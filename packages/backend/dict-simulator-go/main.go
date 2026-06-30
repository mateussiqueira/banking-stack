package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"regexp"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type KeyType string

const (
	KeyTypeCPF    KeyType = "CPF"
	KeyTypeCNPJ   KeyType = "CNPJ"
	KeyTypeEmail  KeyType = "EMAIL"
	KeyTypePhone  KeyType = "PHONE"
	KeyTypeRandom KeyType = "RANDOM"
)

type PixKey struct {
	ID            string    `json:"id"`
	KeyType       KeyType   `json:"keyType"`
	KeyValue      string    `json:"keyValue"`
	AccountID     string    `json:"accountId"`
	ISPB          string    `json:"ispb"`
	Branch        string    `json:"branch"`
	AccountNumber string    `json:"accountNumber"`
	AccountType   string    `json:"accountType"`
	HolderName    string    `json:"holderName"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

type DictStore struct {
	mu   sync.RWMutex
	keys map[string]*PixKey
}

func NewDictStore() *DictStore {
	return &DictStore{
		keys: make(map[string]*PixKey),
	}
}

func (s *DictStore) Add(key *PixKey) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.keys[key.ID] = key
}

func (s *DictStore) GetByID(id string) (*PixKey, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	key, ok := s.keys[id]
	return key, ok
}

func (s *DictStore) GetByValue(keyType KeyType, keyValue string) (*PixKey, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, key := range s.keys {
		if key.KeyType == keyType && key.KeyValue == keyValue && key.Status == "ACTIVE" {
			return key, true
		}
	}
	return nil, false
}

func (s *DictStore) GetAll() []*PixKey {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]*PixKey, 0, len(s.keys))
	for _, key := range s.keys {
		result = append(result, key)
	}
	return result
}

func (s *DictStore) Delete(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	if key, ok := s.keys[id]; ok {
		key.Status = "INACTIVE"
		key.UpdatedAt = time.Now()
		return true
	}
	return false
}

var store = NewDictStore()

func validateCPFCheckDigits(cpf string) bool {
	if len(cpf) != 11 {
		return false
	}
	allSame := true
	for i := 1; i < 11; i++ {
		if cpf[i] != cpf[0] {
			allSame = false
			break
		}
	}
	if allSame {
		return false
	}
	sum := 0
	for i := 0; i < 9; i++ {
		sum += int(cpf[i]-'0') * (10 - i)
	}
	digit1 := (sum * 10) % 11
	if digit1 == 10 {
		digit1 = 0
	}
	if digit1 != int(cpf[9]-'0') {
		return false
	}
	sum = 0
	for i := 0; i < 10; i++ {
		sum += int(cpf[i]-'0') * (11 - i)
	}
	digit2 := (sum * 10) % 11
	if digit2 == 10 {
		digit2 = 0
	}
	return digit2 == int(cpf[10]-'0')
}

func validateCNPJCheckDigits(cnpj string) bool {
	if len(cnpj) != 14 {
		return false
	}
	allSame := true
	for i := 1; i < 14; i++ {
		if cnpj[i] != cnpj[0] {
			allSame = false
			break
		}
	}
	if allSame {
		return false
	}
	weights1 := []int{5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2}
	sum := 0
	for i := 0; i < 12; i++ {
		sum += int(cnpj[i]-'0') * weights1[i]
	}
	digit1 := sum % 11
	if digit1 < 2 {
		digit1 = 0
	} else {
		digit1 = 11 - digit1
	}
	if digit1 != int(cnpj[12]-'0') {
		return false
	}
	weights2 := []int{6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2}
	sum = 0
	for i := 0; i < 13; i++ {
		sum += int(cnpj[i]-'0') * weights2[i]
	}
	digit2 := sum % 11
	if digit2 < 2 {
		digit2 = 0
	} else {
		digit2 = 11 - digit2
	}
	return digit2 == int(cnpj[13]-'0')
}

func validateKey(keyType KeyType, keyValue string) error {
	switch keyType {
	case KeyTypeCPF:
		matched, _ := regexp.MatchString(`^\d{11}$`, keyValue)
		if !matched || !validateCPFCheckDigits(keyValue) {
			return fmt.Errorf("invalid CPF")
		}
	case KeyTypeCNPJ:
		matched, _ := regexp.MatchString(`^\d{14}$`, keyValue)
		if !matched || !validateCNPJCheckDigits(keyValue) {
			return fmt.Errorf("invalid CNPJ")
		}
	case KeyTypeEmail:
		matched, _ := regexp.MatchString(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`, keyValue)
		if !matched {
			return fmt.Errorf("invalid email format")
		}
	case KeyTypePhone:
		matched, _ := regexp.MatchString(`^\+?[1-9]\d{1,14}$`, keyValue)
		if !matched {
			return fmt.Errorf("invalid phone format")
		}
	case KeyTypeRandom:
		// Random keys are always valid
	default:
		return fmt.Errorf("invalid key type")
	}
	return nil
}

func createKey(c *gin.Context) {
	var request struct {
		KeyType       KeyType `json:"keyType" binding:"required"`
		KeyValue      string  `json:"keyValue" binding:"required"`
		AccountID     string  `json:"accountId" binding:"required"`
		ISPB          string  `json:"ispb" binding:"required"`
		Branch        string  `json:"branch" binding:"required"`
		AccountNumber string  `json:"accountNumber" binding:"required"`
		AccountType   string  `json:"accountType" binding:"required"`
		HolderName    string  `json:"holderName" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := validateKey(request.KeyType, request.KeyValue); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check for duplicate
	if _, exists := store.GetByValue(request.KeyType, request.KeyValue); exists {
		c.JSON(http.StatusConflict, gin.H{"error": "Key already exists"})
		return
	}

	key := &PixKey{
		ID:            uuid.New().String(),
		KeyType:       request.KeyType,
		KeyValue:      request.KeyValue,
		AccountID:     request.AccountID,
		ISPB:          request.ISPB,
		Branch:        request.Branch,
		AccountNumber: request.AccountNumber,
		AccountType:   request.AccountType,
		HolderName:    request.HolderName,
		Status:        "ACTIVE",
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	store.Add(key)
	c.JSON(http.StatusCreated, key)
}

func getKey(c *gin.Context) {
	keyType := KeyType(c.Param("keyType"))
	keyValue := c.Param("keyValue")

	key, exists := store.GetByValue(keyType, keyValue)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Key not found"})
		return
	}

	c.JSON(http.StatusOK, key)
}

func listKeys(c *gin.Context) {
	keys := store.GetAll()
	c.JSON(http.StatusOK, keys)
}

func deleteKey(c *gin.Context) {
	id := c.Param("id")
	if !store.Delete(id) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Key not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Key deactivated"})
}

func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "ok",
		"service": "dict-simulator-go",
		"version": "1.0.0",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3003"
	}

	r := gin.Default()

	r.GET("/dict/health", healthCheck)
	r.POST("/dict/keys", createKey)
	r.GET("/dict/keys/:keyType/:keyValue", getKey)
	r.GET("/dict/keys", listKeys)
	r.DELETE("/dict/keys/:id", deleteKey)

	fmt.Printf("DICT Simulator (Go) listening on :%s\n", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
