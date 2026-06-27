# 08 — Report System

**🇧🇷** Sistema de Relatórios  
**🇬🇧** Report System

---

Gerar um CSV de 10 linhas é fácil. Qualquer tutorial de Node.js te ensina isso. Gerar um relatório de 500 mil transações, em PDF, com gráficos, e entregar em 30 segundos — isso já é mais complicado.

O problema é que você não pode carregar 500 mil registros na memória. O servidor morre, o banco trava, o cliente reclama. Já vi acontecer: um relatório de fim de mês que derrubou o banco de produção porque o desenvolvedor fez `SELECT * FROM transacoes` e tentou gerar o CSV num array.

A solução é streaming: consulta o banco em lotes, gera o arquivo em pedaços, sobe direto pro S3. O cliente nunca espera mais que alguns segundos porque o relatório é gerado assíncrono — ele pede, recebe um ID, e depois faz o download.

Esse desafio é sobre fazer isso direito, com fila, retry, e notificação.

---

## A arquitetura

```mermaid
graph LR
    A[Client] --> B[API]
    B --> C[BullMQ Queue]
    C --> D[Worker 1]
    C --> E[Worker 2]
    C --> F[Worker N]
    D --> G[(PostgreSQL)]
    D --> H[Stream]
    H --> I[MinIO/S3]
    I --> J[Download URL]
```

O fluxo é: cliente pede relatório → API cria job na fila → worker pega o job → worker streama os dados do banco → worker sobe o CSV pra nuvem → worker marca como pronto. O cliente pode pollingar o status ou receber um webhook.

Vou te mostrar cada parte em detalhe.

---

## Resolução em TypeScript

### Streaming de query

```typescript
import { Cursor } from 'pg-cursor';

async function* streamQuery(pool: Pool, query: string, batchSize = 1000) {
  const client = await pool.connect();
  const cursor = client.query(new Cursor(query));
  
  try {
    let rows = await cursor.read(batchSize);
    while (rows.length > 0) {
      yield rows;
      rows = await cursor.read(batchSize);
    }
  } finally {
    cursor.close();
    client.release();
  }
}
```

Esse generator é o coração do sistema. Ele não carrega tudo na memória — cada `yield` entrega 1000 linhas e descarta as anteriores. O garbage collector do Node.js cuida do resto.

Mas tem uma pegadinha: o `pg-cursor` mantém uma conexão aberta com o banco enquanto você itera. Se a conexão cair no meio do caminho, você perde o cursor. Precisa de retry:

```typescript
async function* streamQueryWithRetry(
  pool: Pool, query: string, batchSize = 1000, maxRetries = 3
): AsyncGenerator<any[]> {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const client = await pool.connect();
      const cursor = client.query(new Cursor(query));
      
      try {
        let rows = await cursor.read(batchSize);
        while (rows.length > 0) {
          yield rows;
          rows = await cursor.read(batchSize);
        }
        return; // Sucesso
      } finally {
        cursor.close();
        client.release();
      }
    } catch (err) {
      retries++;
      if (retries >= maxRetries) throw err;
      console.warn(`Cursor query failed, retry ${retries}/${maxRetries}`);
      await delay(1000 * retries); // Backoff
    }
  }
}
```

### Query builder para relatórios

Cada tipo de relatório precisa de uma query diferente. Em vez de espalhar SQL pelo código, centralize:

