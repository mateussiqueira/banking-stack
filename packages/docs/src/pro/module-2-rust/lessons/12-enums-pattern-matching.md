# Aula 12: Enums, Pattern Matching e Error Handling

**Duração:** 50 minutos
**Objetivo:** Modelar domínios com enums e tratar erros sem exceptions.

---

## 📋 Objetivos

1. Definir enums com dados
2. Usar match para pattern matching
3. Tratar erros com `Result<T, E>`
4. Usar `Option<T>` para valores ausentes

---

## 1. Enums com Dados

```rust
enum StatusTransacao {
    Aceita { id: String },
    Rejeitada { motivo: String },
    Liquidada { timestamp: u64 },
}

fn processar(status: StatusTransacao) {
    match status {
        StatusTransacao::Aceita { id } => println!("Aceita: {}", id),
        StatusTransacao::Rejeitada { motivo } => println!("Rejeitada: {}", motivo),
        StatusTransacao::Liquidada { ts } => println!("Liquidada em {}", ts),
    }
}
```

---

## 2. `Result<T, E>`

```rust
#[derive(Debug)]
enum ErroTransferencia {
    SaldoInsuficiente { saldo: f64, valor: f64 },
    ContaNaoEncontrada(String),
    ValorInvalido(f64),
}

fn transferir(saldo: f64, valor: f64) -> Result<f64, ErroTransferencia> {
    if valor <= 0.0 {
        return Err(ErroTransferencia::ValorInvalido(valor));
    }
    if saldo < valor {
        return Err(ErroTransferencia::SaldoInsuficiente { saldo, valor });
    }
    Ok(saldo - valor)
}

fn main() {
    match transferir(1000.0, 500.0) {
        Ok(novo_saldo) => println!("Novo saldo: R$ {:.2}", novo_saldo),
        Err(e) => println!("Erro: {:?}", e),
    }
}
```

---

## 3. `Option<T>`

```rust
fn buscar_conta(id: &str) -> Option<String> {
    if id == "123" {
        Some("Conta Alice".to_string())
    } else {
        None
    }
}

fn main() {
    let conta = buscar_conta("123");

    // if let
    if let Some(nome) = conta {
        println!("Encontrada: {}", nome);
    }

    // unwrap_or
    let nome = buscar_conta("999").unwrap_or("Desconhecida".into());
    println!("Nome: {}", nome);
}
```

---

## 4. O operador ?

```rust
fn dividir(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        return Err("Divisão por zero".into());
    }
    Ok(a / b)
}

fn calcular_media(total: f64, count: f64) -> Result<f64, String> {
    let media = dividir(total, count)?; // propagar erro
    Ok(media)
}
```

---

**Próxima aula:** [Traits e Generics](./13-traits-generics.md)
