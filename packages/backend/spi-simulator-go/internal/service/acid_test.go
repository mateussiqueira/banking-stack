package service_test

import (
	"testing"
	"time"

	"github.com/mateussiqueira/banking-stack/spi-simulator-go/internal/service"
)

func TestACIDManager_Begin(t *testing.T) {
	manager := service.NewACIDManager()

	txID := manager.Begin()

	if txID == "" {
		t.Error("expected non-empty transaction ID")
	}

	tx, ok := manager.GetTransaction(txID)
	if !ok {
		t.Error("transaction not found")
	}

	if tx.State != service.StatePending {
		t.Errorf("expected state PENDING, got %s", tx.State)
	}
}

func TestACIDManager_Commit(t *testing.T) {
	manager := service.NewACIDManager()

	txID := manager.Begin()
	manager.AddOperation(txID, "DEBIT", "account-1", 100)
	manager.AddOperation(txID, "CREDIT", "account-2", 100)

	err := manager.Commit(txID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	tx, _ := manager.GetTransaction(txID)
	if tx.State != service.StateCommitted {
		t.Errorf("expected state COMMITTED, got %s", tx.State)
	}

	if len(tx.Operations) != 2 {
		t.Errorf("expected 2 operations, got %d", len(tx.Operations))
	}

	for _, op := range tx.Operations {
		if op.Status != "COMMITTED" {
			t.Errorf("expected operation status COMMITTED, got %s", op.Status)
		}
	}
}

func TestACIDManager_Abort(t *testing.T) {
	manager := service.NewACIDManager()

	txID := manager.Begin()
	manager.AddOperation(txID, "DEBIT", "account-1", 100)

	err := manager.Abort(txID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	tx, _ := manager.GetTransaction(txID)
	if tx.State != service.StateAborted {
		t.Errorf("expected state ABORTED, got %s", tx.State)
	}
}

func TestACIDManager_Atomicity(t *testing.T) {
	manager := service.NewACIDManager()

	// Simular transação atômica: débito + crédito
	txID := manager.Begin()
	manager.AddOperation(txID, "DEBIT", "sender", 200)
	manager.AddOperation(txID, "CREDIT", "receiver", 200)

	// Commit deve ser atômico (tudo ou nada)
	err := manager.Commit(txID)
	if err != nil {
		t.Fatalf("commit failed: %v", err)
	}

	tx, _ := manager.GetTransaction(txID)

	// Verificar que ambas as operações foram commitadas
	for _, op := range tx.Operations {
		if op.Status != "COMMITTED" {
			t.Errorf("atomicity violated: operation %s not committed", op.Type)
		}
	}
}

func TestACIDManager_CannotModifyAfterCommit(t *testing.T) {
	manager := service.NewACIDManager()

	txID := manager.Begin()
	manager.AddOperation(txID, "DEBIT", "account-1", 100)
	manager.Commit(txID)

	// Tentar adicionar operação após commit
	err := manager.AddOperation(txID, "CREDIT", "account-2", 100)
	if err == nil {
		t.Error("expected error when adding operation after commit")
	}
}

func TestACIDManager_Log(t *testing.T) {
	manager := service.NewACIDManager()

	txID := manager.Begin()
	manager.AddOperation(txID, "DEBIT", "account-1", 100)
	manager.Commit(txID)

	log := manager.GetLog()

	if len(log) < 3 {
		t.Errorf("expected at least 3 log entries, got %d", len(log))
	}
}

func TestDistributedLock_Acquire(t *testing.T) {
	lockManager := service.NewDistributedLockManager()

	// Adquirir lock
	acquired, err := lockManager.Acquire("resource-1", "owner-1", 5*time.Second)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !acquired {
		t.Error("expected lock to be acquired")
	}

	// Tentar adquirir novamente (deve falhar)
	acquired, err = lockManager.Acquire("resource-1", "owner-2", 5*time.Second)
	if err == nil {
		t.Error("expected error when acquiring already locked resource")
	}
	if acquired {
		t.Error("expected lock to not be acquired")
	}
}

func TestDistributedLock_Release(t *testing.T) {
	lockManager := service.NewDistributedLockManager()

	lockManager.Acquire("resource-1", "owner-1", 5*time.Second)

	// Liberar lock
	err := lockManager.Release("resource-1", "owner-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Verificar que foi liberado
	if lockManager.IsLocked("resource-1") {
		t.Error("expected lock to be released")
	}
}

func TestDistributedLock_Expiry(t *testing.T) {
	lockManager := service.NewDistributedLockManager()

	// Adquirir lock com TTL curto
	lockManager.Acquire("resource-1", "owner-1", 10*time.Millisecond)

	// Aguardar expirar
	time.Sleep(20 * time.Millisecond)

	// Verificar que expirou
	if lockManager.IsLocked("resource-1") {
		t.Error("expected lock to be expired")
	}

	// Deve poder adquirir novamente
	acquired, err := lockManager.Acquire("resource-1", "owner-2", 5*time.Second)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !acquired {
		t.Error("expected lock to be acquired after expiry")
	}
}

func TestDistributedLock_CleanExpired(t *testing.T) {
	lockManager := service.NewDistributedLockManager()

	// Criar locks com TTLs diferentes
	lockManager.Acquire("lock-1", "owner-1", 10*time.Millisecond)
	lockManager.Acquire("lock-2", "owner-2", 5*time.Second)

	// Aguardar o primeiro expirar
	time.Sleep(20 * time.Millisecond)

	// Limpar expirados
	removed := lockManager.CleanExpired()

	if removed != 1 {
		t.Errorf("expected 1 lock removed, got %d", removed)
	}

	// Verificar que lock-2 ainda existe
	if !lockManager.IsLocked("lock-2") {
		t.Error("expected lock-2 to still be locked")
	}
}

func TestRateLimiter(t *testing.T) {
	limiter := service.NewRateLimiter(10, 1) // 10 tokens, 1 token/s

	// Deve permitir 10 requisições
	for i := 0; i < 10; i++ {
		if !limiter.Allow() {
			t.Errorf("expected request %d to be allowed", i)
		}
	}

	// 11ª requisição deve ser bloqueada
	if limiter.Allow() {
		t.Error("expected request to be blocked")
	}

	// Aguardar reabastecer
	time.Sleep(1100 * time.Millisecond)

	// Deve permitir novamente
	if !limiter.Allow() {
		t.Error("expected request to be allowed after refill")
	}
}
