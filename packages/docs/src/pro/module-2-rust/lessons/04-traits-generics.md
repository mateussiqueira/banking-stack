# Módulo 2 — Rust para Fintechs
## Aula 04: Traits e Generics para Abstrações Financeiras

**Duração:** 45 min
**Nível:** Intermediário/Avançado

### Objetivos
- Definir traits para abstrair serviços financeiros (Ledger, Pagamentos, Detecção de Fraude)
- Implementar polimorfismo sem custo de runtime com dispatch estático e genérico
- Usar trait bounds para compor serviços que dependem de múltiplas capacidades
- Aplicar o padrão Strategy via traits para diferentes gateways de pagamento

### Teoria

Sistemas financeiros precisam de abstrações que permitam trocar infraestrutura (PostgreSQL vs Oracle, REST vs gRPC, ClearSale vs Riskified) sem reescrever lógica de negócio. Traits do Rust oferecem polimorfismo em compilação — sem vtable, sem boxing, sem custo de runtime.

**LedgerService como trait central.** Todo sistema financeiro tem o conceito de ledger (livro-razão). Modele o que ele faz, não como ele persiste:

```rust
use async_trait::async_trait;
use chrono::{DateTime, Utc};

#[async_trait]
pub trait LedgerService {
    async fn record_entry(&self, entry: LedgerEntry) -> Result<EntryId, LedgerError>;
    async fn get_balance(&self, account_id: u64) -> Result<Balance, LedgerError>;
    async fn get_transactions(
        &self,
        account_id: u64,
        from: DateTime<Utc>,
        to: DateTime<Utc>,
    ) -> Result<Vec<LedgerEntry>, LedgerError>;
}
```

Com a trait definida, você pode ter `PostgresLedger`, `InMemoryLedger` (para testes) e `ReplicatedLedger` (para produção com read replicas) — a lógica de transferência não sabe qual está usando.

**PaymentProcessor com generics.** O processador de pagamentos precisa de um ledger, mas não deve acoplar ao tipo concreto:

```rust
pub struct PaymentProcessor<L: LedgerService> {
    ledger: L,
    supported_methods: Vec<PaymentMethod>,
    daily_limits: HashMap<u64, i64>,
}

impl<L: LedgerService> PaymentProcessor<L> {
    pub fn new(ledger: L, limits: HashMap<u64, i64>) -> Self {
        Self {
            ledger,
            supported_methods: vec![PaymentMethod::Pix, PaymentMethod::Ted],
            daily_limits: limits,
        }
    }

    pub async fn process_payment(&self, request: PaymentRequest) -> Result<Payment, PaymentError> {
        let current_balance = self.ledger.get_balance(request.payer_id).await?;
        if current_balance.available_cents < request.amount_cents {
            return Err(PaymentError::InsufficientFunds);
        }
        // ... validações, limites, fraude ...
        let entry = LedgerEntry::debit(request.payer_id, request.amount_cents);
        self.ledger.record_entry(entry).await?;
        Ok(Payment { status: PaymentStatus::Settled })
    }
}
```

O compilador gera uma versão monomorfizada para cada tipo concreto de `L`. Zero overhead de indireção — é como se você tivesse escrito código específico para `PostgresLedger`, mas com total desacoplamento.

**FraudDetector com Strategy pattern.** Diferentes provedores de antifraude implementam a mesma trait:

```rust
#[async_trait]
pub trait FraudDetector {
    async fn analyze(&self, payment: &PaymentRequest) -> Result<FraudDecision, FraudError>;
    async fn should_block(&self, account_id: u64) -> Result<bool, FraudError>;
}

pub struct ClearSaleDetector {
    api_key: String,
    client: reqwest::Client,
}

pub struct RiskifiedDetector {
    shop_domain: String,
    client: reqwest::Client,
}

#[async_trait]
impl FraudDetector for ClearSaleDetector {
    async fn analyze(&self, payment: &PaymentRequest) -> Result<FraudDecision, FraudError> {
        // Chamada REST à API do ClearSale
        todo!()
    }

    async fn should_block(&self, account_id: u64) -> Result<bool, FraudError> {
        todo!()
    }
}
```

**Trait bounds compostos.** Serviços reais dependem de múltiplas capacidades:

```rust
pub struct DisputeService<L, F, N>
where
    L: LedgerService,
    F: FraudDetector,
    N: NotificationService,
{
    ledger: L,
    fraud: F,
    notifier: N,
}

impl<L, F, N> DisputeService<L, F, N>
where
    L: LedgerService,
    F: FraudDetector,
    N: NotificationService,
{
    pub async fn open_dispute(&self, dispute: DisputeRequest) -> Result<Dispute, DisputeError> {
        let fraud_check = self.fraud.analyze(&dispute.payment).await?;
        if fraud_check.is_suspicious() {
            self.notifier.notify_analyst("Disputa suspeita aberta").await?;
        }
        self.ledger.record_entry(LedgerEntry::hold(dispute.amount_cents)).await?;
        Ok(Dispute::opened())
    }
}
```

**Derive macros para tipos de domínio.** Traits da std library são implementadas automaticamente:

```rust
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct Money {
    pub currency: Currency,
    pub amount_cents: i64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Currency { BRL, USD, EUR }
```

`Eq` e `Hash` permitem usar `Money` como chave de `HashMap`. `PartialEq` é crítico para comparações exatas em testes de conciliação — nunca compare floats para dinheiro.

### Exercício

Defina as traits `NotificationService` (método `notify_customer`) e `FeeCalculator` (método `calculate_fee` que recebe `PaymentMethod` e `amount_cents`, retorna a tarifa em centavos). Implemente `FeeCalculator` para duas estratégias: tarifa fixa de 1.5% para Pix e tabela regressiva para TED baseada em faixas de valor. Escreva um teste que usa `InMemoryLedger` + `FeeCalculator` via `PaymentProcessor` genérico e verifica se a tarifa é debitada corretamente.

### Próximo
[05 — Async com Tokio para Alto Throughput](./05-async-tokio.md)
