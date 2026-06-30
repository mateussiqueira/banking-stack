# Aula 17: HTTP com Axum

**Duração:** 50 minutos
**Objetivo:** Criar APIs REST de alta performance em Rust.

---

## 📋 Objetivos

1. Configurar Axum
2. Criar rotas e handlers
3. Serializar JSON com serde
4. Adicionar middleware

---

## 1. Setup Axum

```rust
use axum::{routing::{get, post}, Json, Router, extract::State};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Clone, Serialize, Deserialize)]
struct Transacao {
    id: String,
    valor: f64,
    status: String,
}

type AppState = Arc<RwLock<Vec<Transacao>>>;

async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "status": "healthy" }))
}

async fn listar_transacoes(
    State(state): State<AppState>,
) -> Json<Vec<Transacao>> {
    let txs = state.read().await;
    Json(txs.clone())
}

#[tokio::main]
async fn main() {
    let state: AppState = Arc::new(RwLock::new(Vec::new()));

    let app = Router::new()
        .route("/health", get(health))
        .route("/transacoes", get(listar_transacoes))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000")
        .await.unwrap();

    println!("Servidor rodando em :3000");
    axum::serve(listener, app).await.unwrap();
}
```

---

## 2. Criando Transações

```rust
#[derive(Deserialize)]
struct NovaTransacao {
    valor: f64,
}

async fn criar_transacao(
    State(state): State<AppState>,
    Json(input): Json<NovaTransacao>,
) -> Json<Transacao> {
    let tx = Transacao {
        id: uuid::Uuid::new_v4().to_string(),
        valor: input.valor,
        status: "ACEITA".into(),
    };

    let mut txs = state.write().await;
    txs.push(tx.clone());

    Json(tx)
}
```

---

## 3. Exercício: SPI API

```rust
use axum::{routing::{get, post}, Json, Router, extract::Path};

async fn processar_spi(
    Json(payload): Json<serde_json::Value>,
) -> Json<serde_json::Value> {
    let valor = payload["amount"].as_f64().unwrap_or(0.0);
    Json(serde_json::json!({
        "status": "ACCEPTED",
        "amount": valor
    }))
}

async fn buscar_transacao(
    Path(id): Path<String>,
) -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "id": id,
        "status": "SETTLED"
    }))
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/spi/process", post(processar_spi))
        .route("/spi/transactions/{id}", get(buscar_transacao));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

---

**Próxima aula:** [Zero-Copy com Serde](./18-zero-copy-serde.md)
