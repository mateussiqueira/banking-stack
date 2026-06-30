package handlers

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/go-chi/chi/v5"
	gographql "github.com/graphql-go/graphql"
	"github.com/mateussiqueira/banking-stack/ledger-go/internal/models"
)

type GraphQLHandler struct {
	schema gographql.Schema
	store  *models.Store
}

func NewGraphQLHandler(store *models.Store, schema gographql.Schema) *GraphQLHandler {
	return &GraphQLHandler{schema: schema, store: store}
}

func (h *GraphQLHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Post("/graphql", h.HandleGraphQL)
	r.Get("/graphql", h.HandleGraphQLGet)
	r.Get("/health", h.HandleHealth)
	return r
}

func (h *GraphQLHandler) HandleGraphQL(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		writeError(w, "failed to read request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	var request struct {
		Query     string                 `json:"query"`
		Operation string                 `json:"operationName"`
		Variables map[string]interface{} `json:"variables"`
	}

	if err := json.Unmarshal(body, &request); err != nil {
		writeError(w, "invalid JSON", http.StatusBadRequest)
		return
	}

	result := gographql.Do(gographql.Params{
		Schema:         h.schema,
		RequestString:  request.Query,
		VariableValues: request.Variables,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func (h *GraphQLHandler) HandleGraphQLGet(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("query")
	if query == "" {
		writeError(w, "query parameter required", http.StatusBadRequest)
		return
	}

	result := gographql.Do(gographql.Params{
		Schema:        h.schema,
		RequestString: query,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func (h *GraphQLHandler) HandleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, map[string]string{
		"status":  "healthy",
		"service": "ledger-go",
	}, http.StatusOK)
}

func writeJSON(w http.ResponseWriter, data interface{}, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, message string, status int) {
	writeJSON(w, map[string]interface{}{
		"errors": []map[string]string{{"message": message}},
	}, status)
}
