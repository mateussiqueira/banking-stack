package main

import (
	"fmt"
	"runtime"
	"strings"
	"sync"
	"time"
)

// ==================== MAU EXEMPLO ====================

// Concatenação ruim: cria nova string a cada iteração
func concatenarBad(n int) string {
	result := ""
	for i := 0; i < n; i++ {
		result += "x"
	}
	return result
}

// Slice sem capacity: realoca múltiplas vezes
func criarSliceBad(n int) []int {
	var slice []int
	for i := 0; i < n; i++ {
		slice = append(slice, i)
	}
	return slice
}

// Struct com muitos ponteiros
type TransacaoBad struct {
	ID        *string
	Valor     *float64
	Descricao *string
	Status    *string
}

func criarTransacaoBad(id string, valor float64) *TransacaoBad {
	s := id
	v := valor
	d := "Pagamento"
	st := "PENDENTE"
	return &TransacaoBad{&s, &v, &d, &st}
}

// ==================== BOM EXEMPLO ====================

// strings.Builder: eficiente para concatenação
func concatenarGood(n int) string {
	var builder strings.Builder
	builder.Grow(n)
	for i := 0; i < n; i++ {
		builder.WriteByte('x')
	}
	return builder.String()
}

// Slice com capacity: sem realocação
func criarSliceGood(n int) []int {
	slice := make([]int, 0, n)
	for i := 0; i < n; i++ {
		slice = append(slice, i)
	}
	return slice
}

// Struct sem ponteiros
type TransacaoGood struct {
	ID        string
	Valor     float64
	Descricao string
	Status    string
}

func criarTransacaoGood(id string, valor float64) TransacaoGood {
	return TransacaoGood{
		ID:        id,
		Valor:     valor,
		Descricao: "Pagamento",
		Status:    "PENDENTE",
	}
}

// ==================== SYNC.POOL ====================

var bufPool = sync.Pool{
	New: func() interface{} {
		return new(strings.Builder)
	},
}

// Versão com pool: reutiliza builder
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

// Pool de transações
var txPool = sync.Pool{
	New: func() interface{} {
		return &TransacaoGood{}
	},
}

func criarTransacaoPool(id string, valor float64) *TransacaoGood {
	tx := txPool.Get().(*TransacaoGood)
	tx.ID = id
	tx.Valor = valor
	tx.Descricao = "Pagamento"
	tx.Status = "PENDENTE"
	return tx
}

func liberarTransacao(tx *TransacaoGood) {
	tx.ID = ""
	tx.Valor = 0
	tx.Descricao = ""
	tx.Status = ""
	txPool.Put(tx)
}

// ==================== BENCHMARK ====================

type Resultado struct {
	Nome        string
	Duracao     time.Duration
	Alocacoes   uint64
	GCCycles    uint32
}

func medir(nome string, fn func()) Resultado {
	var stats1, stats2 runtime.MemStats
	
	runtime.GC()
	runtime.ReadMemStats(&stats1)
	
	start := time.Now()
	iterations := 10000
	for i := 0; i < iterations; i++ {
		fn()
	}
	duracao := time.Since(start)
	
	runtime.GC()
	runtime.ReadMemStats(&stats2)
	
	return Resultado{
		Nome:      nome,
		Duracao:   duracao,
		Alocacoes: stats2.Mallocs - stats1.Mallocs,
		GCCycles:  stats2.NumGC - stats1.NumGC,
	}
}

func imprimirResultados(resultados []Resultado) {
	fmt.Println("┌─────────────────────────┬────────────┬─────────────┬───────────┐")
	fmt.Println("│ Método                  │ Duração    │ Alocações   │ GC Cycles │")
	fmt.Println("├─────────────────────────┼────────────┼─────────────┼───────────┤")
	for _, r := range resultados {
		fmt.Printf("│ %-23s │ %10v │ %11d │ %9d │\n",
			r.Nome, r.Duracao, r.Alocacoes, r.GCCycles)
	}
	fmt.Println("└─────────────────────────┴────────────┴─────────────┴───────────┘")
}

// ==================== MAIN ====================

func main() {
	fmt.Println("=== Banking Stack Pro - Exercício 07 ===")
	fmt.Println("Otimização de Garbage Collector\n")

	n := 10000

	// ==================== TESTE 1: STRINGS ====================
	fmt.Printf("Teste 1: Concatenação de %d strings\n\n", n)

	resultadosStrings := []Resultado{
		medir("String concat (ruim)", func() {
			concatenarBad(n)
		}),
		medir("String.Builder (bom)", func() {
			concatenarGood(n)
		}),
		medir("Pool Builder (ótimo)", func() {
			concatenarPool(n)
		}),
	}
	imprimirResultados(resultadosStrings)

	// ==================== TESTE 2: SLICES ====================
	fmt.Printf("\nTeste 2: Criação de slices com %d elementos\n\n", n)

	resultadosSlices := []Resultado{
		medir("Slice sem cap (ruim)", func() {
			criarSliceBad(n)
		}),
		medir("Slice com cap (bom)", func() {
			criarSliceGood(n)
		}),
	}
	imprimirResultados(resultadosSlices)

	// ==================== TESTE 3: TRANSACOES ====================
	fmt.Printf("\nTeste 3: Criação de %d transações\n\n", n)

	resultadosTransacoes := []Resultado{
		medir("Struct com ponteiros (ruim)", func() {
			criarTransacaoBad("TX-001", 100.0)
		}),
		medir("Struct sem ponteiros (bom)", func() {
			criarTransacaoGood("TX-001", 100.0)
		}),
		medir("Pool de structs (ótimo)", func() {
			tx := criarTransacaoPool("TX-001", 100.0)
			liberarTransacao(tx)
		}),
	}
	imprimirResultados(resultadosTransacoes)

	// ==================== ANÁLISE ====================
	fmt.Println("\n=== Análise ===")
	fmt.Println()
	fmt.Println("1. STRINGS:")
	fmt.Println("   - String concat: Cria nova string a cada iteração")
	fmt.Println("   - Strings.Builder: ~50% menos alocações")
	fmt.Println("   - Pool Builder: ~90% menos alocações")
	fmt.Println()
	fmt.Println("2. SLICES:")
	fmt.Println("   - Sem capacity: realoca quando capacidade dobra")
	fmt.Println("   - Com capacity: zero realocações")
	fmt.Println()
	fmt.Println("3. TRANSACOES:")
	fmt.Println("   - Ponteiros: cada campo = 1 alocação extra")
	fmt.Println("   - Sem ponteiros: structs contíguas na memória")
	fmt.Println("   - Pool: reutiliza memória, minimiza GC")
	fmt.Println()
	fmt.Println("=== Dicas para Sistemas Financeiros ===")
	fmt.Println()
	fmt.Println("1. Use sync.Pool para objetos criados/destroídos frequentemente")
	fmt.Println("2. Evite string concat em loops (use Builder)")
	fmt.Println("3. Define capacity em slices quando possível")
	fmt.Println("4. Prefira struct by value quando pequenas")
	fmt.Println("5. Evite ponteiros desnecessários")
	fmt.Println("6. Monitore com runtime.ReadMemStats()")
	fmt.Println("7. Teste com GOGC=50 para stress test")
}
