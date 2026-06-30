# Aula 27: Schema Registry e Avro/Protobuf

**Duração:** 45 minutos

## Objetivos
- Entender a importância de schemas em sistemas distribuídos
- Configurar Schema Registry para evolução de schemas
- Comparar Avro e Protobuf para serialização
- Implementar compatibilidade backward e forward

## Tópicos
1. **Schema Evolution**: Evolução segura de schemas
2. **Backward/Forward Compatibility**: Compatibilidade entre versões
3. **Avro vs Protobuf**: Escolhendo formato de serialização
4. **Schema Registry**: Gerenciamento centralizado de schemas

## Caso de uso: Definir schema para pagamento
Em sistemas financeiros, a estrutura dos dados muda ao longo do tempo. Precisamos garantir que novos e antigos consumidores possam trabalhar com os mesmos dados.

## Por que Schemas?

### Problemas sem schemas
- Consumidores quebram quando produtores mudam formato
- Dados corrompidos entre versões
- Difícil evoluir sistemas distribuídos

### Solução: Schema Registry
- Centraliza definição de schemas
- Valida compatibilidade automaticamente
- Permite evolução segura

## Configuração do Schema Registry

### 1. Setup com Confluent Schema Registry
```yaml
# docker-compose.yml
version: '3'
services:
  schema-registry:
    image: confluentinc/cp-schema-registry:7.4.0
    hostname: schema-registry
    container_name: schema-registry
    depends_on:
      - kafka
    ports:
      - "8081:8081"
    environment:
      SCHEMA_REGISTRY_HOST_NAME: schema-registry
      SCHEMA_REGISTRY_KAFKASTORE_BOOTSTRAP_SERVERS: 'kafka:29092'
      SCHEMA_REGISTRY_LISTENERS: http://0.0.0.0:8081
```

### 2. Criando schema para pagamento
```json
{
  "type": "record",
  "name": "Payment",
  "namespace": "com.banking.payments",
  "fields": [
    {
      "name": "id",
      "type": "string",
      "doc": "Unique payment identifier"
    },
    {
      "name": "amount",
      "type": "double",
      "doc": "Payment amount"
    },
    {
      "name": "currency",
      "type": "string",
      "default": "BRL",
      "doc": "Currency code"
    },
    {
      "name": "status",
      "type": {
        "type": "enum",
        "name": "PaymentStatus",
        "symbols": ["PENDING", "COMPLETED", "FAILED", "REFUNDED"]
      },
      "doc": "Payment status"
    },
    {
      "name": "created_at",
      "type": "long",
      "doc": "Creation timestamp"
    }
  ]
}
```

### 3. Registrando schema
```typescript
import { SchemaRegistry, SchemaType } from '@kafkajs/confluent-schema-registry';

const registry = new SchemaRegistry({ host: 'http://localhost:8081' });

// Registrar schema Avro
const paymentSchema = {
  type: 'record',
  name: 'Payment',
  namespace: 'com.banking.payments',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'amount', type: 'double' },
    { name: 'currency', type: 'string', default: 'BRL' },
    { name: 'status', type: { type: 'enum', name: 'PaymentStatus', symbols: ['PENDING', 'COMPLETED', 'FAILED'] } },
    { name: 'created_at', type: 'long' },
  ],
};

const schemaId = await registry.register({
  schema: JSON.stringify(paymentSchema),
  type: SchemaType.AVRO,
});
```

## Avro vs Protobuf

### 1. Avro
```json
{
  "type": "record",
  "name": "Payment",
  "fields": [
    { "name": "id", "type": "string" },
    { "name": "amount", "type": "double" },
    { "name": "currency", "type": "string", "default": "BRL" }
  ]
}
```

**Vantagens:**
- Schemas completos com metadados
- Suporte a evolução de schemas
- Integrado com Hadoop e Kafka

**Desvantagens:**
- Mais verboso
- Performance ligeiramente menor

### 2. Protobuf
```protobuf
syntax = "proto3";
package banking.payments;

message Payment {
  string id = 1;
  double amount = 2;
  string currency = 3;
  PaymentStatus status = 4;
  int64 created_at = 5;
}

enum PaymentStatus {
  PENDING = 0;
  COMPLETED = 1;
  FAILED = 2;
}
```

