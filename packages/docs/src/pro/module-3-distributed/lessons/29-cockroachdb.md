# Modulo 3 — Sistemas Distribuidos para Fintechs
## Aula 29: CockroachDB e Banco Distribuido

**Duracao:** 50 min  
**Nivel:** Avancado

### Objetivos
- Compreender Distributed SQL e suas diferencas de bancos tradicionais
- Configurar e operar CockroachDB com Raft consensus
- Implementar transacoes serializaveis distribuidas
- Comparar CockroachDB com PostgreSQL e YugabyteDB para decisoes de arquitetura

### Teoria

#### O que e Distributed SQL?

Distributed SQL combina a facilidade de uso de SQL com a escalabilidade horizontal de bancos distribuidos. Enquanto bancos tradicionais (PostgreSQL) rodam em um unico no, Distributed SQL distribui dados automaticamente entre multiplos nos com replicacao, sharding e consensus embutidos.

**Propriedades essenciais:**
- **Serializable Isolation** — padrao (nao configuravel para niveis mais baixos)
- **Distributed Transactions** — 2PC transparente entre nos
- **Automatic Sharding** — range-based partitioning dos dados
- **Multi-Region** — dados replicados geograficamente
- **PostgreSQL Wire Protocol** — compativel com clientes PostgreSQL

#### Raft Consensus no CockroachDB

Cada range de dados (128MB padrao) e uma unidade de replicacao. Cada range tem um grupo Raft que eletara um leader para escritas:

```
┌─────────────────────────────────────────────────────────┐
│                    Cluster CockroachDB                   │
├─────────────┬─────────────┬─────────────┬───────────────┤
│   No 1      │   No 2      │   No 3      │   No 4        │
│  (Region A) │  (Region A) │  (Region B) │  (Region B)   │
├─────────────┼─────────────┼─────────────┼───────────────┤
│ Range 1     │ Range 1     │ Range 1     │ Range 2       │
│ (Leader)    │ (Follower)  │ (Follower)  │ (Leader)      │
├─────────────┼─────────────┼─────────────┼───────────────┤
│ Range 2     │ Range 2     │ Range 3     │ Range 3       │
│ (Follower)  │ (Leader)    │ (Follower)  │ (Leader)      │
└─────────────┴─────────────┴─────────────┴───────────────┘
```

**Fluxo de escrita:**
1. Cliente envia SQL para qualquer no (load balancer)
2. No roteador mapeia a key para o range correto
3. Range leader propoe a mudanca ao grupo Raft
4. Majority (2/3) dos nos confirma
5. Leader aplica e retorna ao cliente
6. Replicas assincronas recebem o commit via Raft log

```go
// Configuracao de conexao com CockroachDB
func ConnectCockroachDB(region string) (*sql.DB, error) {
    // URLs de todos os nos para load balancing
    dsn := fmt.Sprintf(
        "postgresql://user:pass@%s:26257/banking?sslmode=verify-full&sslrootcert=certs/ca.crt",
        region,
    )
    db, err := sql.Open("postgres", dsn)
    if err != nil {
        return nil, err
    }

    // Configuracoes de pool otimizadas para distribuido
    db.SetMaxOpenConns(25)
    db.SetMaxIdleConns(10)
    db.SetConnMaxLifetime(5 * time.Minute)

    // Verificar conectividade
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    if err := db.PingContext(ctx); err != nil {
        return nil, fmt.Errorf("cluster unavailable: %w", err)
    }

    return db, nil
}
```

#### Multi-Region Deployment

CockroachDB suporta configuracao multi-region com constraints de localidade:

```sql
-- Definir regioes do cluster
ALTER DATABASE banking PRIMARY REGION "us-east-1";
ALTER DATABASE banking ADD REGION "sa-east-1";
ALTER DATABASE banking ADD REGION "eu-west-1";

-- Tabela com survival goals
ALTER TABLE contas SET LOCALITY GLOBAL;      -- dados em todas as regioes
ALTER TABLE transacoes SET LOCALITY REGIONAL BY ROW; -- dados pela regiao do usuario
ALTER TABLE logs SET LOCALITY REGIONAL BY ROW;
```

