# Modulo 3 — Sistemas Distribuidos para Fintechs
## Aula 08: Redis Cache Strategies for Financial Systems

**Duracao:** 45 min  
**Nivel:** Avancado

### Objetivos
- Aplicar estrategias de cache: read-through, write-through, write-behind
- Implementar cache invalidation em sistemas financeiros
- Projetar caching seguro para dados sensiveis de pagamento

### Teoria

Cache reduz latencia e carga no banco de dados, mas em fintechs carrega um risco: dados desatualizados podem causar decisoes financeiras incorretas. A chave e escolher a estrategia certa para cada tipo de dado e nunca cachear saldos como fonte de verdade.

**Cache-Aside (Lazy Loading):** Padrao mais comum. A aplicacao verifica o cache primeiro; em caso de miss, busca no banco e popula o cache. Simples, porem propenso a cache stampede — quando o cache expira e multiplas requisicoes batem no banco simultaneamente.

```go
func GetAccountInfo(ctx context.Context, accountID string) (*AccountInfo, error) {
    cacheKey := fmt.Sprintf("account:info:%s", accountID)

    // Tenta cache primeiro
    val, err := redis.Get(ctx, cacheKey).Result()
    if err == nil {
        var acc AccountInfo
        json.Unmarshal([]byte(val), &acc)
        return &acc, nil
    }

    // Cache miss — busca no banco
    acc, err := db.QueryRow(
        "SELECT name, branch, type FROM accounts WHERE id = $1", accountID)
    if err != nil {
        return nil, err
    }

    // Popula cache com TTL curto (dados bancarios expiram rapido)
    data, _ := json.Marshal(acc)
    redis.Set(ctx, cacheKey, data, 5*time.Minute)

    return acc, nil
}
```

**Read-Through:** O cache atua como proxy — a aplicacao sempre consulta o cache, que busca no banco se necessario. Menos codigo na camada de negocio, mas adiciona latencia se implementado via RedisGears ou custom proxy.

**Write-Through:** Escrita vai para o cache primeiro, que sincroniza com o banco. Garante consistencia imediata, mas cada write e duas operacoes (cache + DB). Adequado para dados de configuracao (ex: tarifas de PIX por horario).

**Write-Behind (Write-Back):** Escrita vai para o cache, que persiste no banco assincronamente. Maxima performance, mas risco de perda de dados se o cache cair antes de sincronizar. **Nao recomendado para dados financeiros transacionais.**

**Cache Invalidation Strategies:**
- **TTL (Time-to-Live):** Simples e seguro — dados expiram automaticamente. Para dados bancarios: dados cadastrais 5 min, tarifas 1 hora, saldo nunca.
- **Event-driven invalidation:** Quando uma transacao altera o dado, publica evento `AccountUpdated` e listeners invalidam o cache. Mas cuidado: invalidacao nunca e instantanea, ha janela de inconsistencia.

```go
// Ingestor de eventos para invalidacao
func HandleAccountUpdatedEvent(msg *sarama.ConsumerMessage) {
    var event AccountUpdated
    json.Unmarshal(msg.Value, &event)

    // Invalida cache da conta afetada
    redis.Del(ctx, fmt.Sprintf("account:info:%s", event.AccountID))
    redis.Del(ctx, fmt.Sprintf("account:balance:%s", event.AccountID))
}
```

**Cache Stampede Protection:** Com `SET NX` no Redis, apenas a primeira requisicao popula o cache apos expiracao:

```go
func GetWithLock(ctx context.Context, key string) (string, error) {
    val, err := redis.Get(ctx, key).Result()
    if err == nil {
        return val, nil
    }

    // Tenta adquirir lock para recomputar
    lockKey := key + ":lock"
    acquired, _ := redis.SetNX(ctx, lockKey, "1", 10*time.Second).Result()
    if acquired {
        defer redis.Del(ctx, lockKey)
        data := fetchFromDB(key)
        redis.Set(ctx, key, data, 5*time.Minute)
        return data, nil
    }

    // Outra goroutine ja esta recomputando — espera
    time.Sleep(100 * time.Millisecond)
    return redis.Get(ctx, key).Result()
}
```

### Exercicio

Implemente cache de extrato com Redis usando read-through: (1) ao consultar extrato, verifica Redis com chave `extract:{account}:{month}`, (2) em miss, busca ultimas 50 transacoes do PostgreSQL, (3) popula cache com TTL de 10 min, (4) adiciona invalidacao por evento — quando `TransactionCreated` chega via Kafka, `DEL extract:{account}:current-month`. Prove que apos evento, proxima consulta busca dados frescos.

### Proximo
[09-rate-limiting.md](09-rate-limiting.md)
