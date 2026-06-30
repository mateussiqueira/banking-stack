package service

import (
	"fmt"
	"sync"
	"time"
)

type TransactionState string

const (
	StatePending   TransactionState = "PENDING"
	StateCommitted TransactionState = "COMMITTED"
	StateAborted   TransactionState = "ABORTED"
)

type Operation struct {
	Type      string
	Target    string
	Details   string
	Status    string
}

type ACIDTransaction struct {
	ID         string
	State      TransactionState
	Operations []Operation
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

type ACIDManager struct {
	mu           sync.RWMutex
	transactions map[string]*ACIDTransaction
	log          []string
}

func NewACIDManager() *ACIDManager {
	return &ACIDManager{
		transactions: make(map[string]*ACIDTransaction),
		log:          make([]string, 0),
	}
}

func (m *ACIDManager) Begin() string {
	m.mu.Lock()
	defer m.mu.Unlock()

	txID := fmt.Sprintf("TX-%d", time.Now().UnixNano())
	tx := &ACIDTransaction{
		ID:         txID,
		State:      StatePending,
		Operations: make([]Operation, 0),
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	m.transactions[txID] = tx
	m.log = append(m.log, fmt.Sprintf("[%s] BEGIN %s", time.Now().Format("15:04:05"), txID))

	return txID
}

func (m *ACIDManager) AddOperation(txID, opType, target, details string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	tx, ok := m.transactions[txID]
	if !ok {
		return fmt.Errorf("transaction not found: %s", txID)
	}

	if tx.State != StatePending {
		return fmt.Errorf("transaction %s is not pending", txID)
	}

	op := Operation{
		Type:    opType,
		Target:  target,
		Details: details,
		Status:  "PENDING",
	}

	tx.Operations = append(tx.Operations, op)
	tx.UpdatedAt = time.Now()

	m.log = append(m.log, fmt.Sprintf("[%s] ADD_OP %s %s %s",
		time.Now().Format("15:04:05"), txID, opType, target))

	return nil
}

func (m *ACIDManager) Commit(txID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	tx, ok := m.transactions[txID]
	if !ok {
		return fmt.Errorf("transaction not found: %s", txID)
	}

	if tx.State != StatePending {
		return fmt.Errorf("transaction %s is not pending", txID)
	}

	for i := range tx.Operations {
		if tx.Operations[i].Status != "PENDING" {
			tx.State = StateAborted
			tx.UpdatedAt = time.Now()
			m.log = append(m.log, fmt.Sprintf("[%s] ABORT %s (operation %d invalid)",
				time.Now().Format("15:04:05"), txID, i))
			return fmt.Errorf("transaction aborted: operation %d invalid", i)
		}
	}

	for i := range tx.Operations {
		tx.Operations[i].Status = "COMMITTED"
	}

	tx.State = StateCommitted
	tx.UpdatedAt = time.Now()

	m.log = append(m.log, fmt.Sprintf("[%s] COMMIT %s (%d operations)",
		time.Now().Format("15:04:05"), txID, len(tx.Operations)))

	return nil
}

func (m *ACIDManager) Abort(txID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	tx, ok := m.transactions[txID]
	if !ok {
		return fmt.Errorf("transaction not found: %s", txID)
	}

	tx.State = StateAborted
	tx.UpdatedAt = time.Now()

	m.log = append(m.log, fmt.Sprintf("[%s] ABORT %s",
		time.Now().Format("15:04:05"), txID))

	return nil
}

func (m *ACIDManager) GetTransaction(txID string) (*ACIDTransaction, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	tx, ok := m.transactions[txID]
	return tx, ok
}

func (m *ACIDManager) GetLog() []string {
	m.mu.RLock()
	defer m.mu.RUnlock()

	result := make([]string, len(m.log))
	copy(result, m.log)
	return result
}

func (m *ACIDManager) Clear() {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.transactions = make(map[string]*ACIDTransaction)
	m.log = make([]string, 0)
}
