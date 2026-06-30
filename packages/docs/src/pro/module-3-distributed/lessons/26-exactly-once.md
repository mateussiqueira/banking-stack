# Aula 26: Exactly-Once Semantics com idempotência

**Duração:** 50 minutos

## Objetivos
- Entender semânticas de entrega de mensagens
- Implementar idempotência em sistemas distribuídos
- Configurar exactly-once semantics no Kafka
- Prevenir duplicatas em transações financeiras

## Tópicos
1. **At-least-once**: Entrega garantida mas possíveis duplicatas
2. **Exactly-once**: Entrega exatamente uma vez
3. **Idempotent Producers**: Prevenção de duplicatas no producer
4. **Transactions**: Transações atômicas no Kafka

## Caso de uso financeiro: Prevenir pagamentos duplicados
Em sistemas de pagamento, cada transação deve ser processada exatamente uma vez. Duplicatas podem causar perdas financeiras significativas.

## Semânticas de Entrega

### 1. At-least-once (Padrão)
- Mensagem entregue pelo menos uma vez
- Possível processamento duplicado
- Requer idempotência no consumidor

```typescript
// Producer sem garantias
await producer.send({
  topic: 'payments',
  messages: [{ value: JSON.stringify(payment) }],
});

// Consumer com retry
await consumer.run({
  eachMessage: async ({ message }) => {
    try {
      await processPayment(message);
      await consumer.commitOffsets([{
        topic: message.topic,
        partition: message.partition,
        offset: (Number(message.offset) + 1).toString(),
      }]);
    } catch (error) {
      // Retry - pode causar duplicata
      console.error('Error processing:', error);
    }
  },
});
```

### 2. Exactly-once
- Mensagem entregue exatamente uma vez
- Sem processamento duplicado
- Mais complexo de implementar

## Implementação com Kafka

### 1. Idempotent Producer
```typescript
// Producer idempotente
const producer = kafka.producer({
  idempotent: true,
  transactionalId: 'payment-producer', // Identificador único
});

await producer.send({
  topic: 'payments',
  messages: [{
    key: 'payment-123',
    value: JSON.stringify({
      id: 'payment-123', // ID único para deduplicação
      amount: 100,
      timestamp: new Date(),
    }),
  }],
});
```

### 2. Transactions no Kafka
```typescript
// Transação atômica
const producer = kafka.producer({
  transactionalId: 'payment-transactions',
});

await producer.transaction();

try {
  // Enviar para múltiplos tópicos atomicamente
  await producer.send({
    topic: 'payments',
    messages: [{ value: JSON.stringify(payment) }],
  });

  await producer.send({
    topic: 'account-updates',
    messages: [{ value: JSON.stringify(accountUpdate) }],
  });

  await producer.commit();
} catch (error) {
  await producer.abort();
  throw error;
}
```

### 3. Consumer com Transações
```typescript
// Consumer processando transações
await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    const payment = JSON.parse(message.value?.toString() || '{}');
    
    // Verificar se já processou (deduplicação)
    const alreadyProcessed = await checkIfProcessed(payment.id);
    if (alreadyProcessed) {
      console.log(`Payment ${payment.id} already processed, skipping`);
      return;
    }

    // Processar pagamento
    await processPayment(payment);
    
    // Marcar como processado
    await markAsProcessed(payment.id);
  },
});
```

## Idempotência em Sistemas Distribuídos

### 1. Chaves de idempotência
```typescript
// Usando Redis para controle de idempotência
import Redis from 'ioredis';

const redis = new Redis();

async function processWithIdempotency(
  idempotencyKey: string,
  processor: () => Promise<void>
): Promise<void> {
  const lockKey = `lock:${idempotencyKey}`;
  const processedKey = `processed:${idempotencyKey}`;
  
  // Verificar se já foi processado
  const alreadyProcessed = await redis.get(processedKey);
  if (alreadyProcessed) {
    return;
  }

  // Tentar obter lock
  const acquired = await redis.set(lockKey, '1', 'EX', 60, 'NX');
  if (!acquired) {
    throw new Error('Another instance is processing this request');
  }

  try {
    await processor();
    await redis.set(processedKey, '1', 'EX', 86400); // 24 horas
  } finally {
    await redis.del(lockKey);
  }
}

// Uso
await processWithIdempotency('payment-123', async () => {
  await processPayment(payment);
});
```

