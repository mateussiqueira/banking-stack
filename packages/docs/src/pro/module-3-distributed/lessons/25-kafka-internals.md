# Aula 25: Kafka Internals — Partitions, Consumer Groups

**Duração:** 60 minutos

## Objetivos
- Entender a arquitetura interna do Kafka
- Configurar e gerenciar partitions
- Implementar consumer groups eficientemente
- Otimizar offset management e rebalancing

## Tópicos
1. **Partitions**: Como o Kafka distribui dados
2. **Consumer Groups**: Processamento paralelo e balanceamento
3. **Offsets**: Controle de posição de consumo
4. **Rebalancing**: Redistribuição de partitions entre consumidores
5. **Retention**: Políticas de retenção de dados

## Caso de uso financeiro: Pipeline de transações SPI
Em sistemas de pagamento, precisamos processar milhões de transações por dia com garantias de ordem e durabilidade.

## Arquitetura do Kafka

### 1. Partitions
Cada tópico Kafka é dividido em partitions para:
- **Paralelismo**: Múltiplos consumidores podem ler em paralelo
- **Escalabilidade**: Partitions podem ser distribuídas entre brokers
- **Ordem**: Dentro de uma partition, mensagens mantêm ordem

```typescript
// Criando tópico com múltiplas partitions
const admin = kafka.admin();
await admin.createTopics({
  topics: [{
    topic: 'transactions',
    numPartitions: 6, // 6 partitions para paralelismo
    replicationFactor: 3,
    configEntries: [
      { name: 'retention.ms', value: '86400000' }, // 24 horas
    ]
  }]
});
```

### 2. Consumer Groups
Consumer groups permitem:
- **Load balancing**: Distribuir partitions entre consumidores
- **Fault tolerance**: Se um consumidor falhar, suas partitions são redistribuídas
- **Escalabilidade**: Adicionar consumidores para aumentar throughput

```typescript
// Producer
const producer = kafka.producer();
await producer.send({
  topic: 'transactions',
  messages: [
    { key: 'account-123', value: JSON.stringify({ type: 'deposit', amount: 100 }) },
    { key: 'account-456', value: JSON.stringify({ type: 'withdrawal', amount: 50 }) },
  ],
});

// Consumer Group
const consumer = kafka.consumer({ groupId: 'payment-processing-group' });
await consumer.connect();
await consumer.subscribe({ topic: 'transactions', fromBeginning: false });

await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    const transaction = JSON.parse(message.value?.toString() || '{}');
    console.log(`Processing transaction: ${transaction}`);
    
    // Processar transação
    await processTransaction(transaction);
  },
});
```

## Offset Management

### 1. Offset Committing
```typescript
// Auto commit (configuração padrão)
const consumer = kafka.consumer({
  groupId: 'payment-group',
  autoCommit: true,
  autoCommitInterval: 5000, // Commit a cada 5 segundos
});

// Manual commit para controle preciso
const consumer = kafka.consumer({
  groupId: 'payment-group',
  autoCommit: false,
});

await consumer.run({
  eachMessage: async ({ topic, partition, message, heartbeat }) => {
    try {
      await processMessage(message);
      
      // Commit manual após processamento bem-sucedido
      await consumer.commitOffsets([{
        topic,
        partition,
        offset: (Number(message.offset) + 1).toString(),
      }]);
      
      await heartbeat(); // Manter conexão viva
    } catch (error) {
      // Não commit - mensagem será reprocessada
      console.error('Error processing message:', error);
    }
  },
});
```

### 2. Reset de Offsets
```typescript
// Reset para início do tópico
await consumer.seek({ topic: 'transactions', partition: 0, offset: '0' });

// Reset para timestamp específico
const timestamp = Date.now() - 3600000; // 1 hora atrás
await consumer.seekToTimestamp({
  topic: 'transactions',
  timestamp,
});
```

## Rebalancing

### 1. O que é rebalancing?
Quando um consumidor entra ou sai do grupo, as partitions são redistribuídas:
1. Todos os consumidores param de consumir
2. Coordinator reatribui partitions
3. Consumidores retomam consumo

