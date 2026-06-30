# Projeto Final: Sistema de Pagamentos Completo

## Objetivo
Construir um sistema de pagamentos completo e distribuído utilizando Go, Rust e Apache Kafka, integrando todos os módulos aprendidos ao longo do curso.

## Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENTES                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ Web App     │  │ Mobile App  │  │ API Partner │  │ Legacy      │       │
│  │ (React)     │  │ (Flutter)   │  │             │  │ System      │       │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
└─────────┼────────────────┼────────────────┼────────────────┼────────────────┘
          │                │                │                │
          ▼                ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    API GATEWAY (Go)                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ Rate        │  │ Auth        │  │ Load        │  │ Circuit     │       │
│  │ Limiter     │  │ (JWT/OAuth) │  │ Balancer    │  │ Breaker     │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Router: /api/v1/payments, /api/v1/accounts, /api/v1/transfers     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATION SERVICE (Go)                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ Payment     │  │ Account     │  │ Transfer    │  │ Reconcilia- │       │
│  │ Orchestrator│  │ Manager     │  │ Engine      │  │ tion        │       │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
│         │                │                │                │                 │
│         ▼                ▼                ▼                ▼                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  gRPC Clients → Rust Services                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    KAFKA CLUSTER                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Topics:                                                             │   │
│  │  - payments.commands      (comandos de pagamento)                   │   │
│  │  - payments.events        (eventos de pagamento)                    │   │
│  │  - accounts.events        (eventos de conta)                        │   │
│  │  - transfers.commands     (comandos de transferência)               │   │
│  │  - transfers.events       (eventos de transferência)                │   │
│  │  - audit.events           (eventos de auditoria)                    │   │
│  │  - notifications.commands (comandos de notificação)                 │   │
│  │  - dlq.payments           (dead letter queue)                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ RUST SERVICES   │ │ RUST SERVICES   │ │ GO SERVICES     │
│                 │ │                 │ │                 │
│ ┌─────────────┐ │ │ ┌─────────────┐ │ │ ┌─────────────┐ │
│ │ ISO 8583    │ │ │ │ Order Book  │ │ │ │ Settlement  │ │
│ │ Parser      │ │ │ │ Engine      │ │ │ │ Service     │ │
│ └─────────────┘ │ │ └─────────────┘ │ │ └─────────────┘ │
│                 │ │                 │ │                 │
│ ┌─────────────┐ │ │ ┌─────────────┐ │ │ ┌─────────────┐ │
│ │ Risk        │ │ │ │ Event Store │ │ │ │ Notification│ │
│ │ Engine      │ │ │ │ (EventSourcing)│ │ │ Service     │ │
│ └─────────────┘ │ │ └─────────────┘ │ │ └─────────────┘ │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ PostgreSQL      │ │ Redis           │ │ External APIs   │
│ (ISO Messages)  │ │ (Cache/Session) │ │ (SMS/Email/Push)│
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Componentes

### 1. API Gateway (Go)
**Responsabilidades:**
- Rate limiting e throttling
- Autenticação e autorização (JWT/OAuth2)
- Load balancing e circuit breaker
- Request validation e transformation
- API versioning

**Tecnologias:**
- Go + Gin/Echo framework
- Redis para rate limiting
- Prometheus para métricas

### 2. Orchestration Service (Go)
**Responsabilidades:**
- Coordenação de fluxos de pagamento
- Gerenciamento de transações distribuídas
- Saga pattern para operações complexas
- Integração com serviços Rust via gRPC

**Tecnologias:**
- Go + gRPC
- PostgreSQL para estado
- Kafka para eventos

### 3. ISO 8583 Parser (Rust)
**Responsabilidades:**
- Parse e serialização de mensagens ISO 8583
- Validação de campos e bitmap
- Conversão para ISO 20022
- High performance parsing

**Tecnologias:**
- Rust + serde
- Zero-copy parsing
- SIMD para bitmap processing

### 4. Order Book Engine (Rust)
**Responsabilidades:**
- Gerenciamento de ordens de pagamento
- Matching de ordens
- Priority queue para processamento
- State machine para lifecycle

**Tecnologias:**
- Rust + crossbeam
- Lock-free data structures
- Event sourcing interno

### 5. Risk Engine (Rust)
**Responsabilidades:**
- Análise de risco em tempo real
- Regras de compliance
- Score de risco por transação
- Bloqueio de transações suspeitas

**Tecnologias:**
- Rust + rayon (parallelism)
- Regras configuráveis
- ML models via FFI

### 6. Event Streaming (Kafka)
**Responsabilidades:**
- Event sourcing para todas as entidades
- CQRS para leitura/escrita
- Exactly-once semantics
- Dead letter queue management

**Tecnologias:**
- Apache Kafka
- Schema Registry
- Kafka Connect

## Fluxos Principais