### 2. Database constraints
```typescript
// Schema com constraint de unicidade
const createPaymentsTable = `
  CREATE TABLE payments (
    id VARCHAR(36) PRIMARY KEY,
    amount DECIMAL(10,2),
    status VARCHAR(20),
    created_at TIMESTAMP,
    processed_at TIMESTAMP,
    idempotency_key VARCHAR(64) UNIQUE
  );
`;

// Insert com verificação
async function insertPayment(payment: any): Promise<boolean> {
  try {
    await db.query(
      'INSERT INTO payments (id, amount, status, idempotency_key) VALUES (?, ?, ?, ?)',
      [payment.id, payment.amount, 'pending', payment.idempotencyKey]
    );
    return true;
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return false; // Já existe
    }
    throw error;
  }
}
```

## Exactly-once com Kafka Streams

### 1. Configuração
```typescript
import { KafkaStreams } from 'kafka-streams';

const streams = new KafkaStreams({
  kafka: {
    brokers: ['localhost:9092'],
    clientId: 'payment-processor',
  },
  noptions: {
    'enable.idempotence': true,
    'transactional.id': 'payment-processor-transactional',
  },
});

// Stream processamento atômico
const stream = streams.getKStream('payments');
stream
  .mapJSONConvenience()
  .filter(message => message.value.amount > 0)
  .map(async (message) => {
    // Processar e output para outro tópico
    const result = await processPayment(message.value);
    return { topic: 'processed-payments', value: result };
  })
  .to('processed-payments');

stream.start();
```

## Caso prático: Prevenir duplicatas

### 1. Fluxo completo
```typescript
async function processPaymentSafely(payment: any): Promise<boolean> {
  const idempotencyKey = `payment:${payment.id}:${payment.timestamp}`;
  
  // 1. Verificar se já foi processado
  const alreadyProcessed = await checkIdempotencyKey(idempotencyKey);
  if (alreadyProcessed) {
    console.log(`Payment ${payment.id} already processed`);
    return true;
  }

  // 2. Processar em transação
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Verificar novamente dentro da transação (double-check)
    const result = await client.query(
      'SELECT id FROM payments WHERE id = $1',
      [payment.id]
    );
    
    if (result.rows.length > 0) {
      await client.query('ROLLBACK');
      return true;
    }

    // Inserir pagamento
    await client.query(
      'INSERT INTO payments (id, amount, status, idempotency_key) VALUES ($1, $2, $3, $4)',
      [payment.id, payment.amount, 'completed', idempotencyKey]
    );

    // Atualizar saldo
    await client.query(
      'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
      [payment.amount, payment.accountId]
    );

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

## Exercícios

### Exercício 1: Implementar Idempotência
1. Crie sistema de idempotência com Redis
2. Implemente double-check locking
3. Teste com múltiplas requisições simultâneas

### Exercício 2: Configurar Exactly-once no Kafka
1. Configure producer idempotente
2. Implemente transações atômicas
3. Crie consumer com deduplicação

### Exercício 3: Prevenir Duplicatas em Pagamentos
1. Implemente fluxo completo de pagamento
2. Adicione constraints de unicidade no banco
3. Teste com retry e falhas simuladas

## Próximos passos
- Na próxima aula, veremos Schema Registry e evolução de schemas
- Garantiremos compatibilidade entre versões de eventos

## Material de referência
- [Kafka Exactly-Once Semantics](https://kafka.apache.org/documentation/#exactly_once_semantics)
- [Idempotency Patterns](https://microservices.io/patterns/data/idempotency.html)
- [Kafka Transactions](https://kafka.apache.org/documentation/#transactions)