import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { Rps, NfseResponse, NfseError } from './types';
import dayjs from 'dayjs';

const builder = new XMLBuilder({
  format: true,
  ignoreAttributes: false,
  suppressEmptyNode: true,
});

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: true,
});

export function buildGerarNfseXml(rps: Rps): string {
  const xmlObj = {
    'soap:Envelope': {
      '@_xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
      '@_xmlns:xsd': 'http://www.w3.org/2001/XMLSchema',
      '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      'soap:Body': {
        GerarNfseEnvio: {
          '@_xmlns': 'http://www.abrasf.org.br/nfse.xsd',
          Requerimento: {
            Prestador: {
              CpfCnpj: {
                Cnpj: rps.prestador.cnpj,
              },
              InscricaoMunicipal: rps.prestador.inscricaoMunicipal,
              CodigoMunicipio: rps.prestador.codigoMunicipio,
            },
            Rps: {
              IdentificacaoRps: {
                Numero: rps.numero,
                Serie: rps.serie,
                Tipo: rps.tipo,
              },
              DataEmissao: dayjs(rps.dataEmissao).format('YYYY-MM-DDTHH:mm:ss'),
              NaturezaOperacao: rps.naturezaOperacao,
              OptanteSimplesNacional: rps.optanteSimplesNacional ? '1' : '2',
              IncentivoFiscal: rps.incentivoFiscal ? '1' : '2',
              Servico: {
                ItemListaServico: rps.servico.itemListaServico,
                CodigoTributacaoMunicipio: rps.servico.codigoTributacaoMunicipio,
                Discriminacao: rps.servico.discriminacao,
                CodigoServico: rps.servico.codigoServico,
                CodigoCnae: rps.servico.codigoCnae,
                Valores: {
                  ValorServicos: rps.servico.valorServicos.toFixed(2),
                  ValorDeducoes: (rps.servico.valorDeducoes || 0).toFixed(2),
                  Aliquota: rps.servico.aliquotaIss.toFixed(2),
                  IssRetido: rps.servico.issRetido ? '1' : '2',
                  ValorIss: (rps.servico.valorIss || 0).toFixed(2),
                  BaseCalculo: (rps.servico.baseCalculo || rps.servico.valorServicos).toFixed(2),
                  ValorLiquido: (rps.servico.valorLiquido || rps.servico.valorServicos).toFixed(2),
                },
              },
              Prestador: {
                CpfCnpj: {
                  Cnpj: rps.prestador.cnpj,
                },
                InscricaoMunicipal: rps.prestador.inscricaoMunicipal,
              },
              Tomador: {
                IdentificacaoTomador: {
                  CpfCnpj: rps.tomador.cnpj
                    ? { Cnpj: rps.tomador.cnpj }
                    : { Cpf: rps.tomador.cpf },
                },
                InscricaoMunicipal: rps.tomador.inscricaoMunicipal,
                RazaoSocial: rps.tomador.nome,
                Endereco: {
                  Endereco: rps.tomador.endereco.logradouro,
                  Numero: rps.tomador.endereco.numero,
                  Complemento: rps.tomador.endereco.complemento || '',
                  Bairro: rps.tomador.endereco.bairro,
                  CodigoMunicipio: rps.tomador.endereco.codigoMunicipio,
                  Uf: rps.tomador.endereco.uf,
                  Cep: rps.tomador.endereco.cep,
                },
                Contato: rps.tomador.contato
                  ? {
                      Telefone: rps.tomador.contato.telefone || '',
                      Email: rps.tomador.contato.email || '',
                    }
                  : undefined,
              },
            },
          },
        },
      },
    },
  };

  return builder.build(xmlObj);
}

export function buildConsultarNfseXml(
  params: {
    numeroNfse?: string;
    periodoInicial?: string;
    periodoFinal?: string;
    prestador?: { cnpj: string; inscricaoMunicipal: string; codigoMunicipio: string };
  }
): string {
  const consulta: Record<string, unknown> = {
    '@_xmlns': 'http://www.abrasf.org.br/nfse.xsd',
    Prestador: {
      CpfCnpj: { Cnpj: params.prestador?.cnpj },
      InscricaoMunicipal: params.prestador?.inscricaoMunicipal,
    },
  };

  if (params.numeroNfse) {
    consulta.NumeroNfse = params.numeroNfse;
  }

  if (params.periodoInicial && params.periodoFinal) {
    consulta.PeriodoEmissao = {
      DataInicial: dayjs(params.periodoInicial).format('YYYY-MM-DD'),
      DataFinal: dayjs(params.periodoFinal).format('YYYY-MM-DD'),
    };
  }

  const xmlObj = {
    'soap:Envelope': {
      '@_xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
      'soap:Body': {
        ConsultarNfseEnvio: consulta,
      },
    },
  };

  return builder.build(xmlObj);
}

export function buildCancelarNfseXml(numeroNfse: string, motivo: string): string {
  const xmlObj = {
    'soap:Envelope': {
      '@_xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
      'soap:Body': {
        CancelarNfseEnvio: {
          '@_xmlns': 'http://www.abrasf.org.br/nfse.xsd',
          Pedido: {
            IdentificacaoNfse: {
              Numero: numeroNfse,
            },
            CodigoCancelamento: '1',
            MotivoCancelamento: motivo,
          },
        },
      },
    },
  };

  return builder.build(xmlObj);
}

export function parseNfseResponseXml(xml: string): NfseResponse {
  try {
    const parsed = parser.parse(xml);
    const body = parsed['soap:Envelope']?.['soap:Body'] || {};

    const gerarResult = body['GerarNfseResposta'];
    const consultarResult = body['ConsultarNfseResposta'];
    const cancelarResult = body['CancelarNfseResposta'];

    const result = gerarResult || consultarResult || cancelarResult;

    if (!result) {
      const fault = body['soap:Fault'];
      if (fault) {
        return {
          success: false,
          errors: [
            {
              codigo: fault.faultcode || 'SOAP_ERROR',
              mensagem: fault.faultstring || 'Erro desconhecido no SOAP',
            },
          ],
        };
      }
      return { success: false, errors: [{ codigo: 'PARSE_ERROR', mensagem: 'Resposta inválida' }] };
    }

    const listaNfse = result['ListaNfse'] || result['CompNfse'];
    if (!listaNfse) {
      const erros = result['ListaMensagemRetorno']?.MensagemRetorno;
      if (erros) {
        const errorList: NfseError[] = (Array.isArray(erros) ? erros : [erros]).map(
          (e: Record<string, string>) => ({
            codigo: e['Codigo'] || e.codigo || 'UNKNOWN',
            mensagem: e['Mensagem'] || e.mensagem || 'Erro desconhecido',
            correcao: e['Correcao'] || e.correcao,
          })
        );
        return { success: false, errors: errorList };
      }
      return { success: true };
    }

    const nfseData = Array.isArray(listaNfse['Nfse'])
      ? listaNfse['Nfse'][0]
      : listaNfse['Nfse'] || listaNfse;

    const infNfse = nfseData['InfNfse'] || nfseData;

    return {
      success: true,
      numeroNfse: infNfse['Numero'] || infNfse.numero,
      codigoVerificacao: infNfse['CodigoVerificacao'] || infNfse.codigoVerificacao,
      dataEmissao: infNfse['DataEmissao'] || infNfse.dataEmissao,
      xmlRetorno: xml,
    };
  } catch (err) {
    return {
      success: false,
      errors: [
        {
          codigo: 'PARSE_ERROR',
          mensagem: `Erro ao processar XML: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
    };
  }
}
