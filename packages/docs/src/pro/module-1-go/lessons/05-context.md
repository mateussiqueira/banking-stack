# Aula 05: Context — Cancelamento e Timeout em Go

**Duração:** 40 minutos
**Pré-requisitos:** Aulas 01-04
**Objetivo:** Usar context para gerenciar lifecycle de requisições e timeouts em sistemas financeiros.

---

## 📋 Objetivos de Aprendizagem

1. Entender por que context existe
2. Criar context com cancelamento
3. Implementar timeouts
4. Passar valores via context
5. Usar context em HTTP handlers

---

## 1. O Problema que Context Resolve

### Sem context

```go
func buscarTransacao(id string) (*Transacao, error) {
    // E se o usuário cancelar a requisição?
    // E se o banco de dados demorar 30 segundos?
    // E se precisarmos abortar após 5 segundos?
    
    result, err := db.Query("SELECT * FROM transacoes WHERE id = ?", id)
    // ... continuar mesmo se ninguém mais quer o resultado
}
```

### Com context

```go
func buscarTransacao(ctx context.Context, id string) (*Transacao, error) {
    select {
    case <-ctx.Done():
        return nil, ctx.Err() // Cancelado ou timeout
    default:
        // Continuar processamento
    }
    
    result, err := db.QueryContext(ctx, "SELECT * FROM transacoes WHERE id = ?", id)
    // Query automaticamente cancelada se ctx cancelado
}
```

---

## 2. Criando Contexts

### Context Background (raiz)

```go
ctx := context.Background() // Contexto vazio, nunca cancelado
```

### Context com cancelamento

```go
ctx, cancel := context.WithCancel(context.Background())
defer cancel() // SEMPRE chamar cancel()

// Em algum lugar...
go func() {
    time.Sleep(5 * time.Second)
    cancel() // Cancelar após 5 segundos
}()

// Usar ctx
<-ctx.Done()
fmt.Println("Cancelado:", ctx.Err()) // context canceled
```

### Context com timeout

```go
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

result, err := buscarTransacao(ctx, "123")
if err != nil {
    if ctx.Err() == context.DeadlineExceeded {
        fmt.Println("Timeout!")
    }
}
```

### Context com deadline

```go
deadline := time.Now().Add(5 * time.Second)
ctx, cancel := context.WithDeadline(context.Background(), deadline)
defer cancel()
```

---

## 3. Passando Context

### Regra: context é o primeiro parâmetro

```go
// CORRETO
func processar(ctx context.Context, id string) error {
    // ...
}

// ERRADO
func processar(id string, ctx context.Context) error {
    // ...
}
```

### Exemplo completo

```go
package main

import (
    "context"
    "fmt"
    "math/rand"
    "time"
)

type Transacao struct {
    ID     string
    Valor  float64
    Status string
}

func buscarTransacao(ctx context.Context, id string) (*Transacao, error) {
    // Simular latência de rede
    duracao := time.Duration(100+rand.Intn(400)) * time.Millisecond
    
    select {
    case <-time.After(duracao):
        return &Transacao{
            ID:     id,
            Valor:  100.0,
            Status: "FOUND",
        }, nil
    case <-ctx.Done():
        return nil, ctx.Err()
    }
}

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
    defer cancel()
    
    tx, err := buscarTransacao(ctx, "TX-001")
    if err != nil {
        fmt.Printf("Erro: %v\n", err)
        return
    }
    
    fmt.Printf("Transação: %+v\n", tx)
}
```

---

## 4. Context em HTTP Handlers

### Padrão padrão

```go
func handleTransferencia(w http.ResponseWriter, r *http.Request) {
    // context da requisição HTTP
    ctx := r.Context()
    
    // Timeout para operação de banco
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()
    
    // Buscar conta (cancela se timeout)
    conta, err := db.BuscarConta(ctx, "123")
    if err != nil {
        if ctx.Err() == context.DeadlineExceeded {
            http.Error(w, "Timeout", http.StatusGatewayTimeout)
            return
        }
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    // Processar (também cancela se timeout)
    resultado, err := processarTransferencia(ctx, conta, 100)
    // ...
}
```

---

## 5. Valores no Context

### Armazenar valores

```go
type contextKey string

const (
    keyRequestID contextKey = "requestID"
    keyUserID    contextKey = "userID"
)

// Armazenar
ctx = context.WithValue(ctx, keyRequestID, "req-123")

// Recuperar
requestID := ctx.Value(keyRequestID).(string)
```

