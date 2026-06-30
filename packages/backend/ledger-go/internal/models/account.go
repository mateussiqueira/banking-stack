package models

import (
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
)

type Account struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Document  string    `json:"document"`
	Balance   float64   `json:"balance"`
	Version   int       `json:"version"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type TransactionType string

const (
	TransactionTypePIX      TransactionType = "PIX"
	TransactionTypeTED      TransactionType = "TED"
	TransactionTypeDOC      TransactionType = "DOC"
	TransactionTypeTransfer TransactionType = "TRANSFER"
)

type TransactionStatus string

const (
	TransactionStatusPending   TransactionStatus = "PENDING"
	TransactionStatusCompleted TransactionStatus = "COMPLETED"
	TransactionStatusFailed    TransactionStatus = "FAILED"
	TransactionStatusReverted  TransactionStatus = "REVERTED"
)

type Transaction struct {
	ID              string            `json:"id"`
	SenderAccountID string            `json:"senderAccountId"`
	ReceiverAccountID string          `json:"receiverAccountId"`
	Amount          float64           `json:"amount"`
	Description     string            `json:"description"`
	Type            TransactionType   `json:"type"`
	Status          TransactionStatus `json:"status"`
	CompletedAt     *time.Time        `json:"completedAt,omitempty"`
	IdempotencyKey  string            `json:"idempotencyKey,omitempty"`
	CreatedAt       time.Time         `json:"createdAt"`
}

type Store struct {
	mu           sync.RWMutex
	accounts     map[string]*Account
	transactions map[string]*Transaction
}

func NewStore() *Store {
	return &Store{
		accounts:     make(map[string]*Account),
		transactions: make(map[string]*Transaction),
	}
}

// Account operations

func (s *Store) CreateAccount(name, document string, initialBalance float64) (*Account, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Verificar documento duplicado
	for _, acc := range s.accounts {
		if acc.Document == document {
			return nil, fmt.Errorf("account already exists for document: %s", document)
		}
	}

	if initialBalance < 0 {
		return nil, fmt.Errorf("initial balance cannot be negative")
	}

	account := &Account{
		ID:        uuid.New().String(),
		Name:      name,
		Document:  document,
		Balance:   initialBalance,
		Version:   1,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	s.accounts[account.ID] = account
	return account, nil
}

func (s *Store) GetAccount(id string) (*Account, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	acc, ok := s.accounts[id]
	return acc, ok
}

func (s *Store) GetAccountByDocument(document string) (*Account, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, acc := range s.accounts {
		if acc.Document == document {
			return acc, true
		}
	}
	return nil, false
}

func (s *Store) ListAccounts(page, limit int) ([]*Account, int) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var allAccounts []*Account
	for _, acc := range s.accounts {
		allAccounts = append(allAccounts, acc)
	}

	total := len(allAccounts)
	start := (page - 1) * limit
	if start >= total {
		return []*Account{}, total
	}

	end := start + limit
	if end > total {
		end = total
	}

	return allAccounts[start:end], total
}

// Transaction operations

func (s *Store) CreateTransaction(senderID, receiverID string, amount float64, description string, txType TransactionType, idempotencyKey string) (*Transaction, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Validações
	if amount <= 0 {
		return nil, fmt.Errorf("amount must be positive")
	}

	if senderID == receiverID {
		return nil, fmt.Errorf("sender and receiver cannot be the same")
	}

	sender, ok := s.accounts[senderID]
	if !ok {
		return nil, fmt.Errorf("sender account not found: %s", senderID)
	}

	receiver, ok := s.accounts[receiverID]
	if !ok {
		return nil, fmt.Errorf("receiver account not found: %s", receiverID)
	}

	// Idempotência
	if idempotencyKey != "" {
		for _, tx := range s.transactions {
			if tx.IdempotencyKey == idempotencyKey {
				return tx, nil
			}
		}
	}

	// Verificar saldo
	if sender.Balance < amount {
		return nil, fmt.Errorf("insufficient funds: balance %.2f, amount %.2f", sender.Balance, amount)
	}

	// Débito e crédito (double-entry)
	sender.Balance -= amount
	sender.Version++
	sender.UpdatedAt = time.Now()

	receiver.Balance += amount
	receiver.Version++
	receiver.UpdatedAt = time.Now()

	now := time.Now()
	transaction := &Transaction{
		ID:                uuid.New().String(),
		SenderAccountID:   senderID,
		ReceiverAccountID: receiverID,
		Amount:            amount,
		Description:       description,
		Type:              txType,
		Status:            TransactionStatusCompleted,
		CompletedAt:       &now,
		IdempotencyKey:    idempotencyKey,
		CreatedAt:         now,
	}

	s.transactions[transaction.ID] = transaction
	return transaction, nil
}

func (s *Store) GetTransaction(id string) (*Transaction, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	tx, ok := s.transactions[id]
	return tx, ok
}

func (s *Store) ListTransactions(page, limit int, accountID string) ([]*Transaction, int) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var filtered []*Transaction
	for _, tx := range s.transactions {
		if accountID != "" && tx.SenderAccountID != accountID && tx.ReceiverAccountID != accountID {
			continue
		}
		filtered = append(filtered, tx)
	}

	total := len(filtered)
	start := (page - 1) * limit
	if start >= total {
		return []*Transaction{}, total
	}

	end := start + limit
	if end > total {
		end = total
	}

	return filtered[start:end], total
}

func (s *Store) Clear() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.accounts = make(map[string]*Account)
	s.transactions = make(map[string]*Transaction)
}
