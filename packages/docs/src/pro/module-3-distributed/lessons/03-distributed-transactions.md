# Modulo 3 — Sistemas Distribuidos para Fintechs
## Aula 03: Distributed Transactions — 2PC, Saga, Outbox Pattern

**Duracao:** 45 min  
**Nivel:** Avancado

### Objetivos
- Comparar Two-Phase Commit (2PC) e Saga pattern para transacoes distribuidas
- Implementar Outbox Pattern para garantia de publicacao de eventos
- Projetar fluxos cross-service com consistencia eventual

### Teoria

Em arquiteturas de microservicos, uma operacao de pagamento atravessa multiplos servicos: autorizacao, antifraude, liquidacao, notificacao. Garantir atomicidade nesse cenario e o desafio central das transacoes distribuidas.

**Two-Phase Commit (2PC):** Um coordenador pergunta a todos os participantes se podem commitar (prepare phase). Se todos responderem "sim", envia commit. Caso contrario, abort. 2PC garante ACID global, mas o coordenador e ponto unico de falha e o protocolo e bloqueante — se o coordenador cai apos prepare, os participantes ficam com locks pendentes.

2PC e viavel em sistemas bancarios *internos* com baixa latencia (ex: dentro do mesmo datacenter), usando PostgreSQL com foreign data wrappers ou CockroachDB com transacoes distribuidas nativas.

**Saga Pattern:** Alternativa a 2PC para sistemas de longa duracao ou cross-organization. Cada passo da transacao tem uma operacao compensatoria. Se o passo N falha, executa-se o rollback do passo N-1, N-2... via compensacao.

```go
type SagaStep struct {
    Action       func(ctx context.Context) error
    Compensation func(ctx context.Context) error
}

func ExecuteSaga(ctx context.Context, steps []SagaStep) error {
    completed := make([]int, 0)

    for i, step := range steps {
        if err := step.Action(ctx); err != nil {
            // Compensacao reversa
            for j := len(completed) - 1; j >= 0; j-- {
                _ = steps[completed[j]].Compensation(ctx)
            }
            return fmt.Errorf("saga failed at step %d: %w", i, err)
        }
        completed = append(completed, i)
    }
    return nil
}
```

Exemplo de Saga de pagamento:
1. Reservar saldo (compensacao: liberar saldo)
2. Validar antifraude (compensacao: liberar saldo)
3. Liquidar via SPI (compensacao: estornar liquidacao)
4. Enviar notificacao (compensacao: nada, notificacao e informativa)

**Outbox Pattern:** Em sistemas orientados a eventos, o maior risco e "commit no banco mas evento nao publicado" (dual-write problem). O Outbox resolve: a transacao escreve na tabela `outbox` atomicamente com o dado de negocio, e um processo separado le a outbox e publica no Kafka/RabbitMQ.

```go
func ProcessPayment(ctx context.Context, payment Payment) error {
    tx, _ := db.Begin(ctx)

    // Atualiza saldo + insere outbox atomicamente
    tx.Exec("UPDATE accounts SET balance = balance - $1 WHERE id = $2",
        payment.Amount, payment.FromAccount)
    tx.Exec("INSERT INTO outbox (aggregate_id, event_type, payload) VALUES ($1, $2, $3)",
        payment.ID, "PaymentProcessed", payment.ToJSON())

    return tx.Commit()
}

// Worker separado le outbox e publica
func OutboxPublisher() {
    rows, _ := db.Query("SELECT * FROM outbox ORDER BY id LIMIT 100")
    for rows.Next() {
        var event OutboxEvent
        rows.Scan(&event)
        kafka.Publish(event.EventType, event.Payload)
        db.Exec("DELETE FROM outbox WHERE id = $1", event.ID)
    }
}
```

### Exercicio

Crie uma Saga de 3 passos para pagamento cross-border: (1) conversao cambial, (2) liquidacao via SWIFT simulado, (3) notificacao ao remetente. Implemente cada step com sua compensacao. Adicione tabela `outbox` para que a liquidacao publique evento `CrossBorderSettled` atomicamente.

### Proximo
[04-message-queues.md](04-message-queues.md)
