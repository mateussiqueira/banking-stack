import { Prestador, Tomador, Servico, Tributacao } from './types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePrestador(prestador: Prestador): ValidationResult {
  const errors: string[] = [];

  if (!prestador.cnpj || prestador.cnpj.length !== 14) {
    errors.push('CNPJ do prestador deve ter 14 dígitos');
  }
  if (!prestador.inscricaoMunicipal) {
    errors.push('Inscrição Municipal do prestador é obrigatória');
  }
  if (!prestador.codigoMunicipio) {
    errors.push('Código do município do prestador é obrigatório');
  }
  if (!prestador.nome) {
    errors.push('Nome do prestador é obrigatório');
  }

  if (prestador.endereco) {
    if (!prestador.endereco.logradouro) errors.push('Logradouro do prestador é obrigatório');
    if (!prestador.endereco.numero) errors.push('Número do endereço do prestador é obrigatório');
    if (!prestador.endereco.bairro) errors.push('Bairro do prestador é obrigatório');
    if (!prestador.endereco.codigoMunicipio) errors.push('Código do município no endereço é obrigatório');
    if (!prestador.endereco.uf) errors.push('UF do prestador é obrigatório');
    if (!prestador.endereco.cep) errors.push('CEP do prestador é obrigatório');
  }

  return { valid: errors.length === 0, errors };
}

export function validateTomador(tomador: Tomador): ValidationResult {
  const errors: string[] = [];

  if (!tomador.cpf && !tomador.cnpj) {
    errors.push('CPF ou CNPJ do tomador é obrigatório');
  }
  if (tomador.cpf && tomador.cpf.length !== 11) {
    errors.push('CPF do tomador deve ter 11 dígitos');
  }
  if (tomador.cnpj && tomador.cnpj.length !== 14) {
    errors.push('CNPJ do tomador deve ter 14 dígitos');
  }
  if (!tomador.nome) {
    errors.push('Nome do tomador é obrigatório');
  }

  if (tomador.endereco) {
    if (!tomador.endereco.logradouro) errors.push('Logradouro do tomador é obrigatório');
    if (!tomador.endereco.numero) errors.push('Número do endereço do tomador é obrigatório');
    if (!tomador.endereco.bairro) errors.push('Bairro do tomador é obrigatório');
    if (!tomador.endereco.codigoMunicipio) errors.push('Código do município no endereço é obrigatório');
    if (!tomador.endereco.uf) errors.push('UF do tomador é obrigatório');
    if (!tomador.endereco.cep) errors.push('CEP do tomador é obrigatório');
  }

  return { valid: errors.length === 0, errors };
}

export function validateServico(servico: Servico): ValidationResult {
  const errors: string[] = [];

  if (!servico.descricao) {
    errors.push('Descrição do serviço é obrigatória');
  }
  if (!servico.discriminacao) {
    errors.push('Discriminação do serviço é obrigatória');
  }
  if (servico.valorServicos <= 0) {
    errors.push('Valor dos serviços deve ser maior que zero');
  }
  if (servico.aliquotaIss < 0 || servico.aliquotaIss > 100) {
    errors.push('Alíquota ISS deve estar entre 0 e 100');
  }
  if (!servico.itemListaServico) {
    errors.push('Item da lista de serviços é obrigatório');
  }

  return { valid: errors.length === 0, errors };
}

export function calcularTributos(
  valorServicos: number,
  aliquotaIss: number,
  issRetido: boolean
): Tributacao & { valorIss: number; baseCalculo: number; valorLiquido: number } {
  const baseCalculo = valorServicos;
  const valorIss = baseCalculo * (aliquotaIss / 100);

  const pis = baseCalculo * 0.0065;
  const cofins = baseCalculo * 0.03;
  const csll = baseCalculo * 0.01;
  const ir = baseCalculo * 0.015;

  const deducoes = issRetido ? 0 : valorIss;
  const valorLiquido = baseCalculo - deducoes - pis - cofins - csll - ir;

  return {
    pis: Math.round(pis * 100) / 100,
    cofins: Math.round(cofins * 100) / 100,
    csll: Math.round(csll * 100) / 100,
    ir: Math.round(ir * 100) / 100,
    valorIss: Math.round(valorIss * 100) / 100,
    baseCalculo: Math.round(baseCalculo * 100) / 100,
    valorLiquido: Math.round(Math.max(valorLiquido, 0) * 100) / 100,
  };
}
