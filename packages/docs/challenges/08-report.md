# 08 — Report System

**🇧🇷** Sistema de Relatórios Financeiros  
**🇬🇧** Financial Report System

---

## 🇧🇷 Descrição do Desafio

Implementar um sistema de relatórios financeiros que permite a geração, agendamento e exportação de relatórios em múltiplos formatos. Os relatórios são armazenados no MinIO (S3-compatível) e os metadados no PostgreSQL.

Requisitos:
- Geração de relatórios em CSV, Excel (XLSX) e PDF
- Agendamento de relatórios recorrentes (diário, semanal, mensal)
- Filtros personalizados por data, tipo, instituição
- Armazenamento no MinIO (S3)
- Metadados no PostgreSQL
- Notificações por webhook quando relatório estiver pronto
- Limpeza automática (retenção configurável)

---

## 🇬🇧 Challenge Description

Implement a financial report system that allows generation, scheduling, and export of reports in multiple formats. Reports are stored in MinIO (S3-compatible) and metadata in PostgreSQL.

Requirements:
- Generate reports in CSV, Excel (XLSX), and PDF
- Schedule recurring reports (daily, weekly, monthly)
- Custom filters by date, type, institution
- Storage in MinIO (S3)
- Metadata in PostgreSQL
- Webhook notifications when report is ready
- Auto cleanup (configurable retention)

---

## Architecture / Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    Report System                             │
│                                                              │
│  POST /api/v1/reports/generate          Generate report     │
│  GET  /api/v1/reports/:id               Get report          │
│  GET  /api/v1/reports/:id/download      Download report     │
│  POST /api/v1/reports/:id/schedule      Schedule report     │
│  DELETE /api/v1/reports/:id             Delete report       │
│  GET  /api/v1/reports                   List reports        │
│                                                              │
└───────────────────────┬──────────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────────┐
│  Report Generation Pipeline                                   │
│                                                               │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐               │
│  │  Query   │───►│  Format  │───►│  Upload  │               │
│  │ Data     │    │ CSV/XLSX │    │  to S3   │               │
│  └──────────┘    └──────────┘    └──────────┘               │
│                      │                          │            │
│                      ▼                          ▼            │
│               ┌────────────┐           ┌─────────────┐      │
│               │ PostgreSQL │           │   MinIO     │      │
│               │ (metadata) │           │  (files)    │      │
│               └────────────┘           └─────────────┘      │
└──────────────────────────────────────────────────────────────┘
```

## Tech Stack (Proposed)

| Technology | Purpose |
|------------|---------|
| **Express** | HTTP framework |
| **PostgreSQL** | Report metadata storage |
| **MinIO** | Report file storage (S3-compatible) |
| **node-cron / bull** | Report scheduling |
| **ExcelJS** | XLSX generation |
| **PDFKit** | PDF generation |
| **csv-stringify** | CSV generation |

## Data Flow / Fluxo de Dados

```
Client                    Report Service              PostgreSQL     MinIO
  │                            │                         │           │
  │ POST /generate             │                         │           │
  │ { type, filters, format }  │                         │           │
  │ ──────────────────────────►│                         │           │
  │                            │ INSERT report           │           │
  │                            │ ───────────────────────►│           │
  │                            │                         │           │
  │                            │ Query data              │           │
  │                            │ ◄───────────────────────│           │
  │                            │                         │           │
  │                            │ Generate file           │           │
  │                            │ PUT report.{csv,xlsx}   │           │
  │                            │ ───────────────────────────────────►│
  │                            │                         │           │
  │                            │ UPDATE report.status    │           │
  │                            │ ───────────────────────►│           │
  │                            │                         │           │
  │ { id, status }             │                         │           │
  │ ◄──────────────────────────│                         │           │
```

## How to Run (Proposed)

```bash
# Ensure PostgreSQL and MinIO are running
make infra-up

# Run report system
pnpm --filter @banking/report-system dev
```
