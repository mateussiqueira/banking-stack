# Modulo 3 — Sistemas Distribuidos para Fintechs
## Aula 04: Kafka for Event Streaming and Exactly-Once Semantics

**Duracao:** 45 min  
**Nivel:** Avancado

### Objetivos
- Dominar o modelo de publish/subscribe do Apache Kafka
- Configurar Dead Letter Queues (DLQ) para mensagens problematicas
- Implementar exactly-once semantics com transacoes Kafka

### Teoria

Apache Kafka e o backbone de event streaming em fintechs modernas. Diferente de filas tradicionais (RabbitMQ, SQS), Kafka e um log distribuido imutavel. Mensagens persistem por configuracao (retencao de 7 dias, por exemplo), permitindo replay de eventos e auditoria completa — requisito regulatorio em bancos.

**Particionamento:** Cada topico Kafka divide-se em partitions. Mensagens com a mesma chave (ex: `account_id`) vao para a mesma partition, garantindo ordenacao. Para PIX, cada conta ter vincula-se a uma partition especifica, assegurando que operacoes na mesma conta sejam processadas em ordem.

**Consumer Groups:** Consumidores organizam-se em grupos. Cada partition e atribuida a exatamente um consumidor dentro do grupo. Se um consumidor cai, o grupo rebalanceia — partitions sao redistribuidas. Isso da resiliencia horizontal.

```go
// Producer com idempotencia habilitada
func NewPaymentProducer() sarama.AsyncProducer {
    config := sarama.NewConfig()
    config.Producer.RequiredAcks = sarama.WaitForAll // quorum ISR
    config.Producer.Idempotent = true                 // exactly-once
    config.Producer.Transaction.ID = "payment-service"
    config.Net.MaxOpenRequests = 1

    producer, _ := sarama.NewAsyncProducer(
        []string{"kafka-broker-1:9092", "kafka-broker-2:9092"}, config)
    return producer
}
```

**Exactly-Once Semantics (EOS):** Kafka suporta transacoes entre topicos — ou atomically publica em N topicos ou em nenhum. O producer inicia uma transacao, publica mensagens, e commita. Internamente, Kafka usa um *transaction coordinator* similar ao 2PC.

```go
func PublishPaymentTx(ctx context.Context, payment Payment) error {
    producer.BeginTxn()
    producer.Input() <- &sarama.ProducerMessage{
        Topic: "payments.raw", Key: payment.AccountID, Value: payment.Bytes(),
    }
    producer.Input() <- &sarama.ProducerMessage{
        Topic: "payments.audit", Key: payment.TraceID, Value: payment.AuditBytes(),
    }
    return producer.CommitTxn()
}
```

**Dead Letter Queue (DLQ):** Mensagens que falham repetidamente (schema invalido, conta inexistente) nao podem bloquear a partition. Apos N retries, a mensagem vai para um topico DLQ (`payments.dlq`) onde um operador ou processo de reconciliacao investiga manualmente.

```go
func ConsumePayment(msg *sarama.ConsumerMessage) error {
    var payment Payment
    if err := json.Unmarshal(msg.Value, &payment); err != nil {
        // Poison pill — vai pra DLQ
        dlqProducer.Send("payments.dlq", msg.Value)
        return nil // nao retorna erro, evita loop
    }
    return processPayment(payment)
}
```

**Offset management:** Consumidores devem commit offsets apos processar — nunca antes. Em falhas, consumer retoma do ultimo offset commitado. Para exactly-once consumption, usa-se `ReadCommitted` isolation: mensagens de transacoes abortadas sao ignoradas.

### Exercicio

Crie um producer Kafka que publica transacoes PIX em dois topicos atomicamente (`pix.settled` e `pix.audit`) usando transacoes Kafka. Configure um consumer group de 3 instancias que processa `pix.settled` e, apos 5 falhas de desserializacao, envia para `pix.dlq`. Simule propositalmente uma mensagem malformada para validar o DLQ.

### Proximo
[05-idempotency.md](05-idempotency.md)
