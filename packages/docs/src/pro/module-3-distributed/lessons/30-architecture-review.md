# Modulo 3 — Sistemas Distribuidos para Fintechs
## Aula 30: Arquitetura Completa — Revisao dos 3 Modulos

**Duracao:** 70 min  
**Nivel:** Avancado

### Objetivos
- Revisar e integrar conceitos dos 3 modulos (Fundamentos, Avancado, Distribuido)
- Projetar uma arquitetura completa de sistema de pagamentos com Go + Rust + Kafka
- Aplicar padroes de microservicos em contexto financeiro
- Preparar para certificacao com exercicios integradores

### Teoria

#### Visao Geral dos 3 Modulos

```
┌─────────────────────────────────────────────────────────────────┐
│                    BANKING STACK PRO                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  MODULO 1: Fundamentos       MODULO 2: Avancado                   │
│  ─────────────────────       ────────────────────                 │
│  • Go basics & types         • Rust essentials                    │
│  • Concurrency patterns      • Systems programming                │
│  • HTTP servers              • FFI & safety                       │
│  • Database (PostgreSQL)     • Performance tuning                 │
│  • Testing patterns          • Unsafe code patterns               │
│                                                                  │
│  MODULO 3: Distribuido                                              │
│  ──────────────────────────                                        │
│  • CAP theorem               • Distributed transactions           │
│  • Raft consensus            • Kafka event streaming              │
│  • Circuit breakers          • Rate limiting                      │
│  • Caching strategies        • Observability (OTel)               │
│  • Sharding                  • CockroachDB                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Arquitetura de Referencia: Sistema de Pagamentos Completo

```
                           ┌──────────────────┐
                           │   API Gateway    │
                           │  (Go + Envoy)    │
                           └────────┬─────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
    ┌─────────▼─────────┐ ┌────────▼────────┐ ┌─────────▼─────────┐
    │  Account Service   │ │ Payment Service  │ │ Notification Svc  │
    │  (Go + gRPC)       │ │ (Go + Kafka)     │ │ (Go + WebSocket)  │
    └─────────┬─────────┘ └────────┬────────┘ └─────────┬─────────┘
              │                     │                     │
              │           ┌────────▼────────┐            │
              │           │  Fraud Engine    │            │
              │           │  (Rust + FFI)    │            │
              │           └────────┬────────┘            │
              │                     │                     │
    ┌─────────▼─────────┐ ┌────────▼────────┐ ┌─────────▼─────────┐
    │   PostgreSQL       │ │    Kafka         │ │   Redis Cache     │
    │   (CockroachDB)    │ │  (Event Store)   │ │  (Session + Rate) │
    └───────────────────┘ └──────────────────┘ └───────────────────┘
```

#### Componente 1: API Gateway em Go

```go
// api-gateway/main.go
package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"

    "github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors"
    "go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
)

func main() {
    // Inicializar tracer
    tp, err := initTracer()
    if err != nil {
        log.Fatal(err)
    }
    defer tp.Shutdown(context.Background())

    // Configurar rate limiter
    limiter := NewRateLimiter(RateConfig{
        RequestsPerSecond: 100,
        BurstSize:         200,
    })

    // Configurar circuit breaker
    cb := NewCircuitBreaker(CircuitBreakerConfig{
        FailureThreshold: 5,
        RecoveryTimeout:  30 * time.Second,
    })

    // Middleware chain
    mux := http.NewServeMux()

    // Account endpoints
    mux.HandleFunc("/api/v1/accounts/", otelhttp.NewHandler(
        withAuth(
            withRateLimit(limiter,
                withCircuitBreaker(cb,
                    proxyToService("account-service:8081"),
                ),
            ),
        ),
        "account-handler",
    ))

    // Payment endpoints
    mux.HandleFunc("/api/v1/payments/", otelhttp.NewHandler(
        withAuth(
            withRateLimit(limiter,
                withCircuitBreaker(cb,
                    proxyToService("payment-service:8082"),
                ),
            ),
        ),
        "payment-handler",
    ))

    server := &http.Server{
        Addr:         ":8080",
        Handler:      mux,
        ReadTimeout:  15 * time.Second,
        WriteTimeout: 15 * time.Second,
        IdleTimeout:  60 * time.Second,
    }

    // Graceful shutdown
    go func() {
        sigCh := make(chan os.Signal, 1)
        signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
        <-sigCh

        ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
        defer cancel()
        server.Shutdown(ctx)
    }()

    log.Println("API Gateway starting on :8080")
    if err := server.ListenAndServe(); err != http.ErrServerClosed {
        log.Fatal(err)
    }
}
```

#### Componente 2: Account Service em Go

```go
// account-service/handler.go
package main

