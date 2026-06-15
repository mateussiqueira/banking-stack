import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  gerarNfse,
  consultarNfse,
  cancelarNfse,
  getNfseById,
  listNfse,
} from '../services/nfseService';

interface GerarBody {
  rps: {
    tipo: 'RPS' | 'NFSE';
    numero: number;
    serie: string;
    naturezaOperacao: 1 | 2 | 3 | 4 | 5 | 6;
    optanteSimplesNacional: boolean;
    incentivoFiscal: boolean;
    prestador: {
      cnpj: string;
      inscricaoMunicipal: string;
      codigoMunicipio: string;
      nome: string;
      endereco: {
        logradouro: string;
        numero: string;
        complemento?: string;
        bairro: string;
        codigoMunicipio: string;
        uf: string;
        cep: string;
      };
    };
    tomador: {
      cpf?: string;
      cnpj?: string;
      nome: string;
      email?: string;
      endereco: {
        logradouro: string;
        numero: string;
        bairro: string;
        codigoMunicipio: string;
        uf: string;
        cep: string;
      };
    };
    servico: {
      descricao: string;
      valorServicos: number;
      aliquotaIss: number;
      issRetido: boolean;
      itemListaServico: string;
      discriminacao: string;
      codigoTributacaoMunicipio?: string;
      codigoServico?: string;
      codigoCnae?: string;
    };
  };
}

interface ConsultarBody {
  numeroNfse?: string;
  periodoInicial?: string;
  periodoFinal?: string;
}

interface CancelarBody {
  numeroNfse: string;
  motivo: string;
}

interface ListQuery {
  page?: string;
  limit?: string;
  status?: string;
  dataInicial?: string;
  dataFinal?: string;
}

export async function nfseRoutes(app: FastifyInstance): Promise<void> {
  app.post('/nfse/gerar', async (request: FastifyRequest<{ Body: GerarBody }>, reply: FastifyReply) => {
    const result = gerarNfse({ rps: request.body.rps as any });
    return reply.status(result.success ? 201 : 422).send(result);
  });

  app.post('/nfse/consultar', async (request: FastifyRequest<{ Body: ConsultarBody }>, reply: FastifyReply) => {
    const result = consultarNfse(request.body);
    return reply.status(result.success ? 200 : 404).send(result);
  });

  app.post('/nfse/cancelar', async (request: FastifyRequest<{ Body: CancelarBody }>, reply: FastifyReply) => {
    const result = cancelarNfse(request.body);
    return reply.status(result.success ? 200 : 422).send(result);
  });

  app.get('/nfse/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const result = getNfseById(request.params.id);
    return reply.status(result.success ? 200 : 404).send(result);
  });

  app.get('/nfse', async (request: FastifyRequest<{ Querystring: ListQuery }>, reply: FastifyReply) => {
    const page = parseInt(request.query.page || '1', 10);
    const limit = Math.min(parseInt(request.query.limit || '20', 10), 100);
    const status = request.query.status as any;
    const result = listNfse({
      page,
      limit,
      status,
      dataInicial: request.query.dataInicial,
      dataFinal: request.query.dataFinal,
    });
    return reply.send(result);
  });
}
