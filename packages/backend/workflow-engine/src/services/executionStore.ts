import { Execution } from '../models/execution';

const executions: Map<string, Execution> = new Map();

export function storeExecution(execution: Execution): void {
  executions.set(execution.id, execution);
}

export function getExecutionsByWorkflow(workflowId: string): Execution[] {
  return Array.from(executions.values()).filter(e => e.workflowId === workflowId);
}

export function getAllExecutions(): Execution[] {
  return Array.from(executions.values());
}

export function getExecutionById(id: string): Execution | undefined {
  return executions.get(id);
}
