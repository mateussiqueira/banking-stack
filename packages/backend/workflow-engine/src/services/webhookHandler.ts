import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { config } from '../config';
import { executeWorkflow } from './workflowEngine';
import { storeExecution } from './executionStore';
import { getWorkflowById } from './workflowStore';

function validateSignature(payload: string, signature: string | undefined): boolean {
  if (!signature) return false;
  const expected = crypto
    .createHmac('sha256', config.webhookSecret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export function registerWebhookRoutes(app: FastifyInstance): void {
  app.post('/webhook/:workflowId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { workflowId } = request.params as { workflowId: string };

    const workflow = getWorkflowById(workflowId);
    if (!workflow) {
      return reply.status(404).send({ error: 'Workflow not found' });
    }

    const signature = request.headers['x-webhook-signature'] as string | undefined;
    const rawBody = JSON.stringify(request.body);

    if (signature && !validateSignature(rawBody, signature)) {
      return reply.status(401).send({ error: 'Invalid signature' });
    }

    try {
      const execution = await executeWorkflow(workflow, request.body);
      execution.trigger = 'webhook';
      storeExecution(execution);
      return reply.status(200).send({ executionId: execution.id, status: execution.status, output: execution.output });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return reply.status(500).send({ error: message });
    }
  });
}
