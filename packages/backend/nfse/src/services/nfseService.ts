import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import {
  Rps,
  NfseResponse,
  NfseRequest,
  ConsultaNfseParams,
  CancelaNfseParams,
  NfseListParams,
  PaginatedResult,
  RpsStatus,
} from '../nfse/types';
import {
  validatePrestador,
  validateTomador,
  validateServico,
  calcularTributos,
} from '../nfse/validators';
import {
  buildGerarNfseXml,
  buildConsultarNfseXml,
  buildCancelarNfseXml,
  parseNfseResponseXml,
} from '../nfse/xml';

let rpsDatabase: Rps[] = [];
let nfseCounter = 1;

function generateNfseNumber(): string {
  const now = dayjs();
  const year = now.format('YYYY');
  const seq = String(nfseCounter++).padStart(9, '0');
  return `${year}${seq}`;
}

function generateVerificationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function gerarNfse(request: NfseRequest): NfseResponse {
  const prestadorErrors = validatePrestador(request.rps.prestador);
  if (!prestadorErrors.valid) {
    return {
      success: false,
      errors: prestadorErrors.errors.map((msg) => ({
        codigo: 'VALIDATION_ERROR',
        mensagem: msg,
      })),
    };
  }

  const tomadorErrors = validateTomador(request.rps.tomador);
  if (!tomadorErrors.valid) {
    return {
      success: false,
      errors: tomadorErrors.errors.map((msg) => ({
        codigo: 'VALIDATION_ERROR',
        mensagem: msg,
      })),
    };
  }

  const servicoErrors = validateServico(request.rps.servico);
  if (!servicoErrors.valid) {
    return {
      success: false,
      errors: servicoErrors.errors.map((msg) => ({
        codigo: 'VALIDATION_ERROR',
        mensagem: msg,
      })),
    };
  }

  const tributos = request.rps.servico.tributacao
    ? {
        ...request.rps.servico.tributacao,
        valorIss: request.rps.servico.valorIss || 0,
        baseCalculo: request.rps.servico.baseCalculo || request.rps.servico.valorServicos,
        valorLiquido: request.rps.servico.valorLiquido || request.rps.servico.valorServicos,
      }
    : calcularTributos(
        request.rps.servico.valorServicos,
        request.rps.servico.aliquotaIss,
        request.rps.servico.issRetido
      );

  const numeroNfse = generateNfseNumber();
  const codigoVerificacao = generateVerificationCode();

  const now = dayjs().format('YYYY-MM-DDTHH:mm:ss');

  const rps: Rps = {
    ...request.rps,
    id: uuidv4(),
    dataEmissao: request.rps.dataEmissao || now,
    servico: {
      ...request.rps.servico,
      valorIss: tributos.valorIss,
      baseCalculo: tributos.baseCalculo,
      valorLiquido: tributos.valorLiquido,
    },
    numeroNfse,
    codigoVerificacao,
    status: 'PROCESSADO',
    createdAt: now,
    updatedAt: now,
  };

  rpsDatabase.push(rps);

  const xmlEnvio = buildGerarNfseXml(rps);

  const simulatedResponse = buildSimulatedResponse(rps, numeroNfse, codigoVerificacao);
  const parsedResponse = parseNfseResponseXml(simulatedResponse);

  return {
    ...parsedResponse,
    rps,
    xmlEnvio,
    dataEmissao: now,
  };
}

export function consultarNfse(params: ConsultaNfseParams): NfseResponse {
  let results = rpsDatabase;

  if (params.numeroNfse) {
    results = results.filter((r) => r.numeroNfse === params.numeroNfse);
  }

  if (params.periodoInicial) {
    const inicio = dayjs(params.periodoInicial);
    results = results.filter((r) => dayjs(r.dataEmissao).isAfter(inicio) || dayjs(r.dataEmissao).isSame(inicio));
  }

  if (params.periodoFinal) {
    const fim = dayjs(params.periodoFinal);
    results = results.filter((r) => dayjs(r.dataEmissao).isBefore(fim) || dayjs(r.dataEmissao).isSame(fim));
  }

  if (results.length === 0) {
    return {
      success: false,
      errors: [{ codigo: 'NFSE_NOT_FOUND', mensagem: 'Nenhuma NFS-e encontrada' }],
    };
  }

  return {
    success: true,
    rps: results[0],
  };
}

