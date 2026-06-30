# Challenge: Sistema de Monitoramento Financeiro

## Contexto

Instituições financeiras precisam monitorar transações em tempo real para detectar fraudes, conformidade regulatória e anomalias operacionais. Este desafio consiste em construir um sistema de monitoramento que processe streams de transações, detecte anomalias e envie alertas em tempo real.

## Objetivos

- Implementar processamento de streams de transações financeiras
- Desenvolver motor de detecção de anomalias baseado em regras
- Criar sistema de alertas multi-canal (email, webhook, in-app)
- Dashboard com métricas e visualizações em tempo real

## Requisitos

### Funcionais

1. **Stream Processing de Transações**
   - Consumo de transações via Kafka
   - Processamento em tempo real (micro-batch ou streaming)
   - Enrichment com dados complementares
   - Persistência para reprocessamento

2. **Motor de Detecção de Anomalias**
   - Regras configuráveis via API:
     - Volume transacional acima do normal
     - Horário atípico de operação
     - Geolocalização inconsistente
     - Frequência anormal de transações
     - Valor acima do limite do perfil
   - Scoring de risco por transação
   - Correlação de eventos (multi-step attacks)

3. **Sistema de Alertas**
   - Múltiplos canais:
     - Email (via SMTP ou SendGrid)
     - Webhook (HTTP POST para sistemas externos)
     - WebSocket (para dashboards)
     - In-app notification
   - Níveis de severidade (info, warning, critical)
   - Deduplicação e agrupamento de alertas
   - Histórico de alertas com status

4. **Dashboard em Tempo Real**
   - WebSocket para atualização live
   - Métricas:
     - Transações/segundo
     - Alertas ativos
     - Score de risco médio
     - Taxa de fraude detectada
   - Filtros por período, tipo, severidade
   - Gráficos de tendência

### Não-Funcionais

- Throughput: 10.000+ transações/segundo
- Latência de detecção: < 100ms
- Disponibilidade: 99.95%
- Retenção de dados: 90 dias hot, 1 ano cold
- LGPD compliance (dados sensíveis)

## Stack Tecnológica

- **Linguagem**: Go
- **Message Broker**: Apache Kafka
- **Cache**: Redis (hot data, sessões)
- **Database**: PostgreSQL (alertas, configurações) + TimescaleDB (métricas)
- **Real-time**: WebSocket (Go channels)
- **Observabilidade**: Prometheus + Grafana

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                     FONTES DE TRANSAÇÕES                           │
│                                                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │  PIX    │  │  TED    │  │  DOC    │  │ Cartão  │  │  Boleto │  │
│  │ Adapter │  │ Adapter │  │ Adapter │  │ Adapter │  │ Adapter │  │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  │
│       │            │            │            │            │         │
└───────┼────────────┼────────────┼────────────┼────────────┼─────────┘
        │            │            │            │            │
        ▼            ▼            ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     KAFKA CLUSTER                                   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Topic: raw-transactions                                      │  │
│  │  Partitions: 12 | Replication: 3                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Topic: enriched-transactions                                 │  │
│  │  Partitions: 12 | Replication: 3                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Topic: alerts                                                │  │
│  │  Partitions: 6 | Replication: 3                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└───────────┬────────────────────────────────────────────┬───────────┘
            │                                            │
            ▼                                            ▼
┌───────────────────────────────────┐  ┌───────────────────────────────┐
│      STREAM PROCESSOR             │  │       ALERT DISPATCHER        │
│                                   │  │                               │
│  ┌─────────────────────────────┐  │  │  ┌─────────────────────────┐  │
│  │   Consumer Group            │  │  │  │   Alert Router          │  │
│  │                             │  │  │  │                         │  │
│  │  - Deserialization          │  │  │  │  - Deduplicação         │  │
│  │  - Validation               │  │  │  │  - Agrupamento          │  │
│  │  - Enrichment               │  │  │  │  - Routing              │  │
│  └──────────────┬──────────────┘  │  │  └───────────┬─────────────┘  │
│                 │                 │  │              │                │
│                 ▼                 │  │              ▼                │
│  ┌─────────────────────────────┐  │  │  ┌─────────────────────────┐  │
│  │   Anomaly Detection Engine  │  │  │  │   Channel Adapters      │  │
│  │                             │  │  │  │                         │  │
│  │  ┌───────────────────────┐  │  │  │  │  ┌─────┐ ┌─────┐       │  │
│  │  │  Rules Engine         │  │  │  │  │  │Email│ │Web  │       │  │
│  │  │                       │  │  │  │  │  │     │ │hook │       │  │
│  │  │  - Volume rules       │  │  │  │  │  └─────┘ └─────┘       │  │
│  │  │  - Time rules         │  │  │  │  │  ┌─────┐ ┌─────┐       │  │
│  │  │  - Geo rules          │  │  │  │  │  │ WS  │ │Push │       │  │
│  │  │  - Pattern rules      │  │  │  │  │  │     │ │     │       │  │
│  │  │  - Threshold rules    │  │  │  │  │  └─────┘ └─────┘       │  │
│  │  └───────────────────────┘  │  │  │  └─────────────────────────┘  │
│  │                             │  │  │                               │
│  │  ┌───────────────────────┐  │  │  └───────────────────────────────┘
│  │  │  Risk Scorer          │  │  │
│  │  │                       │  │  │
│  │  │  - Score calculation  │  │  │
│  │  │  - Risk classification│  │  │
│  │  └───────────────────────┘  │  │
│  └─────────────────────────────┘  │
│                                   │
└───────────┬───────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                    │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │   PostgreSQL    │  │    Redis        │  │   TimescaleDB   │     │
│  │                 │  │                 │  │                 │     │
│  │ - Alertas       │  │ - Sessões       │  │ - Métricas      │     │
│  │ - Configurações │  │ - Cache quente  │  │ - Time series   │     │
│  │ - Regras        │  │ - Rate limiting │  │ - Agregações    │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DASHBOARD                                      │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                              │  │
│  │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │  │
│  │   │   TPS   │  │ Alertas │  │  Score  │  │  Taxa   │       │  │
│  │   │  12.5k  │  │   23    │  │  0.72   │  │  0.3%   │       │  │
│  │   └─────────┘  └─────────┘  └─────────┘  └─────────┘       │  │
│  │                                                              │  │
│  │   ┌──────────────────────────────────────────────────────┐  │  │
│  │   │              GRÁFICO DE TENDÊNCIA                    │  │  │
│  │   │  ~~~~~~~/\~~~~~~~\/\~~~~~~~/\~~~~~~~                │  │  │
│  │   │       \/  \~~~~~~    \~~~~~  \~~~~                  │  │  │
│  │   └──────────────────────────────────────────────────────┘  │  │
│  │                                                              │  │
│  │   ┌──────────────────────────────────────────────────────┐  │  │
│  │   │              ALERTAS RECENTES                        │  │  │
│  │   │  🔴 Alto volume transacional - User 12345            │  │  │
│  │   │  🟡 Horário atípico - User 67890                     │  │  │
│  │   │  🟢 Geolocalização - User 11111                      │  │  │
│  │   └──────────────────────────────────────────────────────┘  │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Estrutura do Projeto

