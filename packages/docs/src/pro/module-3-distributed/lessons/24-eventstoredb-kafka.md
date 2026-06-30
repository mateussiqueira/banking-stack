# Aula 24: Implementação com EventStoreDB ou Kafka

**Duração:** 65 minutos

## Objetivos
- Configurar EventStoreDB para armazenamento de eventos
- Utilizar Kafka como event store alternativo
- Implementar projeções em tempo real
- Criar uma implementação completa de event sourcing

## Tópicos
1. **EventStoreDB Basics**: Configuração e uso básico
2. **Kafka as Event Store**: Usando tópicos Kafka para eventos
3. **Projeções**: Criando projeções em tempo real
4. **Comparação**: Quando usar EventStoreDB vs Kafka

## Caso de uso: Implementação simples de event store
Vamos criar um sistema de ledger bancário usando EventStoreDB e comparar com uma implementação Kafka.

## Implementação com EventStoreDB

### 1. Configuração do EventStoreDB
```typescript
// package.json dependencies
{
  "dependencies": {
    "@eventstore/db-client": "^5.0.0"
  }
}

// connection.ts
import { EventStoreDBClient, jsonEvent } from '@eventstore/db-client';

const client = EventStoreDBClient.connection({
  endpoint: {
    hostname: 'localhost',
    port: 2113,
  },
});

export default client;
```

### 2. Event Store Service
```typescript
// event-store.service.ts
import { EventStoreDBClient, jsonEvent, STREAM_NAME } from '@eventstore/db-client';

class EventStoreService {
  private client: EventStoreDBClient;

  constructor() {
    this.client = EventStoreDBClient.connection({
      endpoint: {
        hostname: 'localhost',
        port: 2113,
      },
    });
  }

  async appendEvent(streamName: string, eventType: string, data: any): Promise<void> {
    const event = jsonEvent({
      type: eventType,
      data: data,
    });

    await this.client.appendToStream(streamName, [event]);
  }

  async readEvents(streamName: string): Promise<any[]> {
    const events = [];
    const subscription = this.client.readStream(streamName);
    
    for await (const resolvedEvent of subscription) {
      events.push({
        id: resolvedEvent.event.id,
        type: resolvedEvent.event.type,
        data: resolvedEvent.event.data,
        timestamp: resolvedEvent.event.created,
      });
    }
    
    return events;
  }

  async subscribeToStream(streamName: string, handler: (event: any) => void): Promise<void> {
    const subscription = this.client.subscribeToStream(streamName);
    
    for await (const resolvedEvent of subscription) {
      handler({
        id: resolvedEvent.event.id,
        type: resolvedEvent.event.type,
        data: resolvedEvent.event.data,
        timestamp: resolvedEvent.event.created,
      });
    }
  }
}
```

### 3. Ledger Service com EventStoreDB
```typescript
// ledger.service.ts
class LedgerService {
  private eventStore: EventStoreDBService;

  constructor() {
    this.eventStore = new EventStoreDBService();
  }

  async createAccount(accountId: string, initialBalance: number): Promise<void> {
    await this.eventStore.appendEvent(`account-${accountId}`, 'AccountCreated', {
      accountId,
      initialBalance,
      createdAt: new Date(),
    });
  }

  async deposit(accountId: string, amount: number): Promise<void> {
    await this.eventStore.appendEvent(`account-${accountId}`, 'Deposit', {
      accountId,
      amount,
      timestamp: new Date(),
    });
  }

  async getBalance(accountId: string): Promise<number> {
    const events = await this.eventStore.readEvents(`account-${accountId}`);
    return events.reduce((balance, event) => {
      if (event.type === 'AccountCreated') return event.data.initialBalance;
      if (event.type === 'Deposit') return balance + event.data.amount;
      if (event.type === 'Withdrawal') return balance - event.data.amount;
      return balance;
    }, 0);
  }
}
```

## Implementação com Kafka

### 1. Configuração do Kafka
```typescript
// kafka-config.ts
import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'banking-app',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'ledger-group' });

export { kafka, producer, consumer };
```

### 2. Event Store com Kafka
```typescript
// kafka-event-store.ts
class KafkaEventStore {
  private producer: Producer;
  private topicPrefix: string;

  constructor(producer: Producer, topicPrefix: string = 'events') {
    this.producer = producer;
    this.topicPrefix = topicPrefix;
  }

  async appendEvent(aggregateId: string, eventType: string, data: any): Promise<void> {
    const topic = `${this.topicPrefix}-${aggregateId}`;
    const message = {
      key: aggregateId,
      value: JSON.stringify({
        eventType,
        data,
        timestamp: new Date(),
      }),
      headers: {
        'event-type': eventType,
        'aggregate-id': aggregateId,
      },
    };

    await this.producer.send({
      topic,
      messages: [message],
    });
  }

  async readEvents(aggregateId: string): Promise<any[]> {
    const topic = `${this.topicPrefix}-${aggregateId}`;
    // Em produção, usaria Kafka Streams ou consumer para ler
    // Aqui simplificamos com busca manual
    return [];
  }
}
```

### 3. Projeção com Kafka Streams
```typescript
// kafka-projection.ts
class BalanceProjection {
  private consumer: Consumer;
  private balances: Map<string, number> = new Map();

  constructor(consumer: Consumer) {
    this.consumer = consumer;
  }

  async start(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'events-account-*', fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
        const event = JSON.parse(message.value?.toString() || '{}');
        const accountId = message.headers?.['aggregate-id']?.toString() || '';

        switch (event.eventType) {
          case 'AccountCreated':
            this.balances.set(accountId, event.data.initialBalance);
            break;
          case 'Deposit':
            const currentBalance = this.balances.get(accountId) || 0;
            this.balances.set(accountId, currentBalance + event.data.amount);
            break;
          case 'Withdrawal':
            const balance = this.balances.get(accountId) || 0;
            this.balances.set(accountId, balance - event.data.amount);
            break;
        }

        console.log(`Balance updated for ${accountId}: ${this.balances.get(accountId)}`);
      },
    });
  }

  getBalance(accountId: string): number {
    return this.balances.get(accountId) || 0;
  }
}
```

## Comparação: EventStoreDB vs Kafka

| Aspecto | EventStoreDB | Kafka |
|---------|--------------|-------|
| **Propósito** | Database de eventos | Plataforma de streaming |
| **Consultas** | Suporte nativo a streams | Necessita processamento adicional |
| **Projeções** | Built-in projections | Kafka Streams ou KSQL |
| **Escalabilidade** | Vertical | Horizontal |
| **Complexidade** | Mais simples | Mais complexo |
| **Uso típico** | Event sourcing puro | Event streaming + armazenamento |

## Exercícios

### Exercício 1: Configurar EventStoreDB
1. Instale EventStoreDB via Docker
2. Crie uma conexão simples
3. Implemente append e read de eventos

### Exercício 2: Implementar Ledger com Kafka
1. Configure Kafka localmente
2. Implemente producer para enviar eventos
3. Crie consumer para processar eventos
4. Implemente projeção de saldo

### Exercício 3: Comparar performance
1. Meça latência de append para cada solução
2. Compare throughput de leitura
3. Analise uso de recursos

## Próximos passos
- Na próxima aula, vamos mergulhar nos internals do Kafka
- Veremos partitions, consumer groups e rebalancing

## Material de referência
- [EventStoreDB Getting Started](https://developers.eventstore.com/getting-started/)
- [KafkaJS Documentation](https://kafka.js.org/)
- [Event Sourcing with Kafka](https://kafka.apache.org/documentation/#implementation)