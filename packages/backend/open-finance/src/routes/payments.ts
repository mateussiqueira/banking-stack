import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  createPayment,
  getPayment,
  processPayment,
} from '../services/paymentService';
import { validateConsentActive, hasPermission } from '../services/consentService';
import { setResponseHeaders } from '../middleware/auth';

interface CreatePaymentBody {
  data: {
    amount: number;
    currency: string;
    debtorAccount: {
      number: string;
      agency: string;
      accountType: string;
      ispb: string;
      documentNumber: string;
    };
    creditorAccount: {
      number: string;
      agency: string;
      accountType: string;
      ispb: string;
      documentNumber: string;
    };
    creditorName: string;
    creditorDocument: string;
    description: string;
  };
}

function getConsentId(request: FastifyRequest): string | null {
  return (request.headers['x-consent-id'] as string) || null;
}

function getUserId(request: FastifyRequest): string {
  return (request as any).user?.sub || 'user-001';
}

export async function paymentRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/open-banking/payments/v1/pix/payments',
    async (request: FastifyRequest<{ Body: CreatePaymentBody }>, reply: FastifyReply) => {
      setResponseHeaders(reply);

      const consentId = getConsentId(request);
      if (!consentId || !validateConsentActive(consentId)) {
        return reply.status(403).send({
          code: 'CONSENT_INVALID',
          message: 'Consentimento inválido',
        });
      }

      if (!hasPermission(consentId, 'PIX_WRITE')) {
        return reply.status(403).send({
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Permissão PIX_WRITE necessária',
        });
      }

      const userId = getUserId(request);
      const body = request.body.data;

      const payment = createPayment(
        userId,
        body.amount,
        body.currency || 'BRL',
        body.debtorAccount,
        body.creditorAccount,
        body.creditorName,
        body.creditorDocument,
        body.description
      );

      const processed = processPayment(payment.id);

      return reply.status(201).send({
        data: {
          paymentId: processed?.id || payment.id,
          status: processed?.status || payment.status,
          endToEndId: payment.endToEndId,
          amount: payment.amount,
          currency: payment.currency,
          creationDateTime: payment.creationDateTime,
          statusUpdateDateTime: processed?.statusUpdateDateTime || payment.statusUpdateDateTime,
          transactionId: payment.transactionId,
        },
      });
    }
  );

  app.get(
    '/open-banking/payments/v1/pix/payments/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      setResponseHeaders(reply);

      const consentId = getConsentId(request);
      if (!consentId || !validateConsentActive(consentId)) {
        return reply.status(403).send({
          code: 'CONSENT_INVALID',
          message: 'Consentimento inválido',
        });
      }

      const payment = getPayment(request.params.id);

      if (!payment) {
        return reply.status(404).send({
          code: 'PAYMENT_NOT_FOUND',
          message: 'Pagamento não encontrado',
        });
      }

      return reply.send({
        data: {
          paymentId: payment.id,
          status: payment.status,
          endToEndId: payment.endToEndId,
          amount: payment.amount,
          currency: payment.currency,
          description: payment.description,
          debtorAccount: payment.debtorAccount,
          creditorAccount: payment.creditorAccount,
          creditorName: payment.creditorName,
          creationDateTime: payment.creationDateTime,
          statusUpdateDateTime: payment.statusUpdateDateTime,
          transactionId: payment.transactionId,
        },
      });
    }
  );

  app.post(
    '/open-banking/payments/v1/pix/payments/:id/replay',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      setResponseHeaders(reply);

      const consentId = getConsentId(request);
      if (!consentId || !validateConsentActive(consentId)) {
        return reply.status(403).send({
          code: 'CONSENT_INVALID',
          message: 'Consentimento inválido',
        });
      }

      const processed = processPayment(request.params.id);
      if (!processed) {
        return reply.status(404).send({
          code: 'PAYMENT_NOT_FOUND',
          message: 'Pagamento não encontrado',
        });
      }

      return reply.send({
        data: {
          paymentId: processed.id,
          status: processed.status,
          statusUpdateDateTime: processed.statusUpdateDateTime,
        },
      });
    }
  );
}
