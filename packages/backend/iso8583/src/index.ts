import Fastify from 'fastify';
import cors from '@fastify/cors';
import authPlugin from '@banking/shared-auth/dist/fastify';
import { config } from './config';
import acquirerRoutes from './routes/acquirer';
import issuerRoutes from './routes/issuer';
import adminRoutes from './routes/admin';

async function start(): Promise<void> {
  const app = Fastify({
    logger: {
      level: config.nodeEnv === 'development' ? 'info' : 'warn',
    },
  });

  app.addContentTypeParser('text/plain', { parseAs: 'string' }, (req, body, done) => {
    done(null, body);
  });

  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  });

  await app.register(authPlugin, { excludePaths: ['/health'] });

  await app.register(acquirerRoutes);
  await app.register(issuerRoutes);
  await app.register(adminRoutes);

  app.get('/health', async () => ({
    status: 'ok',
    service: 'iso8583-simulator',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    modes: ['json', 'raw'],
    endpoints: {
      acquirer: {
        authorize: 'POST /iso8583/acquirer/authorize',
        financial: 'POST /iso8583/acquirer/financial',
        reversal: 'POST /iso8583/acquirer/reversal',
      },
      issuer: {
        authorize: 'POST /iso8583/issuer/authorize',
        financial: 'POST /iso8583/issuer/financial',
        reversal: 'POST /iso8583/issuer/reversal',
      },
      admin: {
        listCards: 'GET /admin/cards',
        createCard: 'POST /admin/cards',
        resetCard: 'POST /admin/cards/:pan/reset',
        resetAll: 'POST /admin/reset',
      },
    },
  }));

  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`\n  ISO 8583 Simulator running on http://localhost:${config.port}`);
    console.log(`  JSON mode:    Content-Type: application/json`);
    console.log(`  Raw mode:     Content-Type: text/plain`);
    console.log(`  Admin:        http://localhost:${config.port}/admin/cards`);
    console.log(`  Health:       http://localhost:${config.port}/health\n`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
