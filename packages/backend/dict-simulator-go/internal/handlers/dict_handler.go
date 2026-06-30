package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/mateussiqueira/banking-stack/dict-simulator-go/internal/service"
)

type DICTHandler struct {
	dict             *service.DICTService
	acid             *service.ACIDManager
	antiEnumeration  *service.AntiEnumeration
}

func NewDICTHandler(dict *service.DICTService) *DICTHandler {
	return &DICTHandler{
		dict:            dict,
		acid:            service.NewACIDManager(),
		antiEnumeration: service.NewAntiEnumeration(),
	}
}

func NewDICTHandlerWithProtection(dict *service.DICTService, acid *service.ACIDManager, ae *service.AntiEnumeration) *DICTHandler {
	return &DICTHandler{
		dict:            dict,
		acid:            acid,
		antiEnumeration: ae,
	}
}

func (h *DICTHandler) Routes() chi.Router {
	r := chi.NewRouter()

	r.Use(h.rateLimitMiddleware)

	r.Post("/entries", h.HandleRegisterKey)
	r.Get("/entries", h.HandleListKeys)
	r.Get("/entries/{key}", h.HandleLookupKey)
	r.Patch("/entries/{key}", h.HandleUpdateKey)
	r.Delete("/entries/{key}", h.HandleDeactivateKey)

	r.Post("/claims", h.HandleCreateClaim)
	r.Get("/claims/{id}", h.HandleGetClaim)
	r.Post("/claims/{id}/confirm", h.HandleConfirmClaim)
	r.Post("/claims/{id}/cancel", h.HandleCancelClaim)

	r.Get("/health", h.HandleHealth)
	r.Get("/transactions", h.HandleListTransactions)
	r.Get("/transactions/{txId}", h.HandleGetTransaction)
	r.Get("/anti-enumeration/suspicious", h.HandleGetSuspicious)

	return r
}

func (h *DICTHandler) rateLimitMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := r.RemoteAddr
		if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
			ip = strings.Split(forwarded, ",")[0]
		}
		if realIP := r.Header.Get("X-Real-IP"); realIP != "" {
			ip = realIP
		}

		if !h.antiEnumeration.CheckIPLimit(ip) {
			log.Printf("[RATE-LIMIT] IP %s exceeded rate limit", ip)
			h.antiEnumeration.LogSuspicious(ip, "", "IP_RATE_LIMIT_EXCEEDED", h.antiEnumeration.GetIPCount(ip))
			writeError(w, "rate limit exceeded", http.StatusTooManyRequests)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// Entries

func (h *DICTHandler) HandleRegisterKey(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Key               string `json:"key"`
		KeyType           string `json:"keyType"`
		AccountType       string `json:"accountType"`
		ISPB              string `json:"ispb"`
		Branch            string `json:"branch"`
		AccountNumber     string `json:"accountNumber"`
		AccountHolderName string `json:"accountHolderName"`
		AccountHolderDoc  string `json:"accountHolderDoc"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "invalid request body", http.StatusBadRequest)
		return
	}

	key, err := h.dict.RegisterKey(
		req.Key, req.KeyType, req.AccountType,
		req.ISPB, req.Branch, req.AccountNumber,
		req.AccountHolderName, req.AccountHolderDoc,
	)
	if err != nil {
		status := http.StatusUnprocessableEntity
		if err.Error()[:len("key already registered")] == "key already registered" {
			status = http.StatusConflict
		}
		writeError(w, err.Error(), status)
		return
	}

	writeJSON(w, key, http.StatusCreated)
}

func (h *DICTHandler) HandleLookupKey(w http.ResponseWriter, r *http.Request) {
	key := chi.URLParam(r, "key")

	ip := r.RemoteAddr
	if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
		ip = strings.Split(forwarded, ",")[0]
	}
	if realIP := r.Header.Get("X-Real-IP"); realIP != "" {
		ip = realIP
	}

	if !h.antiEnumeration.CheckAccountLimit(key) {
		h.antiEnumeration.LogSuspicious(ip, key, "ACCOUNT_LOOKUP_LIMIT", h.antiEnumeration.GetAccountCount(key))
		log.Printf("[ANTI-ENUM] Account %s lookup limit exceeded from IP %s", h.antiEnumeration.MaskPartialResult(key), ip)
		writeError(w, "lookup limit exceeded for this key", http.StatusTooManyRequests)
		return
	}

	result, err := h.dict.LookupKey(key)
	if err != nil {
		writeError(w, "key not found", http.StatusNotFound)
		return
	}

	ownISPB := r.Header.Get("X-ISPB")
	if ownISPB != "" && result.ISPB != ownISPB {
		result.AccountHolderDoc = h.antiEnumeration.MaskPartialResult(result.AccountHolderDoc)
		result.AccountNumber = h.antiEnumeration.MaskPartialResult(result.AccountNumber)
	}

	writeJSON(w, result, http.StatusOK)
}

func (h *DICTHandler) HandleUpdateKey(w http.ResponseWriter, r *http.Request) {
	key := chi.URLParam(r, "key")

	var req struct {
		AccountHolderName string `json:"accountHolderName"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "invalid request body", http.StatusBadRequest)
		return
	}

	result, err := h.dict.UpdateKey(key, req.AccountHolderName)
	if err != nil {
		writeError(w, err.Error(), http.StatusNotFound)
		return
	}

	writeJSON(w, result, http.StatusOK)
}

