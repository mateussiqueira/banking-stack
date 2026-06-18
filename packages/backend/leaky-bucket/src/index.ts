import Fastify from 'fastify';
import cors from '@fastify/cors';
import IORedis from 'ioredis';
import { createHandler } from 'graphql-http/lib/use/fastify';
import { config } from './config';
import { LeakyBucket } from './leaky-bucket/strategy';
import { authRoutes } from './routes/auth';
import { pixRoutes } from './routes/pix';
import { schema } from './graphql/schema';
import { createResolvers } from './graphql/resolvers';

async function main() {
  const redis = new IORedis(config.redis.url);

  const bucket = new LeakyBucket(redis, {
    capacity: 10,
    refillRate: 1,
    refillInterval: 3600000,
  });

  const app = Fastify({
    logger: {
      level: config.logLevel,
    },
  });

  await app.register(cors, { origin: true });

  await app.register(authRoutes);
  await app.register((instance) => pixRoutes(instance, bucket));

  const resolvers = createResolvers(bucket);

  app.all('/graphql', createHandler({
    schema,
    rootValue: resolvers,
    context: () => ({}),
  }));

  app.get('/health', async () => {
    const redisOk = await bucket.healthCheck();
    return {
      status: redisOk ? 'healthy' : 'degraded',
      redis: redisOk ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  });

  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    app.log.info(`Leaky Bucket running on port ${config.port}`);
    app.log.info(`GraphQL endpoint: http://localhost:${config.port}/graphql`);
    app.log.info(`REST endpoints:`);
    app.log.info(`  POST /auth/register`);
    app.log.info(`  POST /auth/token`);
    app.log.info(`  POST /pix/query`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
