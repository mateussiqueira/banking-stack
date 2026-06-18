import { LeakyBucket } from '../leaky-bucket/strategy';

const VALID_PIX_KEYS = new Set([
  'matthewsiqueira@gmail.com',
  '11999999999',
  '12345678900',
  'banking-pix@banking.com.br',
]);

function detectKeyType(key: string): string | null {
  if (/^[\w.-]+@[\w.-]+\.\w+$/.test(key)) return 'EMAIL';
  if (/^\d{11}$/.test(key)) return 'CPF';
  if (/^\d{14}$/.test(key)) return 'CNPJ';
  if (/^\+?\d{10,15}$/.test(key)) return 'PHONE';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) return 'EVP';
  return null;
}

export function createResolvers(bucket: LeakyBucket) {
  return {
    queryPixKey: async (args: { key: string }, _context: unknown) => {
      const key = args.key;
      const keyType = detectKeyType(key);
      const isValid = VALID_PIX_KEYS.has(key.toLowerCase());

      if (isValid) {
        return {
          success: true,
          keyType,
          ownerName: 'Matthew Siqueira',
          ownerDocument: '***.123.456-**',
          bank: 'Banking Bank S.A.',
          isValid: true,
          message: 'Pix key found',
        };
      }

      return {
        success: false,
        keyType,
        ownerName: null,
        ownerDocument: null,
        bank: null,
        isValid: false,
        message: keyType ? 'Pix key not found' : 'Invalid Pix key format',
      };
    },

    bucketStatus: async (args: { key: string }) => {
      const state = await bucket.getState(args.key);
      return {
        remaining: state.remaining,
        capacity: state.capacity,
        resetTime: state.resetTime,
      };
    },
  };
}