### Quando usar

| Uso | Recomendado |
|-----|-------------|
| Request ID | ✅ Sim |
| User ID | ✅ Sim |
| Database connection | ❌ Não (usar parâmetro) |
| Configuração | ❌ Não (usar global/dependency) |

---

## 6. Padrões Avançados

### Padrão: Cascata de cancelamento

```go
func processarPedido(ctx context.Context, pedidoID string) error {
    ctx, cancel := context.WithCancel(ctx)
    defer cancel()
    
    // Filhos herdam cancelamento do pai
    ctx1, _ := context.WithTimeout(ctx, 2*time.Second)
    ctx2, _ := context.WithTimeout(ctx, 3*time.Second)
    
    // Se ctx cancelado, todos filhos cancelam
    go func() { buscarEstoque(ctx1, pedidoID) }()
    go func() { validarPagamento(ctx2, pedidoID) }()
    
    // ...
}
```

### Padrão: Worker com cancelamento

```go
func worker(ctx context.Context, id int, jobs <-chan Job) {
    for {
        select {
        case <-ctx.Done():
            fmt.Printf("Worker %d: cancelado\n", id)
            return
        case job, ok := <-jobs:
            if !ok {
                return
            }
            processar(ctx, job)
        }
    }
}

func main() {
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()
    
    jobs := make(chan Job, 100)
    
    // Iniciar workers
    for i := 0; i < 5; i++ {
        go worker(ctx, i, jobs)
    }
    
    // Enviar jobs
    for _, job := range trabalhos {
        jobs <- job
    }
    
    // Cancelar após 10 segundos
    time.AfterFunc(10*time.Second, cancel)
    
    // ...
}
```

---

## 7. Exercício Prático: Consulta SPI com Timeout

### Objetivo

Criar uma consulta SPI que:
1. Tenha timeout de 3 segundos
2. Retorne erro se exceder
3. Use context para cancelar operações

### Solução

```go
package main

import (
    "context"
    "fmt"
    "math/rand"
    "time"
)

type TransacaoSPI struct {
    EndToEndID  string
    Valor       float64
    Status      string
    Processado  bool
}

func consultarSPI(ctx context.Context, endToEndID string) (*TransacaoSPI, error) {
    fmt.Printf("Consultando SPI: %s...\n", endToEndID)
    
    // Simular 3 etapas de processamento
    etapas := []string{"Conectando", "Buscando dados", "Processando"}
    
    for i, etapa := range etapas {
        select {
        case <-ctx.Done():
            return nil, fmt.Errorf("cancelado durante '%s': %w", etapa, ctx.Err())
        case <-time.After(time.Duration(500+rand.Intn(1000)) * time.Millisecond):
            fmt.Printf("  Etapa %d/%d: %s ✓\n", i+1, len(etapas), etapa)
        }
    }
    
    return &TransacaoSPI{
        EndToEndID: endToEndID,
        Valor:      250.00,
        Status:     "SETTLED",
        Processado: true,
    }, nil
}

func main() {
    rand.Seed(time.Now().UnixNano())
    
    fmt.Println("=== Consulta SPI com Timeout ===\n")
    
    // Criar context com timeout de 3 segundos
    ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
    defer cancel()
    
    // Executar consulta
    start := time.Now()
    resultado, err := consultarSPI(ctx, "E2E20240101120000TEST")
    
    if err != nil {
        fmt.Printf("\n❌ Erro: %v\n", err)
        fmt.Printf("Tempo: %v\n", time.Since(start))
        return
    }
    
    fmt.Printf("\n✅ Resultado: %+v\n", resultado)
    fmt.Printf("Tempo: %v\n", time.Since(start))
}
```

---

## 8. Resumo

| Função | Uso |
|--------|-----|
| `context.Background()` | Contexto raiz |
| `context.WithCancel()` | Cancelamento manual |
| `context.WithTimeout()` | Timeout automático |
| `context.WithDeadline()` | Deadline específica |
| `context.WithValue()` | Armazenar valores |
| `ctx.Done()` | Canal de cancelamento |
| `ctx.Err()` | Motivo do cancelamento |

### Boas práticas

1. **Sempre passar context como primeiro parâmetro**
2. **Sempre chamar `defer cancel()`**
3. **Não armazenar context em structs**
4. **Não passar nil como context**

---

**Exercício:** **Exercicio:** timeout-spi/
