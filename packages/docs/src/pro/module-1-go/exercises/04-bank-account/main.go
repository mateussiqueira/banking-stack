package main

import (
	"fmt"
	"math/rand"
	"sync"
	"time"
)

// Conta bancária com sincronização segura
type Conta struct {
	mu        sync.RWMutex
	nome      string
	saldo     float64
	historico []string
}

// NovaConta cria uma nova conta bancária
func NovaConta(nome string, saldoInicial float64) *Conta {
	return &Conta{
		nome:  nome,
		saldo: saldoInicial,
	}
}

// Depositar adiciona valor à conta
func (c *Conta) Depositar(valor float64) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.saldo += valor
	c.historico = append(c.historico,
		fmt.Sprintf("[%s] +R$ %.2f (depósito)", time.Now().Format("15:04:05"), valor))
}

// Sacar remove valor da conta
func (c *Conta) Sacar(valor float64) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.saldo < valor {
		return fmt.Errorf("saldo insuficiente: R$ %.2f", c.saldo)
	}

	c.saldo -= valor
	c.historico = append(c.historico,
		fmt.Sprintf("[%s] -R$ %.2f (saque)", time.Now().Format("15:04:05"), valor))
	return nil
}

// VerSaldo retorna o saldo atual (leitura segura)
func (c *Conta) VerSaldo() float64 {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.saldo
}

// VerHistorico retorna o histórico de transações
func (c *Conta) VerHistorico() []string {
	c.mu.RLock()
	defer c.mu.RUnlock()

	hist := make([]string, len(c.historico))
	copy(hist, c.historico)
	return hist
}

// Transferir move valor para outra conta (atômico)
func (c *Conta) Transferir(destino *Conta, valor float64) error {
	// Ordem fixa de locks para evitar deadlock
 primeira, segunda := c, destino
	if c.nome > destino.nome {
		primeira, segunda = destino, c
	}

	primeira.mu.Lock()
	defer primeira.mu.Unlock()
	segunda.mu.Lock()
	defer segunda.mu.Unlock()

	if c.saldo < valor {
		return fmt.Errorf("saldo insuficiente em %s: R$ %.2f", c.nome, c.saldo)
	}

	c.saldo -= valor
	destino.saldo += valor

	c.historico = append(c.historico,
		fmt.Sprintf("[%s] -R$ %.2f (transferência p/ %s)", time.Now().Format("15:04:05"), valor, destino.nome))
	destino.historico = append(destino.historico,
		fmt.Sprintf("[%s] +R$ %.2f (transferência d/ %s)", time.Now().Format("15:04:05"), valor, c.nome))

	return nil
}

func main() {
	rand.Seed(time.Now().UnixNano())

	fmt.Println("=== Banking Stack Pro - Exercício 04 ===")
	fmt.Println("Conta Bancária Segura com sync\n")

	// Criar contas
	alice := NovaConta("Alice", 10000)
	bob := NovaConta("Bob", 5000)

	fmt.Printf("Estado inicial:\n")
	fmt.Printf("  Alice: R$ %.2f\n", alice.VerSaldo())
	fmt.Printf("  Bob:   R$ %.2f\n\n", bob.VerSaldo())

	var wg sync.WaitGroup

	// Simular 20 depósitos concorrentes em Alice
	for i := 0; i < 20; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			alice.Depositar(float64(100 + rand.Intn(900)))
		}(i)
	}

	// Simular 15 saques concorrentes de Bob
	for i := 0; i < 15; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			bob.Sacar(float64(50 + rand.Intn(200)))
		}(i)
	}

	// Simular 10 transferências Alice → Bob
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			valor := float64(100 + rand.Intn(500))
			if err := alice.Transferir(bob, valor); err != nil {
				fmt.Printf("  Transferência falhou: %v\n", err)
			}
		}(i)
	}

	// Simular 10 transferências Bob → Alice
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			valor := float64(50 + rand.Intn(300))
			if err := bob.Transferir(alice, valor); err != nil {
				fmt.Printf("  Transferência falhou: %v\n", err)
			}
		}(i)
	}

	wg.Wait()

	fmt.Println("\n=== Estado Final ===")
	fmt.Printf("Alice: R$ %.2f\n", alice.VerSaldo())
	fmt.Printf("Bob:   R$ %.2f\n", bob.VerSaldo())

	totalAlice := alice.VerSaldo() + bob.VerSaldo()
	totalDepositos := 20 * 500.0 // Média de 500 por depósito (100-1000)
	esperado := 15000.0 + totalDepositos
	fmt.Printf("\nTotal do sistema: R$ %.2f\n", totalAlice)
	fmt.Printf("Esperado (aprox): R$ %.2f\n", esperado)

	if totalAlice > 14000 && totalAlice < 26000 {
		fmt.Println("\n✅ Validação OK - Valores dentro do esperado!")
	} else {
		fmt.Println("\n❌ Erro - Valores fora do esperado!")
	}

	// Mostrar últimas transações
	fmt.Println("\n=== Últimas 5 transações de Alice ===")
	hist := alice.VerHistorico()
	start := len(hist) - 5
	if start < 0 {
		start = 0
	}
	for _, h := range hist[start:] {
		fmt.Printf("  %s\n", h)
	}
}
