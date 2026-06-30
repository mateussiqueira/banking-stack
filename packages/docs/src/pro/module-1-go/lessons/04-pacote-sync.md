# Aula 04: Pacote sync — Mutex, RWMutex, WaitGroup Avançado

**Duração:** 55 minutos
**Pré-requisitos:** Aulas 01-03
**Objetivo:** Dominar as primitivas de sincronização do Go para sistemas transacionais críticos.

---

## 📋 Objetivos de Aprendizagem

1. Usar Mutex para proteger dados compartilhados
2. Diferenciar Mutex de RWMutex
3. Implementar WaitGroup para operações complexas
4. Usar sync.Once para inicialização segura
5. Criar pool de conexões com sync.Pool

---

## 1. sync.Mutex

### O problema: Race Condition

```go
package main

import (
    "fmt"
    "sync"
)

func main() {
    balance := 0
    var wg sync.WaitGroup

    // 1000 goroutines incrementando
    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            balance++ // ⚠️ Não é atômico!
        }()
    }

    wg.Wait()
    fmt.Println("Balance:", balance) // Valor imprevisível!
}
```

### Solução: Mutex

```go
package main

import (
    "fmt"
    "sync"
)

func main() {
    balance := 0
    var mu sync.Mutex
    var wg sync.WaitGroup

    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            mu.Lock()   // Bloquear acesso
            balance++   // Operação segura
            mu.Unlock() // Liberar acesso
        }()
    }

    wg.Wait()
    fmt.Println("Balance:", balance) // Sempre 1000
}
```

### Mutex com defer

```go
func transferir(from, to *Conta, valor float64) error {
    from.mu.Lock()
    defer from.mu.Unlock() // Sempre liberar!
    
    if from.saldo < valor {
        return fmt.Errorf("saldo insuficiente")
    }
    
    to.mu.Lock()
    defer to.mu.Unlock()
    
    from.saldo -= valor
    to.saldo += valor
    return nil
}
```

---

## 2. sync.RWMutex

### Mutex vs RWMutex

| Operação | Mutex | RWMutex |
|----------|-------|---------|
| Leitura | Bloqueia tudo | Permite múltiplas |
| Escrita | Bloqueia tudo | Bloqueia tudo |

### Quando usar RWMutex

```go
type Cache struct {
    mu   sync.RWMutex
    data map[string]string
}

// Leitura (múltiplas simultâneas)
func (c *Cache) Get(key string) (string, bool) {
    c.mu.RLock()         // Read Lock
    defer c.mu.RUnlock() // Read Unlock
    
    val, ok := c.data[key]
    return val, ok
}

// Escrita (exclusiva)
func (c *Cache) Set(key, value string) {
    c.mu.Lock()         // Write Lock
    defer c.mu.Unlock() // Write Unlock
    
    c.data[key] = value
}
```

### Performance

```
100 leitores + 1 escritor:

Mutex:     ~500ms (tudo serializado)
RWMutex:   ~50ms  (leitores paralelos)
Speedup:   10x
```

---

## 3. sync.WaitGroup Avançado

### Padrão: Worker Pool com WaitGroup

```go
func processarEmParalelo(items []Item) []Resultado {
    var wg sync.WaitGroup
    resultados := make([]Resultado, len(items))
    
    for i, item := range items {
        wg.Add(1)
        go func(i int, item Item) {
            defer wg.Done()
            resultados[i] = processar(item)
        }(i, item)
    }
    
    wg.Wait()
    return resultados
}
```

### Padrão: WaitGroup com timeout

```go
func comTimeout(duracao time.Duration) error {
    var wg sync.WaitGroup
    done := make(chan struct{})
    
    wg.Add(1)
    go func() {
        defer wg.Done()
        trabalhoPesado()
        close(done)
    }()
    
    select {
    case <-done:
        return nil
    case <-time.After(duracao):
        return fmt.Errorf("timeout")
    }
}
```

---

## 4. sync.Once

### Inicialização segura

```go
var (
    instance *Database
    once     sync.Once
)

func GetDatabase() *Database {
    once.Do(func() {
        // Executa UMA vez, mesmo em concorrência
        instance = connectDatabase()
    })
    return instance
}
```

### Exemplo: Singleton de configuração

```go
type Config struct {
    DSN string
}

var (
    config *Config
    once   sync.Once
)

func GetConfig() *Config {
    once.Do(func() {
        config = &Config{
            DSN: os.Getenv("DATABASE_URL"),
        }
    })
    return config
}
```

