# Módulo 2 — Rust para Fintechs
## Aula 08: Concorrência Avançada com Arc, Mutex, RwLock e Channels

**Duração:** 45 min
**Nível:** Intermediário/Avançado

### Objetivos
- Usar Arc para compartilhar estado entre tasks de processamento de pagamentos
- Escolher entre Mutex (escrita exclusiva) e RwLock (muitas leituras, poucas escritas) para caches financeiros
- Implementar pipelines de processamento com mpsc channels no estilo actor model
- Aplicar dashmap e evmap para caches thread-safe com performance superior a `Mutex<HashMap>`

### Teoria

Processadores de pagamento precisam de estado compartilhado: cache de saldos, lista de contas bloqueadas, limites diários atualizados em tempo real, filas de liquidação. Rust oferece primitivas de concorrência com garantias de segurança em compilação — sem data races, sem deadlocks acidentais causados por inversão de lock.

**Arc — compartilhamento de dados imutáveis.** Para dados de referência que não mudam após carga (ex: tabela de ISPB de bancos, tarifas do dia):

```rust
use std::sync::Arc;

#[derive(Debug)]
struct BankRegistry {
    banks: `Vec<BankInfo>`,
}

async fn start_server(registry: `Arc<BankRegistry>`, pool: PgPool) {
    let listener = TcpListener::bind("0.0.0.0:8080").await.unwrap();
    loop {
        let (socket, _) = listener.accept().await.unwrap();
        let registry = Arc::clone(&registry);
        let pool = pool.clone();
        tokio::spawn(async move {
            handle_request(socket, registry, pool).await;
        });
    }
}
```

`Arc::clone` incrementa o contador de referências, não copia os dados — centenas de tasks compartilham o mesmo `BankRegistry` na heap sem overhead.

**RwLock para caches de alta leitura.** O cache de limites diários é lido em toda transação, mas atualizado apenas quando o limite é consumido:

```rust
use tokio::sync::RwLock;

struct DailyLimitCache {
    limits: RwLock<HashMap<i64, i64>>,  // account_id -> remaining_limit
}

impl DailyLimitCache {
    async fn check_and_reserve(&self, account_id: i64, amount: i64) -> Result<(), LimitError> {
        let mut limits = self.limits.write().await;
        let remaining = limits.get_mut(&account_id).ok_or(LimitError::AccountNotFound)?;
        if *remaining < amount {
            return Err(LimitError::DailyLimitExceeded);
        }
        *remaining -= amount;
        Ok(())
    }

    async fn get_remaining(&self, account_id: i64) -> Option<i64> {
        self.limits.read().await.get(&account_id).copied()
    }
}
```

`read().await` permite centenas de leituras simultâneas. `write().await` garante exclusividade durante atualizações.

**Mutex para contadores e estatísticas.** Contadores de transações por segundo, métricas e estado simples não precisam de RwLock:

```rust
use tokio::sync::Mutex;

struct PaymentMetrics {
    processed: Mutex<u64>,
    failed: Mutex<u64>,
    total_amount_cents: Mutex<i64>,
}

impl PaymentMetrics {
    async fn record_success(&self, amount: i64) {
        let mut count = self.processed.lock().await;
        *count += 1;
        drop(count);  // Libera o lock antes do próximo

        let mut total = self.total_amount_cents.lock().await;
        *total += amount;
    }
}
```

O `drop` manual libera o lock mais cedo, evitando contenção desnecessária.

**MPSC Channels para pipeline de processamento.** O padrão actor model isola responsabilidades. Cada etapa do pipeline roda em sua própria task, comunicando-se via channels:

```rust
use tokio::sync::mpsc;

enum PipelineMessage {
    NewTransaction(Transaction),
    FraudCheckResult { tx_id: String, approved: bool },
    SettlementConfirmation { tx_id: String, settlement_id: String },
    Shutdown,
}

async fn pipeline_orchestrator() {
    let (fraud_tx, fraud_rx) = mpsc::channel(1024);
    let (settlement_tx, settlement_rx) = mpsc::channel(1024);
    let (notification_tx, notification_rx) = mpsc::channel(512);

    tokio::spawn(fraud_worker(fraud_rx, settlement_tx.clone()));
    tokio::spawn(settlement_worker(settlement_rx, notification_tx.clone()));
    tokio::spawn(notification_worker(notification_rx));

    // Sender para entrada de novas transações
    // fraud_tx.send(PipelineMessage::NewTransaction(tx)).await;
}

async fn fraud_worker(
    mut rx: mpsc::Receiver<PipelineMessage>,
    settlement_tx: mpsc::Sender<PipelineMessage>,
) {
    while let Some(msg) = rx.recv().await {
        match msg {
            PipelineMessage::NewTransaction(tx) => {
                let approved = check_fraud(&tx);
                settlement_tx
                    .send(PipelineMessage::FraudCheckResult {
                        tx_id: tx.id,
                        approved,
                    })
                    .await
                    .ok();
            }
            PipelineMessage::Shutdown => break,
            _ => {}
        }
    }
}
```

Cada worker só sabe o que precisa — o fraud worker não conhece notificações, o settlement worker não conhece fraude. Se um worker fica lento, o channel buffer absorve picos.

**dashmap — HashMap concorrente sem locks globais.** Para caches de alto throughput, `dashmap` usa sharding interno:

```rust
use dashmap::DashMap;

struct SharedLimitCache {
    limits: DashMap<i64, AtomicI64>,  // account_id -> remaining_limit
}

impl SharedLimitCache {
    fn consume(&self, account_id: i64, amount: i64) -> Result<i64, LimitError> {
        if let Some(mut entry) = self.limits.get_mut(&account_id) {
            let remaining = entry.value_mut();
            if *remaining < amount {
                return Err(LimitError::DailyLimitExceeded);
            }
            *remaining -= amount;
            Ok(*remaining)
        } else {
            Err(LimitError::AccountNotFound)
        }
    }
}
```

DashMap divide o hashmap em shards — cada shard tem seu próprio lock. Milhares de contas diferentes podem ser atualizadas simultaneamente sem contenção.

### Exercício

Implemente um `TransactionPipeline` com três stages via mpsc channels: validação (verifica saldo e limites) → liquidação (grava no ledger simulado) → notificação (print). Use Arc<`RwLock<HashMap>`> para o estado de saldos compartilhado entre os validadores. Submeta 100 transações simultâneas via `tokio::spawn` e verifique que o saldo final está correto.

### Próximo
[09 — Testing e Property-Based Testing para Finanças](./09-testing-proptest.md)
