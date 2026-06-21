# 05 — Workflow Engine (Mini n8n/zapier)

**🇧🇷** Motor de Automação de Workflows  
**🇬🇧** Workflow Automation Engine

---

## 🇧🇷 Descrição do Desafio

Implementar um motor de automação de workflows similar ao n8n ou Zapier, onde usuários podem definir fluxos de trabalho compostos por nós (trigger, ação, condição) que executam em sequência.

Requisitos:
- Definir workflows como grafos direcionados (DAG)
- Nós de trigger (webhook, schedule, event)
- Nós de ação (HTTP request, email, transform)
- Nós condicionais (if/else, switch)
- Execução assíncrona com filas
- Estado e rastreamento de execução
- Redis para filas e cache de estado

---

## 🇬🇧 Challenge Description

Implement a workflow automation engine similar to n8n or Zapier, where users can define workflows composed of nodes (trigger, action, condition) that execute in sequence.

Requirements:
- Define workflows as directed graphs (DAG)
- Trigger nodes (webhook, schedule, event)
- Action nodes (HTTP request, email, transform)
- Conditional nodes (if/else, switch)
- Asynchronous execution with queues
- Execution state and tracing
- Redis for queues and state cache

---

## Architecture / Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    Workflow Engine                           │
│                                                              │
│  POST /api/v1/workflows               Create workflow       │
│  GET  /api/v1/workflows/:id           Get workflow          │
│  PUT  /api/v1/workflows/:id           Update workflow       │
│  DELETE /api/v1/workflows/:id         Delete workflow       │
│  POST /api/v1/workflows/:id/execute    Execute workflow     │
│  GET  /api/v1/workflows/:id/runs      List executions       │
│                                                              │
│  Workflow Definition:                                        │
│  { nodes: Node[], edges: Edge[] }  ← Directed Acyclic Graph │
└──────────────────────────────────────────────────────────────┘
```

### Workflow Graph Example / Exemplo de Grafo de Workflow

```
   [Webhook Trigger]
          │
          ▼
   [HTTP Request] ───► [Transform Node]
          │
          ├── (success) ──► [Send Email]
          │
          └── (error)  ──► [Log Error] ──► [Webhook Callback]
```

## Tech Stack (Proposed)

| Technology | Purpose |
|------------|---------|
| **Express** | HTTP framework |
| **Redis** | Queue, state, pub/sub |
| **Bull/BullMQ** | Job queue |
| **TypeScript** | Type safety |

## Workflow Node Types / Tipos de Nó

| Type | Description | Descrição |
|------|-------------|-----------|
| `trigger:webhook` | HTTP webhook trigger | Gatilho HTTP |
| `trigger:schedule` | Cron-based schedule | Agendamento cron |
| `action:http` | Make HTTP request | Fazer requisição HTTP |
| `action:transform` | Transform data | Transformar dados |
| `action:email` | Send email | Enviar e-mail |
| `condition:ifelse` | Conditional branch | Ramo condicional |
| `action:log` | Log execution | Registrar execução |

## How to Run (Proposed)

```bash
pnpm --filter @banking/workflow-engine dev
```
