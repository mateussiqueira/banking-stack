# Módulo 2 — Rust para Fintechs
## Aula 19: WebSockets em Rust para Cotações em Tempo Real

**Duração:** 50 min
**Nível:** Avançado

### Objetivos
- Entender o protocolo WebSocket e seu uso em sistemas financeiros
- Implementar um servidor WebSocket com tokio-tungstenite para streaming de dados
- Utilizar broadcast channels do Tokio para distribuir atualizações para múltiplos clientes
- Construir um feed de preços em tempo real para trading de ativos

### Teoria

Em mercados financeiros, dados de preços e ordens precisam ser entregues em tempo real a milhares de clientes. WebSockets oferecem uma conexão persistente e bidirecional, eliminando a latência de novas conexões HTTP a cada atualização.

**O protocolo WebSocket.** Inicia como uma requisição HTTP Upgrade, depois muda para um protocolo full-duplex sobre TCP. Para serviços financeiros, a baixa latência e overhead mínimo são críticos — cada milissegundo conta em trading.

**Servidor básico com tokio-tungstenite.** O crate `tokio-tungstenite` integra WebSockets com o runtime Tokio:

```rust
use tokio::net::TcpListener;
use tokio_tungstenite::accept_async;
use futures_util::{StreamExt, SinkExt};

async fn run_websocket_server() -> Result<(), Box<dyn std::error::Error>> {
    let listener = TcpListener::bind("0.0.0.0:9001").await?;
    println!("Servidor WebSocket rodando em ws://0.0.0.0:9001");

    while let Ok((stream, _)) = listener.accept().await {
        tokio::spawn(async move {
            let ws_stream = accept_async(stream).await.expect("Falha ao aceitar WebSocket");
            let (mut write, mut read) = ws_stream.split();

            while let Some(Ok(msg)) = read.next().await {
                if msg.is_text() || msg.is_binary() {
                    // Ecoa mensagem para teste
                    write.send(msg).await.expect("Falha ao enviar");
                }
            }
        });
    }
    Ok(())
}
```

Cada conexão WebSocket é tratada em uma task Tokio separada, permitindo milhares de conexões concorrentes.

**Distribuição com broadcast channels.** Para enviar o mesmo preço a todos os clientes conectados, use `tokio::sync::broadcast`:

```rust
use tokio::sync::broadcast;

#[derive(Clone, Debug, serde::Serialize)]
struct PriceUpdate {
    symbol: String,
    price: f64,
    timestamp: u64,
}

async fn price_feed_broadcaster(
    mut rx: broadcast::Receiver<PriceUpdate>,
    mut write: futures_util::stream::SplitSink<WebSocketStream, Message>,
) {
    while let Ok(update) = rx.recv().await {
        let json = serde_json::to_string(&update).unwrap();
        if let Err(e) = write.send(Message::Text(json.into())).await {
            println!("Erro ao enviar para cliente: {}", e);
            break;
        }
    }
}
```

O `broadcast::Sender` pode ser clonado e compartilhado entre tasks. Quando um preço é publicado, todas as assinaturas recebem a atualização.

**Servidor de feed de preços completo.** Integração com um provedor de dados externo (simulado) e distribuição:

```rust
use tokio::sync::broadcast;
use std::time::{SystemTime, UNIX_EPOCH};

async fn mock_price_provider(mut tx: broadcast::Sender<PriceUpdate>) {
    let mut interval = tokio::time::interval(tokio::time::Duration::from_millis(100));
    let symbols = vec!["PETR4", "VALE3", "ITUB4", "BBDC4"];

    loop {
        interval.tick().await;
        let symbol = symbols[rand::random::<usize>() % symbols.len()].to_string();
        let price = 20.0 + rand::random::<f64>() * 10.0;
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64;

        let update = PriceUpdate { symbol, price, timestamp };
        let _ = tx.send(update); // Ignora erro se não houver assinantes
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let (tx, _) = broadcast::channel::<PriceUpdate>(100);

    // Inicia provedor de preços
    let tx_clone = tx.clone();
    tokio::spawn(async move {
        mock_price_provider(tx_clone).await;
    });

    let listener = TcpListener::bind("0.0.0.0:9001").await?;

    while let Ok((stream, _)) = listener.accept().await {
        let rx = tx.subscribe();
        tokio::spawn(async move {
            let ws_stream = accept_async(stream).await.expect("WebSocket");
            let (write, _) = ws_stream.split();
            price_feed_broadcaster(rx, write).await;
        });
    }
    Ok(())
}
```

**Tratamento de erros e reconexão.** Clientes podem desconectar. O broadcast channel descarta mensagens se o buffer estiver cheio — use `Reserve` para controle fino:

```rust
use tokio::sync::broadcast::error::RecvError;

async fn robust_price_client(mut rx: broadcast::Receiver<PriceUpdate>) {
    loop {
        match rx.recv().await {
            Ok(update) => {
                // Processa atualização
                println!("{}: ${:.2}", update.symbol, update.price);
            }
            Err(RecvError::Lagged(n)) => {
                println!("Cliente perdeu {} mensagens, reconectando...", n);
                // Lógica de reconexão ou solicitar snapshot
            }
            Err(RecvError::Closed) => break,
        }
    }
}
```

O erro `Lagged` indica que o cliente não estava pronto e o buffer encheu — em sistemas financeiros, isso pode significar perda de dados críticos, então monitore de perto.

### Exercício

Construa um servidor WebSocket de feed de preços que:
1. Simule um provedor de dados gerando preços aleatórios para 5 pares de moedas (USD/BRL, EUR/BRL, etc.) a cada 50ms
2. Permita que clientes se inscrevam em símbolos específicos via mensagem JSON `{"subscribe": ["USD/BRL", "EUR/BRL"]}`
3. Utilize broadcast channels para distribuir atualizações apenas para clientes interessados
4. Implemente heartbeat a cada 30 segundos para detectar conexões mortas
5. Escreva um teste que conecte 3 clientes, verifique que recebem atualizações, e simule desconexão de um cliente

### Próximo
[20 — FFI e Integração com Bibliotecas C](./20-ffi-integration.md)