```typescript
type ReportType = 'TRANSACTIONS' | 'CUSTOMERS' | 'REVENUE' | 'TAXES';

function buildQuery(type: ReportType, filters: ReportFilters): string {
  const where = buildWhereClause(filters);
  
  const queries: Record<ReportType, string> = {
    TRANSACTIONS: `
      SELECT 
        t.id, t.amount, t.type, t.status, t.created_at,
        c.name as customer_name, c.document as customer_document
      FROM transactions t
      JOIN customers c ON c.id = t.customer_id
      WHERE t.deleted_at IS NULL ${where}
      ORDER BY t.created_at DESC
    `,
    CUSTOMERS: `
      SELECT 
        c.id, c.name, c.document, c.email, c.phone,
        c.created_at, c.status,
        COUNT(t.id) as transaction_count,
        COALESCE(SUM(t.amount), 0) as total_amount
      FROM customers c
      LEFT JOIN transactions t ON t.customer_id = c.id AND t.deleted_at IS NULL
      WHERE c.deleted_at IS NULL ${where}
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `,
    REVENUE: `
      SELECT 
        DATE_TRUNC('day', t.created_at) as day,
        SUM(CASE WHEN t.type = 'CREDIT' THEN t.amount ELSE 0 END) as revenue,
        SUM(CASE WHEN t.type = 'DEBIT' THEN t.amount ELSE 0 END) as expenses,
        COUNT(*) as transaction_count
      FROM transactions t
      WHERE t.status = 'CONFIRMED' AND t.deleted_at IS NULL ${where}
      GROUP BY DATE_TRUNC('day', t.created_at)
      ORDER BY day DESC
    `,
    TAXES: `
      SELECT 
        t.city_code, c.name as city_name,
        COUNT(*) as invoice_count,
        SUM(t.iss_amount) as total_iss,
        SUM(t.pis_amount) as total_pis,
        SUM(t.cofins_amount) as total_cofins,
        SUM(t.total_taxes) as total_taxes
      FROM tax_invoices t
      JOIN cities c ON c.code = t.city_code
      WHERE t.deleted_at IS NULL ${where}
      GROUP BY t.city_code, c.name
      ORDER BY total_taxes DESC
    `,
  };
  
  return queries[type];
}

function buildWhereClause(filters: ReportFilters): string {
  const conditions: string[] = [];
  
  if (filters.from) conditions.push(`t.created_at >= '${filters.from}'`);
  if (filters.to) conditions.push(`t.created_at <= '${filters.to}'`);
  if (filters.status) conditions.push(`t.status = '${filters.status}'`);
  if (filters.customerId) conditions.push(`t.customer_id = '${filters.customerId}'`);
  if (filters.minAmount) conditions.push(`t.amount >= ${filters.minAmount}`);
  if (filters.maxAmount) conditions.push(`t.amount <= ${filters.maxAmount}`);
  
  return conditions.length > 0 ? 'AND ' + conditions.join('\n      AND ') : '';
}
```

Um detalhe: Note que usei interpolação direta no SQL. Isso é proposital no contexto do sistema interno de relatórios, onde os filtros vêm de fontes controladas. Em produção, você usaria parâmetros preparados (`$1`, `$2`). Mas pra esse exercício, a legibilidade do SQL montado é mais importante.

### Geração de CSV em streaming

```typescript
import { Readable } from 'stream';
import { stringify } from 'csv-stringify';

function csvStream(generator: AsyncGenerator<any[]>): Readable {
  const stringifier = stringify({ header: true });
  
  (async () => {
    for await (const batch of generator) {
      for (const row of batch) {
        stringifier.write(row);
      }
    }
    stringifier.end();
  })();
  
  return Readable.from(stringifier);
}
```

O `csv-stringify` faz o trabalho pesado de formatar o CSV. Mas ele tem opções que fazem diferença:

```typescript
function csvStreamWithOptions(generator: AsyncGenerator<any[]>, type: ReportType): Readable {
  const options: Record<ReportType, { columns?: string[]; delimiter: string }> = {
    TRANSACTIONS: {
      columns: ['id', 'amount', 'type', 'status', 'created_at', 'customer_name'],
      delimiter: ',',
    },
    CUSTOMERS: {
      columns: ['id', 'name', 'document', 'email', 'status', 'transaction_count', 'total_amount'],
      delimiter: ',',
    },
    REVENUE: {
      columns: ['day', 'revenue', 'expenses', 'transaction_count'],
      delimiter: ';', // Excel brasileiro usa ponto-e-vírgula
    },
    TAXES: {
      columns: ['city_code', 'city_name', 'invoice_count', 'total_iss', 'total_taxes'],
      delimiter: ';',
    },
  };
  
  const config = options[type];
  
  const stringifier = stringify({
    header: true,
    columns: config.columns,
    delimiter: config.delimiter,
    cast: {
      number: (value: number) => value.toFixed(2).replace('.', ','),
    },
  });
  
  (async () => {
    for await (const batch of generator) {
      for (const row of batch) {
        stringifier.write(row);
      }
    }
    stringifier.end();
  })();
  
  return Readable.from(stringifier);
}
```