import (
    "context"
    "database/sql"
    "fmt"

    "github.com/jackc/pgx/v5/pgxpool"
    "google.golang.org/grpc"
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/status"
)

type AccountServer struct {
    pb.UnimplementedAccountServiceServer
    db      *pgxpool.Pool
    cache   *RedisCache
    kafka   *KafkaProducer
}

func (s *AccountServer) GetBalance(ctx context.Context, req *pb.GetBalanceRequest) (*pb.BalanceResponse, error) {
    // Cache-first strategy
    cached, err := s.cache.Get(ctx, fmt.Sprintf("balance:%s", req.AccountId))
    if err == nil && cached != nil {
        return &pb.BalanceResponse{
            AccountId: req.AccountId,
            Balance:   cached.Balance,
            Version:   cached.Version,
            Cached:    true,
        }, nil
    }

    // Cache miss — query database
    var balance int64
    var version int64
    err = s.db.QueryRow(ctx,
        "SELECT saldo, version FROM contas WHERE id = $1",
        req.AccountId,
    ).Scan(&balance, &version)
    if err != nil {
        if err == sql.ErrNoRows {
            return nil, status.Error(codes.NotFound, "account not found")
        }
        return nil, status.Error(codes.Internal, "database error")
    }

    // Populate cache
    s.cache.Set(ctx, fmt.Sprintf("balance:%s", req.AccountId), &CachedBalance{
        Balance: balance,
        Version: version,
    }, 30*time.Second)

    return &pb.BalanceResponse{
        AccountId: req.AccountId,
        Balance:   balance,
        Version:   version,
        Cached:    false,
    }, nil
}

func (s *AccountServer) Debit(ctx context.Context, req *pb.DebitRequest) (*pb.DebitResponse, error) {
    // Pessimistic locking para debitos
    tx, err := s.db.Begin(ctx)
    if err != nil {
        return nil, status.Error(codes.Internal, "failed to begin transaction")
    }
    defer tx.Rollback(ctx)

    var balance int64
    err = tx.QueryRow(ctx,
        "SELECT saldo FROM contas WHERE id = $1 FOR UPDATE",
        req.AccountId,
    ).Scan(&balance)
    if err != nil {
        return nil, status.Error(codes.Internal, "failed to read balance")
    }

    if balance < req.Amount {
        return &pb.DebitResponse{
            Success: false,
            Error:   "insufficient balance",
        }, nil
    }

    _, err = tx.Exec(ctx,
        "UPDATE contas SET saldo = saldo - $1 WHERE id = $2",
        req.Amount, req.AccountId,
    )
    if err != nil {
        return nil, status.Error(codes.Internal, "failed to debit")
    }

    if err := tx.Commit(ctx); err != nil {
        return nil, status.Error(codes.Internal, "failed to commit")
    }

    // Invalidate cache
    s.cache.Delete(ctx, fmt.Sprintf("balance:%s", req.AccountId))

    // Publish event
    s.kafka.Publish(ctx, "account.debited", &AccountEvent{
        AccountId: req.AccountId,
        Amount:    req.Amount,
        Balance:   balance - req.Amount,
    })

    return &pb.DebitResponse{
        Success:      true,
        NewBalance:   balance - req.Amount,
    }, nil
}
```

#### Componente 3: Payment Service com Kafka

```go
// payment-service/processor.go
package main

import (
    "context"
    "encoding/json"
    "time"

    "github.com/segmentio/kafka-go"
)

type PaymentProcessor struct {
    reader    *kafka.Reader
    writer    *kafka.Writer
    accountSvc AccountServiceClient
    fraudSvc   FraudServiceClient
}

