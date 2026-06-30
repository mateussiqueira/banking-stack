package handlers_test

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/mateussiqueira/banking-stack/spi-simulator-go/internal/handlers"
	"github.com/mateussiqueira/banking-stack/spi-simulator-go/internal/iso20022"
	"github.com/mateussiqueira/banking-stack/spi-simulator-go/internal/models"
	"github.com/mateussiqueira/banking-stack/spi-simulator-go/internal/service"
)

func setupTestRouter() (*chi.Mux, *service.SPIService) {
	store := models.NewTransactionStore()
	spi := service.NewSPIService(store)
	handler := handlers.NewSPIHandler(spi)

	r := chi.NewRouter()
	r.Route("/spi", func(r chi.Router) {
		r.Mount("/", handler.Routes())
	})

	return r, spi
}

func TestHandleHealth(t *testing.T) {
	r, _ := setupTestRouter()

	req := httptest.NewRequest("GET", "/spi/health", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}

	body := w.Body.String()
	if !bytes.Contains([]byte(body), []byte("healthy")) {
		t.Errorf("expected healthy status, got %s", body)
	}
}

func TestHandlePacs008(t *testing.T) {
	r, spi := setupTestRouter()
	spi.ClearTransactions()

	xmlData, _ := iso20022.BuildPacs008(
		"E2E20240101120000ABC12345",
		"TX001",
		150.00,
		"12345678",
		"Creditor Ltd",
		"87654321",
		"Debtor Inc",
	)

	req := httptest.NewRequest("POST", "/spi/pacs.008", bytes.NewReader(xmlData))
	req.Header.Set("Content-Type", "application/xml")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("expected status 201, got %d: %s", w.Code, w.Body.String())
	}

	body := w.Body.String()
	if !bytes.Contains([]byte(body), []byte("ACCP")) {
		t.Errorf("expected ACCP status, got %s", body)
	}
}

func TestHandleListTransactions(t *testing.T) {
	r, spi := setupTestRouter()
	spi.ClearTransactions()

	// Adicionar uma transação
	xmlData, _ := iso20022.BuildPacs008(
		"E2E20240101120000XYZ99999",
		"TX002",
		250.50,
		"12345678",
		"Test Creditor",
		"87654321",
		"Test Debtor",
	)
	spi.ProcessPayment(xmlData)

	req := httptest.NewRequest("GET", "/spi/transactions", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}

	body := w.Body.String()
	if !bytes.Contains([]byte(body), []byte("E2E20240101120000XYZ99999")) {
		t.Errorf("expected transaction in response, got %s", body)
	}
}

func TestHandleGetTransaction(t *testing.T) {
	r, spi := setupTestRouter()
	spi.ClearTransactions()

	endToEndID := "E2E20240101120000GET11111"
	xmlData, _ := iso20022.BuildPacs008(
		endToEndID,
		"TX003",
		500.00,
		"12345678",
		"Get Test Creditor",
		"87654321",
		"Get Test Debtor",
	)
	spi.ProcessPayment(xmlData)

	req := httptest.NewRequest("GET", "/spi/transactions/"+endToEndID, nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}

	body := w.Body.String()
	if !bytes.Contains([]byte(body), []byte(endToEndID)) {
		t.Errorf("expected EndToEndId in response, got %s", body)
	}
}

func TestFullLifecycle(t *testing.T) {
	r, spi := setupTestRouter()
	spi.ClearTransactions()

	endToEndID := "E2E20240101120000LIFECYCLE"
	txID := "TX_LIFECYCLE"

	// 1. Process payment
	xmlData, _ := iso20022.BuildPacs008(endToEndID, txID, 1000.00, "12345678", "Lifecycle Creditor", "87654321", "Lifecycle Debtor")
	req := httptest.NewRequest("POST", "/spi/pacs.008", bytes.NewReader(xmlData))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Step 1 failed: expected 201, got %d", w.Code)
	}

	// Verificar status via get
	req = httptest.NewRequest("GET", "/spi/transactions/"+endToEndID, nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if !bytes.Contains(w.Body.Bytes(), []byte("ACCEPTED")) {
		t.Errorf("expected ACCEPTED status, got %s", w.Body.String())
	}
}
