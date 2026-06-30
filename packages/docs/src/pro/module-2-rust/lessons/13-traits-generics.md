# Aula 13: Traits e Generics

**Duração:** 55 minutos
**Objetivo:** Definir comportamentos compartilhados e código genérico.

---

## 📋 Objetivos

1. Definir e implementar traits
2. Usar generics com trait bounds
3. Entender dispatch estático vs dinâmico

---

## 1. Definindo Traits

```rust
trait Pagavel {
    fn valor(&self) -> f64;
    fn descricao(&self) -> String;

    fn formatar(&self) -> String {
        format!("{}: R$ {:.2}", self.descricao(), self.valor())
    }
}

struct Transferencia {
    valor: f64,
    destino: String,
}

impl Pagavel for Transferencia {
    fn valor(&self) -> f64 { self.valor }
    fn descricao(&self) -> String {
        format!("Transferência para {}", self.destino)
    }
}

struct Tarifa {
    valor: f64,
    descricao: String,
}

impl Pagavel for Tarifa {
    fn valor(&self) -> f64 { self.valor }
    fn descricao(&self) -> String { self.descricao.clone() }
}
```

---

## 2. Generics com Trait Bounds

```rust
fn total_geral<T: Pagavel>(itens: &[T]) -> f64 {
    itens.iter().map(|i| i.valor()).sum()
}

fn imprimir_pagavel<T: Pagavel>(item: &T) {
    println!("{}", item.formatar());
}

fn main() {
    let transacoes = vec![
        Transferencia { valor: 100.0, destino: "Bob".into() },
        Tarifa { valor: 5.0, descricao: "IOF".into() },
    ];

    println!("Total: R$ {:.2}", total_geral(&transacoes));
}
```

---

## 3. Trait Objects (Dispatch Dinâmico)

```rust
fn processar_pagamentos(pagamentos: &[`Box<dyn `Pagavel>]) {
    for p in pagamentos {
        println!("{}", p.formatar());
    }
}

// use quando precisa de coleções heterogêneas
```

---

## 4. Exercício: Payment Processor

```rust
trait ProcessadorPagamento {
    fn processar(&self, valor: f64) -> Result<String, String>;
    fn nome(&self) -> &str;
}

struct PIX;
impl ProcessadorPagamento for PIX {
    fn processar(&self, valor: f64) -> Result<String, String> {
        Ok(format!("PIX de R$ {:.2} enviado", valor))
    }
    fn nome(&self) -> &str { "PIX" }
}

struct TED;
impl ProcessadorPagamento for TED {
    fn processar(&self, valor: f64) -> Result<String, String> {
        if valor > 5000.0 {
            return Err("TED acima do limite".into());
        }
        Ok(format!("TED de R$ {:.2} agendado", valor))
    }
    fn nome(&self) -> &str { "TED" }
}
```

---

**Próxima aula:** [Structs e Closures](./14-structs-closures.md)
