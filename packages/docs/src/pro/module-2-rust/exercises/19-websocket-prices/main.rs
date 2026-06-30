use futures_util::{SinkExt, StreamExt};
use serde::Serialize;
use std::sync::Arc;
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::broadcast;
use tokio_tungstenite::accept_async;

#[derive(Debug, Clone, Serialize)]
struct PriceUpdate {
    symbol: String,
    price: f64,
    timestamp: u64,
}

async fn handle_connection(
    stream: TcpStream,
    mut rx: broadcast::Receiver<String>,
) {
    let ws_stream = accept_async(stream).await.expect("Failed websocket handshake");
    let (mut write, mut read) = ws_stream.split();

    let forward = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            if write.send(tungstenite::Message::Text(msg.into())).await.is_err() {
                break;
            }
        }
    });

    let _ = read.next().await;
    forward.abort();
}

#[tokio::main]
async fn main() {
    let (tx, _) = broadcast::channel::<String>(16);
    let tx = Arc::new(tx);

    // Simulate price feed
    let tx_clone = tx.clone();
    tokio::spawn(async move {
        let symbols = vec!["AAPL", "GOOGL", "MSFT", "TSLA"];
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(2));
        let mut tick: u64 = 0;

        loop {
            interval.tick().await;
            let symbol = symbols[tick as usize % symbols.len()];
            let price = 100.0 + (tick as f64 * 0.5);

            let update = PriceUpdate {
                symbol: symbol.to_string(),
                price,
                timestamp: tick,
            };

            if let Ok(json) = serde_json::to_string(&update) {
                let _ = tx_clone.send(json);
            }
            tick += 1;
        }
    });

    let listener = TcpListener::bind("0.0.0.0:9001").await.unwrap();
    println!("WebSocket price server running on ws://localhost:9001");

    loop {
        let (stream, _) = listener.accept().await.unwrap();
        let rx = tx.subscribe();
        tokio::spawn(handle_connection(stream, rx));
    }
}
