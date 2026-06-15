import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  listAccounts,
  getAccount,
  getAccountByUser,
  getBalances,
  getTransactions,
  getAccountIdsByUser,
} from '../services/accountService';
import { validateConsentActive, hasPermission } from '../services/consentService';
import { setResponseHeaders } from '../middleware/auth';

interface ListQuery {
  page?: string;
  limit?: string;
}

interface AccountParams {
  id: string;
}

interface TransactionQuery {
  page?: string;
  limit?: string;
}

function getConsentId(request: FastifyRequest): string | null {
  return (request.headers['x-consent-id'] as string) || null;
}

function getUserId(request: FastifyRequest): string {
  return (request as any).user?.sub || 'user-001';
}

export async function accountRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/open-banking/accounts/v1/accounts',
    async (request: FastifyRequest<{ Querystring: ListQuery }>, reply: FastifyReply) => {
      setResponseHeaders(reply);

      const consentId = getConsentId(request);
      if (!consentId || !validateConsentActive(consentId)) {
        return reply.status(403).send({
          code: 'CONSENT_INVALID',
          message: 'Consentimento inválido',
        });
      }

      if (!hasPermission(consentId, 'ACCOUNTS_READ')) {
        return reply.status(403).send({
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Permissão ACCOUNTS_READ necessária',
        });
      }

      const userId = getUserId(request);
      const accounts = listAccounts(userId);

      return reply.send({
        data: accounts.map((a) => ({
          brandName: a.brandName,
          companyName: a.companyName,
          type: a.type,
          subtype: a.subtype,
          compeCode: '001',
          number: a.number,
          agency: a.agency,
          openingDate: a.openingDate,
          accountId: a.id,
          status: a.status,
        })),
        meta: { total: accounts.length },
      });
    }
  );

  app.get(
    '/open-banking/accounts/v1/accounts/:id',
    async (request: FastifyRequest<{ Params: AccountParams }>, reply: FastifyReply) => {
      setResponseHeaders(reply);

      const consentId = getConsentId(request);
      if (!consentId || !validateConsentActive(consentId)) {
        return reply.status(403).send({
          code: 'CONSENT_INVALID',
          message: 'Consentimento inválido',
        });
      }

      const account = getAccountByUser(getUserId(request), request.params.id);
      if (!account) {
        return reply.status(404).send({
          code: 'ACCOUNT_NOT_FOUND',
          message: 'Conta não encontrada',
        });
      }

      return reply.send({
        data: {
          brandName: account.brandName,
          companyName: account.companyName,
          type: account.type,
          subtype: account.subtype,
          number: account.number,
          agency: account.agency,
          openingDate: account.openingDate,
          accountId: account.id,
          status: account.status,
        },
      });
    }
  );

  app.get(
    '/open-banking/accounts/v1/accounts/:id/balances',
    async (request: FastifyRequest<{ Params: AccountParams }>, reply: FastifyReply) => {
      setResponseHeaders(reply);

      const consentId = getConsentId(request);
      if (!consentId || !validateConsentActive(consentId)) {
        return reply.status(403).send({
          code: 'CONSENT_INVALID',
          message: 'Consentimento inválido',
        });
      }

      if (!hasPermission(consentId, 'ACCOUNTS_BALANCES_READ')) {
        return reply.status(403).send({
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Permissão ACCOUNTS_BALANCES_READ necessária',
        });
      }

      const account = getAccountByUser(getUserId(request), request.params.id);
      if (!account) {
        return reply.status(404).send({
          code: 'ACCOUNT_NOT_FOUND',
          message: 'Conta não encontrada',
        });
      }

      const balances = getBalances(request.params.id);
      return reply.send({
        data: {
          availableAmount: balances?.availableAmount || 0,
          blockedAmount: balances?.blockedAmount || 0,
          automaticallyInvestedAmount: balances?.automaticallyInvestedAmount || 0,
          amount: balances?.amount || 0,
          currency: balances?.currency || 'BRL',
        },
      });
    }
  );

  app.get(
    '/open-banking/accounts/v1/accounts/:id/transactions',
    async (
      request: FastifyRequest<{ Params: AccountParams; Querystring: TransactionQuery }>,
      reply: FastifyReply
    ) => {
      setResponseHeaders(reply);

      const consentId = getConsentId(request);
      if (!consentId || !validateConsentActive(consentId)) {
        return reply.status(403).send({
          code: 'CONSENT_INVALID',
          message: 'Consentimento inválido',
        });
      }

      if (!hasPermission(consentId, 'ACCOUNTS_TRANSACTIONS_READ')) {
        return reply.status(403).send({
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Permissão ACCOUNTS_TRANSACTIONS_READ necessária',
        });
      }

      const account = getAccountByUser(getUserId(request), request.params.id);
      if (!account) {
        return reply.status(404).send({
          code: 'ACCOUNT_NOT_FOUND',
          message: 'Conta não encontrada',
        });
      }

      const page = parseInt(request.query.page || '1', 10);
      const limit = Math.min(parseInt(request.query.limit || '20', 10), 100);
      const result = getTransactions(request.params.id, page, limit);

      return reply.send({
        data: result.data.map((t) => ({
          transactionId: t.id,
          accountId: t.accountId,
          type: t.type,
          amount: t.amount,
          currency: t.currency,
          transactionDateTime: t.transactionDateTime,
          description: t.description,
          category: t.category,
        })),
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    }
  );
}