func (p *PaymentProcessor) ProcessPayment(ctx context.Context, msg kafka.Message) error {
    var payment PaymentRequest
    if err := json.Unmarshal(msg.Value, &payment); err != nil {
        return fmt.Errorf("unmarshal payment: %w", err)
    }

    // Idempotency check
    if p.isProcessed(ctx, payment.ID) {
        return nil // ja processado
    }

    // Fraud check (Rust FFI)
    riskScore, err := p.fraudSvc.EvaluateRisk(ctx, &FraudRequest{
        PaymentId: payment.ID,
        Amount:    payment.Amount,
        PayerCpf:  payment.PayerCPF,
        PayeeCpf:  payment.PayeeCPF,
    })
    if err != nil {
        return fmt.Errorf("fraud check failed: %w", err)
    }

    if riskScore > 0.8 {
        return p.rejectPayment(ctx, payment, "high fraud risk")
    }

    // Debit payer
    _, err = p.accountSvc.Debit(ctx, &DebitRequest{
        AccountId: payment.PayerAccountID,
        Amount:    payment.Amount,
    })
    if err != nil {
        return fmt.Errorf("debit failed: %w", err)
    }

    // Credit payee
    _, err = p.accountSvc.Credit(ctx, &CreditRequest{
        AccountId: payment.PayeeAccountID,
        Amount:    payment.Amount,
    })
    if err != nil {
        // Compensating transaction — reverter debito
        p.accountSvc.Credit(ctx, &CreditRequest{
            AccountId: payment.PayerAccountID,
            Amount:    payment.Amount,
        })
        return fmt.Errorf("credit failed, rolled back: %w", err)
    }

    // Mark as processed (idempotency)
    p.markProcessed(ctx, payment.ID)

    // Publish success event
    p.writer.WriteMessages(ctx, kafka.Message{
        Topic: "payment.completed",
        Key:   []byte(payment.ID),
        Value: mustMarshal(&PaymentCompleted{
            PaymentId: payment.ID,
            Status:    "completed",
            Timestamp: time.Now(),
        }),
    })

    return nil
}

func (p *PaymentProcessor) Run(ctx context.Context) error {
    for {
        msg, err := p.reader.ReadMessage(ctx)
        if err != nil {
            if ctx.Err() != nil {
                return nil // shutdown
            }
            log.Printf("read error: %v", err)
            continue
        }

        if err := p.ProcessPayment(ctx, msg); err != nil {
            log.Printf("process error: %v", err)
            // Send to dead letter queue
            p.sendToDLQ(ctx, msg, err)
        }
    }
}
```

#### Componente 4: Fraud Engine em Rust

```rust
// fraud-engine/src/lib.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct FraudRequest {
    pub payment_id: String,
    pub amount: i64,
    pub payer_cpf: String,
    pub payee_cpf: String,
}

#[derive(Debug, Serialize)]
pub struct FraudResponse {
    pub risk_score: f64,
    pub flags: Vec<String>,
}

pub struct FraudEngine {
    rules: Vec<Box<dyn FraudRule>>,
}

impl FraudEngine {
    pub fn new() -> Self {
        Self {
            rules: vec![
                Box::new(AmountRule { max_single: 50_000_00 }), // R$ 50.000
                Box::new(VelocityRule { max_per_hour: 10 }),
                Box::new(DistanceRule { max_km: 500 }),
            ],
        }
    }

    pub fn evaluate(&self, req: &FraudRequest) -> FraudResponse {
        let mut total_score = 0.0;
        let mut flags = Vec::new();

        for rule in &self.rules {
            if let Some((score, flag)) = rule.check(req) {
                total_score += score;
                flags.push(flag);
            }
        }

        FraudResponse {
            risk_score: total_score.min(1.0),
            flags,
        }
    }
}

trait FraudRule {
    fn check(&self, req: &FraudRequest) -> Option<(f64, String)>;
}

struct AmountRule { max_single: i64 }
impl FraudRule for AmountRule {
    fn check(&self, req: &FraudRequest) -> Option<(f64, String)> {
        if req.amount > self.max_single {
            Some((0.3, "high_amount".to_string()))
        } else {
            None
        }
    }
}

struct VelocityRule { max_per_hour: u32 }
impl FraudRule for VelocityRule {
    fn check(&self, req: &FraudRequest) -> Option<(f64, String)> {
        // Verificar cache de transacoes recentes
        let recent_count = get_recent_transaction_count(&req.payer_cpf);
        if recent_count > self.max_per_hour {
            Some((0.5, "high_velocity".to_string()))
        } else {
            None
        }
    }
}

struct DistanceRule { max_km: u32 }
impl FraudRule for DistanceRule {
    fn check(&self, req: &FraudRequest) -> Option<(f64, String)> {
        // Verificar distancia entre transacoes recentes
        let distance = calculate_distance(&req.payer_cpf);
        if distance > self.max_km {
            Some((0.4, "impossible_travel".to_string()))
        } else {
            None
        }
    }
}
```

#### Padroes de Microservicos Aplicados

| Padrao | Aplicacao | Tecnologia |
|--------|-----------|------------|
| **Service Mesh** | Comunicacao segura entre servicos | Envoy + Istio |
| **CQRS** | Leitura vs escrita separadas | Go reads / Kafka writes |
| **Event Sourcing** | Historico completo de transacoes | Kafka + CockroachDB |
| **Saga** | Transacao distribuida compensavel | Choreography via Kafka |
| **Circuit Breaker** | Falha em cascata | Go + Resilience4j |
| **Rate Limiting** | Protecao contra abuso | Go + Redis |
| **Idempotency** | Processamento duplicado | Redis + UUID check |

#### Deploy e Observabilidade

```yaml
# docker-compose.yml
version: '3.8'
services:
  cockroachdb:
    image: cockroachdb/cockroach:v23.1.0
    command: start-single-node --insecure
    ports:
      - "26257:26257"
      - "8080:8080"

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    environment:
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
    ports:
      - "9092:9092"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  jaeger:
    image: jaegertracing/all-in-one:1.49
    ports:
      - "16686:16686"
      - "4318:4318"

  prometheus:
    image: prom/prometheus:v2.47.0
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:10.1.0
    ports:
      - "3000:3000"
