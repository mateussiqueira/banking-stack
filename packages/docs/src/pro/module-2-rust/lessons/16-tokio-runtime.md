# Aula 16: Tokio Runtime

**Duração:** 55 minutos
**Objetivo:** Dominar o runtime Tokio para sistemas assíncronos de alta performance.

---

## 📋 Objetivos

1. Configurar Tokio
2. Usar spawn, select!, channels
3. Implementar timeouts

---

## 1. Setup Tokio

```rust
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    // Runtime configurado automaticamente
    println!("Tokio rodando!");
}
```

---

## 2. Channels

```rust
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    let (tx, mut rx) = mpsc::channel(32);

    // Producer
    tokio::spawn(async move {
        for i in 0..10 {
            tx.send(format!("msg-{}", i)).await.unwrap();
            sleep(Duration::from_millis(50)).await;
        }
    });

    // Consumer
    while let Some(msg) = rx.recv().await {
        println!("Recebido: {}", msg);
    }
}
```

---

## 3. Select!

```rust
use tokio::time::{sleep, timeout, Duration};
use tokio::select;

async fn buscar_api() -> String {
    sleep(Duration::from_secs(2)).await;
    "Resposta da API".into()
}

async fn buscar_cache() -> String {
    sleep(Duration::from_millis(100)).await;
    "Dados do cache".into()
}

#[tokio::main]
async fn main() {
    select! {
        resultado = buscar_api() => println!("API: {}", resultado),
        resultado = buscar_cache() => println!("Cache: {}", resultado),
    }
}
```

---

## 4. Timeouts

```rust
async fn operacao_lenta() -> String {
    sleep(Duration::from_secs(10)).await;
    "Pronto".into()
}

#[tokio::main]
async fn main() {
    match timeout(Duration::from_secs(3), operacao_lenta()).await {
        Ok(resultado) => println!("{}", resultado),
        Err(_) => println!("Timeout!"),
    }
}
```

---

## 5. Exercício: Concurrent Processor

```rust
use tokio::sync::mpsc;
use tokio::time::{sleep, Duration};

struct Transacao {
    id: String,
    valor: f64,
}

async fn processar_transacao(tx: Transacao) -> Result<String, String> {
    sleep(Duration::from_millis(100)).await;
    if tx.valor < 0.0 {
        return Err("Valor inválido".into());
    }
    Ok(format!("{} processada", tx.id))
}

#[tokio::main]
async fn main() {
    let (tx, mut rx) = mpsc::channel(100);

    // Spawn workers
    for i in 0..5 {
        let mut rx = rx.clone();
        tokio::spawn(async move {
            while let Some(tx) = rx.recv().await {
                let resultado = processar_transacao(tx).await;
                println!("Worker {}: {:?}", i, resultado);
            }
        });
    }

    // Enviar transações
    for i in 0..20 {
        tx.send(Transacao {
            id: format!("TX-{}", i),
            valor: 100.0 + i as f64,
        }).await.unwrap();
    }

    sleep(Duration::from_secs(2)).await;
}
```

---

**Próxima aula:** [HTTP com Axum](./17-axum-http.md)
