import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  createConsent,
  getConsent,
  deleteConsent,
  authoriseConsent,
} from '../services/consentService';
import { setResponseHeaders } from '../middleware/auth';
import { ConsentPermission } from '../open-finance/types';

interface CreateConsentBody {
  data: {
    permissions: ConsentPermission[];
    expirationDateTime?: string;
  };
}

export async function consentRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/open-banking/consents/v1/consents',
    async (request: FastifyRequest<{ Body: CreateConsentBody }>, reply: FastifyReply) => {
      setResponseHeaders(reply);

      const userId = (request as any).user?.sub || 'user-001';
      const clientId = (request as any).user?.client_id || 'client-001';

      const consent = createConsent(
        userId,
        clientId,
        request.body.data.permissions
      );

      const authorisedConsent = authoriseConsent(consent.id);

      return reply.status(201).send({
        data: {
          consentId: consent.id,
          status: authorisedConsent?.status || consent.status,
          permissions: consent.permissions,
          creationDateTime: consent.creationDateTime,
          statusUpdateDateTime: consent.statusUpdateDateTime,
          expirationDateTime: consent.expirationDateTime,
        },
      });
    }
  );

  app.get(
    '/open-banking/consents/v1/consents/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      setResponseHeaders(reply);

      const consent = getConsent(request.params.id);

      if (!consent) {
        return reply.status(404).send({
          code: 'CONSENT_NOT_FOUND',
          message: 'Consentimento não encontrado',
        });
      }

      return reply.send({
        data: {
          consentId: consent.id,
          status: consent.status,
          permissions: consent.permissions,
          creationDateTime: consent.creationDateTime,
          statusUpdateDateTime: consent.statusUpdateDateTime,
          expirationDateTime: consent.expirationDateTime,
        },
      });
    }
  );

  app.delete(
    '/open-banking/consents/v1/consents/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      setResponseHeaders(reply);

      const deleted = deleteConsent(request.params.id);

      if (!deleted) {
        return reply.status(404).send({
          code: 'CONSENT_NOT_FOUND',
          message: 'Consentimento não encontrado',
        });
      }

      return reply.status(204).send();
    }
  );
}
