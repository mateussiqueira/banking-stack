import { FastifyInstance } from 'fastify';
import { authService } from '../services/authService';
import { config } from '../config';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/auth/register', async (request, reply) => {
    const { name, email } = request.body as {
      name: string;
      email: string;
    };

    if (!name || !email) {
      return reply.status(400).send({
        error: 'Missing required fields: name, email',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return reply.status(400).send({ error: 'Invalid email format' });
    }

    try {
      const user = authService.createUser(name, email);
      return reply.status(201).send({
        id: user.id,
        name: user.name,
        email: user.email,
        apiKey: user.apiKey,
        createdAt: user.createdAt,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return reply.status(409).send({ error: message });
    }
  });

  app.post('/auth/token', async (request, reply) => {
    const { apiKey } = request.body as { apiKey: string };

    if (!apiKey) {
      return reply.status(400).send({
        error: 'Missing required field: apiKey',
      });
    }

    const user = authService.validateApiKey(apiKey);
    if (!user) {
      return reply.status(401).send({ error: 'Invalid API key' });
    }

    const token = authService.generateToken(user.id);

    return reply.send({
      token,
      expiresIn: config.jwt.expiresIn,
    });
  });
}
