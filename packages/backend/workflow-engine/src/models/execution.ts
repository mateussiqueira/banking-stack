export type ExecutionStatus = 'RUNNING' | 'COMPLETED' | 'FAILED';
export type ExecutionTrigger = 'manual' | 'webhook' | 'schedule';

export interface NodeResult {
  nodeId: string;
  nodeType: string;
  input: unknown;
  output: unknown;
  status: 'success' | 'error';
  error?: string;
  startedAt: string;
  completedAt: string;
}

export interface Execution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  trigger: ExecutionTrigger;
  input: unknown;
  output: unknown;
  nodeResults: NodeResult[];
  startedAt: string;
  completedAt?: string;
  error?: string;
}
