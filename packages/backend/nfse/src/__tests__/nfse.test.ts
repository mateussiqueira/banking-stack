import {
  buildGerarNfseXml,
  buildConsultarNfseXml,
  buildCancelarNfseXml,
  parseNfseResponseXml,
} from '../nfse/xml';
import {
  validatePrestador,
  validateTomador,
  validateServico,
  calcularTributos,
} from '../nfse/validators';
import { gerarNfse, consultarNfse, cancelarNfse, resetDatabase } from '../services/nfseService';
import { Rps } from '../nfse/types';

const mockRps: Rps = {
  id: 'test-id',
  tipo: 'RPS',
  numero: 1,
  serie: 'UNICA',
  dataEmissao: '2026-06-23T10:00:00',
  naturezaOperacao: 1,
  optanteSimplesNacional: true,
  incentivoFiscal: false,
  prestador: {
    cnpj: '12345678000190',
    inscricaoMunicipal: '123456',
    codigoMunicipio: '3550308',
    nome: 'Banking Tecnologia Ltda',
    endereco: {
      logradouro: 'Av Paulista',
      numero: '1000',
      bairro: 'Bela Vista',
      codigoMunicipio: '3550308',
      uf: 'SP',
      cep: '01310100',
    },
  },
  tomador: {
    cnpj: '98765432000110',
    nome: 'Cliente XYZ SA',
    endereco: {
      logradouro: 'Rua Augusta',
      numero: '500',
      bairro: 'Consolação',
      codigoMunicipio: '3550308',
      uf: 'SP',
      cep: '01304000',
    },
  },
  servico: {
    descricao: 'Desenvolvimento de software',
    valorServicos: 5000.0,
    aliquotaIss: 5.0,
    issRetido: false,
    itemListaServico: '01.05',
    discriminacao: 'Desenvolvimento de sistema web sob encomenda conforme contrato 2026/001',
    codigoTributacaoMunicipio: '6202300',
  },
  status: 'PENDENTE',
  createdAt: '2026-06-23T10:00:00',
  updatedAt: '2026-06-23T10:00:00',
};

describe('NFS-e XML Generation', () => {
  it('should generate gerar NFS-e XML', () => {
    const xml = buildGerarNfseXml(mockRps);
    expect(xml).toContain('GerarNfseEnvio');
    expect(xml).toContain(mockRps.prestador.cnpj);
    expect(xml).toContain(mockRps.servico.valorServicos.toFixed(2));
    expect(xml).toContain('soap:Envelope');
  });

  it('should generate consultar NFS-e XML', () => {
    const xml = buildConsultarNfseXml({
      numeroNfse: '2026000000001',
      prestador: {
        cnpj: mockRps.prestador.cnpj,
        inscricaoMunicipal: mockRps.prestador.inscricaoMunicipal,
        codigoMunicipio: mockRps.prestador.codigoMunicipio,
      },
    });
    expect(xml).toContain('ConsultarNfseEnvio');
    expect(xml).toContain('2026000000001');
  });

  it('should generate cancelar NFS-e XML', () => {
    const xml = buildCancelarNfseXml('2026000000001', 'Cancelamento a pedido do contratante');
    expect(xml).toContain('CancelarNfseEnvio');
    expect(xml).toContain('2026000000001');
    expect(xml).toContain('Cancelamento a pedido do contratante');
  });
});

describe('NFS-e Response Parsing', () => {
  it('should parse a valid success response', () => {
    const xml = `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GerarNfseResposta xmlns="http://www.abrasf.org.br/nfse.xsd">
      <CompNfse>
        <Nfse>
          <InfNfse>
            <Numero>2026000000001</Numero>
            <CodigoVerificacao>ABC12345</CodigoVerificacao>
            <DataEmissao>2026-06-23T10:00:00</DataEmissao>
          </InfNfse>
        </Nfse>
      </CompNfse>
    </GerarNfseResposta>
  </soap:Body>
</soap:Envelope>`;

    const result = parseNfseResponseXml(xml);
    expect(result.success).toBe(true);
    expect(result.numeroNfse).toBe('2026000000001');
    expect(result.codigoVerificacao).toBe('ABC12345');
  });

  it('should parse an error response', () => {
    const xml = `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <soap:Fault>
      <faultcode>SOAP-ENV:Client</faultcode>
      <faultstring>Erro de validação</faultstring>
    </soap:Fault>
  </soap:Body>
</soap:Envelope>`;

    const result = parseNfseResponseXml(xml);
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors![0].mensagem).toBe('Erro de validação');
  });
});

