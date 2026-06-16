import { describe, it, expect } from 'vitest';
import { validateCPF, formatCPF } from '@/lib/cpf';
import { validatePhone, formatPhone } from '@/lib/phone';
import { personalInfoSchema, addressSchema, identitySchema } from '@/lib/validation';

describe('CPF Validation', () => {
  it('should validate a correct CPF', () => {
    expect(validateCPF('529.982.247-25')).toBe(true);
  });

  it('should validate CPF with digits only', () => {
    expect(validateCPF('52998224725')).toBe(true);
  });

  it('should reject an invalid CPF', () => {
    expect(validateCPF('111.111.111-11')).toBe(false);
  });

  it('should reject CPF with wrong length', () => {
    expect(validateCPF('123')).toBe(false);
    expect(validateCPF('')).toBe(false);
  });

  it('should format CPF correctly', () => {
    expect(formatCPF('52998224725')).toBe('529.982.247-25');
  });

  it('should not add extra digits beyond 11', () => {
    expect(formatCPF('52998224725123')).toBe('529.982.247-25');
  });

  it('should handle partial formatting', () => {
    expect(formatCPF('529')).toBe('529');
    expect(formatCPF('529982')).toBe('529.982');
  });
});

describe('Phone Validation', () => {
  it('should format phone with 11 digits', () => {
    expect(formatPhone('11999999999')).toBe('(11) 99999-9999');
  });

  it('should format phone with 10 digits', () => {
    expect(formatPhone('1199999999')).toBe('(11) 9999-9999');
  });

  it('should validate correct mobile phone', () => {
    expect(validatePhone('11999999999')).toBe(true);
  });

  it('should reject phone with less than 10 digits', () => {
    expect(validatePhone('119999')).toBe(false);
  });

  it('should strip non-digits when formatting', () => {
    expect(formatPhone('11 99999-9999')).toBe('(11) 99999-9999');
  });
});

describe('Personal Info Schema', () => {
  it('should validate correct personal info', () => {
    const result = personalInfoSchema.safeParse({
      fullName: 'João Silva',
      email: 'joao@email.com',
      phone: '(11) 99999-9999',
      dateOfBirth: '2000-01-01',
      country: 'BR',
    });
    expect(result.success).toBe(true);
  });

  it('should reject short name', () => {
    const result = personalInfoSchema.safeParse({
      fullName: 'Jo',
      email: 'joao@email.com',
      phone: '(11) 99999-9999',
      dateOfBirth: '2000-01-01',
      country: 'BR',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid email', () => {
    const result = personalInfoSchema.safeParse({
      fullName: 'João Silva',
      email: 'invalido',
      phone: '(11) 99999-9999',
      dateOfBirth: '2000-01-01',
      country: 'BR',
    });
    expect(result.success).toBe(false);
  });

  it('should reject underage (17 years old)', () => {
    const today = new Date();
    const underage = `${today.getFullYear() - 17}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const result = personalInfoSchema.safeParse({
      fullName: 'João Silva',
      email: 'joao@email.com',
      phone: '(11) 99999-9999',
      dateOfBirth: underage,
      country: 'BR',
    });
    expect(result.success).toBe(false);
  });
});

describe('Identity Schema', () => {
  it('should reject invalid CPF', () => {
    const result = identitySchema.safeParse({
      idType: 'Passport',
      idNumber: 'AB123456',
      cpf: '111.111.111-11',
    });
    expect(result.success).toBe(false);
  });
});
