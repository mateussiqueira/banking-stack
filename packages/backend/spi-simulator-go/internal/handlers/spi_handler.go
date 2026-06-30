package handlers

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/mateussiqueira/banking-stack/spi-simulator-go/internal/service"
)

type SPIHandler struct {
	spi *service.SPIService
}

func NewSPIHandler(spi *service.SPIService) *SPIHandler {
	return &SPIHandler{spi: spi}
}

func (h *SPIHandler) Routes() chi.Router {
	r := chi.NewRouter()

	r.Post("/pacs.008", h.HandlePacs008)
	r.Post("/pacs.002", h.HandlePacs002)
	r.Post("/pacs.004", h.HandlePacs004)
	r.Get("/transactions", h.HandleListTransactions)
	r.Get("/transactions/{endToEndId}", h.HandleGetTransaction)
	r.Get("/health", h.HandleHealth)

	return r
}

func (h *SPIHandler) HandlePacs008(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "failed to read request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	result, err := h.spi.ProcessPayment(body)
	if err != nil {
		writeError(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/xml")
	w.WriteHeader(http.StatusCreated)
	w.Write(result.StatusXML)
}

func (h *SPIHandler) HandlePacs002(w http.ResponseWriter, r *http.Request) {
	_, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "failed to read request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Acknowledge receipt
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "received",
		"message": "pacs.002 status report acknowledged",
	})
}

func (h *SPIHandler) HandlePacs004(w http.ResponseWriter, r *http.Request) {
	_, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "failed to read request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Acknowledge receipt
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "received",
		"message": "pacs.004 payment return acknowledged",
	})
}

func (h *SPIHandler) HandleListTransactions(w http.ResponseWriter, r *http.Request) {
	transactions := h.spi.ListTransactions()
	writeJSON(w, transactions, http.StatusOK)
}

func (h *SPIHandler) HandleGetTransaction(w http.ResponseWriter, r *http.Request) {
	endToEndID := chi.URLParam(r, "endToEndId")

	tx, ok := h.spi.GetTransaction(endToEndID)
	if !ok {
		writeError(w, "transaction not found", http.StatusNotFound)
		return
	}

	writeJSON(w, tx, http.StatusOK)
}

func (h *SPIHandler) HandleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, map[string]string{
		"status":  "healthy",
		"service": "spi-simulator-go",
	}, http.StatusOK)
}

func writeJSON(w http.ResponseWriter, data interface{}, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, message string, status int) {
	writeJSON(w, map[string]string{"error": message}, status)
}
