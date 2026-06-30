# Módulo 2 — Rust para Fintechs
## Aula 02: Enums e Pattern Matching para Tipos Financeiros

**Duração:** 45 min
**Nível:** Intermediário/Avançado

### Objetivos
- Modelar tipos de transação, status de pagamento e erros de domínio com enums
- Usar pattern matching exaustivo para eliminar branches não tratados em compilação
- Diferenciar dados associados em variantes para enriquecer o domínio financeiro
- Aplicar if-let, while-let e matches aninhados em pipelines de processamento

### Teoria

Sistemas financeiros são repletos de estados: pagamento pendente, processado, falhou, estornado, em análise de fraude, compensado. Modelar esses estados com strings ou inteiros mágicos é a receita para bugs. Os enums do Rust, inspirados nos tipos algébricos de ML/Haskell, permitem que cada variante carregue seus próprios dados — e o compilador exige que todos os casos sejam tratados.

**TransactionType como enum rico.** Em vez de `u8` com constantes `const PIX: u8 = 0;`, modele com dados associados:

```rust
#[derive(Debug, Clone)]
enum TransactionType {
    Pix { end_to_end_id: String, key: PixKey },
    Ted { is_same_institution: bool },
    Doc,
    Boleto { bar_code: String, due_date: NaiveDate },
    InternalTransfer,
}

enum PixKey {
    Cpf(String),
    Email(String),
    Phone(String),
    RandomKey(String),
}
```

Cada variante carrega apenas os campos relevantes — um `Pix` nunca terá campo `bar_code`, e o compilador impede acesso a campos inexistentes.

**PaymentStatus com transições seguras.** Máquinas de estado são naturais com enums:

```rust
enum PaymentStatus {
    Created,
    PendingApproval { reviewer_id: Option<u64> },
    Authorized { auth_code: String, timestamp: DateTime<Utc> },
    Settled { settlement_id: String },
    Failed { error_code: u16, retry_count: u8, max_retries: u8 },
    Reversed { original_settlement_id: String, reason: ReversalReason },
}

enum ReversalReason {
    CustomerRequest,
    FraudDetected { confidence: f64, rule_id: String },
    SystemError,
    DuplicateCharge,
}
```

O padrão `match` exaustivo força que toda lógica de negócio contemple cada estado. Se amanhã o time de produto adicionar `PartiallySettled`, o compilador emite warning em todos os `match` que não o tratarem:

```rust
impl PaymentStatus {
    fn can_be_cancelled(&self) -> bool {
        match self {
            PaymentStatus::Created => true,
            PaymentStatus::PendingApproval { .. } => true,
            PaymentStatus::Authorized { .. } => true,
            PaymentStatus::Settled { .. } => false,   // Já compensado
            PaymentStatus::Failed { .. } => false,     // Já falhou
            PaymentStatus::Reversed { .. } => false,   // Já estornado
        }
    }

    fn requires_fraud_check(&self) -> bool {
        matches!(self, PaymentStatus::Created | PaymentStatus::PendingApproval { .. })
    }
}
```

O macro `matches!` é conciso para condições booleanas. O `if let` extrai dados sem boilerplate:

```rust
fn notify_analyst(status: &PaymentStatus) {
    if let PaymentStatus::PendingApproval { reviewer_id: None } = status {
        println!("ALERTA: Pagamento sem revisor atribuído!");
    }
}
```

**Error handling sem exceções.** Enums eliminam a necessidade de exceções para erros de negócio:

```rust
enum TransferError {
    InsufficientFunds { available_cents: i64, requested_cents: i64 },
    AccountFrozen { account_id: u64 },
    DailyLimitExceeded { account_id: u64, current_volume: i64, limit: i64 },
    PixKeyNotFound { key: String },
    BankOffline { retry_after_seconds: u32 },
}

fn execute_transfer(tx: &Transaction) -> Result<PaymentStatus, TransferError> {
    let account = load_account(tx.payer).ok_or(TransferError::AccountFrozen {
        account_id: tx.payer,
    })?;

    if account.balance_cents < tx.amount_cents {
        return Err(TransferError::InsufficientFunds {
            available_cents: account.balance_cents,
            requested_cents: tx.amount_cents,
        });
    }
    // ...
    Ok(PaymentStatus::Authorized {
        auth_code: generate_auth_code(),
        timestamp: Utc::now(),
    })
}
```

Diferente de exceções que podem ser esquecidas, `Result<_, TransferError>` obriga o chamador a lidar com o erro ou propagá-lo com `?`.

**Pattern matching em pipelines ETL.** Ao ingerir arquivos de diferentes bancos, o enum guia o parser:

```rust
enum BankFormat {
    CNAB240(String),  // Linha completa do arquivo CNAB
    ISO20022(XmlNode),
    CSV { headers: Vec<String>, row: Vec<String> },
}

fn parse_to_transaction(format: BankFormat) -> Result<Transaction, ParseError> {
    match format {
        BankFormat::CNAB240(line) => parse_cnab240(&line),
        BankFormat::ISO20022(node) => parse_iso20022(&node),
        BankFormat::CSV { headers, row } => parse_csv_row(&headers, &row),
    }
}
```

### Exercício

Crie um enum `SettlementResult` com variantes:
- `Completed { batch_id: String, settled_at: DateTime<Utc> }`
- `Partial { success_count: usize, fail_count: usize, failed_ids: Vec<String> }`
- `Delayed { reason: String, estimated_completion: DateTime<Utc> }`

Implemente `fn generate_report(result: &SettlementResult) -> String` que usa `match` para produzir um relatório textual diferente para cada variante. Escreva um teste que garanta que todas as variantes são cobertas (adicione uma variante extra e observe o erro de compilação).

### Próximo
[03 — Error Handling para Fintechs](./03-error-handling.md)
