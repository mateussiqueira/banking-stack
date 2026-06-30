# Aula 15: Async/Await em Rust

**Duração:** 60 minutos
**Objetivo:** Entender async Rust e por que ele é diferente de Go/goroutines.

---

## 📋 Objetivos

1. Entender Futures e executors
2. Usar async/await syntax
3. Entender Pin e por que existe
4. Comparar com goroutines

---

## 1. Async vs Goroutines

| Característica | Go (Goroutines) | Rust (async/await) |
|----------------|-----------------|-------------------|
| Criação | `go func()` | `async fn()` |
| Executor | Runtime (automático) | Tokio (explícito) |
| Memória | ~2KB por goroutine | ~bytes por future |
| Custo | Baixo | Zero-cost |

---

## 2. Futures

```rust
// Future = valor que será disponível no futuro
async fn buscar_transacao(id: &str) -> Result<String, String> {
    // Simular latência de rede
    tokio::time::sleep(std::time::Duration::from_millis(100)).await;
    Ok(format!("Transação {}", id))
}

#[tokio::main]
async fn main() {
    let tx = buscar_transacao("TX-001").await.unwrap();
    println!("{}", tx);
}
```

---

## 3. Concorrência com join!

```rust
async fn processar_paralelo() {
    let tx1 = buscar_transacao("TX-001");
    let tx2 = buscar_transacao("TX-002");
    let tx3 = buscar_transacao("TX-003");

    // Executa todas em paralelo
    let (r1, r2, r3) = tokio::join!(tx1, tx2, tx3);

    println!("{:?}", r1);
    println!("{:?}", r2);
    println!("{:?}", r3);
}
```

---

## 4. spawn para tarefas concorrentes

```rust
#[tokio::main]
async fn main() {
    let mut handles = vec![];

    for i in 0..10 {
        handles.push(tokio::spawn(async move {
            println!("Worker {} processando", i);
            tokio::time::sleep(std::time::Duration::from_millis(100)).await;
            println!("Worker {} concluído", i);
        }));
    }

    for handle in handles {
        handle.await.unwrap();
    }
}
```

---

**Próxima aula:** [Tokio Runtime](./16-tokio-runtime.md)