```go
// Transacao multi-region com regional affinity
func ProcessPIXWithRegionalAffinity(ctx context.Context, db *sql.DB, pix PIXRequest) error {
    // Regiao de origem (onde o usuario esta)
    originRegion := getRegionFromCPF(pix.PayerCPF)

    // Configurar prioridade de regiao
    _, err := db.ExecContext(ctx,
        "SET TRANSACTION PRIORITY HIGH")
    if err != nil {
        return err
    }

    tx, err := db.BeginTx(ctx, &sql.TxOptions{
        Isolation: sql.LevelSerializable,
    })
    if err != nil {
        return err
    }
    defer tx.Rollback()

    // O CockroachDB roteia automaticamente para a replica mais proxima
    var payerBalance int64
    err = tx.QueryRowContext(ctx,
        `SELECT saldo FROM contas WHERE cpf = $1`, pix.PayerCPF,
    ).Scan(&payerBalance)
    if err != nil {
        return err
    }

    if payerBalance < pix.Amount {
        return ErrInsufficientBalance
    }

    // Debito e credito na mesma transacao distribuida
    _, err = tx.ExecContext(ctx,
        `UPDATE contas SET saldo = saldo - $1 WHERE cpf = $2`,
        pix.Amount, pix.PayerCPF)
    if err != nil {
        return err
    }

    _, err = tx.ExecContext(ctx,
        `UPDATE contas SET saldo = saldo + $1 WHERE cpf = $2`,
        pix.Amount, pix.PayeeCPF)
    if err != nil {
        return err
    }

    return tx.Commit()
}
```

#### Serializable Isolation Padrao

Diferente do PostgreSQL (que usa Read Committed por padrao), o CockroachDB roda em **Serializable Snapshot Isolation (SSI)** por padrao. Isso e significativo para bancos:

```go
// No CockroachDB, transacoes concorrentes que causam write-write conflicts
// serao abortadas com retry — nao ha dirty reads possiveis

func DebitWithRetry(ctx context.Context, db *sql.DB, accountID string, amount int64) error {
    maxRetries := 5

    for attempt := 0; attempt < maxRetries; attempt++ {
        err := func() error {
            tx, err := db.BeginTx(ctx, nil) // Serializable por padrao
            if err != nil {
                return err
            }
            defer tx.Rollback()

            var balance int64
            err = tx.QueryRowContext(ctx,
                "SELECT saldo FROM contas WHERE id = $1", accountID,
            ).Scan(&balance)
            if err != nil {
                return err
            }

            if balance < amount {
                return ErrInsufficientBalance
            }

            _, err = tx.ExecContext(ctx,
                "UPDATE contas SET saldo = saldo - $1 WHERE id = $2",
                amount, accountID)
            if err != nil {
                return err
            }

            return tx.Commit()
        }()

        if err == nil {
            return nil
        }

        // Retry em serializable conflicts (erro 40001 no CockroachDB)
        if strings.Contains(err.Error(), "restart transaction") {
            backoff := time.Duration(math.Pow(2, float64(attempt))) * 10 * time.Millisecond
            time.Sleep(backoff)
            continue
        }

        return err
    }

    return fmt.Errorf("max retries exceeded")
}
```

#### Schema Design para Performance

```sql
-- Sequencias distribuidas (UUIDs ao inves de SERIAL)
CREATE TABLE contas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cpf VARCHAR(11) NOT NULL,
    saldo DECIMAL(15,2) NOT NULL DEFAULT 0,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    region crdb_internal_region NOT NULL DEFAULT 'us-east-1'
);

-- Indexes para queries de alto volume
CREATE INDEX idx_contas_cpf ON contas (cpf);
CREATE INDEX idx_contas_region ON contas (region) STORING (saldo);

-- Partitioning por regiao
ALTER TABLE contas PARTITION BY LIST (region) (
    PARTITION sa_east VALUES IN ('sa-east-1'),
    PARTITION us_east VALUES IN ('us-east-1'),
    PARTITION eu_west VALUES IN ('eu-west-1')
);

-- Tabela de transacoes com TTL automatico (dados quentes vs frios)
CREATE TABLE transacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payer_id UUID NOT NULL,
    payee_id UUID NOT NULL,
    valor DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 years')
) WITH (ttl = 'expires_at', ttl_expiration_expression = 'expires_at');
```