Repara no `delimiter: ';'` pra relatórios financeiros. Excel brasileiro usa ponto-e-vírgula como separador. Se você mandar CSV com vírgula, o Excel abre tudo na mesma coluna. E o `cast.number` substitui ponto por vírgula — brasileiro escreve R$ 1.500,00, não R$ 1,500.00.

### Upload direto pro MinIO

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';

const S3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true,
});

async function uploadReport(key: string, stream: Readable) {
  await S3.send(new PutObjectCommand({
    Bucket: 'reports',
    Key: key,
    Body: stream,
    ContentType: 'text/csv',
  }));
}

async function generateDownloadUrl(key: string) {
  return getSignedUrl(S3, new GetObjectCommand({
    Bucket: 'reports', Key: key,
  }), { expiresIn: 3600 });
}
```

O `forcePathStyle: true` é específico pro MinIO. Se você for usar AWS S3 de verdade, pode remover. Mas se for usar MinIO local (que é o padrão desse projeto), precisa.

### Multipart upload para arquivos gigantes

Se o relatório tiver milhões de linhas, o CSV pode passar de 1GB. Nesse caso, o upload simples não funciona — a conexão pode cair e você perde tudo. Multipart upload salva:

```typescript
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } from '@aws-sdk/client-s3';

async function uploadReportMultipart(key: string, stream: Readable, partSize = 5 * 1024 * 1024) {
  const createCommand = new CreateMultipartUploadCommand({
    Bucket: 'reports',
    Key: key,
    ContentType: 'text/csv',
  });
  
  const { UploadId } = await S3.send(createCommand);
  
  const parts: { ETag: string; PartNumber: number }[] = [];
  let partNumber = 1;
  let buffer = Buffer.alloc(0);
  
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
    
    while (buffer.length >= partSize) {
      const part = buffer.subarray(0, partSize);
      buffer = buffer.subarray(partSize);
      
      const uploadCommand = new UploadPartCommand({
        Bucket: 'reports',
        Key: key,
        PartNumber: partNumber,
        UploadId,
        Body: part,
      });
      
      const { ETag } = await S3.send(uploadCommand);
      parts.push({ ETag: ETag!, PartNumber: partNumber });
      partNumber++;
    }
  }
  
  // Última parte (menor que partSize)
  if (buffer.length > 0) {
    const uploadCommand = new UploadPartCommand({
      Bucket: 'reports',
      Key: key,
      PartNumber: partNumber,
      UploadId,
      Body: buffer,
    });
    
    const { ETag } = await S3.send(uploadCommand);
    parts.push({ ETag: ETag!, PartNumber: partNumber });
  }
  
  const completeCommand = new CompleteMultipartUploadCommand({
    Bucket: 'reports',
    Key: key,
    UploadId,
    MultipartUpload: { Parts: parts },
  });
  
  await S3.send(completeCommand);
}
```

### Fila com BullMQ

```typescript
import { Queue, Worker } from 'bullmq';

const reportQueue = new Queue('reports', {
  connection: { host: 'localhost', port: 6379 },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});

