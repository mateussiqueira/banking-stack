import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyWebsocket from '@fastify/websocket';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { registerWorkflowRoutes } from './routes/workflows';
import { registerExecutionRoutes } from './routes/executions';
import { registerWebhookRoutes } from './services/webhookHandler';

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });
  await app.register(fastifyWebsocket);

  registerWorkflowRoutes(app);
  registerExecutionRoutes(app);
  registerWebhookRoutes(app);

  const staticDir = path.join(__dirname, '..', 'web', 'dist');
  if (fs.existsSync(staticDir)) {
    const fastifyStatic = await import('@fastify/static');
    await app.register(fastifyStatic.default || fastifyStatic, {
      root: staticDir,
      prefix: '/',
    });
  }

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  try {
    await app.listen({ port: config.port, host: config.host });
    console.log(`Workflow Engine running on http://${config.host}:${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
