# 08 — Report System

**🇧🇷** Sistema de Relatórios  
**🇬🇧** Report System

---

Gerar um CSV de 10 linhas é fácil. Gerar um relatório de 500 mil transações, em PDF, com gráficos, e entregar em 30 segundos — isso já é mais complicado.

O problema é que você não pode carregar 500 mil registros na memória. O servidor morre, o banco trava, o cliente reclama. A solução é streaming: consulta o banco em lotes, gera o arquivo em pedaços, sobe direto pro S3.

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

---

## Como testar

```bash
make infra-up
pnpm --filter @banking/report-system dev

curl -X POST http://localhost:3008/api/v1/reports/generate \
  -H "Content-Type: application/json" \
  -d '{"type":"TRANSACTIONS","format":"CSV","filters":{"from":"2024-01-01"}}'
```

---

## Lições aprendidas

1. **Nunca carregue tudo na memória** — 500k registros cabem em RAM, mas 5 milhões não. Streaming desde o começo.
2. **Fila com retry salva sua pele** — Se o S3 cai, o worker tenta de novo. Se o banco está lento, o worker espera.
3. **Signed URL é segurança básica** — Não deixe relatório financeiro público. URL expirável de 1 hora.
4. **Idempotência importa** — Se o job roda duas vezes, não pode gerar duas cópias. Use reportId como chave.
