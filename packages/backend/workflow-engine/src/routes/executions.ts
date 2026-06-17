import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getAllExecutions, getExecutionById } from '../services/executionStore';

export function registerExecutionRoutes(app: FastifyInstance): void {
  app.get('/api/executions', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send(getAllExecutions());
  });

  app.get('/api/executions/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const execution = getExecutionById(id);
    if (!execution) return reply.status(404).send({ error: 'Execution not found' });
    return reply.send(execution);
  });
}
