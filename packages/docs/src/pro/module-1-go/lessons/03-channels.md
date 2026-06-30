# Aula 03: Channels — Comunicação Segura entre Goroutines

**Duração:** 50 minutos
**Pré-requisitos:** Aula 02
**Objetivo:** Usar channels para comunicar goroutines de forma segura e eficiente.

---

## 📋 Objetivos de Aprendizagem

1. Entender channels como pipes entre goroutines
2. Criar channels bufferizados e não-bufferizados
3. Usar select para múltiplos channels
4. Implementar padrões Fan-out/Fan-in

---

## 1. O que são Channels?

Channels são pipes que conectam goroutines:

```
Goroutine A  ──▶  Channel  ──▶  Goroutine B
(encontra)      (transporta)     (processa)
```

### Regra de ouro em Go

> **"Não compartilhe memória por threads; compartilhe memória por channels."**

---

## 2. Channels Básicos

### Criando e usando

```go
package main

import "fmt"

func main() {
    // Criar channel
    ch := make(chan string)
    
    // Enviar dados (em goroutine)
    go func() {
        ch <- "Olá do SPI" // Enviar
    }()
    
    // Receber dados
    msg := <-ch // Receber
    fmt.Println(msg)
}
```

### Channel tipado

```go
// Channel de inteiros
chInt := make(chan int)

// Channel de structs
type Transacao struct {
    ID     string
    Valor  float64
}
chTx := make(chan Transacao)

// Channel somente leitura
chReadOnly := make(chan<- int)

// Channel somente escrita
chWriteOnly := make(chan<- int)
```

---

## 3. Channels Bufferizados

### Sem buffer (síncrono)

```go
ch := make(chan int) // Buffer: 0
ch <- 1             // Bloqueia até alguém ler
```

### Com buffer (assíncrono)

```go
ch := make(chan int, 10) // Buffer: 10
ch <- 1                  // Não bloqueia (até 10 itens)
ch <- 2                  // Ainda não bloqueia
// ... até 10
```

### Quando usar?

| Tipo | Caso de uso |
|------|-------------|
| Sem buffer | Garantir que mensagem foi recebida |
| Com buffer | Alto throughput, processamento assíncrono |

---

## 4. Padrão Pipeline

### Conceito

```
[Producer] ──▶ [Stage 1] ──▶ [Stage 2] ──▶ [Consumer]
  gera         filtra         transforma      salva
```

### Exemplo: Pipeline de transações

```go
package main

import (
    "fmt"
    "sync"
)

// Estágio 1: Gerar transações
func gerarTransacoes(out chan<- int) {
    for i := 1; i <= 10; i++ {
        out <- i
    }
    close(out)
}

// Estágio 2: Filtrar (só pares)
func filtrarPares(in <-chan int, out chan<- int) {
    for v := range in {
        if v%2 == 0 {
            out <- v
        }
    }
    close(out)
}

// Estágio 3: Processar
func processar(in <-chan int, wg *sync.WaitGroup) {
    defer wg.Done()
    for v := range in {
        fmt.Printf("Processando: %d\n", v*10)
    }
}

func main() {
    canal1 := make(chan int)
    canal2 := make(chan int)
    
    var wg sync.WaitGroup
    
    // Pipeline
    go gerarTransacoes(canal1)
    go filtrarPares(canal1, canal2)
    
    wg.Add(1)
    go processar(canal2, &wg)
    
    wg.Wait()
    fmt.Println("Pipeline concluído!")
}
```

---

## 5. Select Statement

### Múltiplos channels

```go
select {
case msg := <-ch1:
    fmt.Println("Recebido de ch1:", msg)
case msg := <-ch2:
    fmt.Println("Recebido de ch2:", msg)
case <-time.After(1 * time.Second):
    fmt.Println("Timeout!")
}
```

