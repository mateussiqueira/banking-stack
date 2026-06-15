import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config';
import { nfseRoutes } from './routes/nfse';

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

  await app.register(nfseRoutes);

  app.get('/health', async () => {
    return { status: 'ok', service: 'nfse-integration', timestamp: new Date().toISOString() };
  });

  try {
    await app.listen({ port: config.port, host: config.host });
    console.log(`NFS-e Integration server running on port ${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