func (h *DICTHandler) HandleDeactivateKey(w http.ResponseWriter, r *http.Request) {
	key := chi.URLParam(r, "key")

	result, err := h.dict.DeactivateKey(key)
	if err != nil {
		writeError(w, err.Error(), http.StatusNotFound)
		return
	}

	writeJSON(w, result, http.StatusOK)
}

func (h *DICTHandler) HandleListKeys(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}

	keys, total := h.dict.ListKeys(page, limit)
	writeJSON(w, map[string]interface{}{
		"keys":  keys,
		"total": total,
		"page":  page,
		"limit": limit,
	}, http.StatusOK)
}

// Claims

func (h *DICTHandler) HandleCreateClaim(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Key                   string `json:"key"`
		TargetISPB            string `json:"targetIspb"`
		TargetAccount         string `json:"targetAccount"`
		TargetBranch          string `json:"targetBranch"`
		TargetAccountHolderName string `json:"targetAccountHolderName"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "invalid request body", http.StatusBadRequest)
		return
	}

	claim, err := h.dict.CreateClaim(
		req.Key, req.TargetISPB, req.TargetAccount,
		req.TargetBranch, req.TargetAccountHolderName,
	)
	if err != nil {
		status := http.StatusUnprocessableEntity
		if err.Error()[:len("open claim already exists")] == "open claim already exists" {
			status = http.StatusConflict
		} else if err.Error()[:len("key not found")] == "key not found" {
			status = http.StatusNotFound
		}
		writeError(w, err.Error(), status)
		return
	}

	writeJSON(w, claim, http.StatusCreated)
}

func (h *DICTHandler) HandleGetClaim(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	claim, err := h.dict.GetClaim(id)
	if err != nil {
		writeError(w, "claim not found", http.StatusNotFound)
		return
	}

	writeJSON(w, claim, http.StatusOK)
}

func (h *DICTHandler) HandleConfirmClaim(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	claim, err := h.dict.ConfirmClaim(id)
	if err != nil {
		writeError(w, err.Error(), http.StatusUnprocessableEntity)
		return
	}

	writeJSON(w, claim, http.StatusOK)
}

func (h *DICTHandler) HandleCancelClaim(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	claim, err := h.dict.CancelClaim(id)
	if err != nil {
		writeError(w, err.Error(), http.StatusUnprocessableEntity)
		return
	}

	writeJSON(w, claim, http.StatusOK)
}

// Health

func (h *DICTHandler) HandleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, map[string]string{
		"status":  "healthy",
		"service": "dict-simulator-go",
	}, http.StatusOK)
}

func (h *DICTHandler) HandleListTransactions(w http.ResponseWriter, r *http.Request) {
	log := h.acid.GetLog()
	writeJSON(w, map[string]interface{}{
		"log":   log,
		"count": len(log),
	}, http.StatusOK)
}

func (h *DICTHandler) HandleGetTransaction(w http.ResponseWriter, r *http.Request) {
	txID := chi.URLParam(r, "txId")

	tx, ok := h.acid.GetTransaction(txID)
	if !ok {
		writeError(w, "transaction not found", http.StatusNotFound)
		return
	}

	writeJSON(w, tx, http.StatusOK)
}

func (h *DICTHandler) HandleGetSuspicious(w http.ResponseWriter, r *http.Request) {
	events := h.antiEnumeration.GetSuspiciousLog()
	writeJSON(w, map[string]interface{}{
		"events": events,
		"count":  len(events),
	}, http.StatusOK)
}

// Helpers

func writeJSON(w http.ResponseWriter, data interface{}, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, message string, status int) {
	writeJSON(w, map[string]string{"error": message}, status)
}
