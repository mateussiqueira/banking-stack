import { KeyType } from '../models/PixKey'

const CPF_WEIGHTS_FIRST = [10, 9, 8, 7, 6, 5, 4, 3, 2]
const CPF_WEIGHTS_SECOND = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]
const CNPJ_WEIGHTS_FIRST = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
const CNPJ_WEIGHTS_SECOND = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

function calculateDigit(digits: number[], weights: number[]): number {
  const sum = digits.reduce((acc, d, i) => acc + d * weights[i], 0)
  const rest = sum % 11
  return rest < 2 ? 0 : 11 - rest
}

function stripNonDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function validateCPF(doc: string): boolean {
  const digits = stripNonDigits(doc)
  if (digits.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digits)) return false

  const nums = digits.split('').map(Number)
  const firstDigit = calculateDigit(nums.slice(0, 9), CPF_WEIGHTS_FIRST)
  if (firstDigit !== nums[9]) return false

  const secondDigit = calculateDigit(nums.slice(0, 10), CPF_WEIGHTS_SECOND)
  return secondDigit === nums[10]
}

export function validateCNPJ(doc: string): boolean {
  const digits = stripNonDigits(doc)
  if (digits.length !== 14) return false
  if (/^(\d)\1{13}$/.test(digits)) return false

  const nums = digits.split('').map(Number)
  const firstDigit = calculateDigit(nums.slice(0, 12), CNPJ_WEIGHTS_FIRST)
  if (firstDigit !== nums[12]) return false

  const secondDigit = calculateDigit(nums.slice(0, 13), CNPJ_WEIGHTS_SECOND)
  return secondDigit === nums[13]
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function validatePhone(phone: string): boolean {
  const digits = stripNonDigits(phone)
  if (digits.length < 12 || digits.length > 13) return false
  if (!digits.startsWith('55')) return false
  return true
}

export function validateKeyType(key: string, keyType: KeyType): { valid: boolean; error?: string } {
  switch (keyType) {
    case KeyType.CPF:
      if (!validateCPF(key)) return { valid: false, error: 'Invalid CPF format or check digits' }
      break
    case KeyType.CNPJ:
      if (!validateCNPJ(key)) return { valid: false, error: 'Invalid CNPJ format or check digits' }
      break
    case KeyType.EMAIL:
      if (!validateEmail(key)) return { valid: false, error: 'Invalid email format' }
      break
    case KeyType.PHONE:
      if (!validatePhone(key)) return { valid: false, error: 'Invalid phone format (must be +55)' }
      break
    case KeyType.RANDOM:
      const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRe.test(key)) return { valid: false, error: 'Invalid random key format (must be UUID v4)' }
      break
    default:
      return { valid: false, error: 'Unknown key type' }
  }
  return { valid: true }
}

export function formatPixKey(key: string, keyType: KeyType): string {
  switch (keyType) {
    case KeyType.CPF:
      return stripNonDigits(key)
    case KeyType.CNPJ:
      return stripNonDigits(key)
    case KeyType.PHONE:
      return stripNonDigits(key)
    case KeyType.EMAIL:
      return key.toLowerCase().trim()
    case KeyType.RANDOM:
      return key.toLowerCase()
    default:
      return key
  }
}
