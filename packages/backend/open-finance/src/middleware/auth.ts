import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface JwtPayload {
  sub: string;
  client_id: string;
  iss: string;
  aud: string[];
  iat: number;
  exp: number;
  consents?: string[];
}

export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({
      code: 'UNAUTHORIZED',
      message: 'Token de acesso não informado',
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    (request as any).user = decoded;
  } catch (err) {
    reply.status(401).send({
      code: 'INVALID_TOKEN',
      message: 'Token inválido ou expirado',
    });
    return;
  }
}

export function getFapiHeaders(request: FastifyRequest): Record<string, string> {
  return {
    'x-fapi-interaction-id': (request.headers['x-fapi-interaction-id'] as string) || '',
    'x-fapi-auth-date': (request.headers['x-fapi-auth-date'] as string) || '',
    'x-fapi-customer-ip-address': (request.headers['x-fapi-customer-ip-address'] as string) || '',
  };
}

export function setResponseHeaders(reply: FastifyReply): void {
  reply.header('x-fapi-interaction-id', reply.request.headers['x-fapi-interaction-id'] || '');
  reply.header('cache-control', 'no-store, no-cache, must-revalidate');
  reply.header('pragma', 'no-cache');
  reply.header('x-content-type-options', 'nosniff');
  reply.header('x-frame-options', 'DENY');
  reply.header('x-xss-protection', '1; mode=block');
  reply.header('strict-transport-security', 'max-age=31536000; includeSubDomains');
}