export function cancelarNfse(params: CancelaNfseParams): NfseResponse {
  const index = rpsDatabase.findIndex((r) => r.numeroNfse === params.numeroNfse);

  if (index === -1) {
    return {
      success: false,
      errors: [{ codigo: 'NFSE_NOT_FOUND', mensagem: 'NFS-e não encontrada' }],
    };
  }

  const rps = rpsDatabase[index];

  if (rps.status === 'CANCELADO') {
    return {
      success: false,
      errors: [{ codigo: 'NFSE_ALREADY_CANCELLED', mensagem: 'NFS-e já está cancelada' }],
    };
  }

  if (!params.motivo || params.motivo.trim().length < 10) {
    return {
      success: false,
      errors: [{ codigo: 'INVALID_MOTIVE', mensagem: 'Motivo do cancelamento deve ter pelo menos 10 caracteres' }],
    };
  }

  rpsDatabase[index] = {
    ...rps,
    status: 'CANCELADO',
    updatedAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
  };

  const xmlEnvio = buildCancelarNfseXml(params.numeroNfse, params.motivo);

  return {
    success: true,
    numeroNfse: params.numeroNfse,
    rps: rpsDatabase[index],
    xmlEnvio,
    xmlRetorno: `<CancelarNfseResposta xmlns="http://www.abrasf.org.br/nfse.xsd">
  <RetornoCancelamento>
    <NfseCancelamento>
      <Confirmacao>
        <DataHora>${dayjs().format('YYYY-MM-DDTHH:mm:ss')}</DataHora>
        <NumeroNfse>${params.numeroNfse}</NumeroNfse>
      </Confirmacao>
    </NfseCancelamento>
  </RetornoCancelamento>
</CancelarNfseResposta>`,
  };
}

export function getNfseById(id: string): NfseResponse {
  const rps = rpsDatabase.find((r) => r.id === id || r.numeroNfse === id);

  if (!rps) {
    return {
      success: false,
      errors: [{ codigo: 'NFSE_NOT_FOUND', mensagem: 'NFS-e não encontrada' }],
    };
  }

  return { success: true, rps };
}

export function listNfse(params: NfseListParams): PaginatedResult<Rps> {
  let filtered = [...rpsDatabase];

  if (params.status) {
    filtered = filtered.filter((r) => r.status === params.status);
  }
  if (params.dataInicial) {
    const inicio = dayjs(params.dataInicial);
    filtered = filtered.filter((r) => dayjs(r.dataEmissao).isAfter(inicio) || dayjs(r.dataEmissao).isSame(inicio));
  }
  if (params.dataFinal) {
    const fim = dayjs(params.dataFinal);
    filtered = filtered.filter((r) => dayjs(r.dataEmissao).isBefore(fim) || dayjs(r.dataEmissao).isSame(fim));
  }

  filtered.sort((a, b) => dayjs(b.createdAt).unix() - dayjs(a.createdAt).unix());

  const total = filtered.length;
  const totalPages = Math.ceil(total / params.limit);
  const start = (params.page - 1) * params.limit;
  const data = filtered.slice(start, start + params.limit);

  return { data, total, page: params.page, limit: params.limit, totalPages };
}

export function resetDatabase(): void {
  rpsDatabase = [];
  nfseCounter = 1;
}

export function getDatabase(): Rps[] {
  return rpsDatabase;
}

function buildSimulatedResponse(rps: Rps, numeroNfse: string, codigoVerificacao: string): string {
  return `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GerarNfseResposta xmlns="http://www.abrasf.org.br/nfse.xsd">
      <CompNfse>
        <Nfse>
          <InfNfse>
            <Numero>${numeroNfse}</Numero>
            <CodigoVerificacao>${codigoVerificacao}</CodigoVerificacao>
            <DataEmissao>${rps.dataEmissao}</DataEmissao>
            <ValorServicos>${rps.servico.valorServicos.toFixed(2)}</ValorServicos>
            <ValorIss>${(rps.servico.valorIss || 0).toFixed(2)}</ValorIss>
          </InfNfse>
        </Nfse>
      </CompNfse>
    </GerarNfseResposta>
  </soap:Body>
</soap:Envelope>`;
}