```

### Exercicio Final — Projeto Integrador

#### Projeto: Sistema de Pagamentos PIX Completo

**Escopo:** Implementar do zero um sistema de pagamentos PIX com todos os componentes dos 3 modulos.

**Requisitos funcionais:**
1. API REST para criar/consultar transacoes PIX
2. Processamento assincrono via Kafka
3. Verificacao antifraude em Rust via FFI
4. Contas com saldo e versionamento
5. Notificacoes em tempo real via WebSocket

**Requisitos nao-funcionais:**
1. Throughput minimo: 1000 TPS
2. Latencia P99 < 500ms
3. Disponibilidade 99.9%
4. Idempotencia em todas as operacoes
5. Observabilidade completa (traces + metrics + logs)

**Stack obrigatoria:**
- Go (servicos principais)
- Rust (fraud engine via FFI)
- Kafka (event streaming)
- CockroachDB (banco distribuido)
- Redis (cache + rate limiting)
- OpenTelemetry (observabilidade)

**Etapas:**
1. **Semana 1:** Schema do banco + API de contas (Go + CockroachDB)
2. **Semana 2:** Fraud engine (Rust) + FFI bridge (Go)
3. **Semana 3:** Kafka pipeline + payment processor
4. **Semana 4:** Observabilidade + testes de carga + deploy

**Critérios de avaliacao:**
- Codigo compila e roda sem erros (30%)
- Testes unitarios e de integracao passam (20%)
- Throughput e latencia atendem requisitos (20%)
- Observabilidade funcional (15%)
- Documentacao e README (15%)

### Preparacao para Certificacao

#### Topicos Cobertos nos 3 Modulos

| Modulo | Topicos | Peso na Prova |
|--------|---------|---------------|
| **1: Fundamentos** | Go types, goroutines, channels, HTTP, PostgreSQL, testing | 30% |
| **2: Avancado** | Rust ownership, lifetimes, FFI, performance, unsafe | 30% |
| **3: Distribuido** | CAP, Raft, Kafka, circuit breakers, rate limiting, OTel, CockroachDB | 40% |

#### Dicas para a Prova

1. **Pratique implementacao** — a prova e pratica, nao teorica
2. **Foque em patterns** — circuit breaker, rate limiting, idempotency
3. **Entenda tradeoffs** — quando usar optimistic vs pessimistic locking
4. **Domine Go concurrency** — goroutines, channels, context, sync primitives
5. **Rust basics** — ownership, borrowing, lifetimes, no C++ mental model
6. **Kafka fundamentals** — producers, consumers, topics, partitions, offsets
7. **Observabilidade** — traces, metrics, logs com OpenTelemetry

#### Simulado

1. **Questao 1 (Go):** Implemente um rate limiter com token bucket que suporta 1000 requests/segundo com burst de 2000. Use sync.Map para distribuicao entre goroutines.

2. **Questao 2 (Rust):** Implemente em Rust uma funcao que calcula o score de fraude baseado em 3 regras: valor alto, velocidade alta, e distancia impossivel. Exponha via FFI para Go.

3. **Questao 3 (Distribuido):** Desenhe a arquitetura de um sistema de pagamentos que suporta 10.000 TPS com latencia P99 < 200ms. Justifique cada componente e sua funcao.

4. **Questao 4 (Kafka):** Implemente um consumer que processa pagamentos de forma idempotente com dead letter queue. Use exactly-once semantics.

5. **Questao 5 (CockroachDB):** Configure uma tabela de transacoes com multi-region, TTL automatico, e partitioning por regiao. Explique as decisoes de schema.

### Proximo

Parabens! Voce completou o Banking Stack Pro — Sistemas Distribuidos para Fintechs.

Continue para:
- **Projetos praticos** no repositorio banking-stack
- **Comunidade** — compartilhe suas solucoes
- **Certificacao** — agende sua prova