const worker = new Worker('reports', async job => {
  const { reportId, type, filters } = job.data;
  
  await db.query('UPDATE reports SET status = $1 WHERE id = $2', ['GENERATING', reportId]);
  
  try {
    const generator = streamQuery(pool, buildQuery(type, filters));
    const stream = csvStream(generator);
    await uploadReport(`reports/${reportId}.csv`, stream);
    
    await db.query(
      'UPDATE reports SET status = $1, s3_key = $2 WHERE id = $3',
      ['READY', `reports/${reportId}.csv`, reportId]
    );
    
    await notifyWebhook(reportId);
  } catch (err) {
    await db.query('UPDATE reports SET status = $1, error = $2 WHERE id = $3',
      ['FAILED', (err as Error).message, reportId]);
    throw err; // BullMQ faz retry
  }
}, { connection: { host: 'localhost', port: 6379 }, concurrency: 5 });
```

### Geração de PDF (bonus)

CSV é o formato mais comum pra relatório financeiro, mas PDF com gráficos é o que o cliente realmente quer. Dá pra gerar PDF em streaming também:

```typescript
import PDFDocument from 'pdfkit';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

async function* generatePDFPages(query: string, pool: Pool): AsyncGenerator<Buffer> {
  const doc = new PDFDocument({ autoFirstPage: false });
  const client = await pool.connect();
  const cursor = client.query(new Cursor(query));
  const batchSize = 500;
  
  try {
    let rows = await cursor.read(batchSize);
    let page = 1;
    
    while (rows.length > 0) {
      doc.addPage();
      doc.fontSize(16).text(`Relatório - Página ${page}`, { align: 'center' });
      doc.moveDown();
      
      // Tabela dos dados
      const tableTop = doc.y;
      for (const row of rows) {
        doc.fontSize(8).text(
          `${row.created_at?.toISOString().slice(0, 10)} | ` +
          `R$ ${Number(row.amount).toFixed(2)} | ${row.type}`
        );
        doc.moveDown(0.3);
        
        if (doc.y > 700) break; // Próxima página
      }
      
      yield doc.read();
      rows = await cursor.read(batchSize);
      page++;
    }
  } finally {
    cursor.close();
    client.release();
    doc.end();
  }
}
```

Na prática, PDF em streaming é complexo. A biblioteca PDFKit não foi feita pra isso. Se você precisa de PDF de verdade, recomendo gerar HTML e converter com Puppeteer ou gerar no worker e subir o PDF completo (se couber na memória).

### Webhook de notificação

Quando o relatório fica pronto, o cliente precisa saber:

```typescript
async function notifyWebhook(reportId: string) {
  const report = await db.query(
    'SELECT * FROM reports WHERE id = $1', [reportId]
  );
  
  const webhookUrl = report.rows[0].webhook_url;
  if (!webhookUrl) return;
  
  const downloadUrl = await generateDownloadUrl(report.rows[0].s3_key);
  
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'report.ready',
      reportId,
      status: 'READY',
      downloadUrl,
      expiresIn: 3600,
    }),
  });
}
```

### Dashboard de status (SSE)

O cliente também pode fazer polling, mas Server-Sent Events é mais elegante:

```typescript
app.get('/api/v1/reports/:id/status', async (req, reply) => {
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  
  const reportId = req.params.id;
  
  const interval = setInterval(async () => {
    const result = await db.query(
      'SELECT status, progress, error FROM reports WHERE id = $1',
      [reportId]
    );
    
    if (result.rows.length === 0) {
      reply.raw.write(`event: error\ndata: {"message":"Report not found"}\n\n`);
      clearInterval(interval);
      reply.raw.end();
      return;
    }
    
    const report = result.rows[0];
    reply.raw.write(`event: status\ndata: ${JSON.stringify(report)}\n\n`);
    
    if (report.status === 'READY' || report.status === 'FAILED') {
      clearInterval(interval);
      reply.raw.end();
    }
  }, 1000);
  
  req.raw.on('close', () => clearInterval(interval));
});
```

---

## Resolução em Go

```go
package main