#### Comparacao: PostgreSQL vs CockroachDB vs YugabyteDB

| Caracteristica | PostgreSQL | CockroachDB | YugabyteDB |
|----------------|------------|-------------|------------|
| **Distribuido** | Nao | Sim | Sim |
| **Isolamento padrao** | Read Committed | Serializable | Serializable |
| **Consensus** | N/A | Raft | Raft |
| **Sharding** | Manual (Citus) | Automatico | Automatico |
| **Multi-region** | Streaming replication | Geo-partitioning | Geo-partitioning |
| **Latencia write** | <1ms (local) | 5-50ms (cross-region) | 5-50ms |
| **Read scaling** | Replica | Multi-region reads | Multi-region reads |
| **Write scaling** | Vertical | Horizontal | Horizontal |
| **Maturidade** | 30+ anos | 7+ anos | 7+ anos |
| **Custo** | Baixo | Alto (enterprise) | Medio |
| **Uso ideal** | Single-region, OLTP | Global, financial | Global, hybrid |

**Quando usar PostgreSQL:**
- Dados confinados a uma regiao
- Workloads read-heavy com writes moderados
- Custo e prioridade
- Time familiar com PostgreSQL

**Quando usar CockroachDB:**
- Multi-region com baixa latencia global
- Isolamento serializavel e obrigatorio (regulatorio)
- Escalabilidade horizontal de writes
- Dados criticos que nao podem tolerar perda

**Quando usar YugabyteDB:**
- Multi-region com Oracle compatibility
- Workloads hibridos (OLTP + OLAP)
- Custo menor que CockroachDB
- Redis compatibility via Yedis

```go
// Factory pattern para multi-database support
type DatabaseFactory interface {
    Connect(ctx context.Context, config DBConfig) (*sql.DB, error)
    DefaultIsolation() sql.IsolationLevel
    SupportsDistributedTx() bool
}

type PostgreSQLFactory struct{}
func (p *PostgreSQLFactory) Connect(ctx context.Context, cfg DBConfig) (*sql.DB, error) {
    // PostgreSQL connection
}
func (p *PostgreSQLFactory) DefaultIsolation() sql.IsolationLevel {
    return sql.LevelReadCommitted
}
func (p *PostgreSQLFactory) SupportsDistributedTx() bool { return false }

type CockroachDBFactory struct{}
func (c *CockroachDBFactory) Connect(ctx context.Context, cfg DBConfig) (*sql.DB, error) {
    // CockroachDB connection
}
func (c *CockroachDBFactory) DefaultIsolation() sql.IsolationLevel {
    return sql.LevelSerializable
}
func (c *CockroachDBFactory) SupportsDistributedTx() bool { return true }

type YugabyteDBFactory struct{}
func (y *YugabyteDBFactory) Connect(ctx context.Context, cfg DBConfig) (*sql.DB, error) {
    // YugabyteDB connection
}
func (y *YugabyteDBFactory) DefaultIsolation() sql.IsolationLevel {
    return sql.LevelSerializable
}
func (y *YugabyteDBFactory) SupportsDistributedTx() bool { return true }
```

### Exercicio

1. **Setup local**: Instale CockroachDB single-node e crie o schema de contas/transacoes. Execute 100 transacoes concorrentes com Apache Bench e meça throughput.

2. **Comparacao de performance**: Execute o mesmo workload (1000 transacoes) em PostgreSQL e CockroachDB. Meça latencia P50, P95, P99. Justifique as diferencas.

3. **Multi-region simulation**: Configure 3 nos CockroachDB com localidades diferentes (us-east, sa-east, eu-west). Execute transacoes cross-region e meça overhead de latencia.

4. **Retry logic**: Implemente o padrao de retry com exponential backoff para CockroachDB serializable conflicts. Teste com 10 transacoes concorrentes e conte o numero de retries necessarios.

5. **Schema migration**: Migre uma tabela PostgreSQL existente para CockroachDB. Identifique e corrija incompatibilidades de schema (auto-increment, sequences, constraints).

### Proximo
[30-architecture-review.md](30-architecture-review.md)
