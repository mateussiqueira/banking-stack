# Desafio 07: Pipeline SPI com Kafka

## Objetivo
Construir um pipeline de transações SPI (ISO 20022) usando Apache Kafka, garantindo processamento exactly-once e tratamento de falhas.

## Requisitos

### Mensagens SPI
- **pacs.008**: Credit Transfer (Transferência de Crédito)
- **pacs.002**: Payment Status Report (Relatório de Status)
- **pacs.003**: FI-to-FI Credit Transfer
- **camt.053**: Bank to Customer Statement

### Producers
1. **Gateway Producer**: Envia pacs.008 do sistema legado
2. **Adapter Producer**: Converte mensagens ISO 8583 para ISO 20022
3. **Retry Producer**: Reenvia mensagens falhas com backoff exponencial

### Consumers
1. **Settlement Consumer**: Processa liquidação de pagamentos
2. **Notification Consumer**: Envia notificações (SMS, Email, Push)
3. **Audit Consumer**: Registra auditoria para compliance
4. **Reconciliation Consumer**: Conciliação de transações

### Requisitos Técnicos
- **Exactly-Once Semantics**: Garantia de processamento único
- **Dead Letter Queue**: Tratamento de mensagens inválidas
- **Idempotência**: Consumidores idempotentes
- **Ordering**: Ordering por chave de partição (accountId)

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                    Fontes de Dados                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Sistema     │  │ ISO 8583    │  │ API REST    │            │
│  │ Legado      │  │ Gateway     │  │             │            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
│         │                │                │                     │
│         ▼                ▼                ▼                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Converter   │  │ Validator   │  │ Enricher    │            │
│  │ ISO 8583→   │  │ Schema      │  │ Metadata    │            │
│  │ ISO 20022   │  │ Validation  │  │             │            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│              Kafka Cluster                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Topics:                                                 │   │
│  │  - spi.pacs008.raw          (mensagens originais)       │   │
│  │  - spi.pacs008.validated    (mensagens validadas)       │   │
│  │  - spi.pacs008.settlement   (para liquidação)           │   │
│  │  - spi.pacs008.notification (para notificações)         │   │
│  │  - spi.pacs008.audit        (para auditoria)            │   │
│  │  - spi.pacs008.dlq          (dead letter queue)         │   │
│  │  - spi.pacs008.retry        (para retry)                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Consumer Groups:                                        │   │
│  │  - settlement-group     (3 consumers)                   │   │
│  │  - notification-group   (2 consumers)                   │   │
│  │  - audit-group          (2 consumers)                   │   │
│  │  - reconciliation-group (1 consumer)                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              Consumers                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Settlement  │  │ Notification│  │ Audit       │            │
│  │ Service     │  │ Service     │  │ Service     │            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
│         │                │                │                     │
│         ▼                ▼                ▼                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Core Banking│  │ SMS/Email   │  │ Compliance  │            │
│  │ API         │  │ Gateway     │  │ Database    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## Estrutura de Código

```
kafka-spi-pipeline/
├── src/
│   ├── main.rs
│   ├── producers/
│   │   ├── mod.rs
│   │   ├── gateway_producer.rs
│   │   ├── adapter_producer.rs
│   │   └── retry_producer.rs
│   ├── consumers/
│   │   ├── mod.rs
│   │   ├── settlement_consumer.rs
│   │   ├── notification_consumer.rs
│   │   ├── audit_consumer.rs
│   │   └── reconciliation_consumer.rs
│   ├── kafka/
│   │   ├── mod.rs
│   │   ├── config.rs
│   │   ├── producer.rs
│   │   └── consumer.rs
│   ├── spi/
│   │   ├── mod.rs
│   │   ├── pacs008.rs
│   │   ├── validator.rs
│   │   └── converter.rs
│   ├── idempotency/
│   │   ├── mod.rs
│   │   └── redis_store.rs
│   └── dlq/
│       ├── mod.rs
│       └── handler.rs
├── config/
│   ├── kafka.json
│   └── spi.json
├── tests/
│   ├── integration/
│   └── unit/
├── docker-compose.yml
├── pom.xml / Cargo.toml
└── README.md
```

## Critérios de Avaliação

