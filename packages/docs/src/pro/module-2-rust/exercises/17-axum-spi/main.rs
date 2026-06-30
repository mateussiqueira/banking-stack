use axum::{
    extract::State,
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Transaction {
    id: u64,
    merchant: String,
    amount: f64,
    status: String,
}

#[derive(Debug, Deserialize)]
struct ProcessRequest {
    merchant: String,
    amount: f64,
}

#[derive(Debug, Serialize)]
struct ProcessResponse {
    id: u64,
    status: String,
    message: String,
}

struct AppState {
    transactions: Mutex<Vec<Transaction>>,
    next_id: Mutex<u64>,
}

async fn process_payment(
    State(state): State<Arc<AppState>>,
    Json(req): Json<ProcessRequest>,
) -> Result<Json<ProcessResponse>, (StatusCode, String)> {
    if req.amount <= 0.0 {
        return Err((StatusCode::BAD_REQUEST, "Amount must be positive".to_string()));
    }

    let id = {
        let mut next = state.next_id.lock().map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        let id = *next;
        *next += 1;
        id
    };

    let txn = Transaction {
        id,
        merchant: req.merchant.clone(),
        amount: req.amount,
        status: "completed".to_string(),
    };

    state.transactions.lock().map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?.push(txn);

    Ok(Json(ProcessResponse {
        id,
        status: "success".to_string(),
        message: format!("Payment of ${:.2} to {} processed", req.amount, req.merchant),
    }))
}

async fn get_transactions(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<Transaction>>, (StatusCode, String)> {
    let txns = state.transactions.lock().map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    Ok(Json(txns.clone()))
}

#[tokio::main]
async fn main() {
    let state = Arc::new(AppState {
        transactions: Mutex::new(Vec::new()),
        next_id: Mutex::new(1),
    });

    let app = Router::new()
        .route("/process", post(process_payment))
        .route("/transactions", get(get_transactions))
        .layer(
            tower_http::cors::CorsLayer::permissive(),
        )
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("SPI server running on http://localhost:3000");
    axum::serve(listener, app).await.unwrap();
}
