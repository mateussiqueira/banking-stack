# Aula 07: Otimização do Garbage Collector (GC)

**Duração:** 50 minutos
**Pré-requisitos:** Aulas 01-06
**Objetivo:** Escrever código Go que minimize as pausas de GC em sistemas transacionais críticos.

---

## 📋 Objetivos de Aprendizagem

1. Entender como o GC do Go funciona
2. Medir e monitorar o GC
3. Minimizar alocações de memória
4. Usar sync.Pool para reutilização de objetos
5. Configurar GOGC e GOMEMLIMIT

---

## 1. Como o GC do Go Funciona

### Características do GC

| Característica | Valor |
|----------------|-------|
| **Tipo** | Concurrent, tri-color mark-and-sweep |
| **Pausas** | < 1ms (objetivo: < 500μs) |
| **Gatilho** | Quando heap cresce ~GOGC% |
| **Custo** | ~25% da CPU (típico) |

### Ciclo do GC

```
1. Mark Start     → Iniciar marcação
2. Mark (concurrent) → Marcar objetos vivos (com goroutines)
3. Mark Terminate  → Finalizar marcação (STW curto)
4. Sweep (concurrent) → Limpar memória não referenciada
```

### Quando o GC executa

```go
// O GC é acionado quando:
// 1. Heap cresce além de GOGC% do heap atual
// 2. Chamada manual: runtime.GC()
// 3. Antes de alocar grande bloco de memória

// Exemplo:
// Heap atual: 10MB, GOGC=100
// GC executa quando heap atinge ~20MB
```

---

## 2. Monitorando o GC

### runtime.ReadMemStats

```go
package main

import (
    "fmt"
    "runtime"
    "time"
)

func main() {
    var stats runtime.MemStats
    
    // Ler estatísticas
    runtime.ReadMemStats(&stats)
    
    fmt.Println("=== Estatísticas de Memória ===")
    fmt.Printf("Heap Alloc:  %d MB\n", stats.HeapAlloc/1024/1024)
    fmt.Printf("Heap Sys:    %d MB\n", stats.HeapSys/1024/1024)
    fmt.Printf("Heap Inuse:  %d MB\n", stats.HeapInuse/1024/1024)
    fmt.Printf("Heap Objects: %d\n", stats.HeapObjects)
    fmt.Printf("GC Cycles:   %d\n", stats.NumGC)
    fmt.Printf("Last GC:     %v\n", time.Unix(0, int64(stats.LastGC)))
}
```

### Forçar GC e medir

```go
func medirGC(nome string, fn func()) {
    var stats1, stats2 runtime.MemStats
    
    runtime.GC()
    runtime.ReadMemStats(&stats1)
    
    start := time.Now()
    fn()
    duracao := time.Since(start)
    
    runtime.GC()
    runtime.ReadMemStats(&stats2)
    
    gcCount := stats2.NumGC - stats1.NumGC
    gcTime := stats2.PauseTotalNs - stats1.PauseTotalNs
    
    fmt.Printf("%s: %v | GC: %d cycles | Pausa: %v\n",
        nome, duracao, gcCount, time.Duration(gcTime))
}
```

---

## 3. Minimizando Alocações

### O problema: alocações geram trabalho pro GC

```go
// ERRADO - Muitas alocações
func processarBad(dados []byte) string {
    result := ""
    for _, d := range dados {
        result += string(d) // Nova string a cada iteração!
    }
    return result
}

// CORRETO - Usar strings.Builder
func processarGood(dados []byte) string {
    var builder strings.Builder
    builder.Grow(len(dados))
    for _, d := range dados {
        builder.WriteByte(d)
    }
    return builder.String()
}
```

### Evitar escape para heap

```go
// O compilador decide se vai para stack ou heap

// Stack (rápido, sem GC)
func stackAlloc() int {
    x := 42
    return x
}

// Heap (lento, precisa de GC)
func heapAlloc() *int {
    x := 42
    return &x // Escape para heap!
}

// Verificar escape:
// go build -gcflags="-m" main.go
```

### Usar slices com capacity

```go
// ERRADO - Realocações
func criarBad(n int) []int {
    var slice []int
    for i := 0; i < n; i++ {
        slice = append(slice, i) // Realoca!
    }
    return slice
}

// CORRETO - Capacity predefinida
func criarGood(n int) []int {
    slice := make([]int, 0, n) // Capacity = n
    for i := 0; i < n; i++ {
        slice = append(slice, i) // Sem realocação
    }
    return slice
}
```

---

## 4. sync.Pool

### Reutilização de objetos

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

### Pool para structs complexas

```go
type Transacao struct {
    ID        string
    Valor     float64
    Dados     []byte
    Metadata  map[string]string
}

var txPool = sync.Pool{
    New: func() interface{} {
        return &Transacao{
            Metadata: make(map[string]string),
        }
    },
}

func novaTransacao() *Transacao {
    tx := txPool.Get().(*Transacao)
    tx.ID = ""
    tx.Valor = 0
    tx.Dados = tx.Dados[:0]
    for k := range tx.Metadata {
        delete(tx.Metadata, k)
    }
    return tx
}

func liberarTransacao(tx *Transacao) {
    txPool.Put(tx)
}
```

