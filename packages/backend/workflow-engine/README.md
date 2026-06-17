# @banking/workflow-engine

**🇧🇷** Motor de automação de workflows (mini n8n/zapier)  
**🇬🇧** Workflow automation engine (mini n8n/zapier)

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Express** | HTTP framework |
| **Redis** | Queue, state, pub/sub |
| **TypeScript** | Type safety |

## How to Run

```bash
# Ensure Redis is running
make infra-up

pnpm --filter @banking/workflow-engine dev
```

## Workflow Concepts

Workflows are defined as directed acyclic graphs (DAGs):

- **Nodes**: Individual steps (trigger, action, condition)
- **Edges**: Connections defining execution order
- **Executions**: Individual runs of a workflow

### Node Types

| Type | Description |
|------|-------------|
| `trigger:webhook` | HTTP webhook trigger |
| `trigger:schedule` | Cron-based schedule |
| `action:http` | Make HTTP request |
| `action:transform` | Transform data |
| `action:email` | Send email |
| `condition:ifelse` | Conditional branch |
| `action:log` | Log execution |
