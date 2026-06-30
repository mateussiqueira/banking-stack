# Aula 02: Goroutines — Concorrência Real vs Paralelismo

**Duração:** 60 minutos
**Pré-requisitos:** Aula 01
**Objetivo:** Entender goroutines e como processar milhares de transações simultaneamente.

---

## 📋 Objetivos de Aprendizagem

1. Diferenciar concorrência de paralelismo
2. Criar e gerenciar goroutines
3. Entender o scheduler do Go
4. Medir performance com benchmarks

---

## 1. Concorrência vs Paralelismo

### Analogia simples

| Conceito | Definição | Exemplo |
|----------|-----------|---------|
| **Concorrência** | Múltiplas tarefas avançando | 1 barbeiro atendendo 3 clientes (intercalando) |
| **Paralelismo** | Múltiplas tarefas ao mesmo tempo | 3 barbeiros atendendo 3 clientes |

### Na prática

```
CONCORRÊNCIA (1 core):
CPU: [===A===][===B===][===A===][===B===]
     ↑ troca de contexto

PARALELISMO (2 cores):
CPU 1: [===A===][===A===]
CPU 2: [===B===][===B===]
     ↑ executando ao mesmo tempo
```

### Go é concorrente E paralelo

- **Goroutines** = concorrência (cooperative scheduling)
- **GOMAXPROCS** = paralelismo (número de CPUs)
- Go usa ambas para máximo desempenho

---

## 2. Goroutines

### O que é uma goroutine?

Uma goroutine é uma thread leve gerenciada pelo runtime do Go:

| Característica | Thread OS | Goroutine |
|----------------|-----------|-----------|
| Memória | ~1MB | ~2KB |
| Criação | ~1ms | ~0.3ms |
| Troca de contexto | ~1μs | ~0.1μs |
| Limite prático | ~1000 | ~1.000.000 |

### Criando goroutines

```go
package main

import (
    "fmt"
    "time"
)

func processarTransacao(id int) {
    fmt.Printf("Iniciando transação %d\n", id)
    time.Sleep(100 * time.Millisecond) // Simular processamento
    fmt.Printf("Transação %d concluída\n", id)
}

func main() {
    // SEM goroutine (sequencial)
    start := time.Now()
    for i := 1; i <= 3; i++ {
        processarTransacao(i)
    }
    fmt.Printf("Sequencial: %v\n\n", time.Since(start))

    // COM goroutine (concorrente)
    start = time.Now()
    for i := 1; i <= 3; i++ {
        go processarTransacao(i) // 'go' cria goroutine
    }
    time.Sleep(500 * time.Millisecond) // Aguardar conclusão
    fmt.Printf("Concorrente: %v\n", time.Since(start))
}
```

### Saída esperada

```
Sequencial (~300ms):
Iniciando transação 1
Transação 1 concluída
Iniciando transação 2
Transação 2 concluída
Iniciando transação 3
Transação 3 concluída

Concorrente (~100ms):
Iniciando transação 1
Iniciando transação 2
Iniciando transação 3
Transação 1 concluída
Transação 2 concluída
Transação 3 concluída
```

---

## 3. Sincronização com WaitGroup

### O problema: goroutines "desaparecem"

```go
func main() {
    go fmt.Println("Oi") // Pode não executar!
    // Programa termina antes da goroutine
}
```

### Solução: sync.WaitGroup

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

func processarTransacao(id int, wg *sync.WaitGroup) {
    defer wg.Done() // Marca como concluída
    
    fmt.Printf("Processando transação %d...\n", id)
    time.Sleep(100 * time.Millisecond)
    fmt.Printf("Transação %d concluída\n", id)
}

