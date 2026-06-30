import Koa from 'koa';
import mongoose from 'mongoose';
import { graphqlHTTP } from 'koa-graphql';
import { createKoaAuthMiddleware } from '@banking/shared-auth/dist/koa';
import { schema } from './graphql/schema';
import { config } from './config';

const app = new Koa();

app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (ctx.method === 'OPTIONS') {
    ctx.status = 204;
    return;
  }
  await next();
});

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err: unknown) {
    const error = err as Error;
    ctx.status = 400;
    ctx.body = {
      errors: [{ message: error.message || 'Internal server error' }],
    };
  }
});

app.use(createKoaAuthMiddleware({ excludePaths: ['/health'] }));

app.use(
  graphqlHTTP({
    schema,
    graphiql: false,
  })
);

mongoose
  .connect(config.mongoUri)
  .then(() => {
    console.log(`[ledger] Connected to MongoDB at ${config.mongoUri}`);
    app.listen(config.port, () => {
      console.log(`[ledger] Server running on http://localhost:${config.port}`);
      console.log(
        `[ledger] GraphQL endpoint: http://localhost:${config.port}/graphql`
      );
    });
  })
  .catch((err) => {
    console.error('[ledger] MongoDB connection error:', err);
    process.exit(1);
  });

export default app;