---

## 5. sync.Pool

### Pool de objetos (reutilização)

```go
var bufferPool = sync.Pool{
    New: func() interface{} {
        return new(bytes.Buffer)
    },
}

func processar(dados []byte) string {
    buf := bufferPool.Get().(*bytes.Buffer)
    buf.Reset()
    defer bufferPool.Put(buf)
    
    buf.Write(dados)
    return buf.String()
}
```

### Quando usar

| Caso | Uso |
|------|-----|
| Buffers de bytes | Reutilizar buffers de I/O |
| Conexões | Pool de conexões de banco |
| Structs grandes | Evitar allocações repetidas |

---

## 6. Exercício Prático: Conta Bancária Segura

### Objetivo

Implementar uma conta bancária com:
- Saque/Depósito seguro (Mutex)
- Leitura de saldo (RWMutex)
- Transferência atômica

### Solução

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

type Conta struct {
    mu      sync.RWMutex
    nome    string
    saldo   float64
    historico []string
}

func NovaConta(nome string, saldoInicial float64) *Conta {
    return &Conta{
        nome:  nome,
        saldo: saldoInicial,
    }
}

func (c *Conta) Depositar(valor float64) {
    c.mu.Lock()
    defer c.mu.Unlock()
    
    c.saldo += valor
    c.historico = append(c.historico, 
        fmt.Sprintf("+R$ %.2f (depósito)", valor))
}

func (c *Conta) Sacar(valor float64) error {
    c.mu.Lock()
    defer c.mu.Unlock()
    
    if c.saldo < valor {
        return fmt.Errorf("saldo insuficiente: R$ %.2f", c.saldo)
    }
    
    c.saldo -= valor
    c.historico = append(c.historico, 
        fmt.Sprintf("-R$ %.2f (saque)", valor))
    return nil
}

func (c *Conta) VerSaldo() float64 {
    c.mu.RLock()
    defer c.mu.RUnlock()
    return c.saldo
}

func (c *Conta) Transferir(destino *Conta, valor float64) error {
    // Ordem fixa de locks (evitar deadlock)
    if c.nome < destino.nome {
        c.mu.Lock()
        defer c.mu.Unlock()
        destino.mu.Lock()
        defer destino.mu.Unlock()
    } else {
        destino.mu.Lock()
        defer destino.mu.Unlock()
        c.mu.Lock()
        defer c.mu.Unlock()
    }
    
    if c.saldo < valor {
        return fmt.Errorf("saldo insuficiente")
    }
    
    c.saldo -= valor
    destino.saldo += valor
    
    c.historico = append(c.historico, 
        fmt.Sprintf("-R$ %.2f (transferência p/ %s)", valor, destino.nome))
    destino.historico = append(destino.historico, 
        fmt.Sprintf("+R$ %.2f (transferência d/ %s)", valor, c.nome))
    
    return nil
}

func main() {
    alice := NovaConta("Alice", 1000)
    bob := NovaConta("Bob", 500)
    
    var wg sync.WaitGroup
    
    // Simular múltiplas operações
    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func(i int) {
            defer wg.Done()
            alice.Depositar(100)
            bob.Sacar(50)
        }(i)
    }
    
    for i := 0; i < 5; i++ {
        wg.Add(1)
        go func(i int) {
            defer wg.Done()
            alice.Transferir(bob, 200)
        }(i)
    }
    
    wg.Wait()
    
    fmt.Printf("Alice: R$ %.2f\n", alice.VerSaldo())
    fmt.Printf("Bob: R$ %.2f\n", bob.VerSaldo())
}
```

---

## 7. Resumo

| Tipo | Uso | Exemplo |
|------|-----|---------|
| `Mutex` | Exclusão mútua total | Atualizar saldo |
| `RWMutex` | Múltiplas leituras | Ler saldo |
| `WaitGroup` | Aguardar goroutines | Processamento paralelo |
| `Once` | Inicialização segura | Singleton |
| `Pool` | Reutilização de objetos | Buffer pool |

### Erros comuns

| Erro | Consequência | Solução |
|------|--------------|---------|
| Lock sem Unlock | Deadlock | Usar `defer` |
| Ordem variável de locks | Deadpadlock | Ordem fixa |
| RWMutex para escritas frequentes | Overhead | Usar Mutex |

---

**Exercício:** **Exercicio:** bank-account/
