# Aula 08: Profiling com pprof — CPU, Memory, Goroutines

**Duração:** 45 minutos
**Pré-requisitos:** Aula 07
**Objetivo:** Identificar gargalos de performance em código Go usando ferramentas de profiling.

---

## 📋 Objetivos de Aprendizagem

1. Entender o que é profiling e quando usar
2. Coletar profiles de CPU, memória e goroutines
3. Analisar flame graphs
4. Identificar e corrigir gargalos
5. Integrar profiling em produção

---

## 1. O que é Profiling?

### Definição

Profiling é a análise do comportamento do programa durante execução:
- **Onde** a CPU está gastando tempo?
- **Onde** a memória está sendo alocada?
- **Quantas** goroutines existem?

### Quando usar

| Situação | Uso |
|----------|-----|
| Código lento | Encontrar gargalo |
| Memory leak | Identificar vazamento |
| Alta CPU | Otimizar hot path |
| Em produção | Monitorar com cautela |

---

## 2. Package net/http/pprof

### Habilitar profiling

```go
import _ "net/http/pprof"

func main() {
    // Servidor HTTP para profiling
    go func() {
        http.ListenAndServe("localhost:6060", nil)
    }()
    
    // Seu código aqui
}
```

### Endpoints disponíveis

| Endpoint | Tipo |
|----------|------|
| `/debug/pprof/` | Índice |
| `/debug/pprof/profile` | CPU profile (30s) |
| `/debug/pprof/heap` | Memory profile |
| `/debug/pprof/goroutine` | Goroutine dump |
| `/debug/pprof/allocs` | Alocações |
| `/debug/pprof/block` | Bloqueios |
| `/debug/pprof/mutex` | Mutex contention |

---

## 3. Coletando Profiles

### CPU Profile

```bash
# Coletar por 30 segundos
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

# Salvar em arquivo
curl -o cpu.prof http://localhost:6060/debug/pprof/profile?seconds=30
```

### Memory Profile

```bash
# Coletar snapshot atual
go tool pprof http://localhost:6060/debug/pprof/heap

# Salvar
curl -o mem.prof http://localhost:6060/debug/pprof/heap
```

### Goroutine Profile

```bash
# Ver goroutines ativas
go tool pprof http://localhost:6060/debug/pprof/goroutine
```

---

## 4. Analisando com go tool pprof

### Comandos básicos

```bash
# Iniciar pprof
go tool pprof cpu.prof

# Top funções por CPU time
(pprof) top
(pprof) top20

# Ver flame graph
(pprof) web

# Ver chamadores
(pprof) top --cum

# Sair
(pprof) quit
```

### Interpretando resultados

```
(pprof) top
Showing nodes accounting for 5.2s, 85% of 6.1s total
Showing top 10 nodes out of 123
      flat  flat%   sum%        cum   cum%
     1.2s 19.7% 19.7%      1.2s 19.7%  runtime.mallocgc
     0.8s 13.1% 32.8%      0.8s 13.1%  runtime.concatstrings
     0.6s  9.8% 42.6%      0.6s  9.8%  runtime.(*mheap).alloc
     ...
```

| Coluna | Significado |
|--------|-------------|
| **flat** | Tempo gasto na função (sem filhos) |
| **flat%** | Percentual do total |
| **sum%** | Acumulado |
| **cum** | Tempo total (com filhos) |
| **cum%** | Percentual do total com filhos |

---

## 5. Programatic Profiling

### Coletar no código

```go
import (
    "os"
    "runtime/pprof"
)

func perfilCPU(filename string) {
    f, _ := os.Create(filename)
    defer f.Close()
    
    pprof.StartCPUProfile(f)
    defer pprof.StopCPUProfile()
    
    // Código a ser perfilado
    trabalhoPesado()
}

func perfilMemoria(filename string) {
    f, _ := os.Create(filename)
    defer f.Close()
    
    pprof.WriteHeapProfile(f)
}
```

### Benchmark profiling

```go
func BenchmarkProcessar(b *testing.B) {
    for i := 0; i < b.N; i++ {
        processar()
    }
}

// Rodar:
// go test -bench=. -benchmem -cpuprofile=cpu.prof
// go tool pprof cpu.prof
```

---

## 6. Flame Graphs

### O que é?

Flame graph mostra a cadeia de chamadas:
- **Eixo X**: Proporção do tempo
- **Eixo Y**: Profundidade da chamada
- **Largura**: Quanto tempo a função gastou

### Como interpretar

```
┌─────────────────────────────────────────────────┐
│                   main()                         │
├─────────────────────────────────────────────────┤
│         processarTransacoes()                    │
├──────────────────┬──────────────────────────────┤
│   processar()    │     salvar()                 │
├────────┬─────────┤──────────────────────────────┤
│ validar│ calcular│    escrever()                │
└────────┴─────────┴──────────────────────────────┘

→ processar() é o gargalo (mais largo)
```

