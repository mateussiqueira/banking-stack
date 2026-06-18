import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    reply.status(401).send({ error: 'Missing Authorization header' });
    return;
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    reply.status(401).send({ error: 'Invalid Authorization format. Use: Bearer <token>' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as AuthUser;
    request.user = {
      userId: decoded.userId,
      name: decoded.name,
      email: decoded.email,
    };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      reply.status(401).send({ error: 'Token expired' });
    } else {
      reply.status(401).send({ error: 'Invalid token' });
    }
  }
}
