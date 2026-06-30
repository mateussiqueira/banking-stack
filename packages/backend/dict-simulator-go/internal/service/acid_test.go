package service_test

import (
	"testing"

	"github.com/mateussiqueira/banking-stack/dict-simulator-go/internal/service"
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
	manager.AddOperation(txID, "REGISTER_KEY", "key-1", "CPF=12345678909")
	manager.AddOperation(txID, "VALIDATE_ISPB", "ispb-1", "12345678")

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
	manager.AddOperation(txID, "REGISTER_KEY", "key-1", "CPF=12345678909")

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

	txID := manager.Begin()
	manager.AddOperation(txID, "REGISTER_KEY", "key-1", "CPF=12345678909")
	manager.AddOperation(txID, "VALIDATE_ISPB", "ispb-1", "12345678")

	err := manager.Commit(txID)
	if err != nil {
		t.Fatalf("commit failed: %v", err)
	}

	tx, _ := manager.GetTransaction(txID)

	for _, op := range tx.Operations {
		if op.Status != "COMMITTED" {
			t.Errorf("atomicity violated: operation %s not committed", op.Type)
		}
	}
}

func TestACIDManager_CannotModifyAfterCommit(t *testing.T) {
	manager := service.NewACIDManager()

	txID := manager.Begin()
	manager.AddOperation(txID, "REGISTER_KEY", "key-1", "CPF=12345678909")
	manager.Commit(txID)

	err := manager.AddOperation(txID, "UPDATE_KEY", "key-1", "name=New Name")
	if err == nil {
		t.Error("expected error when adding operation after commit")
	}
}

func TestACIDManager_CannotCommitNonPending(t *testing.T) {
	manager := service.NewACIDManager()

	txID := manager.Begin()
	manager.Abort(txID)

	err := manager.Commit(txID)
	if err == nil {
		t.Error("expected error when committing non-pending transaction")
	}
}

func TestACIDManager_TransactionNotFound(t *testing.T) {
	manager := service.NewACIDManager()

	err := manager.AddOperation("NON-EXISTENT", "REGISTER_KEY", "key-1", "CPF=12345678909")
	if err == nil {
		t.Error("expected error for non-existent transaction")
	}

	err = manager.Commit("NON-EXISTENT")
	if err == nil {
		t.Error("expected error for non-existent transaction")
	}

	err = manager.Abort("NON-EXISTENT")
	if err == nil {
		t.Error("expected error for non-existent transaction")
	}
}

func TestACIDManager_Log(t *testing.T) {
	manager := service.NewACIDManager()

	txID := manager.Begin()
	manager.AddOperation(txID, "REGISTER_KEY", "key-1", "CPF=12345678909")
	manager.Commit(txID)

	log := manager.GetLog()

	if len(log) < 3 {
		t.Errorf("expected at least 3 log entries, got %d", len(log))
	}
}

func TestACIDManager_Clear(t *testing.T) {
	manager := service.NewACIDManager()

	txID := manager.Begin()
	manager.AddOperation(txID, "REGISTER_KEY", "key-1", "CPF=12345678909")
	manager.Commit(txID)

	manager.Clear()

	log := manager.GetLog()
	if len(log) != 0 {
		t.Errorf("expected empty log after clear, got %d entries", len(log))
	}

	_, ok := manager.GetTransaction(txID)
	if ok {
		t.Error("expected transaction to be removed after clear")
	}
}
