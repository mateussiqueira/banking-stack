# Admin Dashboard Specification

Phase 6 — Global Expansion and Enterprise (Months 19-24)

## Team Progress Overview

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Team Progress Overview                           [Export]  │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Active   │  │Completed │  │ At Risk  │  │  Inactive│   │
│  │    42    │  │    28    │  │     5    │  │     7    │   │
│  │  (67%)   │  │  (45%)   9│  │   (8%)   │  │  (11%)   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Completion Trend (Last 30 Days)                    │   │
│  │  ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆▅▄▃▂▁     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Top Performers                                            │
│  1. Maria Silva    — 95% complete — Banking Fundamentals  │
│  2. John Smith     — 88% complete — Payment Systems       │
│  3. Ana Costa      — 82% complete — Compliance Module     │
└─────────────────────────────────────────────────────────────┘
```

### Metrics Displayed

- **Active Learners** — Started but not yet completed
- **Completed** — Finished assigned path
- **At Risk** — Behind schedule by >20%
- **Inactive** — No activity in 14+ days

---

## Individual Learner Metrics

### Learner Profile View

| Metric | Description |
|--------|-------------|
| Completion % | Overall path progress |
| Time Invested | Total learning hours |
| Last Active | Most recent login date |
| Modules Done | X of Y completed |
| Average Score | Quiz/assessment average |
| Certificates | Earned certifications |

### Activity Timeline

```
2024-03-15 — Completed "PIX vs ACH" module (Score: 92%)
2024-03-14 — Started "International Payments" module
2024-03-12 — Completed "Payment Systems" quiz (Score: 88%)
2024-03-10 — Earned "Banking Foundations" certificate
2024-03-08 — Completed "Banking Fundamentals" path
```

### Export Options

- PDF progress report per learner
- CSV bulk export for all team members
- Scheduled weekly email summaries

---

## Custom Content Upload

### Supported Formats

| Format | Type | Notes |
|--------|------|-------|
| PDF | Documents | Max 50MB per file |
| MP4 | Video | Max 500MB, H.264 codec |
| PPTX | Slides | Converted to interactive format |
| SCORM | eLearning | 1.2 and 2004 supported |
| xAPI | Learning Record | Full statement support |

### Upload Interface

```
┌─────────────────────────────────────────────────────────┐
│  Upload Custom Content                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Module Title: [____________________________]          │
│  Description:  [____________________________]          │
│  Category:     [Compliance        ▼]                   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │    📁 Drag & drop files here                   │   │
│  │       or click to browse                        │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Upload]  [Cancel]                                     │
└─────────────────────────────────────────────────────────┘
```

### Content Management

- Edit uploaded content metadata
- Reorder modules within paths
- Set access permissions per team/role
- Version control for updated content
- Usage analytics per custom module

---

## Billing Management

### Subscription Overview

| Section | Information |
|---------|-------------|
| Current Plan | Growth (10 seats) |
| Billing Cycle | Monthly |
| Next Invoice | April 1, 2024 |
| Payment Method | Visa ****4242 |
| Status | Active |

### Invoice History

```
Date        Amount    Status     Invoice
─────────────────────────────────────────────
2024-03-01  $899.00   Paid       INV-2024-0301
2024-02-01  $899.00   Paid       INV-2024-0201
2024-01-01  $899.00   Paid       INV-2024-0101
```

### Billing Actions

- Update payment method
- Download invoices (PDF)
- Upgrade/downgrade plan
- Add seats (pro-rated billing)
- Manage billing contacts
- Set purchase order references

---

## API Access

### Authentication

```typescript
// API Key Authentication
headers: {
  'X-API-Key': 'your-api-key',
  'Content-Type': 'application/json'
}
```

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/teams` | GET | List all teams |
| `/api/v1/teams/:id/members` | GET | Team members |
| `/api/v1/learners/:id/progress` | GET | Individual progress |
| `/api/v1/paths` | GET | Learning paths |
| `/api/v1/paths/:id/assign` | POST | Assign to team |
| `/api/v1/reports/export` | GET | Export report data |
| `/api/v1/certificates` | GET | List certificates |

### Rate Limits

| Tier | Requests/Hour | Burst Limit |
|------|---------------|-------------|
| Starter | — | — |
| Growth | — | — |
| Enterprise | 1,000 | 100/min |

### Webhooks

```typescript
interface WebhookEvent {
  event: 'learner.completed' | 'learner.started' | 'certificate.issued';
  timestamp: Date;
  data: {
    learnerId: string;
    pathId: string;
    moduleId?: string;
    score?: number;
  };
}
```

### Integration Examples

- Slack notifications for completions
- LMS sync via SCORM/xAPI
- HRIS integration for onboarding
- Custom reporting dashboards
