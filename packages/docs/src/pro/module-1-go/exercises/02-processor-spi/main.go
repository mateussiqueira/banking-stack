package main

import (
	"fmt"
	"math/rand"
	"sync"
	"time"
)

// TransacaoSPI representa uma transação no SPI
type TransacaoSPI struct {
	ID          int
	EndToEndID  string
	Valor       float64
	ISPBOrigem  string
	ISPBDestino string
	Status      string
	Duracao     time.Duration
}

// processarTransacao simula o processamento de uma transação
func processarTransacao(tx *TransacaoSPI, wg *sync.WaitGroup) {
	if wg != nil {
		defer wg.Done()
	}

	start := time.Now()

	// Simular latência de rede (20-80ms)
	latencia := time.Duration(20+rand.Intn(60)) * time.Millisecond
	time.Sleep(latencia)

	// Simular rejeição aleatória (10%)
	if rand.Float64() < 0.10 {
		tx.Status = "REJECTED"
	} else {
		tx.Status = "ACCEPTED"
	}

	tx.Duracao = time.Since(start)
}

func main() {
	rand.Seed(time.Now().UnixNano())

	fmt.Println("=== Banking Stack Pro - Exercício 02 ===")
	fmt.Println("Processador de Transações SPI com Goroutines\n")

	// Criar 20 transações
	numTransacoes := 20
	transacoes := make([]TransacaoSPI, numTransacoes)

	for i := range transacoes {
		transacoes[i] = TransacaoSPI{
			ID:          i + 1,
			EndToEndID:  fmt.Sprintf("E2E%d", time.Now().UnixNano()+int64(i)),
			Valor:       float64(rand.Intn(100000)) / 100,
			ISPBOrigem:  "00000000",
			ISPBDestino: "60701190",
		}
	}

	// Processar sequencialmente
	fmt.Println("--- Processamento Sequencial ---")
	start := time.Now()
	for i := range transacoes {
		processarTransacao(&transacoes[i], nil)
	}
	seqTime := time.Since(start)
	fmt.Printf("Tempo: %v\n\n", seqTime)

	// Reset status
	for i := range transacoes {
		transacoes[i].Status = ""
		transacoes[i].Duracao = 0
	}

	// Processar concorrentemente
	fmt.Println("--- Processamento Concorrente ---")
	var wg sync.WaitGroup

	start = time.Now()
	for i := range transacoes {
		wg.Add(1)
		go processarTransacao(&transacoes[i], &wg)
	}
	wg.Wait()
	concTime := time.Since(start)

	// Resultados
	fmt.Println("\n=== Resultados ===")
	accepted := 0
	rejected := 0
	for _, tx := range transacoes {
		if tx.Status == "ACCEPTED" {
			accepted++
		} else {
			rejected++
		}
		fmt.Printf("Tx %2d: R$ %8.2f | %s | %v\n",
			tx.ID, tx.Valor, tx.Status, tx.Duracao)
	}

	fmt.Printf("\nResumo:\n")
	fmt.Printf("  Total: %d transações\n", numTransacoes)
	fmt.Printf("  Aceitas: %d\n", accepted)
	fmt.Printf("  Rejeitadas: %d\n", rejected)
	fmt.Printf("\nSequencial: %v\n", seqTime)
	fmt.Printf("Concorrente: %v\n", concTime)
	fmt.Printf("Speedup: %.2fx\n", float64(seqTime)/float64(concTime))
}
