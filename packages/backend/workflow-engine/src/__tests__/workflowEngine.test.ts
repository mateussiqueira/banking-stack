import { executeWorkflow, topologicalSort, executeNode } from '../services/workflowEngine';
import { Workflow, WorkflowNode, WorkflowEdge } from '../models/workflow';

function createMockWorkflow(nodes: WorkflowNode[], edges: WorkflowEdge[]): Workflow {
  return {
    id: 'test-1',
    name: 'Test Workflow',
    description: 'Test',
    nodes,
    edges,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('topologicalSort', () => {
  it('should sort nodes in correct order', () => {
    const nodes: WorkflowNode[] = [
      { id: 'a', type: 'webhook', position: { x: 0, y: 0 }, data: {} },
      { id: 'b', type: 'api', position: { x: 200, y: 0 }, data: {} },
      { id: 'c', type: 'output', position: { x: 400, y: 0 }, data: {} },
    ];
    const edges: WorkflowEdge[] = [
      { id: 'e1', source: 'a', target: 'b' },
      { id: 'e2', source: 'b', target: 'c' },
    ];

    const sorted = topologicalSort(nodes, edges);
    expect(sorted[0].id).toBe('a');
    expect(sorted[1].id).toBe('b');
    expect(sorted[2].id).toBe('c');
  });

  it('should throw on cycle', () => {
    const nodes: WorkflowNode[] = [
      { id: 'a', type: 'webhook', position: { x: 0, y: 0 }, data: {} },
      { id: 'b', type: 'api', position: { x: 200, y: 0 }, data: {} },
    ];
    const edges: WorkflowEdge[] = [
      { id: 'e1', source: 'a', target: 'b' },
      { id: 'e2', source: 'b', target: 'a' },
    ];

    expect(() => topologicalSort(nodes, edges)).toThrow('Workflow contains a cycle');
  });
});

describe('executeWorkflow', () => {
  it('should execute a simple linear workflow', async () => {
    const webhookNode: WorkflowNode = {
      id: 'webhook-1',
      type: 'webhook',
      position: { x: 0, y: 0 },
      data: {},
    };
    const outputNode: WorkflowNode = {
      id: 'output-1',
      type: 'output',
      position: { x: 400, y: 0 },
      data: { outputTemplate: 'Result: {{value}}' },
    };
    const edges: WorkflowEdge[] = [{ id: 'e1', source: 'webhook-1', target: 'output-1' }];

    const workflow = createMockWorkflow([webhookNode, outputNode], edges);
    const execution = await executeWorkflow(workflow, { value: 'hello' });

    expect(execution.status).toBe('COMPLETED');
    expect(execution.nodeResults).toHaveLength(2);
    expect(execution.output).toEqual({ output: 'Result: hello' });
  });

  it('should execute API node', async () => {
    const apiNode: WorkflowNode = {
      id: 'api-1',
      type: 'api',
      position: { x: 0, y: 0 },
      data: { method: 'GET', url: 'https://jsonplaceholder.typicode.com/todos/1' },
    };
    const outputNode: WorkflowNode = {
      id: 'output-1',
      type: 'output',
      position: { x: 400, y: 0 },
      data: {},
    };
    const edges: WorkflowEdge[] = [{ id: 'e1', source: 'api-1', target: 'output-1' }];

    const workflow = createMockWorkflow([apiNode, outputNode], edges);
    const execution = await executeWorkflow(workflow, {});

    expect(execution.status).toBe('COMPLETED');
    expect(execution.nodeResults[0].status).toBe('success');
    expect(execution.nodeResults[0].nodeType).toBe('api');
  });

  it('should handle condition branching', async () => {
    const webhookNode: WorkflowNode = {
      id: 'wh-1',
      type: 'webhook',
      position: { x: 0, y: 0 },
      data: {},
    };
    const conditionNode: WorkflowNode = {
      id: 'cond-1',
      type: 'condition',
      position: { x: 250, y: 0 },
      data: { conditions: [{ field: 'status', operator: 'eq', value: 'approved' }] },
    };
    const outputTrue: WorkflowNode = {
      id: 'out-true',
      type: 'output',
      position: { x: 500, y: -100 },
      data: { outputTemplate: 'Approved' },
    };
    const outputFalse: WorkflowNode = {
      id: 'out-false',
      type: 'output',
      position: { x: 500, y: 100 },
      data: { outputTemplate: 'Rejected' },
    };
    const edges: WorkflowEdge[] = [
      { id: 'e1', source: 'wh-1', target: 'cond-1' },
      { id: 'e2', source: 'cond-1', target: 'out-true', sourceHandle: 'true' },
      { id: 'e3', source: 'cond-1', target: 'out-false', sourceHandle: 'false' },
    ];

    const workflow = createMockWorkflow(
      [webhookNode, conditionNode, outputTrue, outputFalse],
      edges,
    );

    const execution = await executeWorkflow(workflow, { status: 'approved' });

    expect(execution.status).toBe('COMPLETED');
    const conditionResult = execution.nodeResults.find(n => n.nodeType === 'condition');
    expect(conditionResult?.output).toEqual({ condition: 'true' });
  });

  it('should handle errors gracefully', async () => {
    const apiNode: WorkflowNode = {
      id: 'api-1',
      type: 'api',
      position: { x: 0, y: 0 },
      data: { method: 'GET', url: 'https://invalid-url-that-will-fail.example' },
    };

    const workflow = createMockWorkflow([apiNode], []);
    const execution = await executeWorkflow(workflow, {});

    expect(execution.status).toBe('FAILED');
    expect(execution.error).toBeDefined();
  });
});