### Fluxo 1: Pagamento Simples
```
1. Cliente → API Gateway: POST /api/v1/payments
2. API Gateway → Orchestration: CreatePayment command
3. Orchestration → Kafka: payments.commands topic
4. Orchestration → Risk Engine: Validar risco
5. Risk Engine → Kafka: RiskAssessed event
6. Orchestration → Order Book: Criar ordem
7. Order Book → Kafka: OrderCreated event
8. Orchestration → ISO Parser: Converter para ISO 8583
9. ISO Parser → External Bank: Mensagem ISO
10. External Bank → ISO Parser: Resposta
11. ISO Parser → Orchestration: PaymentCompleted event
12. Orchestration → Kafka: PaymentCompleted event
13. Notification Service → Cliente: Confirmação
```

### Fluxo 2: Transferência entre Contas
```
1. Cliente → API Gateway: POST /api/v1/transfers
2. API Gateway → Orchestration: CreateTransfer command
3. Orchestration → Kafka: transfers.commands topic
4. Orchestration → Account Service: Debitar conta origem
5. Account Service → Kafka: AccountDebited event
6. Orchestration → Account Service: Creditar conta destino
7. Account Service → Kafka: AccountCredited event
8. Orchestration → Kafka: TransferCompleted event
9. Notification Service → Ambos clientes: Confirmação
```

### Fluxo 3: Pagamento com Falha
```
1. Cliente → API Gateway: POST /api/v1/payments
2. API Gateway → Orchestration: CreatePayment command
3. Orchestration → Risk Engine: Validar risco
4. Risk Engine → Orchestration: Risco alto detectado
5. Orchestration → Kafka: PaymentRejected event
6. Orchestration → DLQ: Mensagem para análise
7. Notification Service → Cliente: Pagamento rejeitado
8. Audit Service → Compliance: Log de rejeição
```

## Estrutura de Código

```
banking-payment-system/
├── go-services/
│   ├── api-gateway/
│   │   ├── cmd/
│   │   │   └── main.go
│   │   ├── internal/
│   │   │   ├── handler/
│   │   │   ├── middleware/
│   │   │   ├── service/
│   │   │   └── repository/
│   │   ├── pkg/
│   │   ├── go.mod
│   │   └── Dockerfile
│   │
│   └── orchestration/
│       ├── cmd/
│       │   └── main.go
│       ├── internal/
│       │   ├── saga/
│       │   ├── orchestrator/
│       │   └── grpc/
│       ├── proto/
│       │   └── payment.proto
│       ├── go.mod
│       └── Dockerfile
│
├── rust-services/
│   ├── iso-parser/
│   │   ├── src/
│   │   │   ├── main.rs
│   │   │   ├── parser/
│   │   │   ├── converter/
│   │   │   └── validator/
│   │   ├── benches/
│   │   ├── Cargo.toml
│   │   └── Dockerfile
│   │
│   ├── order-book/
│   │   ├── src/
│   │   │   ├── main.rs
│   │   │   ├── engine/
│   │   │   ├── matcher/
│   │   │   └── state/
│   │   ├── Cargo.toml
│   │   └── Dockerfile
│   │
│   └── risk-engine/
│       ├── src/
│       │   ├── main.rs
│       │   ├── rules/
│       │   ├── scoring/
│       │   └── ml/
│       ├── models/
│       ├── Cargo.toml
│       └── Dockerfile
│
├── kafka/
│   ├── config/
│   │   ├── server.properties
│   │   └── schema-registry.properties
│   ├── schemas/
│   │   ├── payment-event.avsc
│   │   ├── account-event.avsc
│   │   └── transfer-event.avsc
│   ├── connectors/
│   │   └── elasticsearch-connector.json
│   └── docker-compose.yml
│
├── infrastructure/
│   ├── kubernetes/
│   │   ├── api-gateway/
│   │   ├── orchestration/
│   │   ├── iso-parser/
│   │   ├── order-book/
│   │   ├── risk-engine/
│   │   └── kafka/
│   ├── terraform/
│   │   ├── aws/
│   │   └── gcp/
│   └── ansible/
│
├── monitoring/
│   ├── prometheus/
│   │   └── prometheus.yml
│   ├── grafana/
│   │   └── dashboards/
│   ├── jaeger/
│   └── alertmanager/
│
├── tests/
│   ├── integration/
│   ├── e2e/
│   ├── load/
│   └── chaos/
│
├── scripts/
│   ├── setup.sh
│   ├── deploy.sh
│   └── benchmark.sh
│
├── docs/
│   ├── architecture.md
│   ├── api-reference.md
│   └── runbook.md
│
├── docker-compose.yml
├── Makefile
└── README.md
```

## Requisitos Não-Funcionais

### Performance
- **Throughput**: 10,000 transações/segundo
- **Latência P99**: < 100ms para pagamentos
- **Disponibilidade**: 99.99% (4 nines)
- **Recovery Time**: < 30 segundos

### Segurança
- **Autenticação**: JWT + OAuth2
- **Autorização**: RBAC (Role-Based Access Control)
- **Criptografia**: TLS 1.3, AES-256 para dados sensíveis
- **Auditoria**: Log de todas as operações

### Observabilidade
- **Métricas**: Prometheus + Grafana
- **Logs**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Traces**: Jaeger para distributed tracing
- **Alertas**: PagerDuty/Slack integration

