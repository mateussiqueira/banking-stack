package main

import (
	"fmt"
	"log"
	"net"
	"net/rpc"
	"sync"
	"time"
)

// ==================== TYPES ====================

type Transacao struct {
	ID          string
	EndToEndID  string
	Valor       float64
	ISPBOrigem  string
	ISPBDestino string
	NomeOrigem  string
	NomeDestino string
	Status      string
	DataCriacao time.Time
}

type ProcessPaymentRequest struct {
	EndToEndID  string
	Valor       float64
	ISPBOrigem  string
	ISPBDestino string
	NomeOrigem  string
	NomeDestino string
}

type ProcessPaymentResponse struct {
	Sucesso   bool
	Mensagem  string
	Transacao Transacao
}

type GetTransactionRequest struct {
	EndToEndID string
}

type GetTransactionResponse struct {
	Encontrada bool
	Transacao  Transacao
}

type ListTransactionsRequest struct {
	Limite int
}

type ListTransactionsResponse struct {
	Transacoes []Transacao
	Total      int
}

// ==================== SERVER ====================

type SPIService struct {
	mu           sync.RWMutex
	transactions map[string]*Transacao
}

func NewSPIService() *SPIService {
	return &SPIService{
		transactions: make(map[string]*Transacao),
	}
}

func (s *SPIService) ProcessPayment(req ProcessPaymentRequest, resp *ProcessPaymentResponse) error {
	if req.Valor <= 0 {
		resp.Sucesso = false
		resp.Mensagem = "valor deve ser positivo"
		return nil
	}

	if len(req.ISPBOrigem) != 8 || len(req.ISPBDestino) != 8 {
		resp.Sucesso = false
		resp.Mensagem = "ISPB deve ter 8 dígitos"
		return nil
	}

	if req.EndToEndID == "" {
		resp.Sucesso = false
		resp.Mensagem = "EndToEndID é obrigatório"
		return nil
	}

	s.mu.RLock()
	if _, exists := s.transactions[req.EndToEndID]; exists {
		s.mu.RUnlock()
		resp.Sucesso = false
		resp.Mensagem = "transação já existe"
		return nil
	}
	s.mu.RUnlock()

	tx := Transacao{
		ID:          fmt.Sprintf("TX-%d", time.Now().UnixNano()),
		EndToEndID:  req.EndToEndID,
		Valor:       req.Valor,
		ISPBOrigem:  req.ISPBOrigem,
		ISPBDestino: req.ISPBDestino,
		NomeOrigem:  req.NomeOrigem,
		NomeDestino: req.NomeDestino,
		Status:      "ACCEPTED",
		DataCriacao: time.Now(),
	}

	s.mu.Lock()
	s.transactions[tx.EndToEndID] = &tx
	s.mu.Unlock()

	resp.Sucesso = true
	resp.Mensagem = "Transação processada com sucesso"
	resp.Transacao = tx

	log.Printf("[SPI] Nova transação: %s | R$ %.2f | %s → %s",
		tx.EndToEndID, tx.Valor, tx.ISPBOrigem, tx.ISPBDestino)

	return nil
}

func (s *SPIService) GetTransaction(req GetTransactionRequest, resp *GetTransactionResponse) error {
	s.mu.RLock()
	defer s.mu.RUnlock()

	tx, exists := s.transactions[req.EndToEndID]
	if !exists {
		resp.Encontrada = false
		return nil
	}

	resp.Encontrada = true
	resp.Transacao = *tx
	return nil
}

func (s *SPIService) ListTransactions(req ListTransactionsRequest, resp *ListTransactionsResponse) error {
	s.mu.RLock()
	defer s.mu.RUnlock()

	limite := req.Limite
	if limite <= 0 {
		limite = 10
	}

	count := 0
	for _, tx := range s.transactions {
		if count >= limite {
			break
		}
		resp.Transacoes = append(resp.Transacoes, *tx)
		count++
	}

	resp.Total = len(s.transactions)
	return nil
}

// ==================== MAIN ====================

func main() {
	service := NewSPIService()
	rpc.Register(service)

	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatal(err)
	}
	defer lis.Close()

	fmt.Println("=== Banking Stack Pro - Exercício 06 ===")
	fmt.Println("SPI gRPC Server (net/rpc)\n")
	fmt.Println("📡 Endpoints:")
	fmt.Println("   SPIService.ProcessPayment   - Processar pagamento")
	fmt.Println("   SPIService.GetTransaction   - Buscar transação")
	fmt.Println("   SPIService.ListTransactions - Listar transações")
	fmt.Println("\n⏳ Aguardando conexões na porta 50051...\n")

	// Rodar client em goroutine
	go runClient()

	// Aceitar conexões
	for {
		conn, err := lis.Accept()
		if err != nil {
			log.Printf("Accept error: %v", err)
			continue
		}
		go rpc.ServeConn(conn)
	}
}

func runClient() {
	time.Sleep(1 * time.Second)

	client, err := rpc.Dial("tcp", "localhost:50051")
	if err != nil {
		log.Fatal("Erro ao conectar:", err)
	}
	defer client.Close()

	fmt.Println("=== CLIENT: Processando Pagamento ===")
	var resp1 ProcessPaymentResponse
	client.Call("SPIService.ProcessPayment", ProcessPaymentRequest{
		EndToEndID:  "E2E20240101120000TEST001",
		Valor:       250.50,
		ISPBOrigem:  "00000000",
		ISPBDestino: "60701190",
		NomeOrigem:  "Maria Santos",
		NomeDestino: "João Silva",
	}, &resp1)
	fmt.Printf("Sucesso: %v | Mensagem: %s\n", resp1.Sucesso, resp1.Mensagem)
	fmt.Printf("Transação: %s | R$ %.2f | %s\n\n",
		resp1.Transacao.EndToEndID, resp1.Transacao.Valor, resp1.Transacao.Status)

	time.Sleep(100 * time.Millisecond)

	fmt.Println("=== CLIENT: Buscando Transação ===")
	var resp2 GetTransactionResponse
	client.Call("SPIService.GetTransaction", GetTransactionRequest{
		EndToEndID: "E2E20240101120000TEST001",
	}, &resp2)
	if resp2.Encontrada {
		fmt.Printf("Encontrada: %s | R$ %.2f\n\n",
			resp2.Transacao.EndToEndID, resp2.Transacao.Valor)
	}

	fmt.Println("=== CLIENT: Listando Transações ===")
	var resp3 ListTransactionsResponse
	client.Call("SPIService.ListTransactions", ListTransactionsRequest{Limite: 10}, &resp3)
	fmt.Printf("Total: %d transações\n", resp3.Total)
	for i, tx := range resp3.Transacoes {
		fmt.Printf("  %d. %s | R$ %.2f | %s\n", i+1, tx.EndToEndID, tx.Valor, tx.Status)
	}

	fmt.Println("\n✅ Demo gRPC concluída!")
	fmt.Println("🛑 Servidor encerrando...")
	time.Sleep(500 * time.Millisecond)
	fmt.Println("👋 Até a próxima aula!")
}
