package main

import (
	"fmt"
	"math/rand"
	"net/http"
	_ "net/http/pprof"
	"runtime"
	"strings"
	"sync"
	"time"
)

// ==================== MODELS ====================

type TransacaoSPI struct {
	ID         string
	EndToEndID string
	Valor      float64
	Status     string
}

// ==================== STORE ====================

var (
	transactions = make(map[string]*TransacaoSPI)
	mu           sync.RWMutex
)

func salvar(tx *TransacaoSPI) {
	mu.Lock()
	transactions[tx.EndToEndID] = tx
	mu.Unlock()
}

func buscar(endToEndID string) (*TransacaoSPI, bool) {
	mu.RLock()
	defer mu.RUnlock()
	tx, ok := transactions[endToEndID]
	return tx, ok
}

// ==================== VERSÃO RUIM ====================

// Processa transação com alocações desnecessárias
func processarRuim(id string, valor float64) *TransacaoSPI {
	// Alocação 1: Criar transação
	tx := &TransacaoSPI{
		ID:         fmt.Sprintf("TX-%d", time.Now().UnixNano()),
		EndToEndID: id,
		Valor:      valor,
		Status:     "ACCEPTED",
	}

	// Alocação 2: String concatenação (MUITO RUIM)
	logMsg := ""
	for i := 0; i < 100; i++ {
		logMsg += fmt.Sprintf("Step %d: Processing tx %s amount %.2f\n",
			i, tx.EndToEndID, tx.Valor)
	}

	// Alocação 3: Map para metadados (desnecessário)
	metadata := map[string]string{
		"processor": "SPI",
		"version":   "1.0",
		"timestamp": time.Now().Format(time.RFC3339),
	}

	_ = logMsg
	_ = metadata

	salvar(tx)
	return tx
}

// ==================== VERSÃO BOA ====================

// Processa transação otimizada
func processarBom(id string, valor float64) *TransacaoSPI {
	// Usar struct by value (sem ponteiro inicialmente)
	tx := TransacaoSPI{
		ID:         fmt.Sprintf("TX-%d", time.Now().UnixNano()),
		EndToEndID: id,
		Valor:      valor,
		Status:     "ACCEPTED",
	}

	// Usar strings.Builder (sem alocações extras)
	var logMsg strings.Builder
	logMsg.Grow(100 * 50) // Pre-allocar capacity
	for i := 0; i < 100; i++ {
		fmt.Fprintf(&logMsg, "Step %d: Processing tx %s amount %.2f\n",
			i, tx.EndToEndID, tx.Valor)
	}

	salvar(&tx)
	return &tx
}

// ==================== VERSÃO COM POOL ====================

var txPool = sync.Pool{
	New: func() interface{} {
		return &TransacaoSPI{}
	},
}

func processarPool(id string, valor float64) *TransacaoSPI {
	// Reutilizar objeto do pool
	tx := txPool.Get().(*TransacaoSPI)
	tx.ID = fmt.Sprintf("TX-%d", time.Now().UnixNano())
	tx.EndToEndID = id
	tx.Valor = valor
	tx.Status = "ACCEPTED"

	salvar(tx)
	return tx
}

func liberarPool(tx *TransacaoSPI) {
	txPool.Put(tx)
}

// ==================== BENCHMARK ====================

type BenchmarkResult struct {
	Nome        string
	Iteracoes   int
	Duracao     time.Duration
	Alocacoes   uint64
	GCCycles    uint32
}

func runBenchmark(nome string, fn func(string, float64) *TransacaoSPI, iteracoes int) BenchmarkResult {
	var stats1, stats2 runtime.MemStats

	runtime.GC()
	runtime.ReadMemStats(&stats1)

	start := time.Now()
	for i := 0; i < iteracoes; i++ {
		fn(fmt.Sprintf("E2E%d", i), float64(rand.Intn(10000))/100)
	}
	duracao := time.Since(start)

	runtime.GC()
	runtime.ReadMemStats(&stats2)

	return BenchmarkResult{
		Nome:      nome,
		Iteracoes: iteracoes,
		Duracao:   duracao,
		Alocacoes: stats2.Mallocs - stats1.Mallocs,
		GCCycles:  stats2.NumGC - stats1.NumGC,
	}
}

