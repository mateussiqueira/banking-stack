# Challenge: Data Lake para Fintechs

## Contexto

Fintechs precisam consolidar dados de múltiplas fontes para análises financeiras, relatórios regulatórios e Intelligence de Negócios. Este desafio consiste em construir um Data Lake que ingira dados de diferentes formatos, armazene de forma eficiente e permita consultas analíticas performáticas.

## Objetivos

- Criar pipeline de ingestão multi-fonte (API, CSV, Kafka)
- Implementar armazenamento em formato Parquet otimizado
- Desenvolver engine de consultas com DuckDB
- Construir dashboard de analytics básico

## Requisitos

### Funcionais

1. **Ingestão de Dados**
   - APIs REST (pull em intervalos configuráveis)
   - Upload de arquivos CSV/Excel
   - Stream via Kafka (dados em tempo real)
   - Schema evolution support
   - Deduplicação de registros

2. **Armazenamento em Parquet**
   - Particionamento por data/fonte/tipo
   - Compressão otimizada (Snappy/Zstd)
   - Schema registry para governance
   - Lifecycle de dados (hot/warm/cold)
   - Metadados completos

3. **Query Engine (DuckDB)**
   - SQL analítico sobre Parquet
   - Views materializadas para queries comuns
   - Cache de resultados
   - Export para CSV/JSON
   - UDFs para cálculos financeiros

4. **Dashboard de Analytics**
   - Métricas de ingestão (volume, latência)
   - Análises de dados financeiros:
     - Volume por período
     - Top categorias
     - Tendências temporais
   - Filtros dinâmicos
   - Export de relatórios

### Não-Funcionais

- Throughput ingestão: 1GB/minuto
- Query latency: < 2s para queries típicas
- Retenção: configurável (padrão 2 anos)
- Compressão: > 10x ratio
- LGPD compliance

## Stack Tecnológica

- **Linguagem**: Go ou Rust
- **Storage Format**: Apache Parquet
- **Query Engine**: DuckDB
- **Message Broker**: Kafka (para streams)
- **Metastore**: SQLite ou PostgreSQL
- **Dashboard**: Go + HTML/JS ou Grafana

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                      FONTES DE DADOS                               │
│                                                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │  APIs   │  │  CSV    │  │  Kafka  │  │  FTP    │  │  S3     │  │
│  │ Externas│  │ Upload  │  │ Streams │  │  Files  │  │ Buckets │  │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  │
│       │            │            │            │            │         │
└───────┼────────────┼────────────┼────────────┼────────────┼─────────┘
        │            │            │            │            │
        ▼            ▼            ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      INGESTION LAYER                                │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    API Collector                              │  │
