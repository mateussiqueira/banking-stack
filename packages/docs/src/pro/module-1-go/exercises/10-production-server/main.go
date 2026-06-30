package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"runtime"
	"sync"
	"syscall"
	"time"
)

// ==================== CONFIG ====================

type Config struct {
	Port         string
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
	IdleTimeout  time.Duration
}

func LoadConfig() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	return Config{
		Port:         port,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}
}

// ==================== STORE ====================

type Store struct {
	mu           sync.RWMutex
	transactions map[string]interface{}
	startedAt    time.Time
}

func NewStore() *Store {
	return &Store{
		transactions: make(map[string]interface{}),
		startedAt:    time.Now(),
	}
}

func (s *Store) Add(id string, data interface{}) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.transactions[id] = data
}

func (s *Store) Count() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.transactions)
}

func (s *Store) Uptime() time.Duration {
	return time.Since(s.startedAt)
}

// ==================== HEALTH ====================

func livenessHandler(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]string{
		"status": "alive",
	})
}

func readinessHandler(store *Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		checks := map[string]bool{
			"store": true,
		}

		allOK := true
		for _, ok := range checks {
			if !ok {
				allOK = false
				break
			}
		}

		status := http.StatusOK
		if !allOK {
			status = http.StatusServiceUnavailable
		}

		respondJSON(w, status, map[string]interface{}{
			"status":  statusText(status),
			"checks":  checks,
			"uptime":  store.Uptime().String(),
			"txCount": store.Count(),
		})
	}
}

// ==================== HANDLERS ====================

func processHandler(store *Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			respondError(w, http.StatusMethodNotAllowed, "Method not allowed")
			return
		}

		var req struct {
			EndToEndID string  `json:"endToEndId"`
			Valor      float64 `json:"valor"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		if req.Valor <= 0 {
			respondError(w, http.StatusBadRequest, "Valor deve ser positivo")
			return
		}

		time.Sleep(5 * time.Millisecond)

		tx := map[string]interface{}{
			"id":         fmt.Sprintf("TX-%d", time.Now().UnixNano()),
			"endToEndId": req.EndToEndID,
			"valor":      req.Valor,
			"status":     "ACCEPTED",
			"createdAt":  time.Now(),
		}

		store.Add(req.EndToEndID, tx)

		slog.Info("Transação processada",
			"endToEndId", req.EndToEndID,
			"valor", req.Valor,
		)

		respondJSON(w, http.StatusCreated, tx)
	}
}

// ==================== HELPERS ====================

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}

func statusText(code int) string {
	if code == http.StatusOK {
		return "healthy"
	}
	return "unhealthy"
}

// ==================== MAIN ====================

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	config := LoadConfig()
	store := NewStore()

	mux := http.NewServeMux()
	mux.HandleFunc("/health/live", livenessHandler)
	mux.HandleFunc("/health/ready", readinessHandler(store))
	mux.HandleFunc("/spi/process", processHandler(store))

	srv := &http.Server{
		Addr:         ":" + config.Port,
		Handler:      mux,
		ReadTimeout:  config.ReadTimeout,
		WriteTimeout: config.WriteTimeout,
		IdleTimeout:  config.IdleTimeout,
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		slog.Info("Servidor iniciando",
			"port", config.Port,
			"goroutines", runtime.NumGoroutine(),
		)
		if err := srv.ListenAndServe(); err != http.ErrServerClosed {
			slog.Error("Erro ao iniciar servidor", "error", err)
			os.Exit(1)
		}
	}()

	slog.Info("Servidor pronto para receber requisições")

	<-quit
	slog.Info("Sinal de shutdown recebido")

	shutdownCtx, shutdownCancel := context.WithTimeout(ctx, 30*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("Erro ao encerrar servidor", "error", err)
	}

	slog.Info("Servidor encerrado graciosamente")
}