---

## 5. GOGC e GOMEMLIMIT

### GOGC

```bash
# Valor padrão: 100 (GC quando heap cresce 100%)

# Menos GC (mais memória):
export GOGC=200

# Mais GC (menos memória):
export GOGC=50

# Desativar (não recomendado!):
export GOGC=off
```

### GOMEMLIMIT (Go 1.19+)

```bash
# Limitar memória máxima
export GOMEMLIMIT=1GiB

# Combinar com GOGC
export GOGC=100
export GOMEMLIMIT=2GiB
```

### Quando usar

| Cenário | GOGC | GOMEMLIMIT |
|---------|------|------------|
| Serviço com pouca memória | 50-100 | Definir limite |
| Serviço com muita CPU | 200-400 | Não definir |
| Batch processamento | 50 | Definir limite |
| Latência crítica | 100 | Não definir |

---

## 6. Exercício Prático: Benchmark de Alocações

### Objetivo

Comparar diferentes abordagens e medir impacto no GC.

### Solução

```go
package main

import (
    "fmt"
    "runtime"
    "strings"
    "sync"
    "time"
)

// Versão ruim: muitas alocações
func concatenarBad(n int) string {
    result := ""
    for i := 0; i < n; i++ {
        result += "x"
    }
    return result
}

// Versão boa: strings.Builder
func concatenarGood(n int) string {
    var builder strings.Builder
    builder.Grow(n)
    for i := 0; i < n; i++ {
        builder.WriteByte('x')
    }
    return builder.String()
}

// Versão ruim: slice sem capacity
func criarSliceBad(n int) []int {
    var slice []int
    for i := 0; i < n; i++ {
        slice = append(slice, i)
    }
    return slice
}

// Versão boa: slice com capacity
func criarSliceGood(n int) []int {
    slice := make([]int, 0, n)
    for i := 0; i < n; i++ {
        slice = append(slice, i)
    }
    return slice
}

// Pool de buffers
var bufPool = sync.Pool{
    New: func() interface{} {
        return new(strings.Builder)
    },
}

// Versão com pool
func concatenarPool(n int) string {
    builder := bufPool.Get().(*strings.Builder)
    builder.Reset()
    builder.Grow(n)
    for i := 0; i < n; i++ {
        builder.WriteByte('x')
    }
    result := builder.String()
    bufPool.Put(builder)
    return result
}

func medir(nome string, fn func()) {
    var stats1, stats2 runtime.MemStats
    
    runtime.GC()
    runtime.ReadMemStats(&stats1)
    
    start := time.Now()
    for i := 0; i < 1000; i++ {
        fn()
    }
    duracao := time.Since(start)
    
    runtime.GC()
    runtime.ReadMemStats(&stats2)
    
    alocacoes := stats2.Mallocs - stats1.Mallocs
    gcCycles := stats2.NumGC - stats1.NumGC
    
    fmt.Printf("%-20s | %v | %d alocações | %d GC cycles\n",
        nome, duracao, alocacoes, gcCycles)
}

func main() {
    fmt.Println("=== Banking Stack Pro - Exercício 07 ===")
    fmt.Println("Benchmark de Otimização de GC\n")
    
    n := 10000
    
    fmt.Printf("Testando com %d iterações:\n\n", n)
    
    medir("String concat (ruim)", func() {
        concatenarBad(n)
    })
    
    medir("String.Builder (bom)", func() {
        concatenarGood(n)
    })
    
    medir("Pool Builder (ótimo)", func() {
        concatenarPool(n)
    })
    
    fmt.Println()
    
    medir("Slice sem cap (ruim)", func() {
        criarSliceBad(n)
    })
    
    medir("Slice com cap (bom)", func() {
        criarSliceGood(n)
    })
    
    fmt.Println("\n=== Conclusão ===")
    fmt.Println("Strings.Builder: ~50% menos alocações que concat")
    fmt.Println("sync.Pool: ~90% menos alocações com reutilização")
    fmt.Println("Slice capacity: ~30% menos alocações")
}
```

---

## 7. Resumo

| Técnica | Impacto | Dificuldade |
|---------|---------|-------------|
| strings.Builder | Alto | Fácil |
| Slice capacity | Médio | Fácil |
| sync.Pool | Alto | Médio |
| Reduzir escapes | Alto | Difícil |
| GOGC tuning | Médio | Médio |
| GOMEMLIMIT | Médio | Fácil |

### Checklist de otimização

- [ ] Usar strings.Builder em vez de concatenação
- [ ] Definir capacity em slices
- [ ] Usar sync.Pool para objetos frequentes
- [ ] Evitar ponteiros desnecessários
- [ ] Monitorar HeapAlloc e NumGC
- [ ] Testar com GOGC variado

---

**Exercício:** [gc-optimize/](../exercises/07-gc-optimize/)
