# Módulo 2 — Rust para Fintechs
## Aula 03: Error Handling com Result, Option, thiserror e anyhow

**Duração:** 45 min
**Nível:** Intermediário/Avançado

### Objetivos
- Diferenciar erros irrecuperáveis (panic) de erros recuperáveis (Result) no contexto bancário
- Construir hierarquias de erro tipadas com thiserror para APIs de processamento de pagamento
- Usar anyhow para scripts e ferramentas internas de conciliação
- Propagação de contexto com `.context()` e `.with_context()`

### Teoria

Em sistemas financeiros, a diferença entre um panic e um Result tipado é a diferença entre derrubar o motor de liquidação de um banco e retornar uma mensagem de "saldo insuficiente" com todos os campos relevantes. Rust força essa distinção no sistema de tipos.

**Panic = bug do programador.** Use `panic!` apenas para invariantes quebrados, estado que "nunca deveria acontecer":

```rust
fn calculate_installment(total_cents: i64, installments: u8) -> Vec<i64> {
    assert!(installments > 0, "Número de parcelas deve ser positivo");
    assert!(total_cents > 0, "Valor total deve ser positivo");

    let base = total_cents / installments as i64;
    let remainder = total_cents % installments as i64;

    (0..installments)
        .map(|i| if i < remainder as u8 { base + 1 } else { base })
        .collect()
}
```

Os `assert!` acima são barreiras de sanidade — se um chamador passar `installments = 0`, o sistema prefere parar do que gerar divisão por zero.

**Result e Option para fluxos de negócio.** Diferencie ausência de dados transitórios (Option) de falhas operacionais (Result):

```rust
fn find_account(accounts: &HashMap<u64, Account>, id: u64) -> Option<&Account> {
    accounts.get(&id)
}

fn transfer(
    accounts: &mut HashMap<u64, Account>,
    from: u64,
    to: u64,
    amount: i64,
) -> Result<Settlement, TransferError> {
    let payer = accounts.get_mut(&from).ok_or(TransferError::AccountNotFound(from))?;
    payer.debit(amount)?;

    let payee = accounts.get_mut(&to).ok_or(TransferError::AccountNotFound(to))?;
    payee.credit(amount)?;

    Ok(Settlement { from, to, amount })
}
```

**thiserror — hierarquias de erro tipadas para APIs.** Em bibliotecas de domínio, `thiserror` evita boilerplate de `Display` e `Error`:

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum PaymentError {
    #[error("Conta {0} não encontrada")]
    AccountNotFound(u64),

    #[error("Saldo insuficiente: disponível {available_cents}, solicitado {requested_cents}")]
    InsufficientFunds {
        available_cents: i64,
        requested_cents: i64,
    },

    #[error("Limite diário excedido para conta {account_id}: {current_volume}/{limit}")]
    DailyLimitExceeded {
        account_id: u64,
        current_volume: i64,
        limit: i64,
    },

    #[error("Falha na comunicação com o SPI: {0}")]
    SpiCommunicationError(String),

    #[error(transparent)]
    DatabaseError(#[from] sqlx::Error),

    #[error("Erro interno inesperado: {0}")]
    Internal(String),
}
```

O `#[from]` permite usar `?` automaticamente — um `sqlx::Error` é convertido em `PaymentError::DatabaseError` sem código adicional. O `#[error("...")]` gera mensagens para logs e respostas de API.

**anyhow — para scripts e CLIs internas.** Em ferramentas de conciliação, ETL e scripts operacionais, `anyhow` reduz fricção:

```rust
use anyhow::{Context, Result, anyhow};

fn reconcile_file(path: &str) -> Result<ReconciliationReport> {
    let raw = std::fs::read_to_string(path)
        .with_context(|| format!("Falha ao ler arquivo de conciliação: {path}"))?;

    let entries: Vec<CnabEntry> = serde_json::from_str(&raw)
        .context("Arquivo não está no formato esperado (JSON CNAB)")?;

    if entries.is_empty() {
        anyhow::bail!("Arquivo de conciliação vazio — possível corrupção");
    }

    let total: i64 = entries.iter().map(|e| e.amount_cents).sum();
    Ok(ReconciliationReport { entries: entries.len(), total })
}
```

O `.context()` enriquece erros intermediários com informação de onde e por que falharam. O `bail!` é um early return ergonômico.

**Estratégia para API pública.** Bibliotecas expostas devem usar `thiserror`; scripts internos, `anyhow`. A camada HTTP converte `PaymentError` em status codes apropriados:

```rust
impl From<PaymentError> for (StatusCode, String) {
    fn from(err: PaymentError) -> Self {
        match &err {
            PaymentError::AccountNotFound(_) => (StatusCode::NOT_FOUND, err.to_string()),
            PaymentError::InsufficientFunds { .. } => (StatusCode::UNPROCESSABLE_ENTITY, err.to_string()),
            PaymentError::DailyLimitExceeded { .. } => (StatusCode::TOO_MANY_REQUESTS, err.to_string()),
            PaymentError::SpiCommunicationError(_) => (StatusCode::BAD_GATEWAY, "SPI indisponível".into()),
            PaymentError::DatabaseError(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Erro interno".into()),
            PaymentError::Internal(_) => (StatusCode::INTERNAL_SERVER_ERROR, err.to_string()),
        }
    }
}
```

Separe erros "esperados" (saldo insuficiente, conta não encontrada) de "inesperados" (banco offline, panic). Nunca retorne stack traces para o cliente — logue internamente com `tracing::error!`.

### Exercício

Crie um módulo `reconciliation` com uma função que lê um arquivo CSV de extrato bancário, converte para `Vec<Transaction>`, e reconcilia contra um `HashMap<u64, Account>`. Use `thiserror` para definir `ReconciliationError` (variantes: arquivo não encontrado, linha inválida com número da linha, conta referenciada não existe, valores não batem). Use `anyhow` no `main()` para logar e sair com código apropriado.

### Próximo
[04 — Traits e Generics para Abstrações Financeiras](./04-traits-generics.md)
