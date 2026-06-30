package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/mateussiqueira/banking-stack/spi-simulator-go/internal/handlers"
	"github.com/mateussiqueira/banking-stack/spi-simulator-go/internal/models"
	"github.com/mateussiqueira/banking-stack/spi-simulator-go/internal/service"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3002"
	}

	host := os.Getenv("HOST")
	if host == "" {
		host = "0.0.0.0"
	}

	// Inicializar dependências
	store := models.NewTransactionStore()
	spiService := service.NewSPIService(store)
	spiHandler := handlers.NewSPIHandler(spiService)

	// Configurar router
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)

	// CORS (para desenvolvimento)
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			next.ServeHTTP(w, r)
		})
	})

	// Rotas
	r.Route("/spi", func(r chi.Router) {
		r.Mount("/", spiHandler.Routes())
	})

	// Iniciar servidor
	addr := fmt.Sprintf("%s:%s", host, port)
	log.Printf("🚀 SPI Simulator Go starting on %s", addr)
	log.Printf("📡 Endpoints:")
	log.Printf("   POST /spi/pacs.008     - Credit Transfer")
	log.Printf("   POST /spi/pacs.002     - Status Report")
	log.Printf("   POST /spi/pacs.004     - Payment Return")
	log.Printf("   GET  /spi/transactions  - List Transactions")
	log.Printf("   GET  /spi/health        - Health Check")

	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