### 2. Estratégias de Rebalancing
```typescript
// Range Assignor (padrão)
const consumer = kafka.consumer({
  groupId: 'payment-group',
  partitionAssignmentStrategy: ['Range'],
});

// Round Robin - distribuição mais uniforme
const consumer = kafka.consumer({
  groupId: 'payment-group',
  partitionAssignmentStrategy: ['RoundRobin'],
});

// Custom assignor
const consumer = kafka.consumer({
  groupId: 'payment-group',
  partitionAssignmentStrategy: [new CustomAssignor()],
});
```

### 3. Minimizando rebalancing
```typescript
// Session timeout e heartbeat
const consumer = kafka.consumer({
  groupId: 'payment-group',
  sessionTimeout: 30000, // 30 segundos
  heartbeatInterval: 3000, // 3 segundos
  maxPollInterval: 300000, // 5 minutos
});

// Cooperative rebalancing (incremental)
const consumer = kafka.consumer({
  groupId: 'payment-group',
  partitionAssignmentStrategy: ['CooperativeSticky'],
});
```

## Retention Policies

### 1. Tipos de retenção
- **Time-based**: Retém por tempo específico
- **Size-based**: Retém até atingir tamanho máximo
- **Log Compaction**: Mantém apenas último valor por chave

```typescript
// Configuração de retenção
await admin.alterConfigs({
  resources: [{
    type: 2, // TOPIC
    name: 'transactions',
    configEntries: [
      { name: 'retention.ms', value: '86400000' }, // 24 horas
      { name: 'retention.bytes', value: '1073741824' }, // 1GB
      { name: 'cleanup.policy', value: 'delete' }, // ou 'compact'
    ]
  }]
});
```

### 2. Log Compaction para eventos
```typescript
// Tópico com log compaction (mantém último evento por chave)
await admin.createTopics({
  topics: [{
    topic: 'account-updates',
    configEntries: [
      { name: 'cleanup.policy', value: 'compact' },
      { name: 'min.cleanable.dirty.ratio', value: '0.5' },
    ]
  }]
});
```

## Caso prático: Pipeline SPI

### 1. Configuração do pipeline
```typescript
// Tópicos para pipeline SPI
const topics = [
  'spi-incoming',      // Transações recebidas
  'spi-validation',    // Validação
  'spi-processing',    // Processamento
  'spi-settlement',    // Liquidação
  'spi-notifications', // Notificações
];

// Consumers para cada etapa
const validationConsumer = kafka.consumer({ 
  groupId: 'spi-validation-group' 
});

const processingConsumer = kafka.consumer({ 
  groupId: 'spi-processing-group' 
});
```

### 2. Pipeline de processamento
```typescript
// Validation Consumer
await validationConsumer.subscribe({ topic: 'spi-incoming' });
await validationConsumer.run({
  eachMessage: async ({ message }) => {
    const transaction = JSON.parse(message.value?.toString() || '{}');
    
    // Validar transação
    const validation = validateTransaction(transaction);
    
    if (validation.valid) {
      // Enviar para próxima etapa
      await producer.send({
        topic: 'spi-validation',
        messages: [{
          key: message.key,
          value: JSON.stringify({
            ...transaction,
            validation,
            validatedAt: new Date(),
          }),
        }],
      });
    }
  },
});
```

## Exercícios

### Exercício 1: Configurar Consumer Groups
1. Crie um tópico com 6 partitions
2. Implemente 3 consumidores no mesmo grupo
3. Observe como as partitions são distribuídas

### Exercício 2: Gerenciar Offsets
1. Implemente commit manual de offsets
2. Simule falha e verifique reprocessamento
3. Implemente reset de offsets para timestamp específico

### Exercício 3: Otimizar Rebalancing
1. Configure cooperative rebalancing
2. Meça tempo de rebalancing com diferentes configurações
3. Implemente detecção de consumidor morto

## Próximos passos
- Na próxima aula, veremos exactly-once semantics com idempotência
- Implementaremos prevenção de duplicatas em pagamentos

## Material de referência
- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [Kafka Internals](https://kafka.apache.org/documentation/#internals)
- [Consumer Group Protocol](https://kafka.apache.org/protocol)