# Modulo 3 — Sistemas Distribuidos para Fintechs
## Aula 09: Distributed Rate Limiting — Token Bucket and Sliding Window

**Duracao:** 45 min  
**Nivel:** Avancado

### Objetivos
- Implementar algoritmos de rate limiting: token bucket e sliding window
- Escalar rate limiting para sistemas distribuidos com Redis
- Proteger APIs financeiras contra abusos e garantir fair usage

### Teoria

Rate limiting e essencial em APIs financeiras para prevenir abusos, garantir fair usage entre tenants e proteger contra ataques de forca bruta em endpoints sensiveis (login, criacao de conta, pagamento). O Banco Central exige que instituicoes financeiras implementem controles de frequencia em APIs publicas.

**Fixed Window:** O algoritmo mais simples — conta requisicoes em janelas fixas (ex: 100 req/min). Porem permite bursts no limite da janela: um cliente pode fazer 100 requisicoes em 1 segundo, esperar 59 segundos, e fazer mais 100 — efetivamente 200 em um minuto sobreposto. Nao recomendado para fintechs.

**Sliding Window Log:** Registra timestamp de cada requisicao. Para verificar, conta quantas entradas estao dentro da janela atual. Preciso, mas custoso em memoria. Para 1M usuarios com janela de 1 min, seriam bilhoes de timestamps.

**Token Bucket:** O algoritmo ideal para fintechs. Um balde comeca com N tokens. Cada requisicao consome 1 token. Tokens sao reabastecidos a taxa fixa (ex: 10 tokens/s). Se o balde esta cheio, tokens excedentes sao descartados (nao acumula burst infinito).

```go
type TokenBucket struct {
    Capacity   float64   // tokens maximos
    Rate       float64   // tokens por segundo
    Tokens     float64   // tokens atuais
    LastRefill time.Time
    mu         sync.Mutex
}

func (tb *TokenBucket) Allow() bool {
    tb.mu.Lock()
    defer tb.mu.Unlock()

    // Refill proporcional ao tempo decorrido
    now := time.Now()
    elapsed := now.Sub(tb.LastRefill).Seconds()
    tb.Tokens += elapsed * tb.Rate
    if tb.Tokens > tb.Capacity {
        tb.Tokens = tb.Capacity
    }
    tb.LastRefill = now

    if tb.Tokens >= 1 {
        tb.Tokens--
        return true
    }
    return false
}
```

**Distributed Rate Limiting com Redis:** Em sistemas com multiplas instancias, o estado do bucket precisa ser compartilhado. Redis oferece operacoes atomicas via Lua scripting:

```lua
-- Lua script executado atomicamente no Redis
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local requested = tonumber(ARGV[4])

local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
local tokens = tonumber(bucket[1]) or capacity
local last_refill = tonumber(bucket[2]) or now

-- Refill proporcional
local elapsed = (now - last_refill) / 1000
tokens = math.min(capacity, tokens + elapsed * rate)

if tokens >= requested then
    tokens = tokens - requested
    redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
    redis.call('EXPIRE', key, 300) -- cleanup apos 5min
    return 1
end
return 0
```

**Rate limiting por escopo:** Diferentes limites para diferentes entidades:

```go
func RateLimitMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        clientID := r.Header.Get("X-Client-ID")
        userID := r.Context().Value("user_id").(string)

        // Rate limit global por client
        if !bucket.Allow(fmt.Sprintf("client:%s", clientID), 1000, 60) {
            http.Error(w, "rate limit exceeded", 429)
            return
        }

        // Rate limit por usuario
        if !bucket.Allow(fmt.Sprintf("user:%s", userID), 60, 60) {
            http.Error(w, "rate limit exceeded", 429)
            return
        }

        next.ServeHTTP(w, r)
    })
}
```

O header `Retry-After` informa ao cliente quando tentar novamente, essencial para integracoes B2B em APIs de pagamento.

### Exercicio

Implemente um rate limiter Redis usando o script Lua acima. Configure tres tiers: (1) 1000 req/min para instituicoes parceiras, (2) 100 req/min para usuarios finais, (3) 10 req/min para endpoints sensiveis (login). Escreva um teste de carga com 100 goroutines disparando 500 requisicoes cada e verifique que o rate limiter respeita os limites configurados.

### Proximo
[10-observability.md](10-observability.md)
