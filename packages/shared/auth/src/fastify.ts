import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { verifyToken, extractToken, AuthPayload } from './index';

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthPayload;
  }
}

export interface AuthPluginOptions {
  secret?: string;
  excludePaths?: string[];
}

async function authPlugin(fastify: FastifyInstance, opts: AuthPluginOptions) {
  const { secret, excludePaths = ['/health', '/auth'] } = opts;

  fastify.decorateRequest('user', undefined);

  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    for (const path of excludePaths) {
      if (request.url.startsWith(path)) {
        return;
      }
    }

    const token = extractToken(request.headers.authorization);
    if (!token) {
      reply.status(401).send({ error: 'Missing or invalid Authorization header' });
      return;
    }

    const result = verifyToken(token, secret);
    if (!result.authenticated) {
      reply.status(401).send({ error: result.error });
      return;
    }

    request.user = result.payload;
  });
}

export default fp(authPlugin, {
  name: 'auth',
  fastify: '4.x',
});
