# Módulo 2 — Rust para Fintechs
## Aula 05: Tokio Runtime e Async/Await para Processamento de Pagamentos em Alta Escala

**Duração:** 45 min
**Nível:** Intermediário/Avançado

### Objetivos
- Configurar o runtime Tokio multithreaded para workloads de pagamento
- Processar lotes de transações concorrentemente com `join!`, `select!` e `spawn`
- Gerenciar concorrência com `Semaphore` para respeitar rate limits do SPI/Banco Central
- Implementar timeouts e retries com `tokio::time` para integrações com adquirentes

### Teoria

Sistemas de pagamento modernos processam centenas ou milhares de transações por segundo. O modelo async do Rust com Tokio oferece concorrência cooperativa — milhares de tarefas leves compartilhando poucas threads do SO, ideal para workloads I/O-bound como chamadas a APIs bancárias, consultas a banco de dados e leitura de filas.

**Configuração do runtime para fintech.** O Tokio multithreaded é o padrão. Ajuste para o perfil do seu workload:

```rust
#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let database_url = std::env::var("DATABASE_URL")?;
    let pool = PgPoolOptions::new()
        .max_connections(20)
        .connect(&database_url)
        .await?;

    let processor = PaymentProcessor::new(
        PostgresLedger::new(pool.clone()),
        FraudDetector::new(pool.clone()),
    );

    let listener = TcpListener::bind("0.0.0.0:3000").await?;
    loop {
        let (socket, _) = listener.accept().await?;
        let processor = processor.clone();
        tokio::spawn(async move {
            if let Err(e) = handle_connection(socket, processor).await {
                tracing::error!("Erro na conexão: {e}");
            }
        });
    }
}
```

Cada conexão recebe uma task independente. Se uma falha ou trava em I/O, as demais continuam processando — sem bloquear o event loop.

**Processamento de lote concorrente com join_all.** Fechamento de lote diário que dispara liquidações em paralelo:

```rust
use futures::future::join_all;

async fn settle_batch(batch: &[Transaction], processor: &PaymentProcessor) -> Vec<Result<Settlement, PaymentError>> {
    let futures: Vec<_> = batch
        .iter()
        .map(|tx| processor.settle(tx))
        .collect();
    join_all(futures).await
}
```

`join_all` aguarda todas as liquidações. Para milhares de transações, combine com `Semaphore` para limitar concorrência.

**Rate limiting com Semaphore.** O SPI (Sistema de Pagamentos Instantâneos) impõe rate limits. O `Semaphore` do Tokio controla quantas chamadas ocorrem simultaneamente:

```rust
use tokio::sync::Semaphore;
use std::sync::Arc;

async fn settle_with_rate_limit(
    batch: Vec<Transaction>,
    processor: PaymentProcessor,
    max_concurrent: usize,
) -> Vec<Result<Settlement, PaymentError>> {
    let semaphore = Arc::new(Semaphore::new(max_concurrent));
    let futures: Vec<_> = batch
        .into_iter()
        .map(|tx| {
            let permit = semaphore.clone().acquire_owned();
            let processor = processor.clone();
            async move {
                let _permit = permit.await.expect("Semaphore fechado");
                processor.settle(&tx).await
            }
        })
        .collect();
    join_all(futures).await
}
```

O `_permit` é liberado ao sair de escopo, permitindo que outra task adquira o semáforo.

**Retry com backoff exponencial.** APIs bancárias falham transitoriamente. Combine `tokio::time::sleep` com estratégia de retry:

```rust
use tokio::time::{sleep, Duration};

async fn call_spi_with_retry(request: &SpiRequest, max_retries: u32) -> Result<SpiResponse, SpiError> {
    let mut attempt = 0;
    loop {
        match call_spi_endpoint(request).await {
            Ok(response) => return Ok(response),
            Err(SpiError::Timeout) if attempt < max_retries => {
                attempt += 1;
                let backoff = Duration::from_millis(100 * 2u64.pow(attempt));
                tracing::warn!("Tentativa {attempt} falhou. Retry em {backoff:?}");
                sleep(backoff).await;
            }
            Err(e) => return Err(e),
        }
    }
}
```

O backoff exponencial (`100ms * 2^n`) evita sobrecarregar o sistema alvo durante degradação.

**Timeout em chamadas externas.** Nenhuma chamada a sistema externo deve bloquear indefinidamente:

```rust
async fn fetch_exchange_rate() -> Result<Decimal, ExchangeError> {
    tokio::time::timeout(
        Duration::from_secs(5),
        call_exchange_api(),
    )
    .await
    .map_err(|_| ExchangeError::Timeout(5))?
}
```

**select! para race conditions produtivas.** Quando múltiplas fontes podem entregar um dado, use a mais rápida:

```rust
use tokio::select;

async fn query_account_balance(account_id: u64) -> Result<Balance, LedgerError> {
    select! {
        result = query_primary_db(account_id) => result,
        result = query_cache_redis(account_id) => {
            match result {
                Ok(balance) => Ok(balance),
                Err(_) => query_primary_db(account_id).await,
            }
        }
        _ = sleep(Duration::from_millis(200)) => {
            Err(LedgerError::Timeout)
        }
    }
}
```

`select!` executa branches concorrentes e adota o resultado da primeira que completar — implementando o padrão de leitura de cache com fallback e timeout.

### Exercício

Crie um `BatchPaymentService` que recebe um `Vec<Transaction>`, divide as transações em chunks de 50, processa cada chunk concorrentemente usando `Semaphore` com limite 10, e coleta todos os resultados. Adicione retry com backoff exponencial (máx. 3 tentativas) para falhas transientes. Escreva um teste com um ledger mock que falha nas primeiras 3 chamadas e depois responde — verifique que o retry resolve.

### Próximo
[06 — Serde para Serialização Financeira](./06-serde-serialization.md)
