package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/mateussiqueira/banking-stack/dict-simulator-go/internal/handlers"
	"github.com/mateussiqueira/banking-stack/dict-simulator-go/internal/models"
	"github.com/mateussiqueira/banking-stack/dict-simulator-go/internal/service"
)

func setupTestRouter() (*chi.Mux, *service.DICTService) {
	store := models.NewStore()
	dict := service.NewDICTService(store)
	handler := handlers.NewDICTHandler(dict)

	r := chi.NewRouter()
	r.Route("/dict", func(r chi.Router) {
		r.Mount("/", handler.Routes())
	})

	return r, dict
}

func TestHandleHealth(t *testing.T) {
	r, _ := setupTestRouter()

	req := httptest.NewRequest("GET", "/dict/health", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}
}

func TestRegisterKey(t *testing.T) {
	r, dict := setupTestRouter()
	dict.Clear()

	body := `{
		"key": "12345678909",
		"keyType": "CPF",
		"accountType": "CHECKING",
		"ispb": "12345678",
		"branch": "0001",
		"accountNumber": "123456",
		"accountHolderName": "João Silva",
		"accountHolderDoc": "12345678909"
	}`

	req := httptest.NewRequest("POST", "/dict/entries", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("expected status 201, got %d: %s", w.Code, w.Body.String())
	}

	var result models.PixKey
	json.NewDecoder(w.Body).Decode(&result)

	if result.Key != "12345678909" {
		t.Errorf("expected key 12345678909, got %s", result.Key)
	}
	if result.Status != models.KeyStatusActive {
		t.Errorf("expected status ACTIVE, got %s", result.Status)
	}
}

func TestRegisterKeyDuplicate(t *testing.T) {
	r, dict := setupTestRouter()
	dict.Clear()

	body := `{
		"key": "12345678909",
		"keyType": "CPF",
		"accountType": "CHECKING",
		"ispb": "12345678",
		"branch": "0001",
		"accountNumber": "123456",
		"accountHolderName": "João Silva",
		"accountHolderDoc": "12345678909"
	}`

	// Primeiro registro
	req := httptest.NewRequest("POST", "/dict/entries", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	// Tentar registrar novamente
	req = httptest.NewRequest("POST", "/dict/entries", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusConflict {
		t.Errorf("expected status 409, got %d: %s", w.Code, w.Body.String())
	}
}

func TestLookupKey(t *testing.T) {
	r, dict := setupTestRouter()
	dict.Clear()

	// Registrar chave
	dict.RegisterKey("12345678909", "CPF", "CHECKING", "12345678", "0001", "123456", "João Silva", "12345678909")

	req := httptest.NewRequest("GET", "/dict/entries/12345678909", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}
}

func TestLookupKeyNotFound(t *testing.T) {
	r, _ := setupTestRouter()

	req := httptest.NewRequest("GET", "/dict/entries/99999999999", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected status 404, got %d", w.Code)
	}
}

func TestDeactivateKey(t *testing.T) {
	r, dict := setupTestRouter()
	dict.Clear()

	// Registrar chave
	dict.RegisterKey("12345678909", "CPF", "CHECKING", "12345678", "0001", "123456", "João Silva", "12345678909")

	req := httptest.NewRequest("DELETE", "/dict/entries/12345678909", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}

	var result models.PixKey
	json.NewDecoder(w.Body).Decode(&result)

	if result.Status != models.KeyStatusFrozen {
		t.Errorf("expected status FROZEN, got %s", result.Status)
	}
}

func TestRegisterEmailKey(t *testing.T) {
	r, dict := setupTestRouter()
	dict.Clear()

	body := `{
		"key": "joao@email.com",
		"keyType": "EMAIL",
		"accountType": "SAVINGS",
		"ispb": "12345678",
		"branch": "0001",
		"accountNumber": "789012",
		"accountHolderName": "João Silva",
		"accountHolderDoc": "12345678909"
	}`

	req := httptest.NewRequest("POST", "/dict/entries", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("expected status 201, got %d: %s", w.Code, w.Body.String())
	}

	var result models.PixKey
	json.NewDecoder(w.Body).Decode(&result)

	if result.Key != "joao@email.com" {
		t.Errorf("expected key joao@email.com, got %s", result.Key)
	}
}