func printResults(results []BenchmarkResult) {
	fmt.Println("┌─────────────────────────┬──────────┬────────────┬─────────────┬───────────┐")
	fmt.Println("│ Método                  │ Iterações│ Duração    │ Alocações   │ GC Cycles │")
	fmt.Println("├─────────────────────────┼──────────┼────────────┼─────────────┼───────────┤")
	for _, r := range results {
		fmt.Printf("│ %-23s │ %8d │ %10v │ %11d │ %9d │\n",
			r.Nome, r.Iteracoes, r.Duracao, r.Alocacoes, r.GCCycles)
	}
	fmt.Println("└─────────────────────────┴──────────┴────────────┴─────────────┴───────────┘")
}

// ==================== MAIN ====================

func main() {
	fmt.Println("=== Banking Stack Pro - Exercício 08 ===")
	fmt.Println("Profiling com pprof\n")

	// Habilitar profiling HTTP
	go func() {
		fmt.Println("📊 Profiling disponível em:")
		fmt.Println("   http://localhost:6060/debug/pprof/")
		fmt.Println()
		fmt.Println("   Comandos:")
		fmt.Println("   go tool pprof http://localhost:6060/debug/pprof/heap")
		fmt.Println("   go tool pprof http://localhost:6060/debug/pprof/profile?seconds=10")
		fmt.Println("   go tool pprof http://localhost:6060/debug/pprof/goroutine")
		fmt.Println()
		http.ListenAndServe("localhost:6060", nil)
	}()

	// Endpoint de processamento
	http.HandleFunc("/process", func(w http.ResponseWriter, r *http.Request) {
		id := r.URL.Query().Get("id")
		if id == "" {
			id = fmt.Sprintf("E2E%d", time.Now().UnixNano())
		}

		tx := processarRuim(id, 100.0)
		fmt.Fprintf(w, "Transação: %s | Status: %s\n", tx.EndToEndID, tx.Status)
	})

	// Benchmark
	fmt.Println("=== Benchmark de Performance ===\n")

	n := 10000

	results := []BenchmarkResult{
		runBenchmark("Versão Ruim (concat)", processarRuim, n),
		runBenchmark("Versão Boa (Builder)", processarBom, n),
		runBenchmark("Versão Pool", processarPool, n),
	}

	printResults(results)

	// Mostrar estatísticas de memória
	var stats runtime.MemStats
	runtime.ReadMemStats(&stats)

	fmt.Println("\n=== Estatísticas de Memória ===")
	fmt.Printf("Heap Alloc: %d MB\n", stats.HeapAlloc/1024/1024)
	fmt.Printf("Heap Sys:   %d MB\n", stats.HeapSys/1024/1024)
	fmt.Printf("Heap Objects: %d\n", stats.HeapObjects)
	fmt.Printf("GC Cycles:  %d\n", stats.NumGC)

	fmt.Println("\n=== Como Usar o Profiling ===")
	fmt.Println()
	fmt.Println("1. Acesse http://localhost:6060/debug/pprof/")
	fmt.Println("2. Colete CPU profile:")
	fmt.Println("   curl -o cpu.prof http://localhost:6060/debug/pprof/profile?seconds=10")
	fmt.Println("3. Analise:")
	fmt.Println("   go tool pprof cpu.prof")
	fmt.Println("4. Veja top funções:")
	fmt.Println("   (pprof) top")
	fmt.Println("5. Veja flame graph:")
	fmt.Println("   (pprof) web")
	fmt.Println()
	fmt.Println("Pressione Ctrl+C para sair...")
	select {}
}
