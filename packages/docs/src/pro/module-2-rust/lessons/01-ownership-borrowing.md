# Módulo 2 — Rust para Fintechs
## Aula 01: Ownership, Borrowing e Lifetimes para Integridade de Dados Financeiros

**Duração:** 45 min
**Nível:** Intermediário/Avançado

### Objetivos
- Compreender o modelo de ownership do Rust e como ele previne corrupção de dados financeiros
- Aplicar borrowing e referências para compartilhar dados de transação sem duplicação
- Usar lifetimes para garantir que referências a dados críticos nunca fiquem inválidas
- Modelar uma estrutura de conta bancária à prova de data races em compilação

### Teoria

O sistema de ownership do Rust é o fundamento que torna a linguagem ideal para sistemas financeiros. Diferente de garbage collectors (Java, Go) ou gerenciamento manual (C, C++), Rust impõe regras estritas em tempo de compilação que eliminam classes inteiras de bugs — precisamente os bugs que causariam lançamentos incorretos, duplicação de transações ou leitura de saldos inconsistentes.

**As três regras do ownership aplicadas a fintech:**

1. Cada valor em Rust tem um único dono (owner) por vez
2. Quando o dono sai de escopo, o valor é liberado automaticamente
3. Apenas referências imutáveis compartilhadas OU uma única referência mutável podem existir

Considere uma transferência bancária. Em linguagens sem borrow checker, nada impede que dois threads modifiquem simultaneamente o `balance` de uma conta, resultando no clássico problema de leitura pós-escrita. Em Rust, o compilador rejeita o código antes mesmo de rodar os testes.

```rust
#[derive(Debug)]
struct Account {
    id: u64,
    balance_cents: i64,  // Representado em centavos para evitar floats
    frozen: bool,
}

impl Account {
    fn debit(&mut self, amount_cents: i64) -> Result<(), &'static str> {
        if self.frozen {
            return Err("Conta congelada — operação bloqueada");
        }
        if self.balance_cents < amount_cents {
            return Err("Saldo insuficiente");
        }
        self.balance_cents -= amount_cents;
        Ok(())
    }

    fn credit(&mut self, amount_cents: i64) -> Result<(), &'static str> {
        if self.frozen {
            return Err("Conta congelada");
        }
        self.balance_cents += amount_cents;
        Ok(())
    }
}
```

No exemplo acima, `debit` e `credit` recebem `&mut self`, exigindo acesso exclusivo à `Account`. Se outro trecho de código possuir uma referência imutável ativa (`&self`) no mesmo momento, o compilador emitirá um erro — impedindo leituras inconsistentes durante escritas.

**Borrowing em pipelines de transações.** Ao processar lote de pagamentos, você pode emprestar referências imutáveis para múltiplos validadores sem copiar os dados:

```rust
struct Transaction {
    id: String,
    payer: u64,
    payee: u64,
    amount_cents: i64,
    currency: String,
}

fn validate_fraud(tx: &Transaction, blocklist: &HashSet<u64>) -> bool {
    !blocklist.contains(&tx.payer) && !blocklist.contains(&tx.payee)
}

fn validate_limits(tx: &Transaction, daily_volumes: &HashMap<u64, i64>) -> bool {
    let current = daily_volumes.get(&tx.payer).copied().unwrap_or(0);
    current + tx.amount_cents <= 1_000_000 // Limite diário: 10k BRL
}

fn process_batch(txs: &[Transaction], blocklist: &HashSet<u64>, volumes: &HashMap<u64, i64>) -> Vec<bool> {
    txs.iter()
       .map(|tx| validate_fraud(tx, blocklist) && validate_limits(tx, volumes))
       .collect()
}
```

Cada validador recebe `&Transaction` — referências imutáveis compartilhadas. O borrow checker garante que nenhum deles altera a transação acidentalmente.

**Lifetimes em repositórios de dados.** Quando sua camada de acesso a dados retorna referências, lifetimes documentam no tipo de dado exatamente por quanto tempo aqueles valores são válidos:

```rust
struct LedgerEntry<'a> {
    transaction_id: &'a str,  // Vive enquanto 'a
    account_id: u64,
    amount_cents: i64,
    description: &'a str,
}

impl<'a> LedgerEntry<'a> {
    fn summarize(&self) -> String {
        format!("TX {}: {} centavos", self.transaction_id, self.amount_cents)
    }
}
```

O lifetime `'a` vincula as referências `transaction_id` e `description` ao tempo de vida da string original — tipicamente um buffer ou linha de arquivo carregado em memória. Isso evita referências a dados já liberados (use-after-free), erro que em C poderia exibir números de transação incorretos na interface bancária.

### Exercício

Implemente uma `TransactionLedger` que armazena entries como `LedgerEntry<'a>` usando um `Vec`. Adicione métodos para:
1. Registrar uma entrada com validação de que o ID da transação não está vazio
2. Calcular o saldo total de uma conta específica (soma de créditos e débitos)
3. Retornar todas as entradas de uma conta com borrowing imutável

Escreva um teste que tente modificar uma `LedgerEntry` através de uma referência imutável e observe o erro de compilação.

### Próximo
[02 — Enums e Pattern Matching para Tipos Financeiros](./02-enums-pattern-matching.md)