func main() {
    var wg sync.WaitGroup
    
    transacoes := []int{1, 2, 3, 4, 5}
    
    for _, id := range transacoes {
        wg.Add(1) // Incrementar contador
        go processarTransacao(id, &wg)
    }
    
    wg.Wait() // Aguardar todas concluírem
    fmt.Println("Todas as transações processadas!")
}
```

### Fluxo do WaitGroup

```
wg.Add(1)    →  Contador: 1
wg.Add(1)    →  Contador: 2
wg.Done()    →  Contador: 1 (goroutine 1 terminou)
wg.Done()    →  Contador: 0 (libera Wait)
```

---

## 4. Exercício Prático: Processador de Transações SPI

### Objetivo

Criar um processador que execute múltiplas transações SPI simultaneamente.

### Requisitos

1. Criar função `processarTransacao` que:
   - Receba ID, valor, ISPB origem/destino
   - Simule processamento (sleep 50ms)
   - Retorne status (ACCEPTED/REJECTED)

2. Processar 10 transações concorrentemente

3. Medir tempo total vs sequencial

### Solução

```go
package main

import (
    "fmt"
    "math/rand"
    "sync"
    "time"
)

type TransacaoSPI struct {
    ID          int
    EndToEndID  string
    Valor       float64
    ISPBOrigem  string
    ISPBDestino string
    Status      string
}

func processarTransacao(tx *TransacaoSPI, wg *sync.WaitGroup) {
    defer wg.Done()
    
    // Simular processamento (latência de rede)
    time.Sleep(50 * time.Millisecond)
    
    // Simular rejeição aleatória (5%)
    if rand.Float64() < 0.05 {
        tx.Status = "REJECTED"
    } else {
        tx.Status = "ACCEPTED"
    }
}

func main() {
    rand.Seed(time.Now().UnixNano())
    
    // Criar 10 transações
    transacoes := make([]TransacaoSPI, 10)
    for i := range transacoes {
        transacoes[i] = TransacaoSPI{
            ID:          i + 1,
            EndToEndID:  fmt.Sprintf("E2E%d", time.Now().UnixNano()+int64(i)),
            Valor:       float64(rand.Intn(10000)) / 100,
            ISPBOrigem:  "00000000",
            ISPBDestino: "60701190",
        }
    }
    
    // Processar sequencialmente
    start := time.Now()
    for i := range transacoes {
        processarTransacao(&transacoes[i], &sync.WaitGroup{})
    }
    seqTime := time.Since(start)
    
    // Reset status
    for i := range transacoes {
        transacoes[i].Status = ""
    }
    
    // Processar concorrentemente
    var wg sync.WaitGroup
    start = time.Now()
    for i := range transacoes {
        wg.Add(1)
        go processarTransacao(&transacoes[i], &wg)
    }
    wg.Wait()
    concTime := time.Since(start)
    
    // Resultados
    fmt.Println("=== Resultados ===")
    for _, tx := range transacoes {
        fmt.Printf("Tx %d: R$ %.2f | %s → %s | %s\n",
            tx.ID, tx.Valor, tx.ISPBOrigem, tx.ISPBDestino, tx.Status)
    }
    
    fmt.Printf("\nSequencial: %v\n", seqTime)
    fmt.Printf("Concorrente: %v\n", concTime)
    fmt.Printf("Speedup: %.2fx\n", float64(seqTime)/float64(concTime))
}
```

---

## 5. Race Conditions

### O problema

```go
func main() {
    counter := 0
    var wg sync.WaitGroup
    
    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            counter++ // ⚠️ Não é atômico!
        }()
    }
    
    wg.Wait()
    fmt.Println("Counter:", counter) // Valor imprevisível!
}
```

### Detectar com -race

```bash
go run -race main.go
// Output: WARNING: DATA RACE
```

### Solução: Mutex

```go
import "sync"

func main() {
    counter := 0
    var mu sync.Mutex
    var wg sync.WaitGroup
    
    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            mu.Lock()
            counter++
            mu.Unlock()
        }()
    }
    
    wg.Wait()
    fmt.Println("Counter:", counter) // Sempre 1000
}
```

---

## 6. Resumo

| Conceito | Uso |
|----------|-----|
| `go func()` | Criar goroutine |
| `sync.WaitGroup` | Aguardar conclusão |
| `sync.Mutex` | Proteger dados compartilhados |
| `-race` | Detectar race conditions |

### Próxima aula

**Aula 03: Channels** — Como goroutines se comunicam de forma segura.

---

**Exercício:** **Exercicio:** processor-spi/
