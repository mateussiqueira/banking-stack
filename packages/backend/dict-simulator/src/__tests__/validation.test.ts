import {
  validateCPF,
  validateCNPJ,
  validateEmail,
  validatePhone,
  validateKeyType,
  formatPixKey,
} from '../validation/keyValidation'
import { KeyType } from '../models/PixKey'

describe('validateCPF', () => {
  it('should validate a valid CPF', () => {
    expect(validateCPF('529.982.247-25')).toBe(true)
  })

  it('should validate a valid CPF with only digits', () => {
    expect(validateCPF('52998224725')).toBe(true)
  })

  it('should reject an invalid CPF', () => {
    expect(validateCPF('111.111.111-11')).toBe(false)
  })

  it('should reject a CPF with wrong check digits', () => {
    expect(validateCPF('529.982.247-00')).toBe(false)
  })

  it('should reject a CPF with less than 11 digits', () => {
    expect(validateCPF('123.456.789-00')).toBe(false)
  })
})

describe('validateCNPJ', () => {
  it('should validate a valid CNPJ', () => {
    expect(validateCNPJ('00.000.000/0001-91')).toBe(true)
  })

  it('should validate a valid CNPJ with only digits', () => {
    expect(validateCNPJ('00000000000191')).toBe(true)
  })

  it('should reject an invalid CNPJ', () => {
    expect(validateCNPJ('00.000.000/0001-00')).toBe(false)
  })

  it('should reject a CNPJ with repeated digits', () => {
    expect(validateCNPJ('00.000.000/0000-00')).toBe(false)
  })
})

describe('validateEmail', () => {
  it('should validate a valid email', () => {
    expect(validateEmail('user@example.com')).toBe(true)
  })

  it('should reject an email without @', () => {
    expect(validateEmail('userexample.com')).toBe(false)
  })

  it('should reject an email without domain', () => {
    expect(validateEmail('user@')).toBe(false)
  })
})

describe('validatePhone', () => {
  it('should validate a valid Brazilian phone', () => {
    expect(validatePhone('+5511999999999')).toBe(true)
  })

  it('should validate a phone with 8-digit number', () => {
    expect(validatePhone('+551199999999')).toBe(true)
  })

  it('should reject a phone without +55 prefix', () => {
    expect(validatePhone('11999999999')).toBe(false)
  })
})

describe('validateKeyType', () => {
  it('should validate a CPF key', () => {
    const result = validateKeyType('52998224725', KeyType.CPF)
    expect(result.valid).toBe(true)
  })

  it('should reject an invalid CPF key', () => {
    const result = validateKeyType('12345678901', KeyType.CPF)
    expect(result.valid).toBe(false)
  })

  it('should validate an email key', () => {
    const result = validateKeyType('test@example.com', KeyType.EMAIL)
    expect(result.valid).toBe(true)
  })

  it('should validate a UUID random key', () => {
    const result = validateKeyType('550e8400-e29b-41d4-a716-446655440000', KeyType.RANDOM)
    expect(result.valid).toBe(true)
  })
})

describe('formatPixKey', () => {
  it('should strip formatting from CPF', () => {
    expect(formatPixKey('529.982.247-25', KeyType.CPF)).toBe('52998224725')
  })

  it('should lowercase email', () => {
    expect(formatPixKey('User@Example.COM', KeyType.EMAIL)).toBe('user@example.com')
  })
})