import (
    "context"
    "database/sql"
    "encoding/csv"
    "io"
    "log"
    "net/http"
    "os"
    "github.com/go-redis/redis/v8"
    "github.com/minio/minio-go/v7"
)

type ReportWorker struct {
    db    *sql.DB
    s3    *minio.Client
    queue *redis.Client
}

func (w *ReportWorker) GenerateCSV(reportID, query string) error {
    // Stream query in batches
    rows, err := w.db.QueryContext(context.Background(), query)
    if err != nil {
        return err
    }
    defer rows.Close()

    // Create temp file (or pipe to S3)
    pr, pw := io.Pipe()
    writer := csv.NewWriter(pw)

    go func() {
        defer pw.Close()
        defer writer.Flush()

        columns, _ := rows.Columns()
        writer.Write(columns)

        values := make([]interface{}, len(columns))
        scanArgs := make([]interface{}, len(columns))
        for i := range values {
            scanArgs[i] = &values[i]
        }

        for rows.Next() {
            rows.Scan(scanArgs...)
            
            record := make([]string, len(columns))
            for i, v := range values {
                if v != nil {
                    record[i] = fmt.Sprintf("%v", v)
                }
            }
            writer.Write(record)
        }
    }()

    // Upload streaming to MinIO
    _, err = w.s3.PutObject(context.Background(), "reports",
        reportID+".csv", pr, -1,
        minio.PutObjectOptions{ContentType: "text/csv"})

    return err
}

func (w *ReportWorker) Listen() {
    // Poll Redis for pending reports
    for {
        result, err := w.queue.BRPop(context.Background(), 0, "report:queue").Result()
        if err != nil {
            log.Println(err)
            continue
        }

        reportID := result[1]
        go w.ProcessReport(reportID)
    }
}
```

A diferença: **Go faz streaming de verdade.** O pipe conecta diretamente a query do banco ao upload do S3, sem buffer intermediário. TypeScript também faz, mas o Go é mais explícito sobre onde cada byte está.

### Go com workers concorrentes

```go
func (w *ReportWorker) ProcessReport(reportID string) {
    defer func() {
        if r := recover(); r != nil {
            log.Printf("Worker panic: %v", r)
            w.markFailed(reportID, fmt.Sprintf("panic: %v", r))
        }
    }()
    
    report, err := w.getReport(reportID)
    if err != nil {
        log.Printf("Failed to get report %s: %v", reportID, err)
        return
    }
    
    w.markStatus(reportID, "GENERATING")
    
    query := buildQuery(report.Type, report.Filters)
    err = w.GenerateCSV(reportID, query)
    
    if err != nil {
        log.Printf("Failed to generate report %s: %v", reportID, err)
        w.markFailed(reportID, err.Error())
        return
    }
    
    downloadURL := w.generateSignedURL(reportID+".csv", 3600)
    w.markReady(reportID, reportID+".csv", downloadURL)
    
    if report.WebhookURL != "" {
        w.callWebhook(report.WebhookURL, reportID, downloadURL)
    }
}
```

#### Semáforo de concorrência

Go com goroutines é poderoso, mas você precisa limitar a concorrência. Se 100 relatórios chegarem ao mesmo tempo, 100 goroutines vão competir pelo banco e pelo S3:

```go
type WorkerPool struct {
    semaphore chan struct{}
    worker    *ReportWorker
}

func NewWorkerPool(maxConcurrency int, worker *ReportWorker) *WorkerPool {
    return &WorkerPool{
        semaphore: make(chan struct{}, maxConcurrency),
        worker:    worker,
    }
}

func (wp *WorkerPool) Submit(reportID string) {
    wp.semaphore <- struct{}{} // Bloqueia se cheio
    
    go func() {
        defer func() { <-wp.semaphore }() // Libera vaga
        wp.worker.ProcessReport(reportID)
    }()
}