```
financial-monitoring/
├── cmd/
│   ├── processor/
│   │   └── main.go
│   ├── dispatcher/
│   │   └── main.go
│   └── api/
│       └── main.go
├── internal/
│   ├── stream/
│   │   ├── consumer.go
│   │   ├── processor.go
│   │   └── enricher.go
│   ├── anomaly/
│   │   ├── engine.go
│   │   ├── rules/
│   │   │   ├── volume.go
│   │   │   ├── time.go
│   │   │   ├── geo.go
│   │   │   └── pattern.go
│   │   └── scorer.go
│   ├── alert/
│   │   ├── dispatcher.go
│   │   ├── deduplicator.go
│   │   └── channels/
│   │       ├── email.go
│   │       ├── webhook.go
│   │       ├── websocket.go
│   │       └── push.go
│   ├── api/
│   │   ├── handlers/
│   │   │   ├── alerts.go
│   │   │   ├── rules.go
│   │   │   └── metrics.go
│   │   └── websocket/
│   │       └── hub.go
│   ├── repository/
│   │   ├── alert_repo.go
│   │   ├── rule_repo.go
│   │   └── metrics_repo.go
│   └── config/
│       └── config.go
├── pkg/
│   ├── kafka/
│   │   ├── consumer.go
│   │   └── producer.go
│   ├── database/
│   │   ├── postgres.go
│   │   └── timescale.go
│   ├── cache/
│   │   └── redis.go
│   └── logger/
│       └── logger.go
├── migrations/
│   └── 001_initial.sql
├── docker-compose.yml
├── Dockerfile
├── go.mod
└── README.md
```

## Regras de Detecção (Exemplos)

```yaml
rules:
  - name: "alto_volume_transacional"
    description: "Volume de transações acima do normal"
    type: "threshold"
    config:
      field: "transaction_count"
      window: "5m"
      threshold: 100
      severity: "warning"
    
  - name: "horario_atipico"
    description: "Transação em horário não usual"
    type: "time_pattern"
    config:
      user_profile: "typical_hours"
      tolerance: "2h"
      severity: "info"
    
  - name: "geolocalizacao_inconsistente"
    description: "Transações de locais distantes em pouco tempo"
    type: "geo_velocity"
    config:
      max_distance_km: 500
      min_time_minutes: 30
      severity: "critical"
    
  - name: "valor_acima_limite"
    description: "Transação acima do limite do perfil"
    type: "threshold"
    config:
      field: "amount"
      user_profile: "max_transaction"
      multiplier: 2.0
      severity: "warning"
```

## Critérios de Avaliação

### Funcionalidade (35%)

- [ ] Consumo de Kafka funcionando
- [ ] Pelo menos 4 regras de anomalia implementadas
- [ ] Sistema de alertas multi-canal
- [ ] Dashboard com WebSocket
- [ ] API para gerenciar regras

### Performance (25%)

- [ ] Throughput > 10.000 msg/s
- [ ] Latência de detecção < 100ms
- [ ] Uso eficiente de memória
- [ ] Consumer group balanceado

### Qualidade de Código (20%)

- [ ] Processamento concorrente (goroutines adequadas)
- [ ] Testes unitários > 70% cobertura
- [ ] Testes de integração com Kafka
- [ ] Error handling robusto
- [ ] Graceful shutdown

### Operacionalidade (20%)

- [ ] Docker Compose funcional
- [ ] Métricas Prometheus disponíveis
- [ ] Logs estruturados
- [ ] Health checks
- [ ] Documentação de setup

## Bônus

- Machine Learning para detecção de padrões
- Replay de eventos para retreino de regras
- Dashboard com Grafana
- Alertas via Telegram/Slack
- Simulador de carga integrado
- Export de relatórios (PDF/CSV)

## Referências

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [TimescaleDB](https://docs.timescale.com/)
- [Go WebSocket](https://pkg.go.dev/github.com/gorilla/websocket)

## Entregáveis

1. Repositório com código fonte
2. docker-compose.yml funcional
3. Documentação de regras de anomalia
4. Testes unitários e de integração
5. README com instruções de uso
6. (Opcional) Dashboard funcional
7. (Opcional) Simulador de transações
