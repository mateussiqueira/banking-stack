import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  createWorkflow,
  getAllWorkflows,
  getWorkflowById,
  updateWorkflow,
  deleteWorkflow,
} from '../services/workflowStore';
import { executeWorkflow } from '../services/workflowEngine';
import { storeExecution } from '../services/executionStore';
import { getExecutionsByWorkflow } from '../services/executionStore';

export function registerWorkflowRoutes(app: FastifyInstance): void {
  app.post('/api/workflows', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    const workflow = createWorkflow({
      name: body.name,
      description: body.description || '',
      nodes: body.nodes || [],
      edges: body.edges || [],
      status: body.status || 'DRAFT',
    });
    return reply.status(201).send(workflow);
  });

  app.get('/api/workflows', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send(getAllWorkflows());
  });

  app.get('/api/workflows/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const workflow = getWorkflowById(id);
    if (!workflow) return reply.status(404).send({ error: 'Workflow not found' });
    return reply.send(workflow);
  });

  app.put('/api/workflows/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const updated = updateWorkflow(id, body);
    if (!updated) return reply.status(404).send({ error: 'Workflow not found' });
    return reply.send(updated);
  });

  app.delete('/api/workflows/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const deleted = deleteWorkflow(id);
    if (!deleted) return reply.status(404).send({ error: 'Workflow not found' });
    return reply.status(204).send();
  });

  app.post('/api/workflows/:id/execute', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const workflow = getWorkflowById(id);
    if (!workflow) return reply.status(404).send({ error: 'Workflow not found' });

    const body = request.body as any;
    const execution = await executeWorkflow(workflow, body?.input || {});
    execution.trigger = 'manual';
    storeExecution(execution);

    return reply.send({
      executionId: execution.id,
      status: execution.status,
      output: execution.output,
      error: execution.error,
      nodeResults: execution.nodeResults,
    });
  });

  app.get('/api/workflows/:id/executions', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    return reply.send(getExecutionsByWorkflow(id));
  });
}
