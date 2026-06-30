# Módulo 2 — Rust para Fintechs
## Aula 10: Produção — Build Otimizado, Docker, Observabilidade e Benchmarking

**Duração:** 45 min
**Nível:** Intermediário/Avançado

### Objetivos
- Configurar release profile para performance e tamanho de binário otimizados
- Construir imagens Docker multi-stage mínimas para serviços financeiros em Rust
- Instrumentar com tracing e opentelemetry para observabilidade de ponta a ponta
- Escrever benchmarks com Criterion.rs para hot paths do motor de pagamentos

### Teoria

Levar um serviço Rust financeiro a produção exige mais que lógica correta — é preciso compilação otimizada, containerização enxuta, rastreamento de cada transação e métricas para provar performance sob carga real.

**Release profile otimizado.** Em `Cargo.toml`, o perfil padrão é conservador. Para sistemas financeiros onde latência importa:

```toml
[profile.release]
opt-level = 3          # Otimização máxima (padrão para release)
lto = "fat"            # Link-time optimization cross-crate
codegen-units = 1      # Unidade única de codegen — permite mais otimização
panic = "abort"        # Aborta em vez de unwind — binário menor, mais rápido
strip = "symbols"      # Remove símbolos de debug do binário

[profile.dist]
inherits = "release"
lto = "fat"
codegen-units = 1
strip = true
opt-level = "s"        # Otimiza para tamanho (bom para containers)
```

Compilar com `cargo build --profile dist` para imagens Docker de produção.

**Docker multi-stage para imagens mínimas.** Imagens Rust em produção devem ser `scratch` ou `distroless` — sem shell, sem package manager, superfície de ataque mínima:

```dockerfile
# Stage 1: Build
FROM rust:1.85-slim-bookworm AS builder

RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src
COPY migrations ./migrations

RUN cargo build --profile dist --bin payment-engine

# Stage 2: Runtime
FROM gcr.io/distroless/cc-debian12 AS runtime

COPY --from=builder /app/target/dist/payment-engine /usr/local/bin/payment-engine
COPY --from=builder /app/migrations /app/migrations

EXPOSE 3000
USER nonroot:nonroot

ENV RUST_LOG=info
ENV DATABASE_URL=postgres://localhost/payments

CMD ["/usr/local/bin/payment-engine"]
```

Multi-stage separa build (1.5 GB de toolchain Rust) de runtime (~60 MB para binário + libc). Use `.dockerignore` para excluir `/target`, `node_modules`, e documentação.

**Observabilidade com tracing.** Rastreamento distribuído é essencial para debugar transações que cruzam múltiplos serviços. O crate `tracing` com `opentelemetry` exporta spans para Jaeger ou Grafana Tempo:

```rust
use tracing::{info, error, instrument, Level, span};
use tracing_subscriber::{fmt, layer::SubscriberExt, EnvFilter};
use opentelemetry::global;
use opentelemetry_otlp::WithExportConfig;

fn init_observability() -> Result<(), `Box<dyn `std::error::Error>> {
    let otlp_exporter = opentelemetry_otlp::new_exporter()
        .tonic()
        .with_endpoint("http://jaeger:4317");

    let tracer = opentelemetry_otlp::new_pipeline()
        .tracing()
        .with_exporter(otlp_exporter)
        .install_batch(opentelemetry_sdk::runtime::Tokio)?;

    let telemetry = tracing_opentelemetry::layer().with_tracer(tracer);
    let fmt_layer = fmt::layer().with_filter(EnvFilter::from_default_env());

    tracing_subscriber::registry()
        .with(telemetry)
        .with(fmt_layer)
        .init();

    global::set_text_map_propagator(opentelemetry_sdk::propagation::TraceContextPropagator::new());
    Ok(())
}

#[instrument(skip(pool), fields(
    transaction_id = %request.id,
    amount = request.amount_cents,
    payer = request.payer_id,
))]
async fn process_payment(
    pool: &PgPool,
    request: PaymentRequest,
) -> Result<PaymentResponse, PaymentError> {
    info!("Iniciando processamento de pagamento");

    let account = fetch_account(pool, request.payer_id).await?;
    info!(balance = account.balance_cents, "Conta carregada");

    if account.frozen {
        error!("Conta congelada — pagamento bloqueado");
        return Err(PaymentError::AccountFrozen(request.payer_id));
    }

    let entry = LedgerEntry::debit(request.payer_id, request.amount_cents);
    record_entry(pool, &entry).await?;

    info!("Pagamento processado com sucesso");
    Ok(PaymentResponse::success(entry.transaction_id))
}
```

