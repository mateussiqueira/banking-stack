# Desafio 06: Ledger com Event Sourcing em Rust

## Objetivo
Construir um sistema de ledger bancário utilizando event sourcing em Rust, garantindo auditoria completa e reconstrução de estado.

## Requisitos

### Eventos Principais
- **AccountCreated**: Criação de conta com metadados iniciais
- **MoneyDeposited**: Registro de depósitos com timestamp e fonte
- **MoneyWithdrawn**: Registro de saques com validação de saldo
- **MoneyTransferred**: Transferências entre contas com idempotência

### Projeções Obligatorias
1. **Balance**: Saldo atual de cada conta
2. **TransactionHistory**: Histórico completo de transações
3. **AuditLog**: Log imutável para compliance regulatório

### Componentes Técnicos
- **Event Store**: Armazenamento persistente dos eventos
- **Replay**: Reconstrução de estado a partir dos eventos
- **Snapshot**: Otimização para contas com muitos eventos

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    API de Comandos                          │
│  (CreateAccount, Deposit, Withdraw, Transfer)              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Command Handler                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Validador   │  │ Idempotência│  │ Concorrência│        │
│  │ de Negócio  │  │             │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Event Store (RocksDB/SQLite)                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Event Stream: [E1, E2, E3, E4, ...]                 │   │
│  │ - Append-only log                                   │   │
│  │ - Versionado por stream                             │   │
│  │ - Checkpoints para snapshots                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Projection Engine                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Balance    │  │ Transaction │  │  Audit      │        │
│  │  Projector  │  │ History     │  │  Log        │        │
│  │             │  │ Projector   │  │  Projector  │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                 │
│         ▼                ▼                ▼                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Redis/      │  │ PostgreSQL  │  │ Immutable   │        │
│  │ Memcached   │  │             │  │ Log Store   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Query Handlers                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ GetBalance  │  │ GetHistory  │  │ GetAudit    │        │
│  │             │  │             │  │ Trail       │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Estrutura de Código

```
event-sourcing-ledger/
├── src/
│   ├── main.rs
│   ├── commands/
│   │   ├── mod.rs
│   │   ├── create_account.rs
│   │   ├── deposit.rs
│   │   ├── withdraw.rs
│   │   └── transfer.rs
│   ├── events/
│   │   ├── mod.rs
│   │   ├── account_created.rs
│   │   ├── money_deposited.rs
│   │   ├── money_withdrawn.rs
│   │   └── money_transferred.rs
│   ├── projections/
│   │   ├── mod.rs
│   │   ├── balance.rs
│   │   ├── transaction_history.rs
│   │   └── audit_log.rs
│   ├── store/
│   │   ├── mod.rs
│   │   ├── event_store.rs
│   │   └── snapshot_store.rs
│   └── aggregate/
│       ├── mod.rs
│       └── account.rs
├── tests/
│   ├── integration/
│   └── unit/
├── Cargo.toml
└── README.md
```

## Critérios de Avaliação

### Funcionais (60%)
1. **Persistência de Eventos** (15%)
   - Eventos armazenados imutavelmente
   - Serialização/deserialização consistente
   - Versionamento de streams

2. **Projeções** (20%)
   - Saldo sempre consistente com eventos
   - Histórico completo e consultável
   - Audit log imutável e temporizado

3. **Replay e Snapshots** (15%)
   - Reconstrução de estado a partir de eventos
   - Snapshots automáticos a cada N eventos
   - Recovery rápido após falhas

4. **Idempotência** (10%)
   - Comandos duplicados não alteram estado
   - Chaves de idempotência por transação

### Não-Funcionais (40%)
1. **Performance** (15%)
   - Throughput mínimo: 1000 eventos/segundo
   - Latência de leitura: < 10ms (projeções)
   - Latência de escrita: < 50ms

2. **Concorrência** (10%)
   - Controle de concorrência otimista
   - Resolução de conflitos por versão
   - Lock-free para operações de leitura

3. **Observabilidade** (10%)
   - Métricas: eventos processados, latência
   - Logs estruturados
   - Traces distribuídos

4. **Testabilidade** (5%)
   - Testes unitários para cada evento
   - Testes de integração para projeções
   - Testes de concorrência

## Casos de Teste

### Caso 1: Criação e Operações Básicas
```rust
#[test]
fn test_account_lifecycle() {
    // 1. Criar conta
    // 2. Depositar R$ 1000
    // 3. Sacar R$ 200
    // 4. Verificar saldo = R$ 800
    // 5. Verificar histórico completo
}
```

### Caso 2: Transferência Entre Contas
```rust
#[test]
fn test_transfer_between_accounts() {
    // 1. Criar conta A com R$ 500
    // 2. Criar conta B com R$ 300
    // 3. Transferir R$ 200 de A para B
    // 4. Verificar saldos: A=R$300, B=R$500
    // 5. Verificar eventos de transferência
}
```

### Caso 3: Replay e Snapshot
```rust
#[test]
fn test_replay_and_snapshot() {
    // 1. Criar conta com 1000 transações
    // 2. Criar snapshot na transação 500
    // 3. Simular falha e recovery
    // 4. Verificar estado reconstruído
    // 5. Verificar performance do replay
}
```

## Entregáveis

1. **Código Fonte**
   - Implementação completa em Rust
   - Documentação inline
   - Exemplos de uso

2. **Testes**
   - Suite completa de testes
   - Cobertura mínima: 80%
   - Testes de carga

3. **Documentação**
   - Arquitetura detalhada
   - Guia de uso
   - Decisões de design

4. **Demonstração**
   - Script de demonstração
   - Métricas de performance
   - Comparação com abordagens tradicionais

## Recursos Sugeridos

### Crates Rust
- `serde` / `serde_json`: Serialização
- `tokio`: Runtime assíncrono
- `sqlx`: Database access
- `redis`: Cache para projeções
- `tracing`: Observabilidade
- `uuid`: Geração de IDs

### Padrões
- Event Sourcing
- CQRS (Command Query Responsibility Segregation)
- Snapshotting
- Idempotency Keys

## Dicas de Implementação

1. **Design de Eventos**
   - Eventos devem ser imutáveis
   - Incluir metadados: timestamp, versão, fonte
   - Usar enums para tipagem forte

2. **Armazenamento**
   - Considerar comparação de eventos
   - Implementar limpeza de snapshots antigos
   - Usar transactions para consistência

3. **Projeções**
   - Implementar como consumers assíncronos
   - Usar checkpoints para recovery
   - Considerar eventual consistency

4. **Performance**
   - Usar pooling de conexões
   - Implementar batch processing
   - Considerar parallelismo para projeções

## Tempo Estimado
- **Básico**: 8-10 horas
- **Completo**: 15-20 horas
- **Avançado**: 25+ horas (com otimizações)