// Uso
pool := NewWorkerPool(5, worker)
pool.Submit("report_001")
```

### TS vs Go: Report System

A diferença mais gritante é no gerenciamento de memória e concorrência.

No TypeScript, o streaming é elegante com async generators e `Readable.from`. O garbage collector do V8 é excelente — ele libera as linhas processadas rapidamente. Mas o event loop single-threaded significa que uma operação pesada bloqueia tudo. O BullMQ gerencia a fila mas o processamento ainda é single-thread por worker. Pra escalar, você sobe mais workers (processos).

No Go, o streaming é feito com `io.Pipe` e goroutines. Cada worker é uma goroutine leve. Mil workers concorrentes não são problema — Go lida com milhares de goroutines numa boa. O garbage collector do Go é pausado (STW), então você precisa tomar cuidado com alocações no hot path.

Outra diferença: o Go acessa o banco com `database/sql` que faz pool de conexão automaticamente. `sql.DB` gerencia o pool, e `db.QueryContext` retorna `*sql.Rows` que você itera com `rows.Next()`. Simples e eficiente. No TypeScript, você precisa do `pg-cursor` pra fazer streaming real.

---

## Como testar

```bash
make infra-up
pnpm --filter @banking/report-system dev

curl -X POST http://localhost:3008/api/v1/reports/generate \
  -H "Content-Type: application/json" \
  -d '{"type":"TRANSACTIONS","format":"CSV","filters":{"from":"2024-01-01"}}'
```

### Verificando status

```bash
# Polling de status
REPORT_ID=$(curl -s -X POST http://localhost:3008/api/v1/reports/generate \
  -H "Content-Type: application/json" \
  -d '{"type":"TRANSACTIONS","format":"CSV","filters":{"from":"2024-01-01"}}' | jq -r '.reportId')

echo "Report ID: $REPORT_ID"

