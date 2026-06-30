package main

import (
	"context"
	"fmt"
	"math/rand"
	"sync"
	"time"
)

// TransacaoSPI representa uma transação no SPI
type TransacaoSPI struct {
	EndToEndID  string
	Valor       float64
	ISPBOrigem  string
	ISPBDestino string
	Status      string
	Tentativa   int
}

// consultarSPI simula uma consulta ao SPI com latência variável
func consultarSPI(ctx context.Context, tx *TransacaoSPI, tentativa int) error {
	tx.Tentativa = tentativa

	// Simular etapas de processamento
	etapas := []struct {
		nome    string
		minMs   int
		maxMs   int
	}{
		{"Conectando ao SPI", 100, 300},
		{"Validando ISPB", 50, 150},
		{"Buscando transação", 200, 800},
		{"Processando resposta", 100, 400},
	}

	for _, etapa := range etapas {
		select {
		case <-ctx.Done():
			return fmt.Errorf("cancelado durante '%s' (tentativa %d): %w",
				etapa.nome, tentativa, ctx.Err())
		default:
		}

		duracao := time.Duration(etapa.minMs+rand.Intn(etapa.maxMs-etapa.minMs)) * time.Millisecond
		time.Sleep(duracao)

		fmt.Printf("    [%d] %s ✓ (%v)\n", tentativa, etapa.nome, duracao)
	}

	// Simular falha aleatória (20%)
	if rand.Float64() < 0.20 {
		tx.Status = "REJECTED"
		return fmt.Errorf("transação rejeitada pelo SPI")
	}

	tx.Status = "SETTLED"
	return nil
}

// consultarComRetry consulta com retry e timeout
func consultarComRetry(ctx context.Context, tx *TransacaoSPI, maxTentativas int) error {
	for i := 1; i <= maxTentativas; i++ {
		fmt.Printf("\n  Tentativa %d/%d...\n", i, maxTentativas)

		// Timeout por tentativa (2 segundos)
		tentativaCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
		err := consultarSPI(tentativaCtx, tx, i)
		cancel()

		if err == nil {
			return nil // Sucesso
		}

		if ctx.Err() != nil {
			return fmt.Errorf("timeout global atingido: %w", ctx.Err())
		}

		if i < maxTentativas {
			fmt.Printf("    ⏳ Aguardando 500ms antes da próxima tentativa...\n")
			time.Sleep(500 * time.Millisecond)
		}
	}

	return fmt.Errorf("máximo de tentativas atingido (%d)", maxTentativas)
}

// processarTransacoes processa múltiplas transações concorrentemente
func processarTransacoes(ctx context.Context, transacoes []TransacaoSPI) []TransacaoSPI {
	var wg sync.WaitGroup
	resultados := make([]TransacaoSPI, len(transacoes))

	for i := range transacoes {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()

			fmt.Printf("Processando tx %s...\n", transacoes[idx].EndToEndID)

			// Clone da transação
			tx := transacoes[idx]

			// Consultar com retry
			err := consultarComRetry(ctx, &tx, 3)
			if err != nil {
				tx.Status = "FAILED"
				fmt.Printf("  ❌ %s: %v\n", tx.EndToEndID, err)
			} else {
				fmt.Printf("  ✅ %s: %s\n", tx.EndToEndID, tx.Status)
			}

			resultados[idx] = tx
		}(i)
	}

	wg.Wait()
	return resultados
}

func main() {
	rand.Seed(time.Now().UnixNano())

	fmt.Println("=== Banking Stack Pro - Exercício 05 ===")
	fmt.Println("Consulta SPI com Context e Timeout\n")

	// Criar 6 transações
	transacoes := []TransacaoSPI{
		{EndToEndID: "E2E001", Valor: 100.00, ISPBOrigem: "00000000", ISPBDestino: "60701190"},
		{EndToEndID: "E2E002", Valor: 250.50, ISPBOrigem: "00000000", ISPBDestino: "60701190"},
		{EndToEndID: "E2E003", Valor: 50.00, ISPBOrigem: "00000000", ISPBDestino: "60701190"},
		{EndToEndID: "E2E004", Valor: 1000.00, ISPBOrigem: "00000000", ISPBDestino: "60701190"},
		{EndToEndID: "E2E005", Valor: 75.25, ISPBOrigem: "00000000", ISPBDestino: "60701190"},
		{EndToEndID: "E2E006", Valor: 500.00, ISPBOrigem: "00000000", ISPBDestino: "60701190"},
	}

	// Context global com timeout de 10 segundos
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	start := time.Now()
	resultados := processarTransacoes(ctx, transacoes)
	elapsed := time.Since(start)

	// Estatísticas
	fmt.Println("\n=== Estatísticas ===")
	fmt.Printf("Tempo total: %v\n", elapsed)
	fmt.Printf("Timeout global: %v\n", ctx.Err())

	settled := 0
	failed := 0
	for _, tx := range resultados {
		if tx.Status == "SETTLED" {
			settled++
		} else {
			failed++
		}
	}

	fmt.Printf("Transações: %d\n", len(transacoes))
	fmt.Printf("Sucesso: %d\n", settled)
	fmt.Printf("Falha: %d\n", failed)
	fmt.Printf("Taxa sucesso: %.1f%%\n", float64(settled)/float64(len(transacoes))*100)

	// Verificar se context foi cancelado
	if ctx.Err() == context.DeadlineExceeded {
		fmt.Println("\n⚠️  Timeout global foi atingido!")
	} else if ctx.Err() == context.Canceled {
		fmt.Println("\n⚠️  Context foi cancelado manualmente!")
	} else {
		fmt.Println("\n✅ Todas as transações processadas dentro do timeout!")
	}
}
