import { v4 as uuid } from 'uuid';
import { Workflow } from '../models/workflow';

const workflows: Map<string, Workflow> = new Map();

export function createWorkflow(data: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Workflow {
  const now = new Date().toISOString();
  const workflow: Workflow = {
    id: uuid(),
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  workflows.set(workflow.id, workflow);
  return workflow;
}

export function getAllWorkflows(): Workflow[] {
  return Array.from(workflows.values());
}

export function getWorkflowById(id: string): Workflow | undefined {
  return workflows.get(id);
}

export function updateWorkflow(id: string, data: Partial<Omit<Workflow, 'id' | 'createdAt'>>): Workflow | undefined {
  const existing = workflows.get(id);
  if (!existing) return undefined;
  const updated: Workflow = {
    ...existing,
    ...data,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  workflows.set(id, updated);
  return updated;
}

export function deleteWorkflow(id: string): boolean {
  return workflows.delete(id);
}
