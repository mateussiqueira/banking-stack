# Módulo 2 — Rust para Fintechs
## Aula 09: Testes Unitários, de Integração e Property-Based para Invariantes Financeiros

**Duração:** 45 min
**Nível:** Intermediário/Avançado

### Objetivos
- Escrever testes unitários para funções de cálculo financeiro e validação de transações
- Estruturar testes de integração com banco de dados real usando test fixtures
- Aplicar property-based testing com proptest para invariantes financeiros
- Modelar testes de concorrência para operações atômicas no ledger

### Teoria

Em sistemas financeiros, testes não são opcionais — são a única prova de que R$ 1,50 não desaparecerá entre o débito e o crédito. Rust permite que testes vivam no mesmo arquivo que o código, incentivando teste-first.

**Testes unitários inline.** Em Rust, testes vivem em módulos `#[cfg(test)]` no mesmo arquivo:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn debit_sufficient_balance_succeeds() {
        let mut account = Account::new(1, "Maria Silva", 100_00); // R$ 100,00
        let result = account.debit(30_00);  // R$ 30,00
        assert!(result.is_ok());
        assert_eq!(account.balance_cents, 70_00);
    }

    #[test]
    fn debit_insufficient_balance_fails() {
        let mut account = Account::new(1, "João Souza", 10_00);
        let result = account.debit(50_00);
        assert!(result.is_err());
        // Saldo não pode ser alterado em caso de erro
        assert_eq!(account.balance_cents, 10_00);
    }

    #[test]
    #[should_panic(expected = "Conta congelada")]
    fn debit_frozen_account_panics() {
        let mut account = Account::new(1, "Conta Congelada", 100_00);
        account.freeze();
        account.debit(10_00).unwrap();
    }

    #[test]
    fn installment_calculation_distributes_correctly() {
        let installments = calculate_installment(100_00, 3);
        assert_eq!(installments, vec![33_34, 33_33, 33_33]);
        assert_eq!(installments.iter().sum::<i64>(), 100_00);
    }
}
```

Note o uso de centavos (`100_00` = R$ 100,00). Nunca use floats em testes financeiros — `0.1 + 0.2 != 0.3` em IEEE 754.

**Testes de integração com banco real.** Testes que acessam PostgreSQL devem ser isolados e idempotentes:

```rust
#[cfg(test)]
mod integration {
    use sqlx::PgPool;

    async fn setup_test_db() -> PgPool {
        let database_url = std::env::var("TEST_DATABASE_URL")
            .expect("TEST_DATABASE_URL não definida");
        let pool = PgPoolOptions::new()
            .max_connections(5)
            .connect(&database_url)
            .await
            .expect("Falha ao conectar ao banco de teste");

        sqlx::migrate!("./migrations")
            .run(&pool)
            .await
            .expect("Falha ao rodar migrations");

        pool
    }

    #[tokio::test]
    async fn transfer_is_atomic() {
        let pool = setup_test_db().await;
        let mut tx = pool.begin().await.unwrap();

        // Cria duas contas de teste
        let alice = create_test_account(&mut tx, "Alice", 100_000).await;
        let bob = create_test_account(&mut tx, "Bob", 50_000).await;

        execute_transfer(&mut tx, alice, bob, 30_000, Uuid::new_v4(), Uuid::new_v4())
            .await
            .expect("Transferencia deve ser atomica");

        let alice_balance = get_balance(&mut tx, alice).await;
        let bob_balance = get_balance(&mut tx, bob).await;

        assert_eq!(alice_balance, 70_000, "Alice deve ter R$ 700,00");
        assert_eq!(bob_balance, 80_000, "Bob deve ter R$ 800,00");

        // Rollback para não poluir o banco
        tx.rollback().await.unwrap();
    }

