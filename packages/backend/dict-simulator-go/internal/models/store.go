package models

import (
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
)

type Store struct {
	mu       sync.RWMutex
	keys     map[string]*PixKey
	claims   map[string]*AccountClaim
}

func NewStore() *Store {
	return &Store{
		keys:   make(map[string]*PixKey),
		claims: make(map[string]*AccountClaim),
	}
}

// PixKey operations

func (s *Store) CreatePixKey(key *PixKey) (*PixKey, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Verificar duplicata
	for _, existing := range s.keys {
		if existing.Key == key.Key {
			return nil, fmt.Errorf("key already registered: %s", key.Key)
		}
	}

	key.ID = uuid.New().String()
	key.Status = KeyStatusActive
	key.CreatedAt = time.Now()
	key.UpdatedAt = time.Now()

	s.keys[key.ID] = key
	return key, nil
}

func (s *Store) GetPixKey(keyValue string) (*PixKey, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, pk := range s.keys {
		if pk.Key == keyValue && pk.Status == KeyStatusActive {
			return pk, nil
		}
	}
	return nil, fmt.Errorf("key not found: %s", keyValue)
}

func (s *Store) GetPixKeyByID(id string) (*PixKey, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	pk, ok := s.keys[id]
	if !ok {
		return nil, fmt.Errorf("key not found: %s", id)
	}
	return pk, nil
}

func (s *Store) UpdatePixKey(keyValue string, holderName string) (*PixKey, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for _, pk := range s.keys {
		if pk.Key == keyValue && pk.Status == KeyStatusActive {
			pk.AccountHolderName = holderName
			pk.UpdatedAt = time.Now()
			return pk, nil
		}
	}
	return nil, fmt.Errorf("key not found: %s", keyValue)
}

func (s *Store) DeactivatePixKey(keyValue string) (*PixKey, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for _, pk := range s.keys {
		if pk.Key == keyValue && pk.Status == KeyStatusActive {
			pk.Status = KeyStatusFrozen
			pk.UpdatedAt = time.Now()
			return pk, nil
		}
	}
	return nil, fmt.Errorf("key not found: %s", keyValue)
}

func (s *Store) ListPixKeys(page, limit int) ([]*PixKey, int) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var activeKeys []*PixKey
	for _, pk := range s.keys {
		if pk.Status == KeyStatusActive {
			activeKeys = append(activeKeys, pk)
		}
	}

	total := len(activeKeys)
	start := (page - 1) * limit
	if start >= total {
		return []*PixKey{}, total
	}

	end := start + limit
	if end > total {
		end = total
	}

	return activeKeys[start:end], total
}

// Claim operations

func (s *Store) CreateClaim(claim *AccountClaim) (*AccountClaim, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Verificar se já existe claim aberta para esta key
	for _, c := range s.claims {
		if c.Key == claim.Key && (c.Status == ClaimStatusOpen || c.Status == ClaimStatusWaiting) {
			return nil, fmt.Errorf("open claim already exists for key: %s", claim.Key)
		}
	}

	claim.ID = uuid.New().String()
	claim.Status = ClaimStatusOpen
	claim.CreatedAt = time.Now()
	claim.UpdatedAt = time.Now()

	s.claims[claim.ID] = claim
	return claim, nil
}

func (s *Store) GetClaim(id string) (*AccountClaim, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	claim, ok := s.claims[id]
	if !ok {
		return nil, fmt.Errorf("claim not found: %s", id)
	}
	return claim, nil
}

func (s *Store) ConfirmClaim(id string) (*AccountClaim, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	claim, ok := s.claims[id]
	if !ok {
		return nil, fmt.Errorf("claim not found: %s", id)
	}

	if claim.Status != ClaimStatusOpen {
		return nil, fmt.Errorf("claim cannot be confirmed: status is %s (expected OPEN)", claim.Status)
	}

	claim.Status = ClaimStatusCompleted
	claim.UpdatedAt = time.Now()
	return claim, nil
}

func (s *Store) CancelClaim(id string) (*AccountClaim, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	claim, ok := s.claims[id]
	if !ok {
		return nil, fmt.Errorf("claim not found: %s", id)
	}

	if claim.Status == ClaimStatusCompleted {
		return nil, fmt.Errorf("claim cannot be cancelled: status is COMPLETED")
	}

	claim.Status = ClaimStatusCancelled
	claim.UpdatedAt = time.Now()
	return claim, nil
}

func (s *Store) Clear() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.keys = make(map[string]*PixKey)
	s.claims = make(map[string]*AccountClaim)
}
