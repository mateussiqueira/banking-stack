export type NodeType = 'api' | 'webhook' | 'condition' | 'delay' | 'output';

export interface NodeConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url?: string;
  headers?: Record<string, string>;
  body?: string;
  expression?: string;
  conditions?: Array<{
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'matches';
    value: string;
  }>;
  delayMs?: number;
  outputTemplate?: string;
  webhookPath?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNodeDef[];
  edges: WorkflowEdgeDef[];
  status: string;
}

export interface WorkflowNodeDef {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeConfig;
}

export interface WorkflowEdgeDef {
  id: string;
  source: string;
  target: string;
  label?: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export const NODE_COLORS: Record<NodeType, string> = {
  api: '#3b82f6',
  webhook: '#8b5cf6',
  condition: '#f59e0b',
  delay: '#10b981',
  output: '#ef4444',
};

export const NODE_LABELS: Record<NodeType, string> = {
  api: 'API Request',
  webhook: 'Webhook',
  condition: 'Condition',
  delay: 'Delay',
  output: 'Output',
};