**Vantagens:**
- Mais compacto
- Melhor performance
- Suporte a múltiplas linguagens

**Desvantagens:**
- Menos metadados
- Compatibilidade mais restritiva

## Evolução de Schemas

### 1. Backward Compatibility
Consumidores antigos podem ler dados novos:
```json
// Schema v1
{
  "type": "record",
  "name": "Payment",
  "fields": [
    { "name": "id", "type": "string" },
    { "name": "amount", "type": "double" }
  ]
}

// Schema v2 (backward compatible - adiciona campo com default)
{
  "type": "record",
  "name": "Payment",
  "fields": [
    { "name": "id", "type": "string" },
    { "name": "amount", "type": "double" },
    { "name": "currency", "type": "string", "default": "BRL" }
  ]
}
```

### 2. Forward Compatibility
Consumidores novos podem ler dados antigos:
```json
// Schema v1
{
  "type": "record",
  "name": "Payment",
  "fields": [
    { "name": "id", "type": "string" },
    { "name": "amount", "type": "double" },
    { "name": "currency", "type": "string" }
  ]
}

// Schema v2 (forward compatible - torna campo opcional)
{
  "type": "record",
  "name": "Payment",
  "fields": [
    { "name": "id", "type": "string" },
    { "name": "amount", "type": "double" },
    { "name": "currency", "type": ["null", "string"], "default": null }
  ]
}
```

### 3. Full Compatibility
Backward e forward compatibility:
```json
// Schema v1
{
  "type": "record",
  "name": "Payment",
  "fields": [
    { "name": "id", "type": "string" },
    { "name": "amount", "type": "double" }
  ]
}

// Schema v2 (full compatible - adiciona campo com default)
{
  "type": "record",
  "name": "Payment",
  "fields": [
    { "name": "id", "type": "string" },
    { "name": "amount", "type": "double" },
    { "name": "description", "type": ["null", "string"], "default": null }
  ]
}
```

## Implementação Prática

### 1. Producer com Schema
```typescript
import { Kafka, SchemaRegistry, SchemaType } from 'kafkajs';
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';

const kafka = new Kafka({
  clientId: 'payment-producer',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();
const registry = new SchemaRegistry({ host: 'http://localhost:8081' });

async function sendPayment(payment: any): Promise<void> {
  // Registrar schema se não existir
  const schemaId = await registry.register({
    schema: JSON.stringify(paymentSchema),
    type: SchemaType.AVRO,
  });

  // Enviar mensagem com schema
  await producer.send({
    topic: 'payments',
    messages: [{
      key: payment.id,
      value: await registry.encode(schemaId, payment),
    }],
  });
}
```

### 2. Consumer com Schema
```typescript
const consumer = kafka.consumer({ groupId: 'payment-consumer' });

await consumer.subscribe({ topic: 'payments' });

await consumer.run({
  eachMessage: async ({ message }) => {
    // Decodificar mensagem com schema
    const payment = await registry.decode(message.value);
    
    console.log('Payment received:', payment);
    await processPayment(payment);
  },
});
```

### 3. Validação de compatibilidade
```typescript
// Verificar compatibilidade antes de registrar
async function checkCompatibility(
  newSchema: any,
  existingSchemaId: number
): Promise<boolean> {
  try {
    await registry.testCompatibility(existingSchemaId, newSchema);
    return true;
  } catch (error) {
    console.error('Schema not compatible:', error.message);
    return false;
  }
}
```

## Exercícios

### Exercício 1: Definir Schema de Pagamento
1. Crie schema Avro para pagamento com campos essenciais
2. Registre no Schema Registry
3. Teste com producer e consumer

### Exercício 2: Evoluir Schema
1. Adicione novo campo com valor default
2. Verifique backward compatibility
3. Atualize producer e consumer gradualmente

### Exercício 3: Comparar Avro e Protobuf
1. Implemente mesmo schema em Avro e Protobuf
2. Meça tamanho da serialização
3. Compare performance de encode/decode

## Próximos passos
- Módulo 4: Microserviços e Comunicação
- Padrões avançados de arquitetura

## Material de referência
- [Confluent Schema Registry](https://docs.confluent.io/platform/current/schema-registry/)
- [Apache Avro](https://avro.apache.org/docs/current/)
- [Protocol Buffers](https://developers.google.com/protocol-buffers)