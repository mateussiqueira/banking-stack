# Challenge: Motor de Crédito sobre Pix

## Contexto

O Banco Central do Brasil implementou nova regulação que permite a oferta de crédito diretamente sobre a infraestrutura do Pix. Este desafio consiste em desenvolver um motor de crédito que integre fluxos de aprovação, avaliação de risco e concessão de crédito em tempo real utilizando o Pix como base.

## Objetivos

- Criar uma API para propostas de crédito sobre Pix
- Desenvolver engine de avaliação de risco com scoring simplificado
- Implementar cálculo de limite de crédito baseado em histórico transacional
- Integrar fluxo de aprovação com liquidação via Pix

## Requisitos

### Funcionais

1. **API de Propostas de Crédito**
   - Endpoint para criar propostas de crédito
   - Endpoint para consultar status da proposta
   - Endpoint para simular valores e parcelas
   - Validação de dados do proponente

2. **Engine de Avaliação de Risco**
   - Scoring baseado em:
     - Histórico de transações Pix (volume, frequência, regularidade)
     - Dados cadastrais (tempo de conta, dados verificados)
     - Comportamento de pagamentos anteriores
   - Retorno em tempo real (< 500ms)
   - Thresholds configuráveis por segmento

3. **Cálculo de Limite de Crédito**
   - Limite baseado em score e histórico
   - Teto máximo por perfil de risco
   - Ajuste dinâmico baseado em comportamento recente
   - Regras de negócio parametrizáveis

4. **Integração com Pix**
   - Liquidação automática do crédito via Pix
   - Débito automático das parcelas via Pix
   - Webhook de confirmação de pagamento
   - Tratamento de falhas e retries

### Não-Funcionais

- Latência: < 500ms para decisão de crédito
- Disponibilidade: 99.9%
- Throughput: 1000+ propostas/minuto
- Auditoria completa de decisões
- LGPD compliance

## Stack Tecnológica

- **Linguagem**: Go ou Rust
- **Banco de Dados**: PostgreSQL (dados transacionais)
- **Cache**: Redis (scoring cache, rate limiting)
- **Filas**: RabbitMQ ou NATS (eventos assíncronos)
- **API**: REST ou gRPC
- **Observabilidade**: OpenTelemetry + Jaeger

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Frontend/App)                       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY                                  │
│              (Rate Limiting, Auth, Request Routing)                 │
└──────────┬──────────────────┬──────────────────┬────────────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
┌──────────────────┐ ┌─────────────────┐ ┌─────────────────────┐
│  PROPOSTA API    │ │  SCORING API    │ │  CREDITO API        │
│                  │ │                 │ │                     │
│ - Criar proposta │ │ - Avaliar risco │ │ - Aprovar crédito   │
│ - Consultar      │ │ - Calcular      │ │ - Liquidar Pix      │
│ - Simular        │ │   limite        │ │ - Gerar parcelas    │
└────────┬─────────┘ └───────┬─────────┘ └──────────┬──────────┘
         │                   │                      │
         ▼                   ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        CORE SERVICES                                │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │  Risk Engine     │  │  Credit Engine  │  │  Pix Adapter    │    │