    // Helpers
    async fn create_test_account(
        tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
        name: &str,
        balance: i64,
    ) -> i64 {
        sqlx::query!(
            "INSERT INTO accounts (owner_name, balance_cents) VALUES ($1, $2) RETURNING id",
            name,
            balance
        )
        .fetch_one(&mut **tx)
        .await
        .unwrap()
        .id
    }
}
```

Use `ROLLBACK` em vez de `COMMIT` no fim dos testes — o banco de teste nunca acumula sujeira.

**Property-based testing com proptest.** Invariantes financeiros devem valer para quaisquer entradas válidas. Em vez de testar 3 casos de parcelamento, prove que para todo `total >= 1` e todo `n >= 1`, a soma das parcelas é igual ao total:

```rust
#[cfg(test)]
mod proptest_tests {
    use proptest::prelude::*;

    proptest! {
        #[test]
        fn installment_sum_equals_total(
            total in 1i64..1_000_000_00i64,    // R$ 0,01 a R$ 10.000.000,00
            installments in 1u8..48u8,          // 1 a 48 parcelas
        ) {
            let values = calculate_installment(total, installments);
            let sum: i64 = values.iter().sum();
            prop_assert_eq!(sum, total, "Soma das parcelas deve igualar o total");
        }

        #[test]
        fn installment_max_diff_is_one_cent(
            total in 1i64..100_000_00i64,
            installments in 2u8..24u8,
        ) {
            let values = calculate_installment(total, installments);
            let min = values.iter().min().unwrap();
            let max = values.iter().max().unwrap();
            prop_assert!(max - min <= 1, "Diferença entre parcelas deve ser no máximo 1 centavo, min={min} max={max}");
        }

        #[test]
        fn credit_debit_roundtrip_preserves_balance(
            initial in 0i64..1_000_000_00i64,
            amount in 1i64..100_000_00i64,
        ) {
            let mut account = Account::new(1, "Test", initial + amount);
            let _ = account.debit(amount);
            // Assume-se que debit e credit não são exatamente inversos —
            // mas o saldo após debit + credit deve ser igual ao inicial
            let _ = account.credit(amount);
            prop_assert_eq!(account.balance_cents, initial + amount);
        }
    }
}
```

O proptest gera centenas de combinações aleatórias de `total` e `installments`, incluindo casos extremos (total = 1, parcelas = 48; total grande, parcelas = 2). Se 1 caso em 1000 falhar, ele reduz (shrinks) ao menor contra-exemplo e reporta.

**Testes de concorrência.** Operações concorrentes no ledger precisam de testes com loom ou simulação:

```rust
#[tokio::test]
async fn concurrent_debits_never_overdraw() {
    const INITIAL: i64 = 100_00;  // R$ 100,00
    const THREADS: usize = 10;
    const DEBIT_PER_THREAD: i64 = 15_00;  // Cada thread tenta debitar R$ 15

    let account = Arc::new(Mutex::new(Account::new(1, "Test", INITIAL)));

    let handles: Vec<_> = (0..THREADS)
        .map(|_| {
            let account = account.clone();
            tokio::spawn(async move {
                let mut acc = account.lock().await;
                acc.debit(DEBIT_PER_THREAD)
            })
        })
        .collect();

    let mut success = 0;
    for handle in handles {
        match handle.await.unwrap() {
            Ok(()) => success += 1,
            Err(_) => {} // Saldo insuficiente, esperado
        }
    }

    let final_balance = account.lock().await.balance_cents;
    assert_eq!(final_balance, INITIAL - (success * DEBIT_PER_THREAD));
    assert!(final_balance >= 0, "Saldo nunca pode ficar negativo: {final_balance}");
}
```

O invariante crítico: `balance >= 0` sempre. Se o sistema não tiver mecanismo de exclusão mútua adequado, duas threads podem ler saldo 100 simultaneamente, debitar 15 cada, e ficar com 70 (em vez de 85).

### Exercício

Escreva property-based tests para:
1. Uma função `apply_fee(amount, percentage_bps)` — para qualquer amount positivo e percentage entre 0 e 10000 bps, o resultado nunca deve ser maior que `amount * 2`
2. Um `ReconciliationEngine` que reconcilia dois `Vec<Transaction>` — a diferença entre os totais deve ser igual à soma dos totais das transações não reconciliadas

Implemente um teste de concorrência que dispara 50 depósitos e 50 saques simultâneos sobre a mesma conta com Mutex e verifica invariantes.

### Próximo
[10 — Produção: Build, Docker, Observability e Benchmarking](./10-production.md)