describe('NFS-e Validators', () => {
  it('should validate a complete prestador', () => {
    const result = validatePrestador(mockRps.prestador);
    expect(result.valid).toBe(true);
  });

  it('should reject prestador without CNPJ', () => {
    const result = validatePrestador({ ...mockRps.prestador, cnpj: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('CNPJ do prestador deve ter 14 dígitos');
  });

  it('should validate tomador', () => {
    const result = validateTomador(mockRps.tomador);
    expect(result.valid).toBe(true);
  });

  it('should reject tomador without CPF/CNPJ', () => {
    const result = validateTomador({ ...mockRps.tomador, cnpj: undefined, cpf: undefined });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('CPF ou CNPJ do tomador é obrigatório');
  });

  it('should validate servico', () => {
    const result = validateServico(mockRps.servico);
    expect(result.valid).toBe(true);
  });

  it('should reject servico with zero value', () => {
    const result = validateServico({ ...mockRps.servico, valorServicos: 0 });
    expect(result.valid).toBe(false);
  });
});

describe('Tax Calculation', () => {
  it('should calculate all tributos correctly', () => {
    const result = calcularTributos(5000, 5, false);
    expect(result.valorIss).toBe(250);
    expect(result.pis).toBe(32.5);
    expect(result.cofins).toBe(150);
    expect(result.csll).toBe(50);
    expect(result.ir).toBe(75);
    expect(result.baseCalculo).toBe(5000);
  });
});

describe('NFS-e Full Issuance Flow', () => {
  beforeEach(() => {
    resetDatabase();
  });

  it('should successfully issue an NFS-e', () => {
    const result = gerarNfse({ rps: mockRps });
    expect(result.success).toBe(true);
    expect(result.numeroNfse).toBeDefined();
    expect(result.codigoVerificacao).toBeDefined();
    expect(result.rps?.status).toBe('PROCESSADO');
  });

  it('should consult an NFS-e by number', () => {
    const issued = gerarNfse({ rps: mockRps });
    const result = consultarNfse({ numeroNfse: issued.numeroNfse });
    expect(result.success).toBe(true);
    expect(result.rps?.numeroNfse).toBe(issued.numeroNfse);
  });

  it('should cancel an NFS-e', () => {
    const issued = gerarNfse({ rps: mockRps });
    const result = cancelarNfse({
      numeroNfse: issued.numeroNfse!,
      motivo: 'Cancelamento solicitado pelo cliente conforme contrato',
    });
    expect(result.success).toBe(true);
    expect(result.rps?.status).toBe('CANCELADO');
  });

  it('should reject cancellation of already cancelled NFS-e', () => {
    const issued = gerarNfse({ rps: mockRps });
    cancelarNfse({
      numeroNfse: issued.numeroNfse!,
      motivo: 'Cancelamento solicitado pelo cliente conforme contrato',
    });
    const result = cancelarNfse({
      numeroNfse: issued.numeroNfse!,
      motivo: 'Segundo cancelamento solicitado pelo cliente conforme contrato',
    });
    expect(result.success).toBe(false);
    expect(result.errors![0].codigo).toBe('NFSE_ALREADY_CANCELLED');
  });

  it('should reject gerar with invalid data', () => {
    const invalidRps = {
      ...mockRps,
      prestador: { ...mockRps.prestador, cnpj: '' },
    };
    const result = gerarNfse({ rps: invalidRps });
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});