│  │                  │  │                 │  │                 │    │
│  │  - Scoring       │  │  - Limite       │  │  - QR Code      │    │
│  │  - Regras        │  │  - Parcelamento │  │  - Liquidação   │    │
│  │  - ML Model      │  │  - Juros        │  │  - Webhooks     │    │
│  └────────┬─────────┘  └────────┬────────┘  └────────┬────────┘    │
│           │                     │                     │             │
│           ▼                     ▼                     ▼             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   EVENT BUS (NATS/RabbitMQ)                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└──────────┬──────────────────┬──────────────────┬────────────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
┌──────────────────┐ ┌─────────────────┐ ┌─────────────────────┐
│   PostgreSQL     │ │     Redis       │ │   Central Pix       │
│                  │ │                 │ │                     │
│ - Propostas      │ │ - Score Cache   │ │ - Iniciação         │
│ - Créditos       │ │ - Rate Limit    │ │ - Confirmação       │
│ - Pagamentos     │ │ - Sessões       │ │ - Consulta          │
└──────────────────┘ └─────────────────┘ └─────────────────────┘
```

## Fluxo Principal

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Cliente │────▶│  API    │────▶│ Scoring │────▶│ Crédito │────▶│   Pix   │
│ Solicita│     │ Proposta│     │  Engine │     │  Engine │     │ Adapter │
└─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────┘
     │               │               │               │               │
     │               ▼               ▼               ▼               ▼
     │          ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
     │          │ Valida  │    │ Calcula │    │ Aprova  │    │ Liquida │
     │          │ Dados   │    │ Score   │    │ Crédito │    │  Pix    │
     │          └─────────┘    └─────────┘    └─────────┘    └─────────┘
     │               │               │               │               │
     │               ▼               ▼               ▼               ▼
     │          ┌─────────────────────────────────────────────────────────┐
     └─────────▶│                    POSTGRESQL                          │
                │              (Persistência de Estados)                 │
                └─────────────────────────────────────────────────────────┘
```

## Estrutura do Projeto

```
pix-credit-engine/
├── cmd/
│   └── api/
│       └── main.go
├── internal/
│   ├── api/
│   │   ├── handlers/
│   │   │   ├── proposta.go
│   │   │   ├── scoring.go
│   │   │   └── credito.go
│   │   └── middleware/
│   ├── domain/
│   │   ├── proposta.go
│   │   ├── scoring.go
│   │   ├── credito.go
│   │   └── pix.go
│   ├── engine/
│   │   ├── risk/
│   │   │   ├── scorer.go
│   │   │   ├── rules.go
│   │   │   └── models.go
│   │   └── credit/
│   │       ├── calculator.go
│   │       ├── limits.go
│   │       └── installments.go
│   ├── adapter/
│   │   └── pix/
│   │       ├── client.go
│   │       └── webhook.go
│   ├── repository/
│   │   ├── proposta.go
│   │   ├── credito.go
│   │   └── pagamento.go
│   └── config/
│       └── config.go
├── pkg/
│   ├── database/
│   │   └── postgres.go
│   ├── cache/
│   │   └── redis.go
│   └── events/
│       └── bus.go
├── migrations/
│   └── 001_initial.sql
├── docker-compose.yml
├── Dockerfile
├── go.mod
└── README.md
```

## Critérios de Avaliação

### Funcionalidade (40%)

- [ ] API de propostas funcionando com todos os endpoints
- [ ] Engine de scoring com pelo menos 5 regras implementadas
- [ ] Cálculo de limite baseado em regras configuráveis
- [ ] Integração com Pix (simulada ou real)
- [ ] Fluxo completo de crédito aprovado

### Qualidade de Código (25%)

- [ ] Arquitetura limpa (Clean Architecture ou similar)
- [ ] Testes unitários com cobertura > 70%
- [ ] Testes de integração para fluxos críticos
- [ ] Error handling consistente
- [ ] Documentação de API (OpenAPI/Swagger)

### Performance (20%)

- [ ] Latência < 500ms para decisão de crédito
- [ ] Cache de scoring implementado
- [ ] Rate limiting configurado
- [ ] Connection pooling adequado

### Operacionalidade (15%)

- [ ] Docker Compose funcional
- [ ] Migrações de banco organizadas
- [ ] Logging estruturado
- [ ] Métricas básicas (request count, latency)
- [ ] Health check endpoint

## Bônus

- Circuit breaker para chamadas externas
- Feature flags para regras de negócio
- Dashboard de métricas de crédito
- Simulador de carga
- Documentação de runbook operacional

## Referências

- [Docs Pix - Banco Central](https://www.bcb.gov.br/estabilidadefinanceira/pix)
- [Regulamentação Crédito sobre Pix](https://www.bcb.gov.br/)
- [Padrões API Banking](https://github.com/banks/fintech-standards)

## Entregáveis

1. Repositório com código fonte
2. docker-compose.yml funcional
3. Documentação de setup e execução
4. Testes unitários e de integração
5. README com instruções de uso
6. (Opcional) Postman collection ou similar
