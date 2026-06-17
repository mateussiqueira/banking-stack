# @banking/report-system

**🇧🇷** Sistema de relatórios financeiros com exportação e agendamento  
**🇬🇧** Financial report system with export and scheduling

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Express** | HTTP framework |
| **PostgreSQL** | Report metadata |
| **MinIO** | Report file storage |
| **ExcelJS** | XLSX generation |
| **PDFKit** | PDF generation |

## How to Run

```bash
# Ensure PostgreSQL and MinIO are running
make infra-up

pnpm --filter @banking/report-system dev
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/reports/generate` | Generate report |
| `GET` | `/api/v1/reports/:id` | Get report metadata |
| `GET` | `/api/v1/reports/:id/download` | Download report file |
| `POST` | `/api/v1/reports/:id/schedule` | Schedule recurring report |
| `DELETE` | `/api/v1/reports/:id` | Delete report |
| `GET` | `/api/v1/reports` | List reports |

## Report Formats

- CSV
- XLSX (Excel)
- PDF

## Environment Variables

```env
REPORT_EXPORT_DIR=./exports
REPORT_SCHEDULE=0 0 * * *
REPORT_RETENTION_DAYS=90
```
