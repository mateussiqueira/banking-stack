package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"sync"
	"time"
)

// ==================== TYPES ====================

type TransacaoSPI struct {
	ID          string    `json:"id"`
	EndToEndID  string    `json:"endToEndId"`
	Valor       float64   `json:"valor"`
	ISPBOrigem  string    `json:"ispbOrigem"`
	ISPBDestino string    `json:"ispbDestino"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"createdAt"`
}

type ProcessRequest struct {
	EndToEndID  string  `json:"endToEndId"`
	Valor       float64 `json:"valor"`
	ISPBOrigem  string  `json:"ispbOrigem"`
	ISPBDestino string  `json:"ispbDestino"`
}

type ProcessResponse struct {
	Sucesso  bool        `json:"sucesso"`
	Mensagem string      `json:"mensagem"`
	Transacao *TransacaoSPI `json:"transacao,omitempty"`
}

// ==================== STORE ====================

type Store struct {
	mu           sync.RWMutex
	transactions map[string]*TransacaoSPI
}

func NewStore() *Store {
	return &Store{
		transactions: make(map[string]*TransacaoSPI),
	}
}

func (s *Store) Add(tx *TransacaoSPI) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.transactions[tx.EndToEndID] = tx
}

func (s *Store) Get(endToEndID string) (*TransacaoSPI, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	tx, ok := s.transactions[endToEndID]
	return tx, ok
}

func (s *Store) Count() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.transactions)
}

// ==================== HANDLERS ====================

var store = NewStore()

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":       "healthy",
		"service":      "spi-simulator",
		"transactions": store.Count(),
		"timestamp":    time.Now(),
	})
}

func processHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ProcessRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ProcessResponse{
			Sucesso:  false,
			Mensagem: "Invalid request body",
		})
		return
	}

	// Validações
	if req.Valor <= 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ProcessResponse{
			Sucesso:  false,
			Mensagem: "Valor deve ser positivo",
		})
		return
	}

	if len(req.ISPBOrigem) != 8 || len(req.ISPBDestino) != 8 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ProcessResponse{
			Sucesso:  false,
			Mensagem: "ISPB deve ter 8 dígitos",
		})
		return
	}

	// Verificar duplicata
	if _, exists := store.Get(req.EndToEndID); exists {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusConflict)
		json.NewEncoder(w).Encode(ProcessResponse{
			Sucesso:  false,
			Mensagem: "Transação já existe",
		})
		return
	}

	// Simular latência (1-10ms)
	time.Sleep(time.Duration(1+rand.Intn(10)) * time.Millisecond)

	// Criar transação
	tx := &TransacaoSPI{
		ID:          fmt.Sprintf("TX-%d", time.Now().UnixNano()),
		EndToEndID:  req.EndToEndID,
		Valor:       req.Valor,
		ISPBOrigem:  req.ISPBOrigem,
		ISPBDestino: req.ISPBDestino,
		Status:      "ACCEPTED",
		CreatedAt:   time.Now(),
	}

	store.Add(tx)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(ProcessResponse{
		Sucesso:   true,
		Mensagem:  "Transação processada com sucesso",
		Transacao: tx,
	})
}

func getTransactionHandler(w http.ResponseWriter, r *http.Request) {
	endToEndID := r.URL.Query().Get("endToEndId")
	if endToEndID == "" {
		http.Error(w, "endToEndId required", http.StatusBadRequest)
		return
	}

	tx, exists := store.Get(endToEndID)
	if !exists {
		http.Error(w, "Transaction not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tx)
}

// ==================== MAIN ====================

func main() {
	rand.Seed(time.Now().UnixNano())

	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/spi/pacs.008", processHandler)
	http.HandleFunc("/spi/transactions", getTransactionHandler)

	fmt.Println("=== SPI Simulator for Load Testing ===")
	fmt.Println()
	fmt.Println("📡 Endpoints:")
	fmt.Println("   GET  /health              - Health check")
	fmt.Println("   POST /spi/pacs.008       - Processar transação")
	fmt.Println("   GET  /spi/transactions   - Buscar transação")
	fmt.Println()
	fmt.Println("🚀 Servidor rodando em http://localhost:9090")
	fmt.Println()
	fmt.Println("Para rodar o teste de carga:")
	fmt.Println("   k6 run load-test.js")
	fmt.Println()

	log.Fatal(http.ListenAndServe(":9090", nil))
}
