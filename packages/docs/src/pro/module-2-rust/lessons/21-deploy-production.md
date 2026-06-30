# Módulo 2 — Rust para Fintechs
## Aula 21: Deploy de Serviços Rust — Docker, systemd, Performance

**Duração:** 40 min
**Nível:** Avançado

### Objetivos
- Criar imagens Docker otimizadas para serviços Rust financeiros
- Configurar serviços systemd para gerenciamento de processos em produção
- Ajustar parâmetros de performance do runtime e do sistema operacional
- Otimizar binários Rust para tamanho e velocidade em ambientes de produção

### Teoria

Levar um serviço Rust a produção exige considerações além do código: como empacotar, como reiniciar automaticamente, como garantir performance sob carga.

**Docker multi-stage revisado.** Imagens mínimas reduzem superfície de ataque e tamanho do deploy:

```dockerfile
# Stage 1: Dependências para cache eficiente
FROM rust:1.85-slim-bookworm AS chef
RUN cargo install cargo-chef --locked
WORKDIR /app

# Stage 2: Preparar receita
FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

# Stage 3: Construir com cache de dependências
FROM chef AS builder
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json
COPY . .
RUN cargo build --release --bin spi-server

# Stage 4: Runtime mínimo
FROM debian:bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --system --no-create-home --shell /bin/false appuser
COPY --from=builder /app/target/release/spi-server /usr/local/bin/

USER appuser
EXPOSE 8080

ENV RUST_LOG=info
ENV SPI_ENDPOINT=https://api.banco.central.gov.br

CMD ["spi-server"]
```

O `cargo-chef` separa a instalação de dependências da compilação, aproveitando cache do Docker. A imagem final tem apenas o binário e certificados CA.

**systemd para gerenciamento de serviços.** Em servidores Linux, systemd gerencia ciclo de vida, restart automático e logs:

```ini
# /etc/systemd/system/spi-server.service
[Unit]
Description=SPI Payment Server
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=spi-service
Group=spi-service
ExecStart=/usr/local/bin/spi-server
Environment=RUST_LOG=info
Environment=DATABASE_URL=postgres://spi_user:password@localhost/spi_db
WorkingDirectory=/var/lib/spi-server

# Segurança
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/spi-server
PrivateTmp=true

# Performance
LimitNOFILE=65536
LimitNPROC=4096

# Restart
Restart=always
RestartSec=5
StartLimitIntervalSec=60
StartLimitBurst=3

# Logs
StandardOutput=journal
StandardError=journal
SyslogIdentifier=spi-server

[Install]
WantedBy=multi-user.target
```

Habilite com:
```bash
sudo systemctl daemon-reload
sudo systemctl enable spi-server
sudo systemctl start spi-server
sudo journalctl -u spi-server -f  # Logs em tempo real
```

**Tuning de performance do kernel.** Para serviços de alta performance financeira:

```bash
# /etc/sysctl.d/99-spi-performance.conf
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15
net.core.netdev_max_backlog = 65535
vm.overcommit_memory = 1
fs.file-max = 2097152
```

Aplique com `sudo sysctl --system`.

**Otimização de binário.** Para部署, use `cargo-zigbuild` para cross-compilation e binários menores:

```toml
# Cargo.toml
[profile.release]
opt-level = 3
lto = "fat"
codegen-units = 1
panic = "abort"
strip = "symbols"

# Perfis específicos
[profile.server]
inherits = "release"
opt-level = "s"  # Otimiza para tamanho
lto = "fat"
strip = true
```

Compile com `cargo build --profile server`.

**Health checks e graceful shutdown.** Implemente endpoints de health e tratamento de sinais:

```rust
use tokio::signal::unix::{signal, SignalKind};
use axum::{Router, routing::get, Json};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

static RUNNING: AtomicBool = AtomicBool::new(true);

async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": if RUNNING.load(Ordering::Relaxed) { "healthy" } else { "shutting_down" },
        "version": env!("CARGO_PKG_VERSION"),
    }))
}

async fn shutdown_signal() {
    let mut sigterm = signal(SignalKind::terminate()).expect("Falha ao registrar SIGTERM");
    let mut sigint = signal(SignalKind::interrupt()).expect("Falha ao registrar SIGINT");

    tokio::select! {
        _ = sigterm.recv() => println!("Recebido SIGTERM, iniciando shutdown..."),
        _ = sigint.recv() => println!("Recebido SIGINT, iniciando shutdown..."),
    }

    RUNNING.store(false, Ordering::Relaxed);
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/health", get(health));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();

    tokio::spawn(async move {
        axum::serve(listener, app).await.unwrap();
    });

    shutdown_signal().await;
    println!("Aguardando conexões existentes fecharem...");
    tokio::time::sleep(std::time::Duration::from_secs(5)).await;
    println!("Shutdown completo");
}
```

### Exercício

Crie um Dockerfile completo para um servidor SPI que:
1. Use multi-stage com cargo-chef para cache eficiente
2. Inclua health check endpoint respondendo `/health`
3. Configure systemd service com hardening (NoNewPrivileges, ProtectSystem, etc.)
4. Implemente graceful shutdown que responda a SIGTERM
5. Adicione script de deploy que construa a imagem, crie o serviço, e configure log rotation
6. Teste com `docker run` e verifique que o health check funciona

### Próximo
[Voltar ao índice do Módulo 2](../README.md)