import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config';
import { authMiddleware } from './middleware/auth';
import { consentRoutes } from './routes/consents';
import { accountRoutes } from './routes/accounts';
import { paymentRoutes } from './routes/payments';

async function main() {
  const app = Fastify({
    logger: {
      level: 'info',
    },
  });

  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  app.addHook('onRequest', authMiddleware);

  await app.register(consentRoutes);
  await app.register(accountRoutes);
  await app.register(paymentRoutes);

  app.get('/health', async () => {
    return {
      status: 'ok',
      service: 'open-finance-simulator',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  });

  app.get('/open-banking/discovery/v1/endpoints', async () => {
    return {
      data: {
        endpoints: [
          { path: '/open-banking/consents/v1/consents', methods: ['GET', 'POST', 'DELETE'] },
          { path: '/open-banking/accounts/v1/accounts', methods: ['GET'] },
          { path: '/open-banking/accounts/v1/accounts/:id', methods: ['GET'] },
          { path: '/open-banking/accounts/v1/accounts/:id/balances', methods: ['GET'] },
          { path: '/open-banking/accounts/v1/accounts/:id/transactions', methods: ['GET'] },
          { path: '/open-banking/payments/v1/pix/payments', methods: ['GET', 'POST'] },
        ],
      },
    };
  });

  try {
    await app.listen({ port: config.port, host: config.host });
    console.log(`Open Finance Simulator running on port ${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
