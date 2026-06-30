package service

import (
	"log"
	"sync"
	"time"
)

type RateLimiter struct {
	mu       sync.Mutex
	requests map[string][]time.Time
	limit    int
	window   time.Duration
}

func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		requests: make(map[string][]time.Time),
		limit:    limit,
		window:   window,
	}
}

func (rl *RateLimiter) Allow(key string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-rl.window)

	valid := make([]time.Time, 0)
	for _, t := range rl.requests[key] {
		if t.After(cutoff) {
			valid = append(valid, t)
		}
	}
	rl.requests[key] = valid

	if len(valid) >= rl.limit {
		return false
	}

	rl.requests[key] = append(rl.requests[key], now)
	return true
}

func (rl *RateLimiter) GetCount(key string) int {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-rl.window)

	count := 0
	for _, t := range rl.requests[key] {
		if t.After(cutoff) {
			count++
		}
	}
	return count
}

func (rl *RateLimiter) Clear() {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	rl.requests = make(map[string][]time.Time)
}

type AntiEnumeration struct {
	ipLimiter     *RateLimiter
	accountLimiter *RateLimiter
	suspiciousLog []SuspiciousEvent
	mu            sync.RWMutex
}

type SuspiciousEvent struct {
	Timestamp time.Time
	IP        string
	Account   string
	Action    string
	Count     int
}

func NewAntiEnumeration() *AntiEnumeration {
	return &AntiEnumeration{
		ipLimiter:     NewRateLimiter(100, time.Minute),
		accountLimiter: NewRateLimiter(10, time.Minute),
		suspiciousLog: make([]SuspiciousEvent, 0),
	}
}

func (ae *AntiEnumeration) CheckIPLimit(ip string) bool {
	return ae.ipLimiter.Allow("ip:" + ip)
}

func (ae *AntiEnumeration) CheckAccountLimit(account string) bool {
	return ae.accountLimiter.Allow("acct:" + account)
}

func (ae *AntiEnumeration) GetIPCount(ip string) int {
	return ae.ipLimiter.GetCount("ip:" + ip)
}

func (ae *AntiEnumeration) GetAccountCount(account string) int {
	return ae.accountLimiter.GetCount("acct:" + account)
}

func (ae *AntiEnumeration) LogSuspicious(ip, account, action string, count int) {
	ae.mu.Lock()
	defer ae.mu.Unlock()

	ae.suspiciousLog = append(ae.suspiciousLog, SuspiciousEvent{
		Timestamp: time.Now(),
		IP:        ip,
		Account:   account,
		Action:    action,
		Count:     count,
	})

	log.Printf("[ANTI-ENUM] Suspicious: IP=%s Account=%s Action=%s Count=%d",
		ip, account, action, count)
}

func (ae *AntiEnumeration) MaskPartialResult(key string) string {
	if len(key) <= 4 {
		return "****"
	}
	masked := key[:2]
	for i := 2; i < len(key)-2; i++ {
		masked += "*"
	}
	masked += key[len(key)-2:]
	return masked
}

func (ae *AntiEnumeration) GetSuspiciousLog() []SuspiciousEvent {
	ae.mu.RLock()
	defer ae.mu.RUnlock()

	result := make([]SuspiciousEvent, len(ae.suspiciousLog))
	copy(result, ae.suspiciousLog)
	return result
}

func (ae *AntiEnumeration) Clear() {
	ae.mu.Lock()
	defer ae.mu.Unlock()

	ae.ipLimiter.Clear()
	ae.accountLimiter.Clear()
	ae.suspiciousLog = make([]SuspiciousEvent, 0)
}
