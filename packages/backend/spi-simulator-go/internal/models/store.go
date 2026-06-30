package models

import "sync"

type TransactionStore struct {
	mu           sync.RWMutex
	transactions map[string]*Transaction
}

func NewTransactionStore() *TransactionStore {
	return &TransactionStore{
		transactions: make(map[string]*Transaction),
	}
}

func (s *TransactionStore) Add(tx *Transaction) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.transactions[tx.EndToEndID] = tx
}

func (s *TransactionStore) Get(endToEndID string) (*Transaction, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	tx, ok := s.transactions[endToEndID]
	return tx, ok
}

func (s *TransactionStore) Update(tx *Transaction) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.transactions[tx.EndToEndID] = tx
}

func (s *TransactionStore) GetAll() []*Transaction {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]*Transaction, 0, len(s.transactions))
	for _, tx := range s.transactions {
		result = append(result, tx)
	}
	return result
}

func (s *TransactionStore) Clear() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.transactions = make(map[string]*Transaction)
}
