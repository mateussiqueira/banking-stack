export interface Prestador {
  cnpj: string;
  inscricaoMunicipal: string;
  codigoMunicipio: string;
  nome: string;
  nomeFantasia?: string;
  endereco: Endereco;
  contato?: Contato;
}

export interface Tomador {
  cpf?: string;
  cnpj?: string;
  inscricaoMunicipal?: string;
  nome: string;
  email?: string;
  endereco: Endereco;
  contato?: Contato;
}

export interface Endereco {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  codigoMunicipio: string;
  uf: string;
  cep: string;
  pais?: string;
}

export interface Contato {
  telefone?: string;
  email?: string;
}

export interface Servico {
  descricao: string;
  codigoServico?: string;
  codigoTributacaoMunicipio?: string;
  valorServicos: number;
  valorDeducoes?: number;
  aliquotaIss: number;
  issRetido: boolean;
  valorIss?: number;
  baseCalculo?: number;
  valorLiquido?: number;
  itemListaServico: string;
  codigoCnae?: string;
  discriminacao: string;
  tributacao?: Tributacao;
}

export interface Tributacao {
  pis: number;
  cofins: number;
  csll: number;
  ir: number;
}

export interface Rps {
  id: string;
  tipo: 'RPS' | 'NFSE';
  numero: number;
  serie: string;
  dataEmissao: string;
  prestador: Prestador;
  tomador: Tomador;
  servico: Servico;
  competencia?: string;
  naturezaOperacao: NaturezaOperacao;
  regimeEspecialTributacao?: RegimeEspecialTributacao;
  optanteSimplesNacional: boolean;
  incentivoFiscal: boolean;
  status: RpsStatus;
  numeroNfse?: string;
  codigoVerificacao?: string;
  dataCompetencia?: string;
  createdAt: string;
  updatedAt: string;
}

export type NaturezaOperacao = 1 | 2 | 3 | 4 | 5 | 6;

export type RegimeEspecialTributacao = 1 | 2 | 3 | 4 | 5 | 6;

export type RpsStatus = 'PENDENTE' | 'PROCESSADO' | 'CANCELADO' | 'ERRO';

export interface NfseRequest {
  rps: Rps;
}

export interface NfseResponse {
  success: boolean;
  numeroNfse?: string;
  codigoVerificacao?: string;
  dataEmissao?: string;
  rps?: Rps;
  errors?: NfseError[];
  xmlEnvio?: string;
  xmlRetorno?: string;
}

export interface NfseError {
  codigo: string;
  mensagem: string;
  correcao?: string;
}

export interface ConsultaNfseParams {
  numeroNfse?: string;
  periodoInicial?: string;
  periodoFinal?: string;
  prestador?: Prestador;
  tomador?: Tomador;
}

export interface CancelaNfseParams {
  numeroNfse: string;
  motivo: string;
}

export interface NfseListParams {
  page: number;
  limit: number;
  status?: RpsStatus;
  dataInicial?: string;
  dataFinal?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
