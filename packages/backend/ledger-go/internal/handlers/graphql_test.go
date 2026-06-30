package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/mateussiqueira/banking-stack/ledger-go/internal/graphql"
	"github.com/mateussiqueira/banking-stack/ledger-go/internal/handlers"
	"github.com/mateussiqueira/banking-stack/ledger-go/internal/models"
)

func setupTestRouter() (*chi.Mux, *models.Store) {
	store := models.NewStore()
	schema, _ := graphql.NewSchema(store)
	handler := handlers.NewGraphQLHandler(store, schema)

	r := chi.NewRouter()
	r.Mount("/", handler.Routes())

	return r, store
}

func TestHandleHealth(t *testing.T) {
	r, _ := setupTestRouter()

	req := httptest.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}
}

func TestCreateAccount(t *testing.T) {
	r, store := setupTestRouter()
	store.Clear()

	query := `{
		"query": "mutation { createAccount(name: \"João Silva\", document: \"12345678909\", initialBalance: 1000) { id name document balance } }"
	}`

	req := httptest.NewRequest("POST", "/graphql", bytes.NewReader([]byte(query)))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	var result map[string]interface{}
	json.NewDecoder(w.Body).Decode(&result)

	if result["errors"] != nil {
		t.Errorf("unexpected errors: %v", result["errors"])
	}

	data := result["data"].(map[string]interface{})
	account := data["createAccount"].(map[string]interface{})

	if account["name"] != "João Silva" {
		t.Errorf("expected name João Silva, got %v", account["name"])
	}
	if account["balance"] != float64(1000) {
		t.Errorf("expected balance 1000, got %v", account["balance"])
	}
}

func TestCreateTransaction(t *testing.T) {
	r, store := setupTestRouter()
	store.Clear()

	// Criar contas
	sender, _ := store.CreateAccount("Sender", "11111111111", 1000)
	receiver, _ := store.CreateAccount("Receiver", "22222222222", 500)

	query := `{
		"query": "mutation { createTransaction(senderAccountId: \"` + sender.ID + `\", receiverAccountId: \"` + receiver.ID + `\", amount: 200, type: \"PIX\", description: \"Test transfer\") { id amount status } }"
	}`

	req := httptest.NewRequest("POST", "/graphql", bytes.NewReader([]byte(query)))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	var result map[string]interface{}
	json.NewDecoder(w.Body).Decode(&result)

	if result["errors"] != nil {
		t.Errorf("unexpected errors: %v", result["errors"])
	}

	data := result["data"].(map[string]interface{})
	tx := data["createTransaction"].(map[string]interface{})

	if tx["amount"] != float64(200) {
		t.Errorf("expected amount 200, got %v", tx["amount"])
	}
	if tx["status"] != "COMPLETED" {
		t.Errorf("expected status COMPLETED, got %v", tx["status"])
	}

	// Verificar saldos
	updatedSender, _ := store.GetAccount(sender.ID)
	updatedReceiver, _ := store.GetAccount(receiver.ID)

	if updatedSender.Balance != 800 {
		t.Errorf("expected sender balance 800, got %f", updatedSender.Balance)
	}
	if updatedReceiver.Balance != 700 {
		t.Errorf("expected receiver balance 700, got %f", updatedReceiver.Balance)
	}
}

func TestInsufficientFunds(t *testing.T) {
	r, store := setupTestRouter()
	store.Clear()

	sender, _ := store.CreateAccount("Poor Sender", "33333333333", 100)
	receiver, _ := store.CreateAccount("Receiver", "44444444444", 500)

	query := `{
		"query": "mutation { createTransaction(senderAccountId: \"` + sender.ID + `\", receiverAccountId: \"` + receiver.ID + `\", amount: 500, type: \"PIX\") { id } }"
	}`

	req := httptest.NewRequest("POST", "/graphql", bytes.NewReader([]byte(query)))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	var result map[string]interface{}
	json.NewDecoder(w.Body).Decode(&result)

	// Deve retornar erro
	if result["errors"] == nil {
		t.Error("expected errors for insufficient funds")
	}
}

func TestListAccounts(t *testing.T) {
	r, store := setupTestRouter()
	store.Clear()

	store.CreateAccount("Account 1", "11111111111", 100)
	store.CreateAccount("Account 2", "22222222222", 200)
	store.CreateAccount("Account 3", "33333333333", 300)

	query := `{
		"query": "{ accounts(page: 1, limit: 2) { id name balance } }"
	}`

	req := httptest.NewRequest("POST", "/graphql", bytes.NewReader([]byte(query)))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	var result map[string]interface{}
	json.NewDecoder(w.Body).Decode(&result)

	data := result["data"].(map[string]interface{})
	accounts := data["accounts"].([]interface{})

	if len(accounts) != 2 {
		t.Errorf("expected 2 accounts, got %d", len(accounts))
	}
}
