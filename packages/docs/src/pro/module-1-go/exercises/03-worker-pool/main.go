package main

import (
	"fmt"
	"math/rand"
	"sync"
	"time"
)

// Transacao representa uma transação SPI
type Transacao struct {
	ID       string
	Valor    float64
	Tipo     string
	Status   string
	WorkerID int
}

// worker processa transações do canal de jobs
func worker(id int, jobs <-chan Transacao, results chan<- Transacao, wg *sync.WaitGroup) {
	defer wg.Done()

	for tx := range jobs {
		// Simular processamento variável (10-100ms)
		processamento := time.Duration(10+rand.Intn(90)) * time.Millisecond
		time.Sleep(processamento)

		// Simular falha (5%)
		if rand.Float64() < 0.05 {
			tx.Status = "FAILED"
		} else {
			tx.Status = "COMPLETED"
		}

		tx.WorkerID = id
		results <- tx
	}
}

func main() {
	rand.Seed(time.Now().UnixNano())

	fmt.Println("=== Banking Stack Pro - Exercício 03 ===")
	fmt.Println("Worker Pool para Transações SPI\n")

	// Configuração
	numWorkers := 5
	numJobs := 20

	// Criar canais
	jobs := make(chan Transacao, numJobs)
	results := make(chan Transacao, numJobs)

	var wg sync.WaitGroup

	// Iniciar workers
	fmt.Printf("Iniciando %d workers...\n", numWorkers)
	for w := 1; w <= numWorkers; w++ {
		wg.Add(1)
		go worker(w, jobs, results, &wg)
	}

	// Enviar jobs
	fmt.Printf("Enviando %d transações...\n\n", numJobs)
	start := time.Now()

	tipos := []string{"PIX", "TED", "DOC", "TRANSFER"}
	for j := 1; j <= numJobs; j++ {
		jobs <- Transacao{
			ID:    fmt.Sprintf("TX-%03d", j),
			Valor: float64(rand.Intn(50000)) / 100,
			Tipo:  tipos[rand.Intn(len(tipos))],
		}
	}
	close(jobs)

	// Aguardar workers e fechar results
	go func() {
		wg.Wait()
		close(results)
	}()

	// Coletar resultados
	completed := 0
	failed := 0
	workerCounts := make(map[int]int)

	fmt.Println("=== Resultados ===")
	for tx := range results {
		if tx.Status == "COMPLETED" {
			completed++
		} else {
			failed++
		}
		workerCounts[tx.WorkerID]++

		emoji := "✅"
		if tx.Status == "FAILED" {
			emoji = "❌"
		}
		fmt.Printf("%s Tx %s: R$ %.2f (%s) - Worker %d\n",
			emoji, tx.ID, tx.Valor, tx.Tipo, tx.WorkerID)
	}

	totalTime := time.Since(start)

	// Estatísticas
	fmt.Println("\n=== Estatísticas ===")
	fmt.Printf("Tempo total: %v\n", totalTime)
	fmt.Printf("Transações: %d\n", numJobs)
	fmt.Printf("Completadas: %d\n", completed)
	fmt.Printf("Falharam: %d\n", failed)
	fmt.Printf("Throughput: %.2f tx/s\n", float64(numJobs)/totalTime.Seconds())

	fmt.Println("\nJobs por Worker:")
	for w := 1; w <= numWorkers; w++ {
		fmt.Printf("  Worker %d: %d transações\n", w, workerCounts[w])
	}
}
