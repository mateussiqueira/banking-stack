package service_test

import (
	"testing"
	"time"

	"github.com/mateussiqueira/banking-stack/dict-simulator-go/internal/service"
)

func TestRateLimiter_Allow(t *testing.T) {
	limiter := service.NewRateLimiter(5, time.Minute)

	for i := 0; i < 5; i++ {
		if !limiter.Allow("test-ip") {
			t.Errorf("expected request %d to be allowed", i)
		}
	}

	if limiter.Allow("test-ip") {
		t.Error("expected request to be blocked after limit")
	}
}

func TestRateLimiter_DifferentKeys(t *testing.T) {
	limiter := service.NewRateLimiter(2, time.Minute)

	if !limiter.Allow("ip-1") {
		t.Error("expected ip-1 to be allowed")
	}
	if !limiter.Allow("ip-1") {
		t.Error("expected ip-1 to be allowed")
	}
	if limiter.Allow("ip-1") {
		t.Error("expected ip-1 to be blocked")
	}

	if !limiter.Allow("ip-2") {
		t.Error("expected ip-2 to be allowed")
	}
}

func TestRateLimiter_WindowExpiry(t *testing.T) {
	limiter := service.NewRateLimiter(1, 10*time.Millisecond)

	if !limiter.Allow("test-ip") {
		t.Error("expected first request to be allowed")
	}

	if limiter.Allow("test-ip") {
		t.Error("expected second request to be blocked")
	}

	time.Sleep(15 * time.Millisecond)

	if !limiter.Allow("test-ip") {
		t.Error("expected request to be allowed after window expiry")
	}
}

func TestRateLimiter_GetCount(t *testing.T) {
	limiter := service.NewRateLimiter(10, time.Minute)

	limiter.Allow("test-ip")
	limiter.Allow("test-ip")
	limiter.Allow("test-ip")

	count := limiter.GetCount("test-ip")
	if count != 3 {
		t.Errorf("expected count 3, got %d", count)
	}
}

func TestRateLimiter_Clear(t *testing.T) {
	limiter := service.NewRateLimiter(2, time.Minute)

	limiter.Allow("test-ip")
	limiter.Allow("test-ip")

	limiter.Clear()

	if !limiter.Allow("test-ip") {
		t.Error("expected request to be allowed after clear")
	}
}

func TestAntiEnumeration_CheckIPLimit(t *testing.T) {
	ae := service.NewAntiEnumeration()

	for i := 0; i < 100; i++ {
		if !ae.CheckIPLimit("192.168.1.1") {
			t.Errorf("expected request %d to be allowed", i)
		}
	}

	if ae.CheckIPLimit("192.168.1.1") {
		t.Error("expected request to be blocked after IP limit")
	}
}

func TestAntiEnumeration_CheckAccountLimit(t *testing.T) {
	ae := service.NewAntiEnumeration()

	for i := 0; i < 10; i++ {
		if !ae.CheckAccountLimit("account-1") {
			t.Errorf("expected request %d to be allowed", i)
		}
	}

	if ae.CheckAccountLimit("account-1") {
		t.Error("expected request to be blocked after account limit")
	}
}

func TestAntiEnumeration_MaskPartialResult(t *testing.T) {
	ae := service.NewAntiEnumeration()

	tests := []struct {
		input    string
		expected string
	}{
		{"12345678909", "12*******09"},
		{"12345678", "12****78"},
		{"1234", "****"},
		{"12", "****"},
		{"", "****"},
	}

	for _, tt := range tests {
		result := ae.MaskPartialResult(tt.input)
		if result != tt.expected {
			t.Errorf("MaskPartialResult(%q) = %q, want %q", tt.input, result, tt.expected)
		}
	}
}

func TestAntiEnumeration_LogSuspicious(t *testing.T) {
	ae := service.NewAntiEnumeration()

	ae.LogSuspicious("192.168.1.1", "account-1", "TEST_ACTION", 5)

	events := ae.GetSuspiciousLog()
	if len(events) != 1 {
		t.Fatalf("expected 1 event, got %d", len(events))
	}

	if events[0].IP != "192.168.1.1" {
		t.Errorf("expected IP 192.168.1.1, got %s", events[0].IP)
	}
	if events[0].Account != "account-1" {
		t.Errorf("expected account account-1, got %s", events[0].Account)
	}
	if events[0].Action != "TEST_ACTION" {
		t.Errorf("expected action TEST_ACTION, got %s", events[0].Action)
	}
	if events[0].Count != 5 {
		t.Errorf("expected count 5, got %d", events[0].Count)
	}
}

func TestAntiEnumeration_Clear(t *testing.T) {
	ae := service.NewAntiEnumeration()

	ae.CheckIPLimit("192.168.1.1")
	ae.CheckAccountLimit("account-1")
	ae.LogSuspicious("192.168.1.1", "account-1", "TEST", 1)

	ae.Clear()

	events := ae.GetSuspiciousLog()
	if len(events) != 0 {
		t.Errorf("expected empty suspicious log after clear, got %d events", len(events))
	}

	if !ae.CheckIPLimit("192.168.1.1") {
		t.Error("expected IP to be allowed after clear")
	}
}

func TestAntiEnumeration_DifferentAccounts(t *testing.T) {
	ae := service.NewAntiEnumeration()

	for i := 0; i < 10; i++ {
		if !ae.CheckAccountLimit("account-1") {
			t.Errorf("expected account-1 request %d to be allowed", i)
		}
	}

	if ae.CheckAccountLimit("account-1") {
		t.Error("expected account-1 to be blocked")
	}

	if !ae.CheckAccountLimit("account-2") {
		t.Error("expected account-2 to be allowed")
	}
}