### Escalabilidade
- **Horizontal**: Auto-scaling baseado em CPU/memória
- **Database**: Read replicas, connection pooling
- **Cache**: Redis Cluster para hot data
- **CDN**: Assets estáticos via CDN

## Casos de Teste

### Caso 1: Pagamento de Alto Volume
```go
func TestHighVolumePayments(t *testing.T) {
    // 1. Enviar 10,000 pagamentos simultâneos
    // 2. Verificar throughput mínimo
    // 3. Verificar latência P99
    // 4. Verificar consistência de dados
    // 5. Verificar zero perda de mensagens
}
```

### Caso 2: Falha e Recovery
```go
func TestFailureRecovery(t *testing.T) {
    // 1. Processar 1000 pagamentos
    // 2. Simular falha no Risk Engine
    // 3. Verificar DLQpopulada
    // 4. Reiniciar Risk Engine
    // 5. Verificar retry automático
    // 6. Verificar estado final correto
}
```

### Caso 3: Consistência Distribuída
```go
func TestDistributedConsistency(t *testing.T) {
    // 1. Criar transferência entre contas
    // 2. Simular rede particionada
    // 3. Verificar que transação é revertida
    // 4. Verificar saldo final correto
    // 5. Verificar audit log completo
}
```

### Caso 4: Stress Test
```go
func TestStressScenario(t *testing.T) {
    // 1. Sustained load de 5000 tps por 1 hora
    // 2. Monitorar memory leaks
    // 3. Verificar garbage collection
    // 4. Verificar conexões de database
    // 5. Verificar performance degradada
}
```

## Entregáveis

### 1. Código Fonte
- Implementação completa de todos os serviços
- Dockerfiles para containerização
- Kubernetes manifests
- Scripts de deploy

### 2. Infraestrutura
- Terraform/Ansible para provisionamento
- CI/CD pipeline (GitHub Actions/GitLab CI)
- Monitoring stack
- Alerting configuration

### 3. Documentação
- Arquitetura detalhada (ADR - Architecture Decision Records)
- API documentation (OpenAPI/Swagger)
- Runbook operacional
- Guia de desenvolvimento

### 4. Testes
- Unit tests (cobertura > 80%)
- Integration tests
- E2E tests
- Load tests (k6/Locust)
- Chaos tests (Chaos Monkey)

### 5. Demo
- Script de demonstração
- Dados de teste
- Métricas de performance
- Comparison com baseline

## Tecnologias e Bibliotecas

### Go
- **Web Framework**: Gin/Echo
- **gRPC**: google.golang.org/grpc
- **Kafka**: confluent-kafka-go
- **Database**: pgx (PostgreSQL)
- **Redis**: go-redis
- **Config**: viper
- **Logging**: zap/zerolog
- **Metrics**: prometheus/client_golang

### Rust
- **Async Runtime**: tokio
- **gRPC**: tonic
- **Kafka**: rdkafka
- **Database**: sqlx/sqlc
- **Serialization**: serde/serde_json
- **Logging**: tracing
- **Metrics**: prometheus

### Kafka
- **Cluster**: 3 brokers minimum
- **Schema Registry**: Confluent Schema Registry
- **Kafka Connect**: For external integrations
- **ksqlDB**: Stream processing

### Infraestrutura
- **Containers**: Docker
- **Orchestration**: Kubernetes
- **Service Mesh**: Istio (optional)
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack
- **Tracing**: Jaeger

## Plano de Execução

### Fase 1: Fundamentos (1-2 dias)
1. Setup do ambiente de desenvolvimento
2. Configuração do Kafka cluster
3. Implementação básica de cada serviço
4. Testes unitários

### Fase 2: Integração (2-3 dias)
1. Implementação do fluxo principal
2. Integração entre serviços
3. Testes de integração
4. Primeira demonstração

### Fase 3: Resiliência (1-2 dias)
1. Implementação de circuit breakers
2. Dead letter queue
3. Retry mechanisms
4. Testes de falha

### Fase 4: Performance (1-2 dias)
1. Otimização de queries
2. Cache implementation
3. Connection pooling
4. Load testing

### Fase 5: Observabilidade (1 dia)
1. Métricas detalhadas
2. Distributed tracing
3. Alerting rules
4. Dashboards

### Fase 6: Finalização (1 dia)
1. Documentação completa
2. Deploy em staging
3. Demo final
4. Code review

## Tempo Total Estimado
- **Mínimo**: 10 dias (2 semanas)
- **Recomendado**: 15 dias (3 semanas)
- **Ideal**: 20 dias (4 semanas)

## Critérios de Avaliação

### Funcionais (40%)
- **Fluxo completo de pagamento** (15%)
- **Transferências entre contas** (10%)
- **Tratamento de falhas** (10%)
- **Integração com sistema externo** (5%)

### Não-Funcionais (30%)
- **Performance** (10%)
- **Segurança** (10%)
- **Observabilidade** (5%)
- **Escalabilidade** (5%)

### Código (20%)
- **Qualidade do código** (10%)
- **Testes** (5%)
- **Documentação** (5%)

### Apresentação (10%)
- **Demo funcional** (5%)
- **Explicação da arquitetura** (3%)
- **Respostas a perguntas** (2%)