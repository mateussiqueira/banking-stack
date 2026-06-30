package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/mateussiqueira/banking-stack/ledger-go/internal/graphql"
	"github.com/mateussiqueira/banking-stack/ledger-go/internal/handlers"
	"github.com/mateussiqueira/banking-stack/ledger-go/internal/models"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	host := os.Getenv("HOST")
	if host == "" {
		host = "0.0.0.0"
	}

	// Inicializar dependências
	store := models.NewStore()
	schema, err := graphql.NewSchema(store)
	if err != nil {
		log.Fatalf("Failed to create GraphQL schema: %v", err)
	}

	graphqlHandler := handlers.NewGraphQLHandler(store, schema)

	// Configurar router
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)

	// CORS
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			next.ServeHTTP(w, r)
		})
	})

	// Rotas
	r.Mount("/", graphqlHandler.Routes())

	// Iniciar servidor
	addr := fmt.Sprintf("%s:%s", host, port)
	log.Printf("🚀 Ledger Go starting on %s", addr)
	log.Printf("📡 Endpoints:")
	log.Printf("   POST /graphql   - GraphQL API")
	log.Printf("   GET  /graphql   - GraphQL (query param)")
	log.Printf("   GET  /health    - Health Check")

	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
