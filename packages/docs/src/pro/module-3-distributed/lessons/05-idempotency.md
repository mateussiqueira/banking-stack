# Modulo 3 — Sistemas Distribuidos para Fintechs
## Aula 05: Idempotency Keys, Deduplication, and Distributed Idempotency

**Duracao:** 45 min  
**Nivel:** Avancado

### Objetivos
- Entender o conceito de idempotencia em APIs financeiras
- Implementar idempotency keys com deduplicacao
- Escalar deduplicacao com Redis em arquitetura distribuida

### Teoria

Idempotencia e a propriedade pela qual multiplas execucoes identicas produzem o mesmo resultado que uma unica execucao. Em APIs financeiras, e a diferenca entre cobrar um cliente uma vez ou cobra-lo 5 vezes porque o client-side retry foi acionado.

A RFC da IETF para HTTP idempotency keys (`Idempotency-Key`) define que o cliente gera uma chave unica (UUID v4), envia no header, e o servidor garante que requisicoes com a mesma chave retornam o resultado da primeira execucao — sem re-executar efeitos colaterais.

**Implementacao com banco de dados:**

```go
func HandlePIXPayment(w http.ResponseWriter, r *http.Request) {
    idempotencyKey := r.Header.Get("Idempotency-Key")
    if idempotencyKey == "" {
        http.Error(w, "missing idempotency key", 400)
        return
    }

    var payment PIXRequest
    json.NewDecoder(r.Body).Decode(&payment)

    // Tenta inserir chave — unique constraint garante atomically
    result, err := db.Exec(
        `INSERT INTO idempotency_keys (key, response, expires_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (key) DO NOTHING`,
        idempotencyKey, "", time.Now().Add(24*time.Hour))

    if err != nil || result.RowsAffected() == 0 {
        // Chave ja existe — retorna resposta armazenada
        var storedResponse string
        db.QueryRow("SELECT response FROM idempotency_keys WHERE key = $1",
            idempotencyKey).Scan(&storedResponse)
        w.Header().Set("Idempotent-Replayed", "true")
        w.Write([]byte(storedResponse))
        return
    }

    // Executa pagamento
    response := executePayment(payment)

    // Armazena resposta para replays futuros
    db.Exec("UPDATE idempotency_keys SET response = $1 WHERE key = $2",
        response.ToJSON(), idempotencyKey)

    w.Write([]byte(response.ToJSON()))
}
```

**Distributed idempotency com Redis:** Em sistemas com multiplas instancias, a condicao de corrida persiste — duas requisicoes podem passar pela verificacao de chave simultaneamente. Redis resolve com `SET NX` atomico:

```go
func AcquireIdempotencyKey(ctx context.Context, key string) (bool, error) {
    // SET NX e atomico no Redis — retorna OK apenas se key nao existe
    result := redisClient.SetNX(ctx, "idem:"+key, "LOCKED", 24*time.Hour)
    return result.Val(), result.Err()
}
```

**Estrategia de fallback:** Se o Redis estiver indisponivel, o sistema pode degradar para o banco relacional com unique constraint. A latencia aumenta, mas a garantia de idempotencia se mantem — essencial em sistemas de pagamento.

```go
func IdempotentOperation(ctx context.Context, key string, fn func() error) error {
    acquired, _ := AcquireIdempotencyKey(ctx, key)
    if !acquired {
        return ErrDuplicateRequest
    }
    return fn()
}
```

**TTL e garbage collection:** Chaves de idempotencia tem TTL (24-72 horas tipicamente). Apos isso, o replay nao e mais garantido — cabe ao cliente regenerar chave. Processos de GC limpam chaves expiradas periodicamente.

### Exercicio

Implemente um middleware HTTP em Go que: (1) extrai `Idempotency-Key` do header, (2) verifica Redis com `SetNX`, (3) se chave ja existe, retorna `409 Conflict` com body armazenado, (4) se nova, prossegue e armazena resposta com TTL de 1 hora. Teste com duas requisicoes simultaneas (goroutines) e confirme que apenas uma persiste.

### Proximo
[06-circuit-breaker.md](06-circuit-breaker.md)
