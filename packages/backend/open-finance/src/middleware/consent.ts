import { FastifyRequest, FastifyReply } from 'fastify';
import { validateConsentActive } from '../services/consentService';

export async function consentMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const consentId = (request.headers['x-consent-id'] as string) || '';

  if (!consentId) {
    reply.status(401).send({
      code: 'MISSING_CONSENT',
      message: 'Identificador do consentimento (x-consent-id) é obrigatório',
    });
    return;
  }

  if (!validateConsentActive(consentId)) {
    reply.status(403).send({
      code: 'CONSENT_INVALID',
      message: 'Consentimento inválido, expirado ou não autorizado',
    });
    return;
  }

  (request as any).consentId = consentId;
}

export function requirePermission(permission: string) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const consentId = (request.headers['x-consent-id'] as string) || '';

    const { hasPermission } = await import('../services/consentService');
    if (!hasPermission(consentId, permission as any)) {
      reply.status(403).send({
        code: 'INSUFFICIENT_PERMISSIONS',
        message: `Permissão necessária: ${permission}`,
      });
      return;
    }
  };
}
