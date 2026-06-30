# Módulo 2 — Rust para Fintechs
## Aula 07: SQLx com PostgreSQL, Migrations e Transações para Persistência de Ledger

**Duração:** 45 min
**Nível:** Intermediário/Avançado

### Objetivos
- Configurar SQLx com PostgreSQL para acesso tipado e compilado a queries financeiras
- Implementar migrations versionadas para schema de ledger com rollback
- Usar transações ACID para garantir atomicidade em transferências entre contas
- Aplicar locking otimista e pessimista para evitar race conditions em saldos

### Teoria

O ledger é a fonte da verdade de qualquer sistema financeiro. Cada centavo que entra ou sai deve ser registrado de forma imutável, rastreável e atômica. SQLx permite escrever queries SQL verificadas em compilação — se o schema muda e uma query referencia coluna inexistente, o build quebra antes de chegar em staging.

**Conexão e pool.** SQLx gerencia pool de conexões automaticamente:

```rust
use sqlx::postgres::{PgPoolOptions, PgPool};
use sqlx::FromRow;

#[derive(Debug, FromRow, Serialize)]
struct LedgerEntry {
    id: i64,
    account_id: i64,
    amount_cents: i64,
    entry_type: String,   // "credit" | "debit"
    description: String,
    created_at: DateTime<Utc>,
    transaction_id: String,
}

async fn create_pool(database_url: &str) -> Result<PgPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(20)
        .min_connections(5)
        .acquire_timeout(Duration::from_secs(10))
        .idle_timeout(Duration::from_secs(300))
        .connect(database_url)
        .await
}
```

Configure `max_connections` com cuidado — cada conexão consome recursos do PostgreSQL. Para sistemas de pagamento, 20-50 conexões geralmente bastam para milhares de transações por segundo.

**Migrations versionadas.** SQLx usa migrations no diretório `migrations/`. Arquivos são nomeados com timestamp + descrição:

```
migrations/
  20250101000001_create_accounts.sql
  20250101000002_create_ledger_entries.sql
  20250101000003_create_indexes.sql
```

Conteúdo de `20250101000002_create_ledger_entries.sql`:

```sql
CREATE TABLE IF NOT EXISTS ledger_entries (
    id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL REFERENCES accounts(id),
    amount_cents BIGINT NOT NULL,
    entry_type VARCHAR(10) NOT NULL CHECK (entry_type IN ('credit', 'debit')),
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    transaction_id UUID NOT NULL UNIQUE,
    idempotency_key UUID NOT NULL UNIQUE
);

CREATE INDEX idx_ledger_account_id ON ledger_entries(account_id);
CREATE INDEX idx_ledger_created_at ON ledger_entries(account_id, created_at);
CREATE INDEX idx_ledger_transaction_id ON ledger_entries(transaction_id);
```

A coluna `idempotency_key` é crítica em sistemas financeiros — previne duplicação de transações em cenários de retry.

```rust
sqlx::migrate!("./migrations")
    .run(&pool)
    .await?;
```

**Transações ACID para transferências.** Débito e crédito devem ser atômicos — ou ambos acontecem, ou nenhum:

```rust
async fn execute_transfer(
    pool: &PgPool,
    from_account: i64,
    to_account: i64,
    amount_cents: i64,
    transaction_id: Uuid,
    idempotency_key: Uuid,
) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;

    sqlx::query!(
        "INSERT INTO ledger_entries (account_id, amount_cents, entry_type, description, transaction_id, idempotency_key)
         VALUES ($1, $2, 'debit', 'Transferencia enviada', $4, $5)
         ON CONFLICT (idempotency_key) DO NOTHING",
        from_account,
        -amount_cents,
        transaction_id,
        idempotency_key,
    )
    .execute(&mut *tx)
    .await?;

    sqlx::query!(
        "INSERT INTO ledger_entries (account_id, amount_cents, entry_type, description, transaction_id, idempotency_key)
         VALUES ($1, $2, 'credit', 'Transferencia recebida', $4, $5)",
        to_account,
        amount_cents,
        transaction_id,
        idempotency_key,
    )
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(())
}
```

`ON CONFLICT (idempotency_key) DO NOTHING` garante idempotência. Se o cliente reenviar a mesma transação, o banco ignora silenciosamente.

**Locking pessimista para saldos.** Para evitar que duas transações simultâneas leiam o mesmo saldo e causem overdraft:

```rust
async fn debit_account(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    account_id: i64,
    amount: i64,
) -> Result<(), sqlx::Error> {
    let row = sqlx::query!(
        "SELECT balance_cents FROM accounts WHERE id = $1 FOR UPDATE",
        account_id
    )
    .fetch_one(&mut **tx)
    .await?;

    let current_balance = row.balance_cents;
    if current_balance < amount {
        return Err(sqlx::Error::Protocol("Saldo insuficiente".to_string()));
    }

    sqlx::query!(
        "UPDATE accounts SET balance_cents = balance_cents - $1 WHERE id = $2",
        amount,
        account_id,
    )
    .execute(&mut **tx)
    .await?;

    Ok(())
}
```

`FOR UPDATE` bloqueia a linha até o commit, serializando operações concorrentes sobre a mesma conta. Em sistemas de alta escala, prefira locking otimista com version column para reduzir contenção:

```sql
UPDATE accounts
SET balance_cents = balance_cents - $1,
    version = version + 1
WHERE id = $2 AND version = $3
```

Se `rows_affected() == 0`, outra transação venceu a corrida — retry ou rejeite.

**Compile-time checked queries.** O macro `sqlx::query!` conecta ao banco em build e verifica tipo das colunas:

```rust
let entries = sqlx::query_as!(
    LedgerEntry,
    "SELECT id, account_id, amount_cents, entry_type, description, created_at, transaction_id
     FROM ledger_entries
     WHERE account_id = $1
     ORDER BY created_at DESC
     LIMIT 50",
    account_id
)
.fetch_all(&pool)
.await?;
```

Se `amount_cents` mudar de `BIGINT` para `NUMERIC` no PostgreSQL, o build falha com erro claro — sem surpresas em produção.

### Exercício

Crie as migrations para `accounts` (id, owner_name, document, balance_cents, version, created_at) e `ledger_entries`. Implemente a função `transfer` com transação ACID, idempotency key, locking otimista e compile-time check. Escreva um teste de integração que inicia 10 tasks simultâneas tentando debitar da mesma conta — verifique que o saldo final está correto.

### Próximo
[08 — Concorrência Avançada com Arc, Mutex e Channels](./08-concurrency.md)