### Funcionais (60%)
1. **Produção de Mensagens** (15%)
   - Serialização correta pacs.008
   - Validação de schema
   - Tratamento de erros

2. **Consumo e Processamento** (20%)
   - Settlement: Processamento de liquidação
   - Notification: Envio de notificações
   - Audit: Registro de auditoria
   - Reconciliation: Conciliação de transações

3. **Exactly-Once Semantics** (15%)
   - Transactions Kafka
   - Idempotência de producers
   - Checkpointing de offsets

4. **Dead Letter Queue** (10%)
   - Mensagens inválidas para DLQ
   - Monitoramento de DLQ
   - Retry com backoff exponencial

### Não-Funcionais (40%)
1. **Performance** (15%)
   - Throughput: 1000 mensagens/segundo
   - Latência end-to-end: < 500ms
   - Consumer lag monitoring

2. **Confiabilidade** (10%)
   - Acknowledgment after processing
   - Recovery after consumer failure
   - Message ordering guarantees

3. **Observabilidade** (10%)
   - Kafka metrics (consumer lag, throughput)
   - Application metrics
   - Distributed tracing

4. **Operacionalidade** (5%)
   - Docker Compose para development
   - Scripts de deploy
   - Health checks

## Casos de Teste

### Caso 1: Fluxo Happy Path
```java
@Test
void testSuccessfulPaymentFlow() {
    // 1. Enviar pacs.008 válido
    // 2. Verificar validação
    // 3. Verificar processamento settlement
    // 4. Verificar notificação enviada
    // 5. Verificar audit log
}
```

### Caso 2: Mensagem Inválida
```java
@Test
void testInvalidMessageToDLQ() {
    // 1. Enviar pacs.008 com dados inválidos
    // 2. Verificar rejeição
    // 3. Verificar mensagem na DLQ
    // 4. Verificar métricas de erro
}
```

### Caso 3: Exactly-Once
```java
@Test
void testExactlyOnceProcessing() {
    // 1. Enviar 100 mensagens
    // 2. Simular falha do consumer
    // 3. Reiniciar consumer
    // 4. Verificar que cada mensagem foi processada exatamente uma vez
}
```

### Caso 4: Ordering
```java
@Test
void testMessageOrdering() {
    // 1. Enviar 10 transações para mesma conta
    // 2. Verificar que são processadas em ordem
    // 3. Verificar estado final correto
}
```

## Entregáveis

1. **Código Fonte**
   - Implementação completa
   - Configurações de Kafka
   - Docker Compose

2. **Infraestrutura**
   - Scripts de deploy
   - Configurações de monitoramento
   - Health checks

3. **Testes**
   - Testes unitários
   - Testes de integração
   - Testes de carga

4. **Documentação**
   - Guia de setup
   - Arquitetura detalhada
   - Runbook operacional

## Recursos Sugeridos

### Bibliotecas
- **Java**: Spring Kafka, Kafka Streams
- **Go**: Sarama, confluent-kafka-go
- **Python**: confluent-kafka, faust

### Ferramentas
- **Docker**: Kafka + Zookeeper
- **Schema Registry**: Validação de schemas
- **Kafka Connect**: Integrações
- **Confluent Control Center**: Monitoramento

### Padrões
- Transactional Producer
- Consumer Rebalance
- Dead Letter Topic
- Idempotent Consumer
- Outbox Pattern

## Dicas de Implementação

1. **Configuração Kafka**
   ```properties
   # Producer
   enable.idempotence=true
   transactional.id=spi-producer-1
   acks=all
   
   # Consumer
   enable.auto.commit=false
   isolation.level=read_committed
   ```

2. **Idempotência**
   - Usar Redis para store de idempotência
   - Chave: transactionId + accountId
   - TTL: 24 horas

3. **DLQ Strategy**
   - Mensagens com mais de 3 falhas vão para DLQ
   - Alertar equipe de operações
   - Processar manualmente ou com retry

4. **Monitoring**
   - Consumer lag por partição
   - Throughput por topic
   - Error rate por consumer

## Tempo Estimado
- **Básico**: 10-12 horas
- **Completo**: 18-22 horas
- **Avançado**: 30+ horas (com monitoramento avançado)