### Exemplo: Router de transações

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    pix := make(chan string)
    ted := make(chan string)
    doc := make(chan string)
    
    // Simular transações chegando
    go func() {
        time.Sleep(100 * time.Millisecond)
        pix <- "PIX R$ 100"
    }()
    go func() {
        time.Sleep(200 * time.Millisecond)
        ted <- "TED R$ 500"
    }()
    go func() {
        time.Sleep(300 * time.Millisecond)
        doc <- "DOC R$ 1000"
    }()
    
    // Processar por ordem de chegada
    for i := 0; i < 3; i++ {
        select {
        case tx := <-pix:
            fmt.Println("Processando PIX:", tx)
        case tx := <-ted:
            fmt.Println("Processando TED:", tx)
        case tx := <-doc:
            fmt.Println("Processando DOC:", tx)
        }
    }
}
```

---

## 6. Padrão Fan-out / Fan-in

### Fan-out: 1 → N workers

```go
func fanOut(jobs <-chan int, results chan<- int, workers int) {
    var wg sync.WaitGroup
    
    for i := 0; i < workers; i++ {
        wg.Add(1)
        go worker(jobs, results, &wg)
    }
    
    wg.Wait()
    close(results)
}

func worker(jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
    defer wg.Done()
    for job := range jobs {
        results <- job * 2 // Processar
    }
}
```

### Fan-in: N → 1

```go
func fanIn(channels ...<-chan int) <-chan int {
    var wg sync.WaitGroup
    merged := make(chan int)
    
    for _, ch := range channels {
        wg.Add(1)
        go func(c <-chan int) {
            defer wg.Done()
            for v := range c {
                merged <- v
            }
        }(ch)
    }
    
    go func() {
        wg.Wait()
        close(merged)
    }()
    
    return merged
}
```

---

## 7. Exercício Prático: Worker Pool para Transações

### Objetivo

Criar um worker pool que processe transações SPI em paralelo.

### Solução

```go
package main

import (
    "fmt"
    "math/rand"
    "sync"
    "time"
)

type Transacao struct {
    ID    string
    Valor float64
    Status string
}

func worker(id int, jobs <-chan Transacao, results chan<- Transacao, wg *sync.WaitGroup) {
    defer wg.Done()
    
    for tx := range jobs {
        // Simular processamento
        time.Sleep(time.Duration(rand.Intn(50)) * time.Millisecond)
        
        tx.Status = "COMPLETED"
        fmt.Printf("Worker %d processou tx %s\n", id, tx.ID)
        results <- tx
    }
}

func main() {
    rand.Seed(time.Now().UnixNano())
    
    numWorkers := 3
    numJobs := 10
    
    jobs := make(chan Transacao, numJobs)
    results := make(chan Transacao, numJobs)
    
    var wg sync.WaitGroup
    
    // Iniciar workers
    for w := 1; w <= numWorkers; w++ {
        wg.Add(1)
        go worker(w, jobs, results, &wg)
    }
    
    // Enviar jobs
    for j := 1; j <= numJobs; j++ {
        jobs <- Transacao{
            ID:    fmt.Sprintf("TX-%d", j),
            Valor: float64(rand.Intn(10000)) / 100,
        }
    }
    close(jobs)
    
    // Aguardar workers e fechar results
    go func() {
        wg.Wait()
        close(results)
    }()
    
    // Coletar resultados
    fmt.Println("\n=== Resultados ===")
    for tx := range results {
        fmt.Printf("Tx %s: R$ %.2f | %s\n", tx.ID, tx.Valor, tx.Status)
    }
    
    fmt.Println("\nTodas transações processadas!")
}
```

---

## 8. Resumo

| Padrão | Uso | Exemplo |
|--------|-----|---------|
| Pipeline | Processar em estágios | Filtrar → Transformar → Salvar |
| Fan-out | Distribuir trabalho | 1 fila → N workers |
| Fan-in | Combinar resultados | N workers → 1 resultado |
| Select | Múltiplos canais | Router de transações |
| Timeout | Limitar tempo | `time.After()` |

### Erros comuns

| Erro | Solução |
|------|---------|
| deadlock | Não enviar para channel sem leitor |
| goroutine leak | Sempre fechar channels ou usar context |
| race condition | Usar channels em vez de mutex |

---

**Exercício:** [worker-pool/](../exercises/03-worker-pool/)