### Ver no navegador

```bash
# Gerar SVG
go tool pprof -svg cpu.prof > flame.svg

# Ou abrir no navegador
go tool pprof -http=:8080 cpu.prof
```

---

## 7. Exercício Prático: Profiling SPI

### Objetivo

Criar um servidor SPI com profiling habilitado e identificar gargalos.

### Solução

```go
package main

import (
    "fmt"
    "log"
    "math/rand"
    "net/http"
    _ "net/http/pprof"
    "runtime"
    "sync"
    "time"
)

type TransacaoSPI struct {
    ID        string
    EndToEndID string
    Valor     float64
    Status    string
}

var (
    transactions = make(map[string]*TransacaoSPI)
    mu           sync.RWMutex
)

// Função com alocações desnecessárias (gargalo)
func processarTransacaoBad(id string, valor float64) *TransacaoSPI {
    tx := &TransacaoSPI{
        ID:        fmt.Sprintf("TX-%d", time.Now().UnixNano()),
        EndToEndID: id,
        Valor:     valor,
        Status:    "ACCEPTED",
    }
    
    // Simular processamento com concatenação ruim
    logMsg := ""
    for i := 0; i < 100; i++ {
        logMsg += fmt.Sprintf("Step %d: Processing %s\n", i, tx.EndToEndID)
    }
    
    mu.Lock()
    transactions[tx.EndToEndID] = tx
    mu.Unlock()
    
    return tx
}

// Função otimizada
func processarTransacaoGood(id string, valor float64) *TransacaoSPI {
    tx := TransacaoSPI{
        ID:        fmt.Sprintf("TX-%d", time.Now().UnixNano()),
        EndToEndID: id,
        Valor:     valor,
        Status:    "ACCEPTED",
    }
    
    // Usar strings.Builder
    var logMsg strings.Builder
    logMsg.Grow(100 * 50)
    for i := 0; i < 100; i++ {
        fmt.Fprintf(&logMsg, "Step %d: Processing %s\n", i, tx.EndToEndID)
    }
    
    mu.Lock()
    transactions[tx.EndToEndID] = &tx
    mu.Unlock()
    
    return &tx
}

func main() {
    // Habilitar profiling
    go func() {
        log.Println("📊 Profiling disponível em http://localhost:6060/debug/pprof/")
        http.ListenAndServe("localhost:6060", nil)
    }()
    
    fmt.Println("=== SPI Server com Profiling ===")
    fmt.Println("📡 Endpoints:")
    fmt.Println("   GET /process?endToEndId=XXX&amount=XXX  - Processar")
    fmt.Println("   GET /debug/pprof/                       - Profiling")
    fmt.Println()
    
    // Simular carga
    go func() {
        for i := 0; i < 1000; i++ {
            processarTransacaoBad(
                fmt.Sprintf("E2E%d", i),
                float64(rand.Intn(10000))/100,
            )
            time.Sleep(time.Millisecond)
        }
    }()
    
    // Endpoint HTTP
    http.HandleFunc("/process", func(w http.ResponseWriter, r *http.Request) {
        id := r.URL.Query().Get("endToEndId")
        if id == "" {
            id = fmt.Sprintf("E2E%d", time.Now().UnixNano())
        }
        
        amount := 100.0
        tx := processarTransacaoBad(id, amount)
        
        fmt.Fprintf(w, "Transação: %s | Status: %s", tx.EndToEndID, tx.Status)
    })
    
    log.Println("🚀 Servidor rodando na porta 8080")
    log.Println("   Para profiling: go tool pprof http://localhost:6060/debug/pprof/profile?seconds=10")
    
    http.ListenAndServe(":8080", nil)
}
```

---

## 8. Checklist de Profiling

### Antes de otimizar

- [ ] Coletar baseline (antes de mudanças)
- [ ] Rodar por tempo suficiente (30s+)
- [ ] Simular carga real

### Análise

- [ ] Identificar top 5 funções por CPU
- [ ] Verificar alocações por função
- [ ] Checar número de goroutines
- [ ] Analisar flame graph

### Depois de otimizar

- [ ] Coletar novo profile
- [ ] Comparar com baseline
- [ ] Medir melhoria real

---

## 9. Resumo

| Ferramenta | Uso |
|------------|-----|
| `pprof` | Coleta e análise de profiles |
| `go tool pprof` | CLI para análise |
| `-http=:8080` | Visualização web |
| `-svg` | Gerar flame graph |
| `runtime.ReadMemStats` | Métricas em runtime |
| `b.N` + `-benchmem` | Benchmark com profiling |

### Links úteis

- [pprof documentation](https://pkg.go.dev/net/http/pprof)
- [Profiling Go Programs](https://go.dev/blog/pprof)
- [Flame Graphs](https://www.brendangregg.com/flamegraphs.html)

---

**Exercício:** **Exercicio:** pprof-spi/