`#[instrument]` cria automaticamente um span com os campos especificados. Cada etapa (`fetch_account`, `record_entry`) fica aninhada no span pai, visível no trace. O `transaction_id` no span permite buscar todas as operações de uma transação específica no tracing backend.

**Métricas e health checks.** Exponha métricas no formato Prometheus e um endpoint de health:

```rust
use axum::{Router, routing::get, Json};
use serde::Serialize;

#[derive(Serialize)]
struct HealthStatus {
    status: &'static str,
    database: bool,
    spi_connected: bool,
    uptime_seconds: u64,
}

async fn health_check() -> Json<HealthStatus> {
    Json(HealthStatus {
        status: "healthy",
        database: check_database().await,
        spi_connected: check_spi().await,
        uptime_seconds: get_uptime(),
    })
}

async fn metrics() -> String {
    let mut output = String::new();
    output.push_str(&format!(
        "payments_processed_total {}\n",
        PAYMENTS_COUNTER.load(Ordering::Relaxed)
    ));
    output.push_str(&format!(
        "payments_failed_total {}\n",
        FAILURES_COUNTER.load(Ordering::Relaxed)
    ));
    output.push_str(&format!(
        "payment_latency_p99_seconds {:.3}\n",
        get_p99_latency()
    ));
    output
}
```

**Benchmarking com Criterion.rs.** O hot path de liquidação precisa de benchmarks para guiar otimizações e detectar regressões:

```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};

fn bench_settlement(c: &mut Criterion) {
    let rt = tokio::runtime::Runtime::new().unwrap();

    let mut group = c.benchmark_group("settlement");
    for batch_size in [1, 10, 100, 1000] {
        group.bench_with_input(
            BenchmarkId::from_parameter(batch_size),
            &batch_size,
            |b, &size| {
                b.to_async(&rt).iter(|| async {
                    let batch: Vec<Transaction> = generate_test_batch(size);
                    settle_batch(black_box(&batch)).await
                });
            },
        );
    }
    group.finish();
}

criterion_group!(benches, bench_settlement);
criterion_main!(benches);
```

Execute com `cargo bench`. O Criterion gera relatórios estatísticos com médias, desvios e detecção de regressões entre runs. Para sistemas financeiros, meça p50, p95 e p99 — médias escondem outliers.

**CI/CD essencial.** Pipeline mínimo em GitHub Actions para serviços financeiros:

```yaml
name: CI
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: clippy, rustfmt
      - run: cargo fmt --check
      - run: cargo clippy -- -D warnings
      - run: cargo test --release
      - run: cargo audit
```

`cargo audit` verifica dependências contra o RustSec Advisory Database — crítico em fintech onde vulnerabilidades em libs TLS ou criptografia podem ter consequências regulatórias.

### Exercício

Crie o Dockerfile multi-stage para o serviço de pagamentos. Adicione instrumentação com tracing em todas as funções do fluxo de transferência (`validate`, `debit`, `credit`, `commit`). Escreva um benchmark com Criterion comparando duas estratégias de locking (pessimista com `FOR UPDATE` vs otimista com version column) em cenário de alta contenção (100 transferências concorrentes na mesma conta). Configure o release profile para LTO + fat e meça a diferença no tamanho do binário e throughput.

### Próximo
[Voltar ao índice do Módulo 2](../README.md)
