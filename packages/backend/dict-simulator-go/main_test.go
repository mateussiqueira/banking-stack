package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestCreateAndGetKey(t *testing.T) {
	store = NewDictStore()
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.POST("/dict/keys", createKey)
	r.GET("/dict/keys/:keyType/:keyValue", getKey)

	payload := `{"keyType":"EMAIL","keyValue":"test@example.com","accountId":"acc1","ispb":"00000001","branch":"0001","accountNumber":"12345","accountType":"CHECKING","holderName":"Test User"}`
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest("POST", "/dict/keys", strings.NewReader(payload)))
	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", w.Code, w.Body.String())
	}

	var created struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &created); err != nil {
		t.Fatal(err)
	}
	if created.ID == "" {
		t.Fatal("expected non-empty ID")
	}

	// GET by EMAIL/test@example.com
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, httptest.NewRequest("GET", "/dict/keys/EMAIL/test@example.com", nil))
	if w2.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w2.Code, w2.Body.String())
	}
}

func TestCreateKey_Duplicate(t *testing.T) {
	store = NewDictStore()
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.POST("/dict/keys", createKey)

	payload := `{"keyType":"EMAIL","keyValue":"dup@example.com","accountId":"acc1","ispb":"00000001","branch":"0001","accountNumber":"12345","accountType":"CHECKING","holderName":"Test"}`
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, httptest.NewRequest("POST", "/dict/keys", strings.NewReader(payload)))

	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, httptest.NewRequest("POST", "/dict/keys", strings.NewReader(payload)))
	if w2.Code != http.StatusConflict {
		t.Errorf("expected 409 for duplicate, got %d", w2.Code)
	}
}

func TestCreateKey_InvalidCPF(t *testing.T) {
	store = NewDictStore()
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.POST("/dict/keys", createKey)

	// valid format but invalid check digits
	payload := `{"keyType":"CPF","keyValue":"12345678901","accountId":"acc1","ispb":"00000001","branch":"0001","accountNumber":"12345","accountType":"CHECKING","holderName":"Test"}`
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest("POST", "/dict/keys", strings.NewReader(payload)))
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid CPF, got %d: %s", w.Code, w.Body.String())
	}
}

func TestCreateKey_ValidCPF(t *testing.T) {
	store = NewDictStore()
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.POST("/dict/keys", createKey)

	// valid CPF with correct check digits
	payload := `{"keyType":"CPF","keyValue":"52998224725","accountId":"acc1","ispb":"00000001","branch":"0001","accountNumber":"12345","accountType":"CHECKING","holderName":"Test"}`
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest("POST", "/dict/keys", strings.NewReader(payload)))
	if w.Code != http.StatusCreated {
		t.Errorf("expected 201 for valid CPF, got %d: %s", w.Code, w.Body.String())
	}
}

func TestSoftDelete(t *testing.T) {
	store = NewDictStore()
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.POST("/dict/keys", createKey)
	r.DELETE("/dict/keys/:id", deleteKey)
	r.GET("/dict/keys/:keyType/:keyValue", getKey)

	payload := `{"keyType":"EMAIL","keyValue":"del@example.com","accountId":"acc1","ispb":"00000001","branch":"0001","accountNumber":"12345","accountType":"CHECKING","holderName":"Test"}`
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest("POST", "/dict/keys", strings.NewReader(payload)))

	var created struct{ ID string }
	json.Unmarshal(w.Body.Bytes(), &created)

	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, httptest.NewRequest("DELETE", "/dict/keys/"+created.ID, nil))
	if w2.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w2.Code)
	}

	var resp struct{ Message string }
	json.Unmarshal(w2.Body.Bytes(), &resp)
	if resp.Message != "Key deactivated" {
		t.Errorf("expected 'Key deactivated', got '%s'", resp.Message)
	}

	w3 := httptest.NewRecorder()
	r.ServeHTTP(w3, httptest.NewRequest("GET", "/dict/keys/EMAIL/del@example.com", nil))
	if w3.Code != http.StatusNotFound {
		t.Errorf("expected 404 after soft delete, got %d", w3.Code)
	}
}

func TestHealthCheck(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.GET("/dict/health", healthCheck)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest("GET", "/dict/health", nil))
	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestValidateCPFFormatOnly(t *testing.T) {
	if !validateCPFCheckDigits("52998224725") {
		t.Error("expected valid CPF 52998224725")
	}
	if validateCPFCheckDigits("12345678901") {
		t.Error("expected invalid CPF 12345678901")
	}
	if validateCPFCheckDigits("00000000000") {
		t.Error("expected invalid for all same digits")
	}
}

func TestValidateCNPJCheckDigits(t *testing.T) {
	if !validateCNPJCheckDigits("11444777000161") {
		t.Error("expected valid CNPJ 11444777000161")
	}
	if validateCNPJCheckDigits("00000000000000") {
		t.Error("expected invalid for all same digits")
	}
}
