import Fastify from 'fastify';
import cors from '@fastify/cors';
import mongoose from 'mongoose';
import { config } from './config';
import { reportRoutes } from './routes/reports';

async function main() {
  const app = Fastify({
    logger: {
      level: config.logLevel,
    },
  });

  await app.register(cors, { origin: true });

  await app.register(reportRoutes);

  try {
    await mongoose.connect(config.mongoUri);
    app.log.info('Connected to MongoDB');
  } catch (err) {
    app.log.error('Failed to connect to MongoDB');
    process.exit(1);
  }

  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    app.log.info(`Report System running on port ${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
