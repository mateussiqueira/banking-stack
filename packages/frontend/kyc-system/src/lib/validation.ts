import { z } from 'zod';
import { validateCPF } from './cpf';

export const personalInfoSchema = z.object({
  fullName: z
    .string()
    .min(3, 'Nome completo deve ter no mínimo 3 caracteres')
    .max(120, 'Nome muito longo'),
  email: z
    .string()
    .email('E-mail inválido'),
  phone: z
    .string()
    .min(14, 'Telefone inválido')
    .max(15, 'Telefone inválido'),
  dateOfBirth: z
    .string()
    .refine(
      (val) => {
        const birth = new Date(val);
        const today = new Date();
        const age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          return age - 1 >= 18;
        }
        return age >= 18;
      },
      { message: 'Você deve ter pelo menos 18 anos' }
    ),
  country: z
    .string()
    .min(1, 'Selecione um país'),
});

export const addressSchema = z.object({
  street: z
    .string()
    .min(5, 'Endereço deve ter no mínimo 5 caracteres'),
  number: z
    .string()
    .min(1, 'Número é obrigatório'),
  complement: z
    .string()
    .optional()
    .default(''),
  neighborhood: z
    .string()
    .min(2, 'Bairro é obrigatório'),
  city: z
    .string()
    .min(2, 'Cidade é obrigatória'),
  state: z
    .string()
    .length(2, 'Estado deve ter 2 caracteres'),
  postalCode: z
    .string()
    .min(8, 'CEP inválido'),
  proofDoc: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      'O arquivo deve ter no máximo 5MB'
    )
    .refine(
      (file) => ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type),
      'Formato aceito: PDF, JPG ou PNG'
    )
    .optional(),
});

export const identitySchema = z.object({
  idType: z.enum(['Passport', 'DriverLicense', 'RG'], {
    errorMap: () => ({ message: 'Selecione um tipo de documento' }),
  }),
  idNumber: z
    .string()
    .min(3, 'Número do documento é obrigatório'),
  cpf: z
    .string()
    .min(14, 'CPF inválido')
    .refine((val) => validateCPF(val), { message: 'CPF inválido' }),
  idFront: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      'O arquivo deve ter no máximo 5MB'
    )
    .refine(
      (file) => ['image/jpeg', 'image/png'].includes(file.type),
      'Formato aceito: JPG ou PNG'
    ),
  idBack: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      'O arquivo deve ter no máximo 5MB'
    )
    .refine(
      (file) => ['image/jpeg', 'image/png'].includes(file.type),
      'Formato aceito: JPG ou PNG'
    ),
});

export const selfieSchema = z.object({
  selfieImage: z
    .string()
    .min(1, 'Você precisa capturar uma selfie'),
});

export const reviewSchema = z.object({
  termsAccepted: z
    .literal(true, {
      errorMap: () => ({ message: 'Você precisa aceitar os termos' }),
    }),
});

export const multiStepSchema = z.object({
  personalInfo: personalInfoSchema,
  address: addressSchema,
  identity: identitySchema,
  selfie: selfieSchema,
  review: reviewSchema,
});

export type PersonalInfoData = z.infer<typeof personalInfoSchema>;
export type AddressData = z.infer<typeof addressSchema>;
export type IdentityData = z.infer<typeof identitySchema>;
export type SelfieData = z.infer<typeof selfieSchema>;
export type ReviewData = z.infer<typeof reviewSchema>;
export type MultiStepData = z.infer<typeof multiStepSchema>;