│  │                                                               │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │  │
│  │  │ Scheduler   │  │ Rate Limiter│  │ Retry Logic │          │  │
│  │  │ (Cron-like) │  │             │  │             │          │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    CSV/Excel Processor                        │  │
│  │                                                               │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │  │
│  │  │ Parser      │  │ Validator   │  │ Transformer │          │  │
│  │  │ (multi-type)│  │ (schema)    │  │ (cleaning)  │          │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Kafka Consumer                             │  │
│  │                                                               │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │  │
│  │  │ Deserializer│  │ Enricher    │  │ Batcher     │          │  │
│  │  │             │  │             │  │ (micro-batch)│          │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      PROCESSING LAYER                               │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Schema Registry                           │  │
│  │                                                               │  │
│  │  - Schema versioning                                          │  │
│  │  - Validation rules                                           │  │
│  │  - Evolution tracking                                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Transform Engine                           │  │
│  │                                                               │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │  │
│  │  │ Cleansing   │  │ Enrichment  │  │ Aggregation │          │  │
│  │  │ (dedup,     │  │ (lookup     │  │ (pre-agg    │          │  │
│  │  │  normalize) │  │  external)  │  │  metrics)   │          │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      STORAGE LAYER                                  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Data Lake Storage                          │  │
│  │                                                               │  │
│  │  /data-lake/                                                  │  │
│  │  ├── raw/                    (dados brutos)                   │  │
│  │  │   └── {source}/{date}/                                       │  │
│  │  ├── processed/              (dados processados)              │  │
│  │  │   └── {dataset}/{date}/                                     │  │
│  │  ├── aggregated/             (métricas pré-calculadas)       │  │
│  │  │   └── {metric}/{date}/                                      │  │
│  │  └── metadata/               (schemas, catálogos)             │  │
│  │      ├── schemas/                                              │  │
│  │      └── catalog.json                                          │  │
│  │                                                               │  │
│  │  Formatos:                                                   │  │
│  │  - Parquet (dados colunares, compressão Snappy)              │  │
│  │  - Partition: {year}/{month}/{day}/                           │  │
│  │  - Bloom filters para lookups                                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Metadata Store (PostgreSQL)                │  │
│  │                                                               │  │
│  │  - Datasets registry                                          │  │
│  │  - Schema versions                                            │  │
│  │  - Lineage tracking                                           │  │
│  │  - Access control                                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      QUERY LAYER                                    │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    DuckDB Query Engine                        │  │
│  │                                                               │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │  │
│  │  │ SQL Parser  │  │ Optimizer   │  │ Executor    │          │  │
│  │  │             │  │ (pushdown,  │  │ (vectorized,│          │  │
│  │  │             │  │  pruning)   │  │  parallel)  │          │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │  │
│  │                                                               │  │
│  │  ┌──────────────────────────────────────────────────────┐    │  │
│  │  │  Features:                                            │    │  │
│  │  │  - Query directly over Parquet files                  │    │  │
│  │  │  - Automatic partition pruning                        │    │  │
│  │  │  - Result caching (Redis)                             │    │  │
│  │  │  - Materialized views for common queries              │    │  │
│  │  │  - UDFs: financial calculations                       │    │  │
│  │  └──────────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    API Server                                │  │
│  │                                                               │  │
│  │  POST /query          - Execute SQL query                    │  │
│  │  GET  /datasets       - List available datasets              │  │
│  │  GET  /datasets/{id}  - Dataset metadata                     │  │
│  │  POST /ingest         - Trigger manual ingestion             │  │
│  │  GET  /jobs           - List ingestion jobs                  │  │
│  │  GET  /metrics        - System metrics                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DASHBOARD                                      │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         │  │
│  │  │  Total  │  │ Ingested│  │ Queries │  │  Size   │         │  │
│  │  │ Records │  │  Today  │  │  Today  │  │  (GB)   │         │  │
│  │  │  1.2M   │  │  45.2K  │  │   234   │  │  12.4   │         │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘         │  │
│  │                                                               │  │
│  │  ┌──────────────────────────────────────────────────────┐    │  │
│  │  │           INGESTION VOLUME BY SOURCE                 │    │  │
│  │  │  ████████████████░░░░  API (60%)                     │    │  │
│  │  │  ████████░░░░░░░░░░░░  CSV (25%)                     │    │  │
│  │  │  ████░░░░░░░░░░░░░░░░  Kafka (15%)                   │    │  │
│  │  └──────────────────────────────────────────────────────┘    │  │
│  │                                                               │  │
│  │  ┌──────────────────────────────────────────────────────┐    │  │
│  │  │           QUERY PERFORMANCE                          │    │  │
│  │  │  ~~~~~~~/\~~~~~~~\/\~~~~~~~/\~~~~~~~                │    │  │
│  │  │       \/  \~~~~~~    \~~~~~  \~~~~                  │    │  │
│  │  └──────────────────────────────────────────────────────┘    │  │
│  │                                                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Estrutura do Projeto

```
data-lake-fintech/
├── cmd/
│   ├── api/
│   │   └── main.go
│   ├── ingestion/
│   │   └── main.go
│   └── worker/
│       └── main.go
├── internal/
│   ├── ingestion/
│   │   ├── collector/
│   │   │   ├── api.go
│   │   │   ├── csv.go
│   │   │   └── kafka.go
│   │   ├── processor/
│   │   │   ├── validator.go
│   │   │   ├── transformer.go
│   │   │   └── deduplicator.go
│   │   └── scheduler/
│   │       └── scheduler.go
│   ├── storage/
│   │   ├── parquet/
│   │   │   ├── writer.go
│   │   │   ├── reader.go
│   │   │   └── partition.go
│   │   ├── schema/
│   │   │   ├── registry.go
│   │   │   └── evolution.go
│   │   └── lifecycle/
│   │       └── manager.go
│   ├── query/
│   │   ├── engine/
│   │   │   ├── duckdb.go
│   │   │   ├── optimizer.go
│   │   │   └── cache.go
│   │   ├── udf/
│   │   │   ├── financial.go
│   │   │   └── aggregations.go
│   │   └── views/
│   │       └── materializer.go
│   ├── api/
│   │   ├── handlers/
│   │   │   ├── query.go
│   │   │   ├── datasets.go
│   │   │   ├── ingest.go
│   │   │   └── metrics.go
│   │   └── middleware/
│   ├── catalog/
│   │   ├── dataset.go
│   │   ├── lineage.go
│   │   └── metadata.go
│   └── config/
│       └── config.go
├── pkg/
│   ├── parquet/
│   │   ├── writer.go
│   │   └── reader.go
│   ├── duckdb/
│   │   └── conn.go
│   ├── kafka/
│   │   └── consumer.go
│   ├── database/
│   │   └── postgres.go
│   └── logger/
│       └── logger.go
├── migrations/
│   └── 001_initial.sql
├── schemas/
│   ├── transaction.json
│   ├── account.json
│   └── customer.json
├── docker-compose.yml
├── Dockerfile
├── go.mod
└── README.md
```