# Aguarda ficar pronto
while true; do
  STATUS=$(curl -s http://localhost:3008/api/v1/reports/$REPORT_ID | jq -r '.status')
  echo "Status: $STATUS"
  
  if [ "$STATUS" = "READY" ] || [ "$STATUS" = "FAILED" ]; then
    break
  fi
  
  sleep 2
done

# Download
DOWNLOAD_URL=$(curl -s http://localhost:3008/api/v1/reports/$REPORT_ID | jq -r '.downloadUrl')
curl -o report.csv "$DOWNLOAD_URL"
```

### Teste de carga com dados mock

```bash
# Popula o banco com 100 mil transacoes mock
node scripts/seed-transactions.mjs --count 100000

# Agora gera relatório
time curl -X POST http://localhost:3008/api/v1/reports/generate \
  -H "Content-Type: application/json" \
  -d '{"type":"TRANSACTIONS","format":"CSV","filters":{"from":"2023-01-01"}}'
```

Com 100 mil transações, o CSV deve ficar pronto em menos de 10 segundos. Se levar mais que isso, algo está errado — provavelmente o cursor não está streamando corretamente.

---

## Lições aprendidas

1. **Nunca carregue tudo na memória** — 500k registros cabem em RAM, mas 5 milhões não. Streaming desde o começo. Já vi relatório de 2GB derrubar servidor porque o desenvolvedor fez `JSON.stringify(array)`.

2. **Fila com retry salva sua pele** — Se o S3 cai, o worker tenta de novo. Se o banco está lento, o worker espera. Com `backoff: 'exponential'`, você não sobrecarrega os serviços dependentes.

3. **Signed URL é segurança básica** — Não deixe relatório financeiro público. URL expirável de 1 hora. E revogue se o cliente pedir. MinIO e S3 suportam isso nativamente.

4. **Idempotência importa** — Se o job roda duas vezes, não pode gerar duas cópias. Use `reportId` como chave. Se o relatório já existe, retorne o existente em vez de gerar novo.

5. **Formato de CSV depende do locale** — Brasileiro usa ponto-e-vírgula e vírgula decimal. Americano usa vírgula e ponto. Seu CSV não pode assumir que o Excel do cliente vai interpretar certo.

6. **Monitore o progresso** — O cliente precisa saber se o relatório está gerando, pronto, ou falhou. SSE ou polling com status. Nunca deixe o cliente no escuro.

7. **Worker com timeout** — Relatório que leva mais de 30 minutos provavelmente nunca vai terminar. Implemente timeout e notifique o cliente pra tentar com filtros mais restritivos.

8. **Rate limit na fila** — Se 1000 clientes pedirem relatório ao mesmo tempo, a fila precisa lidar. BullMQ (ou Redis) com backpressure. Não deixe a fila crescer infinitamente.

9. **Compressão antes do upload** — CSV de 500k linhas pode ter centenas de MB. Comprima com GZip. O MinIO/S3 aceita `Content-Encoding: gzip`. O download fica 10x menor.

10. **CSV com BOM pra Excel** — Excel abre CSV com encoding errado se não tiver BOM (`\uFEFF`) no começo. Adicione o BOM no início do stream. Parece detalhe, mas seu cliente financeiro vai tentar abrir no Excel e ver "�" em todo lugar.

## Código completo

O módulo de relatórios está em `packages/report-system/`. Pra rodar:

```bash
# Sobe infra (PostgreSQL + Redis + MinIO)
make infra-up

# Popula banco com dados de teste
node scripts/seed-transactions.mjs --count 100000

# Roda o sistema
pnpm --filter @banking/report-system dev

# Testes
pnpm --filter @banking/report-system test
```

### Testes de integração

```typescript
// tests/report.test.ts
import { describe, it, expect } from 'vitest';

const BASE_URL = 'http://localhost:3008';

describe('Report System', () => {
  it('deve criar job de relatório', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'TRANSACTIONS',
        format: 'CSV',
        filters: { from: '2024-01-01' },
      }),
    });

    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body.reportId).toBeDefined();
    expect(body.status).toBe('QUEUED');
  });

  it('deve retornar status do relatório', async () => {
    // Primeiro cria um relatório
    const create = await fetch(`${BASE_URL}/api/v1/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'TRANSACTIONS',
        format: 'CSV',
        filters: { from: '2024-01-01' },
      }),
    });

    const { reportId } = await create.json();

    // Polling até ficar pronto
    let status = 'QUEUED';
    while (status === 'QUEUED' || status === 'GENERATING') {
      const res = await fetch(`${BASE_URL}/api/v1/reports/${reportId}`);
      const body = await res.json();
      status = body.status;
      if (status === 'READY' || status === 'FAILED') break;
      await new Promise(r => setTimeout(r, 500));
    }

    expect(status).toBe('READY');
  });
});
```

### Script de seed de dados

```typescript
// scripts/seed-transactions.mjs
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://admin:admin@localhost:5432/banking',
});

async function seed(count = 100000) {
  const client = await pool.connect();

  console.log(`Populando ${count} transações...`);

  const types = ['PIX', 'TED', 'DOC', 'BOLETO', 'DEBITO', 'CREDITO'];
  const statuses = ['CONFIRMED', 'PENDING', 'FAILED', 'REFUNDED'];

  for (let i = 0; i < count; i += 1000) {
    const values = [];

    for (let j = 0; j < 1000 && i + j < count; j++) {
      const amount = (Math.random() * 10000 - 500).toFixed(2);
      const type = types[Math.floor(Math.random() * types.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const daysAgo = Math.floor(Math.random() * 365);
      const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();

      values.push(`('txn_${i + j}', '${type}', ${amount}, '${status}', 'cust_${Math.floor(Math.random() * 1000)}', '${createdAt}')`);
    }

    await client.query(`
      INSERT INTO transactions (id, type, amount, status, customer_id, created_at)
      VALUES ${values.join(', ')}
    `);

    console.log(`  ${Math.min(i + 1000, count)}/${count}`);
  }

  console.log('Seed completo!');
  await client.end();
  await pool.end();
}

seed(parseInt(process.argv[2]) || 100000).catch(console.error);
```
