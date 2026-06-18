import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import { LeakyBucket } from '../leaky-bucket/strategy';
import { createRateLimiter } from '../middleware/rateLimiter';

const VALID_PIX_KEYS = new Set([
  'matthewsiqueira@gmail.com',
  '11999999999',
  '12345678900',
  'banking-pix@banking.com.br',
]);

interface PixQueryResponse {
  success: boolean;
  keyType: 'EMAIL' | 'PHONE' | 'CPF' | 'CNPJ' | 'EVP' | null;
  ownerName: string | null;
  ownerDocument: string | null;
  bank: string | null;
  isValid: boolean;
  message: string;
}

function detectKeyType(key: string): PixQueryResponse['keyType'] {
  if (/^[\w.-]+@[\w.-]+\.\w+$/.test(key)) return 'EMAIL';
  if (/^\d{11}$/.test(key)) return 'CPF';
  if (/^\d{14}$/.test(key)) return 'CNPJ';
  if (/^\+?\d{10,15}$/.test(key)) return 'PHONE';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) return 'EVP';
  return null;
}

export async function pixRoutes(
  app: FastifyInstance,
  bucket: LeakyBucket
): Promise<void> {
  const pixRateLimiter = createRateLimiter(bucket, {
    capacity: 10,
    refillRate: 1,
    refillInterval: 3600000,
    keyPrefix: 'pix-query',
    tokensPerRequest: 1,
  });

  app.post('/pix/query', {
    preHandler: [authMiddleware, pixRateLimiter],
  }, async (request, reply) => {
    const { key } = request.body as { key: string };

    if (!key) {
      return reply.status(400).send({
        success: false,
        error: 'Missing required field: key',
      });
    }

    const keyType = detectKeyType(key);

    if (!keyType) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid Pix key format',
        keyType: null,
      });
    }

    const isValid = VALID_PIX_KEYS.has(key.toLowerCase());

    if (isValid) {
      const response: PixQueryResponse = {
        success: true,
        keyType,
        ownerName: 'Matthew Siqueira',
        ownerDocument: '***.123.456-**',
        bank: 'Banking Bank S.A.',
        isValid: true,
        message: 'Pix key found',
      };

      reply.header('X-Token-Consumed', '0');
      return reply.send(response);
    } else {
      const response: PixQueryResponse = {
        success: false,
        keyType,
        ownerName: null,
        ownerDocument: null,
        bank: null,
        isValid: false,
        message: 'Pix key not found',
      };

      reply.header('X-Token-Consumed', '1');
      return reply.status(404).send(response);
    }
  });
}
