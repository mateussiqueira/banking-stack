export interface ServiceTemplate {
  descricao: string;
  itemListaServico: string;
  codigoTributacaoMunicipio?: string;
  codigoCnae?: string;
}

export interface MunicipioConfig {
  codigo: string;
  nome: string;
  uf: string;
  aliquotaIssPadrao: number;
}

export const serviceTemplates: Record<string, ServiceTemplate> = {
  'desenvolvimento-software': {
    descricao: 'Desenvolvimento de software sob encomenda',
    itemListaServico: '01.05',
    codigoTributacaoMunicipio: '6202300',
    codigoCnae: '6202300',
  },
  'consultoria-ti': {
    descricao: 'Consultoria em tecnologia da informação',
    itemListaServico: '01.03',
    codigoTributacaoMunicipio: '6204000',
    codigoCnae: '6204000',
  },
  'suporte-tecnico': {
    descricao: 'Suporte técnico em tecnologia da informação',
    itemListaServico: '01.07',
    codigoTributacaoMunicipio: '6209100',
    codigoCnae: '6209100',
  },
  'hospedagem-cloud': {
    descricao: 'Serviços de hospedagem em nuvem',
    itemListaServico: '01.08',
    codigoTributacaoMunicipio: '6311900',
    codigoCnae: '6311900',
  },
  'implantacao-sistema': {
    descricao: 'Implantação de sistemas de software',
    itemListaServico: '01.06',
    codigoTributacaoMunicipio: '6202300',
    codigoCnae: '6202300',
  },
  'treinamento-ti': {
    descricao: 'Treinamento e capacitação em tecnologia',
    itemListaServico: '01.09',
    codigoTributacaoMunicipio: '8599600',
    codigoCnae: '8599600',
  },
  'design-ux': {
    descricao: 'Design de experiência do usuário e interfaces',
    itemListaServico: '01.05',
    codigoTributacaoMunicipio: '7410200',
    codigoCnae: '7410200',
  },
};

export const municipios: Record<string, MunicipioConfig> = {
  '3550308': { codigo: '3550308', nome: 'São Paulo', uf: 'SP', aliquotaIssPadrao: 5.0 },
  '3304557': { codigo: '3304557', nome: 'Rio de Janeiro', uf: 'RJ', aliquotaIssPadrao: 5.0 },
  '3106200': { codigo: '3106200', nome: 'Belo Horizonte', uf: 'MG', aliquotaIssPadrao: 5.0 },
  '5300108': { codigo: '5300108', nome: 'Brasília', uf: 'DF', aliquotaIssPadrao: 5.0 },
  '2927408': { codigo: '2927408', nome: 'Salvador', uf: 'BA', aliquotaIssPadrao: 5.0 },
  '4106902': { codigo: '4106902', nome: 'Curitiba', uf: 'PR', aliquotaIssPadrao: 5.0 },
  '4314902': { codigo: '4314902', nome: 'Porto Alegre', uf: 'RS', aliquotaIssPadrao: 5.0 },
  '4205407': { codigo: '4205407', nome: 'Florianópolis', uf: 'SC', aliquotaIssPadrao: 5.0 },
  '2611606': { codigo: '2611606', nome: 'Recife', uf: 'PE', aliquotaIssPadrao: 5.0 },
  '2304400': { codigo: '2304400', nome: 'Fortaleza', uf: 'CE', aliquotaIssPadrao: 5.0 },
};

export function getTemplate(id: string): ServiceTemplate | undefined {
  return serviceTemplates[id];
}

export function getMunicipio(codigo: string): MunicipioConfig | undefined {
  return municipios[codigo];
}
