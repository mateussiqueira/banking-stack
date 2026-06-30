# Modulo 3 — Sistemas Distribuidos para Fintechs
## Aula 06: Circuit Breaker, Retry, and Bulkhead Patterns for SPI Integrations

**Duracao:** 45 min  
**Nivel:** Avancado

### Objetivos
- Implementar circuit breaker para chamadas a sistemas externos (SPI, DICT)
- Configurar retry policies com backoff exponencial e jitter
- Aplicar bulkhead para isolar falhas entre componentes

### Teoria

Integracoes com sistemas externos — SPI (Sistema de Pagamentos Instantaneos), DICT (Diretorio de Identificadores Transacionais), CIP, STR — sao inevitaveis em fintechs brasileiras. Esses sistemas podem ficar indisponiveis, lentos ou retornar erros transientes. Os padroes circuit breaker, retry e bulkhead protegem o sistema contra falhas em cascata.

**Circuit Breaker:** Inspirado em disjuntores eletricos, o padrao monitora chamadas a um servico externo. Estados:
- **Closed:** chamadas fluem normalmente
- **Open:** apos N falhas consecutivas, o circuito abre e chamadas sao rejeitadas imediatamente (fail fast), sem sobrecarregar o servico degradado
- **Half-Open:** apos timeout, uma chamada de teste e permitida; se bem-sucedida, volta para closed; se falhar, permanece open

```go
type CircuitBreaker struct {
    State           State // Closed, Open, HalfOpen
    FailureCount    int
    FailureThreshold int   // ex: 5 falhas
    ResetTimeout    time.Duration // ex: 30s
    LastFailure     time.Time
    mu              sync.Mutex
}

func (cb *CircuitBreaker) Call(fn func() error) error {
    cb.mu.Lock()

    switch cb.State {
    case Open:
        if time.Since(cb.LastFailure) > cb.ResetTimeout {
            cb.State = HalfOpen
        } else {
            cb.mu.Unlock()
            return ErrCircuitOpen
        }
    case HalfOpen:
        cb.mu.Unlock()
        err := fn()
        cb.mu.Lock()
        if err != nil {
            cb.State = Open
            cb.LastFailure = time.Now()
        } else {
            cb.State = Closed
            cb.FailureCount = 0
        }
        cb.mu.Unlock()
        return err
    }

    cb.mu.Unlock()
    err := fn()
    cb.mu.Lock()
    if err != nil {
        cb.FailureCount++
        if cb.FailureCount >= cb.FailureThreshold {
            cb.State = Open
            cb.LastFailure = time.Now()
        }
    } else {
        cb.FailureCount = 0
    }
    cb.mu.Unlock()
    return err
}
```

**Retry com Backoff Exponencial:** Nem todo erro justifica circuit breaker. Erros transientes (timeout, rate limit) merecem retry com backoff. O jitter (randomizacao) evita thundering herd — multiplos clients retentando simultaneamente.

```go
func RetryWithBackoff(fn func() error, maxRetries int) error {
    base := 100 * time.Millisecond
    for i := 0; i < maxRetries; i++ {
        if err := fn(); err == nil {
            return nil
        }
        // Exponential backoff com jitter
        backoff := base * time.Duration(1<<i)
        jitter := time.Duration(rand.Int63n(int64(backoff / 2)))
        time.Sleep(backoff + jitter)
    }
    return ErrMaxRetriesExceeded
}
```

**Bulkhead Pattern:** Inspirado em compartimentos estanques de navios, o bulkhead isola recursos. Cada integracao (SPI, DICT, antifraude) recebe seu proprio pool de threads/conexoes. Se o DICT ficar lento, as chamadas SPI nao sao afetadas.

```go
type Bulkhead struct {
    semaphore chan struct{}
}

func NewBulkhead(maxConcurrent int) *Bulkhead {
    return &Bulkhead{semaphore: make(chan struct{}, maxConcurrent)}
}

func (b *Bulkhead) Execute(fn func() error) error {
    select {
    case b.semaphore <- struct{}{}:
        defer func() { <-b.semaphore }()
        return fn()
    default:
        return ErrBulkheadFull
    }
}
```

### Exercicio

Implemente um wrapper `SafeSPICall()` que combina circuit breaker (5 falhas, 30s reset), retry com backoff exponencial (max 3 tentativas) e bulkhead (max 10 concorrentes). Teste com o servico SPI simulado que falha aleatoriamente 50% das vezes e confirme que o sistema nao propaga falhas para o restante da aplicacao.

### Proximo
[07-sharding.md](07-sharding.md)
