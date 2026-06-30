# 05 — Workflow Engine

**🇧🇷** Motor de Workflows  
**🇬🇧** Workflow Engine

---

## The Problem

You need to run a sequence of steps: validate data, call an API, transform the result, send an email. If a step fails, what happens? If the server dies halfway through?

A workflow engine solves this. You define the steps as nodes in a graph, and the engine executes them in the right order, with retries, queues, and persisted state.

This is how n8n, Zapier, and Power Automate work under the hood.

---

## Architecture

```mermaid
flowchart TD
    A[Trigger] --> B[Validate Node]
    B --> C{Condition}
    C -->|Success| D[HTTP Action]
    C -->|Error| E[Log + Webhook]
    D --> F[Transform]
    F --> G[Send Email]
    G --> H[Done]
```

```
POST /api/v1/workflows         → Create workflow
GET  /api/v1/workflows/:id     → Get workflow
POST /api/v1/workflows/:id/execute → Execute workflow
GET  /api/v1/workflows/:id/runs    → Execution history
```

---

## TypeScript Implementation

### Workflow definition

```typescript
interface Node {
  id: string;
  type: 'trigger:webhook' | 'action:http' | 'action:transform' 
      | 'condition:ifelse' | 'action:email' | 'action:log';
  config: Record<string, any>;
}

interface Edge {
  from: string;
  to: string;
  condition?: string; // 'success' | 'error' | expression
}

interface Workflow {
  id: string;
  nodes: Node[];
  edges: Edge[];
}
```

### DAG Executor

```typescript
class WorkflowExecutor {
  private state: Map<string, any> = new Map();

  async execute(workflow: Workflow, triggerData: any): Promise<void> {
    const trigger = workflow.nodes.find(n => n.type.startsWith('trigger:'));
    if (!trigger) throw new Error('Workflow without trigger');
    
    this.state.set('trigger', triggerData);
    await this.executeNode(workflow, trigger.id);
  }

  private async executeNode(workflow: Workflow, nodeId: string) {
    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) return;

    const result = await this.runNode(node);
    this.state.set(nodeId, result);

    const nextEdges = workflow.edges.filter(e => e.from === nodeId);
    
    for (const edge of nextEdges) {
      if (edge.condition && !this.evalCondition(edge.condition, result)) {
        continue;
      }
      await this.executeNode(workflow, edge.to);
    }
  }

  private async runNode(node: Node): Promise<any> {
    switch (node.type) {
      case 'action:http':
        return fetch(node.config.url, {
          method: node.config.method || 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(node.config.body),
        }).then(r => r.json());
      
      case 'action:transform':
        const fn = new Function('data', node.config.script);
        return fn(this.state);
      
      case 'condition:ifelse':
        return this.evalField(node.config);
      
      default:
        return null;
    }
  }
}
```

### Workflow example

```json
{
  "nodes": [
    { "id": "trigger", "type": "trigger:webhook", "config": {} },
    { "id": "validate", "type": "action:http", "config": {
        "url": "http://validator/api",
        "method": "POST"
    }},
    { "id": "check", "type": "condition:ifelse", "config": {
        "field": "body.valid", "operator": "equals", "value": "true"
    }},
    { "id": "process", "type": "action:http", "config": {
        "url": "http://processor/api", "method": "POST"
    }},
    { "id": "notify", "type": "action:email", "config": {
        "to": "admin@bank.com", "subject": "Processed"
    }}
  ],
  "edges": [
    { "from": "trigger", "to": "validate" },
    { "from": "validate", "to": "check" },
    { "from": "check", "to": "process", "condition": "success" },
    { "from": "check", "to": "notify", "condition": "error" }
  ]
}
```

---

## Go Implementation

In Go, each node runs in its own goroutine. The workflow is a pipeline of channels:

```go
package main

import (
    "context"
    "encoding/json"
    "fmt"
    "net/http"
)

type Node struct {
    ID     string                 `json:"id"`
    Type   string                 `json:"type"`
    Config map[string]interface{} `json:"config"`
}

type Edge struct {
    From      string `json:"from"`
    To        string `json:"to"`
    Condition string `json:"condition,omitempty"`
}

type Workflow struct {
    Nodes []Node `json:"nodes"`
    Edges []Edge `json:"edges"`
}

type Executor struct {
    state map[string]interface{}
    done  chan struct{}
}

func NewExecutor() *Executor {
    return &Executor{
        state: make(map[string]interface{}),
        done:  make(chan struct{}),
    }
}

func (e *Executor) Execute(ctx context.Context, wf *Workflow, triggerData interface{}) error {
    // Find trigger node
    var trigger *Node
    for _, n := range wf.Nodes {
        if len(n.Type) > 8 && n.Type[:8] == "trigger:" {
            trigger = &n
            break
        }
    }
    if trigger == nil {
        return fmt.Errorf("no trigger node found")
    }

    e.state["trigger"] = triggerData
    
    // Build adjacency list
    edges := make(map[string][]Edge)
    for _, edge := range wf.Edges {
        edges[edge.From] = append(edges[edge.From], edge)
    }

    // Execute DAG
    return e.executeNode(ctx, wf, edges, trigger.ID)
}

func (e *Executor) executeNode(ctx context.Context, wf *Workflow, 
    edges map[string][]Edge, nodeID string) error {
    
    // Find node
    var node *Node
    for _, n := range wf.Nodes {
        if n.ID == nodeID {
            node = &n
            break
        }
    }
    if node == nil {
        return nil
    }

    // Execute node
    result, err := e.runNode(ctx, node)
    if err != nil {
        return err
    }
    e.state[nodeID] = result

    // Execute children
    for _, edge := range edges[nodeID] {
        if edge.Condition != "" {
            if !e.evaluateCondition(edge.Condition, result) {
                continue
            }
        }
        if err := e.executeNode(ctx, wf, edges, edge.To); err != nil {
            return err
        }
    }

    return nil
}

func (e *Executor) runNode(ctx context.Context, node *Node) (interface{}, error) {
    switch node.Type {
    case "action:http":
        url, _ := node.Config["url"].(string)
        resp, err := http.Get(url)
        if err != nil {
            return nil, err
        }
        defer resp.Body.Close()
        
        var result interface{}
        json.NewDecoder(resp.Body).Decode(&result)
        return result, nil

    case "condition:ifelse":
        field, _ := node.Config["field"].(string)
        value, _ := node.Config["value"].(string)
        
        if data, ok := e.state[field]; ok {
            return fmt.Sprintf("%v", data) == value, nil
        }
        return false, nil

    default:
        return nil, nil
    }
}
```

**Key difference:** In Go, the executor is truly concurrent with goroutines. Each branch of the workflow can run in parallel. In TypeScript, it's sequential with async/await — simpler to reason about, but less efficient.

---

## Testing

```bash
pnpm --filter @banking/workflow-engine dev

curl -X POST http://localhost:3005/api/v1/workflows \
  -H "Content-Type: application/json" \
  -d '{"nodes":[...],"edges":[...]}'

curl -X POST http://localhost:3005/api/v1/workflows/wf_1/execute
```

---

## Lessons Learned

1. **DAG is the core** — A workflow engine without a DAG is just a task queue.
2. **State must be external** — If the server restarts, the workflow needs to pick up where it left off. Redis or PostgreSQL.
3. **Retry is not optional** — HTTP calls fail. Your workflow needs to retry, with backoff.
4. **Observability** — Every execution needs logging, tracing, and visible status. Without it, debugging is impossible.