## Schema Registry (Exemplo)

```json
{
  "datasets": [
    {
      "id": "transactions",
      "name": "Transações Financeiras",
      "description": "Registro de todas as transações financeiras",
      "schema": {
        "fields": [
          {"name": "id", "type": "STRING", "nullable": false},
          {"name": "account_id", "type": "STRING", "nullable": false},
          {"name": "amount", "type": "DECIMAL(18,2)", "nullable": false},
          {"name": "currency", "type": "STRING", "nullable": false},
          {"name": "type", "type": "STRING", "nullable": false},
          {"name": "status", "type": "STRING", "nullable": false},
          {"name": "created_at", "type": "TIMESTAMP", "nullable": false},
          {"name": "metadata", "type": "JSON", "nullable": true}
        ],
        "partition_keys": ["created_at"],
        "primary_key": ["id"]
      },
      "retention_days": 730,
      "source": "kafka"
    }
  ]
}
```

## Query Examples

```sql
-- Volume de transações por dia nos últimos 7 dias
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_transactions,
    SUM(amount) as total_amount
FROM transactions
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY 1
ORDER BY 1 DESC;

-- Top 10 contas por volume transacional
SELECT 
    account_id,
    COUNT(*) as transaction_count,
    SUM(amount) as total_volume,
    AVG(amount) as avg_transaction
FROM transactions
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY 1
ORDER BY 2 DESC
LIMIT 10;

-- Taxa de sucesso por tipo de transação
SELECT 
    type,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
    ROUND(100.0 * COUNT(CASE WHEN status = 'completed' THEN 1 END) / COUNT(*), 2) as success_rate
FROM transactions
WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
GROUP BY 1;
```

## Critérios de Avaliação

### Funcionalidade (40%)

- [ ] Ingestão de CSV funcionando
- [ ] Ingestão de API configurável
- [ ] Consumo de Kafka
- [ ] Armazenamento em Parquet com particionamento
- [ ] Query engine com DuckDB
- [ ] Dashboard básico funcional

### Performance (25%)

- [ ] Ingestão > 1GB/minuto
- [ ] Queries típicas < 2s
- [ ] Compressão eficiente (> 8x)
- [ ] Particionamento eficaz (pruning funciona)

### Qualidade de Código (20%)

- [ ] Arquitetura limpa
- [ ] Schema registry funcional
- [ ] Tratamento de erros adequado
- [ ] Testes unitários > 60%
- [ ] Documentação de API

### Operacionalidade (15%)

- [ ] Docker Compose funcional
- [ ] Métricas de ingestão disponíveis
- [ ] Logs estruturados
- [ ] Health checks
- [ ] README completo

## Bônus

- CDC (Change Data Capture) para databases
- Data quality checks automáticos
- Lineage de dados completo
- A/B testing de schemas
- Cache de query results
- Export para formats adicionais (ORC, Avro)
- Integração com BI tools (Metabase, Superset)

## Referências

- [Apache Parquet](https://parquet.apache.org/)
- [DuckDB](https://duckdb.org/)
- [Go Parquet Library](https://github.com/xitongsys/parquet-go)
- [Kafka Go Client](https://github.com/segmentio/kafka-go)

## Entregáveis

1. Repositório com código fonte
2. docker-compose.yml funcional
3. Schemas de exemplo
4. Dados de teste (synthetic data)
5. Documentação de setup e uso
6. Exemplos de queries
7. (Opcional) Dashboard funcional
8. (Opcional) Simulador de dados
