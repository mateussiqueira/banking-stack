package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/mateussiqueira/banking-stack/dict-simulator-go/internal/service"
)

type DICTHandler struct {
	dict *service.DICTService
}

func NewDICTHandler(dict *service.DICTService) *DICTHandler {
	return &DICTHandler{dict: dict}
}

func (h *DICTHandler) Routes() chi.Router {
	r := chi.NewRouter()

	// Entries
	r.Post("/entries", h.HandleRegisterKey)
	r.Get("/entries", h.HandleListKeys)
	r.Get("/entries/{key}", h.HandleLookupKey)
	r.Patch("/entries/{key}", h.HandleUpdateKey)
	r.Delete("/entries/{key}", h.HandleDeactivateKey)

	// Claims
	r.Post("/claims", h.HandleCreateClaim)
	r.Get("/claims/{id}", h.HandleGetClaim)
	r.Post("/claims/{id}/confirm", h.HandleConfirmClaim)
	r.Post("/claims/{id}/cancel", h.HandleCancelClaim)

	// Health
	r.Get("/health", h.HandleHealth)

	return r
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

	result, err := h.dict.LookupKey(key)
	if err != nil {
		writeError(w, "key not found", http.StatusNotFound)
		return
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

// Helpers

func writeJSON(w http.ResponseWriter, data interface{}, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, message string, status int) {
	writeJSON(w, map[string]string{"error": message}, status)
}
