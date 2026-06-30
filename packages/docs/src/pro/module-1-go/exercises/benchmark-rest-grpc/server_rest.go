//go:build ignore

package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"
)

type TransactionRequest struct {
	ID     string  `json:"id"`
	Amount float64 `json:"amount"`
	Type   string  `json:"type"`
}

type TransactionResponse struct {
	ID       string  `json:"id"`
	Status   string  `json:"status"`
	Amount   float64 `json:"amount"`
	ProcessedAt string `json:"processed_at"`
}

func processHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req TransactionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	resp := TransactionResponse{
		ID:          req.ID,
		Status:      "completed",
		Amount:      req.Amount,
		ProcessedAt: time.Now().UTC().Format(time.RFC3339Nano),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func main() {
	http.HandleFunc("/process", processHandler)
	http.HandleFunc("/health", healthHandler)
	log.Println("REST server listening on :9091")
	log.Fatal(http.ListenAndServe(":9091", nil))
}
