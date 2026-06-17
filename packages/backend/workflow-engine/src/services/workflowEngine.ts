import axios from 'axios';
import { v4 as uuid } from 'uuid';
import { Workflow, WorkflowNode, WorkflowEdge, NodeConfig } from '../models/workflow';
import { Execution, NodeResult, ExecutionStatus } from '../models/execution';

function topologicalSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const node of nodes) {
    adj.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  for (const edge of edges) {
    adj.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const sorted: WorkflowNode[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  while (queue.length > 0) {
    const id = queue.shift()!;
    const node = nodeMap.get(id);
    if (node) sorted.push(node);

    for (const neighbor of adj.get(id) || []) {
      const newDeg = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  if (sorted.length !== nodes.length) {
    throw new Error('Workflow contains a cycle');
  }

  return sorted;
}

function executeApiNode(config: NodeConfig, inputData: unknown): Promise<unknown> {
  const method = config.method || 'GET';
  const url = config.url || '';
  const headers = config.headers || {};
  const body = config.body ? interpolateTemplate(config.body, inputData) : undefined;

  return axios({
    method: method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch',
    url: interpolateTemplate(url, inputData),
    headers,
    data: body,
    timeout: 15000,
  })
    .then(res => res.data)
    .catch(err => {
      throw new Error(`API request failed: ${err.message}`);
    });
}

function executeWebhookNode(config: NodeConfig, inputData: unknown): Promise<unknown> {
  return Promise.resolve({
    received: true,
    payload: inputData,
    processedAt: new Date().toISOString(),
  });
}

function executeConditionNode(config: NodeConfig, inputData: unknown): string {
  const conditions = config.conditions || [];
  const data = inputData as Record<string, unknown>;

  for (const condition of conditions) {
    const actualValue = String(data[condition.field] ?? '');
    const expectedValue = condition.value;

    let result = false;
    switch (condition.operator) {
      case 'eq': result = actualValue === expectedValue; break;
      case 'ne': result = actualValue !== expectedValue; break;
      case 'gt': result = Number(actualValue) > Number(expectedValue); break;
      case 'gte': result = Number(actualValue) >= Number(expectedValue); break;
      case 'lt': result = Number(actualValue) < Number(expectedValue); break;
      case 'lte': result = Number(actualValue) <= Number(expectedValue); break;
      case 'contains': result = actualValue.includes(expectedValue); break;
      case 'matches': result = new RegExp(expectedValue).test(actualValue); break;
    }

    if (result) return 'true';
  }

  return 'false';
}

function executeDelayNode(config: NodeConfig, _inputData: unknown): Promise<unknown> {
  const delayMs = config.delayMs || 1000;
  return new Promise(resolve => {
    setTimeout(() => resolve({ delayed: true, durationMs: delayMs }), delayMs);
  });
}

function executeOutputNode(config: NodeConfig, inputData: unknown): unknown {
  if (config.outputTemplate) {
    return { output: interpolateTemplate(config.outputTemplate, inputData) };
  }
  return { output: inputData };
}

function interpolateTemplate(template: string, data: unknown): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const value = (data as Record<string, unknown>)[key.trim()];
    return value !== undefined ? String(value) : `{{${key.trim()}}}`;
  });
}

function getOutgoingEdges(nodeId: string, edges: WorkflowEdge[], conditionResult?: string): WorkflowEdge[] {
  return edges.filter(e => {
    if (e.source !== nodeId) return false;
    if (conditionResult !== undefined && e.sourceHandle && e.sourceHandle !== conditionResult) return false;
    return true;
  });
}

export async function executeNode(
  node: WorkflowNode,
  inputData: unknown,
): Promise<{ output: unknown; edgeCondition?: string }> {
  switch (node.type) {
    case 'api': {
      const output = await executeApiNode(node.data, inputData);
      return { output };
    }
    case 'webhook': {
      const output = await executeWebhookNode(node.data, inputData);
      return { output };
    }
    case 'condition': {
      const conditionResult = executeConditionNode(node.data, inputData);
      return { output: { condition: conditionResult }, edgeCondition: conditionResult };
    }
    case 'delay': {
      const output = await executeDelayNode(node.data, inputData);
      return { output };
    }
    case 'output': {
      const output = executeOutputNode(node.data, inputData);
      return { output };
    }
    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
}

export async function executeWorkflow(
  workflow: Workflow,
  triggerData: unknown,
  onProgress?: (result: NodeResult) => void,
): Promise<Execution> {
  const execution: Execution = {
    id: uuid(),
    workflowId: workflow.id,
    status: 'RUNNING',
    trigger: 'manual',
    input: triggerData,
    output: null,
    nodeResults: [],
    startedAt: new Date().toISOString(),
  };

  try {
    const sortedNodes = topologicalSort(workflow.nodes, workflow.edges);
    const nodeDataMap = new Map<string, unknown>();
    nodeDataMap.set('trigger', triggerData);

    for (const node of sortedNodes) {
      const inputData = nodeDataMap.get(node.id) || triggerData;
      const startTime = new Date().toISOString();

      try {
        const { output, edgeCondition } = await executeNode(node, inputData);

        const result: NodeResult = {
          nodeId: node.id,
          nodeType: node.type,
          input: inputData,
          output,
          status: 'success',
          startedAt: startTime,
          completedAt: new Date().toISOString(),
        };

        execution.nodeResults.push(result);
        if (onProgress) onProgress(result);

        const outgoing = getOutgoingEdges(node.id, workflow.edges, edgeCondition);
        for (const edge of outgoing) {
          nodeDataMap.set(edge.target, output);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const result: NodeResult = {
          nodeId: node.id,
          nodeType: node.type,
          input: inputData,
          output: null,
          status: 'error',
          error: errorMessage,
          startedAt: startTime,
          completedAt: new Date().toISOString(),
        };

        execution.nodeResults.push(result);
        if (onProgress) onProgress(result);

        execution.status = 'FAILED';
        execution.error = errorMessage;
        execution.completedAt = new Date().toISOString();
        return execution;
      }
    }

    const lastNode = sortedNodes[sortedNodes.length - 1];
    execution.output = lastNode ? nodeDataMap.get(lastNode.id) : triggerData;
    execution.status = 'COMPLETED';
    execution.completedAt = new Date().toISOString();
  } catch (err) {
    execution.status = 'FAILED';
    execution.error = err instanceof Error ? err.message : String(err);
    execution.completedAt = new Date().toISOString();
  }

  return execution;
}

export { topologicalSort };
