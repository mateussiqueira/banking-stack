package service

import (
	"fmt"
	"sync"
	"time"
)

// DistributedLock representa um lock distribuído (simula Redis)
type DistributedLock struct {
	Key        string
	Owner      string
	AcquiredAt time.Time
	ExpiresAt  time.Time
}

// DistributedLockManager gerencia locks distribuídos
type DistributedLockManager struct {
	mu    sync.RWMutex
	locks map[string]*DistributedLock
}

// NewDistributedLockManager cria um novo gerenciador de locks
func NewDistributedLockManager() *DistributedLockManager {
	return &DistributedLockManager{
		locks: make(map[string]*DistributedLock),
	}
}

// Acquire tenta adquirir um lock (SETNX simulation)
func (m *DistributedLockManager) Acquire(key, owner string, ttl time.Duration) (bool, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Verificar se já existe um lock
	if existing, ok := m.locks[key]; ok {
		// Verificar se expirou
		if time.Now().Before(existing.ExpiresAt) {
			return false, fmt.Errorf("lock already held by %s", existing.Owner)
		}
		// Lock expirado, pode ser adquirido
	}

	// Adquirir lock
	m.locks[key] = &DistributedLock{
		Key:        key,
		Owner:      owner,
		AcquiredAt: time.Now(),
		ExpiresAt:  time.Now().Add(ttl),
	}

	return true, nil
}

// Release libera um lock
func (m *DistributedLockManager) Release(key, owner string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	lock, ok := m.locks[key]
	if !ok {
		return fmt.Errorf("lock not found: %s", key)
	}

	if lock.Owner != owner {
		return fmt.Errorf("lock not owned by %s", owner)
	}

	delete(m.locks, key)
	return nil
}

// IsLocked verifica se uma chave está bloqueada
func (m *DistributedLockManager) IsLocked(key string) bool {
	m.mu.RLock()
	defer m.mu.RUnlock()

	lock, ok := m.locks[key]
	if !ok {
		return false
	}

	// Verificar se não expirou
	return time.Now().Before(lock.ExpiresAt)
}

// GetLock retorna informações sobre um lock
func (m *DistributedLockManager) GetLock(key string) (*DistributedLock, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	lock, ok := m.locks[key]
	if !ok {
		return nil, false
	}

	// Verificar se não expirou
	if time.Now().After(lock.ExpiresAt) {
		return nil, false
	}

	return lock, true
}

// CleanExpired remove locks expirados
func (m *DistributedLockManager) CleanExpired() int {
	m.mu.Lock()
	defer m.mu.Unlock()

	count := 0
	now := time.Now()

	for key, lock := range m.locks {
		if now.After(lock.ExpiresAt) {
			delete(m.locks, key)
			count++
		}
	}

	return count
}

// Clear limpa todos os locks
func (m *DistributedLockManager) Clear() {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.locks = make(map[string]*DistributedLock)
}

// RateLimiter implementa rate limiting com token bucket
type RateLimiter struct {
	mu       sync.Mutex
	tokens   float64
	maxRate  float64
	refillRate float64
	lastRefill time.Time
}

// NewRateLimiter cria um novo rate limiter
func NewRateLimiter(maxRate, refillRate float64) *RateLimiter {
	return &RateLimiter{
		tokens:     maxRate,
		maxRate:    maxRate,
		refillRate: refillRate,
		lastRefill: time.Now(),
	}
}

// Allow verifica se uma requisição é permitida
func (r *RateLimiter) Allow() bool {
	r.mu.Lock()
	defer r.mu.Unlock()

	// Reabastecer tokens
	now := time.Now()
	elapsed := now.Sub(r.lastRefill).Seconds()
	r.tokens += elapsed * r.refillRate
	if r.tokens > r.maxRate {
		r.tokens = r.maxRate
	}
	r.lastRefill = now

	// Verificar se há tokens disponíveis
	if r.tokens >= 1 {
		r.tokens--
		return true
	}

	return false
}

// Tokens retorna o número de tokens disponíveis
func (r *RateLimiter) Tokens() float64 {
	r.mu.Lock()
	defer r.mu.Unlock()

	// Reabastecer tokens
	now := time.Now()
	elapsed := now.Sub(r.lastRefill).Seconds()
	r.tokens += elapsed * r.refillRate
	if r.tokens > r.maxRate {
		r.tokens = r.maxRate
	}
	r.lastRefill = now

	return r.tokens
}
