package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/mateussiqueira/banking-stack/dict-simulator-go/internal/handlers"
	"github.com/mateussiqueira/banking-stack/dict-simulator-go/internal/models"
	"github.com/mateussiqueira/banking-stack/dict-simulator-go/internal/service"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3003"
	}

	host := os.Getenv("HOST")
	if host == "" {
		host = "0.0.0.0"
	}

	// Inicializar dependências
	store := models.NewStore()
	dictService := service.NewDICTService(store)
	dictHandler := handlers.NewDICTHandler(dictService)

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
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			next.ServeHTTP(w, r)
		})
	})

	// Rotas
	r.Route("/dict", func(r chi.Router) {
		r.Mount("/", dictHandler.Routes())
	})

	// Iniciar servidor
	addr := fmt.Sprintf("%s:%s", host, port)
	log.Printf("🚀 DICT Simulator Go starting on %s", addr)
	log.Printf("📡 Endpoints:")
	log.Printf("   POST   /dict/entries              - Register Pix Key")
	log.Printf("   GET    /dict/entries              - List Pix Keys")
	log.Printf("   GET    /dict/entries/{key}        - Lookup Pix Key")
	log.Printf("   PATCH  /dict/entries/{key}        - Update Pix Key")
	log.Printf("   DELETE /dict/entries/{key}        - Deactivate Pix Key")
	log.Printf("   POST   /dict/claims              - Create Claim")
	log.Printf("   GET    /dict/claims/{id}         - Get Claim")
	log.Printf("   POST   /dict/claims/{id}/confirm - Confirm Claim")
	log.Printf("   POST   /dict/claims/{id}/cancel  - Cancel Claim")
	log.Printf("   GET    /dict/health              - Health Check")

	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
