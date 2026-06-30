# Aula 10: Go em Produção — Graceful Shutdown, Health Checks

**Duração:** 50 minutos
**Pré-requisitos:** Aulas 01-09
**Objetivo:** Preparar microsserviços Go para produção com shutdown seguro e observabilidade.

---

## 📋 Objetivos de Aprendizagem

1. Implementar graceful shutdown
2. Criar health checks (liveness e readiness)
3. Configurar sinais do sistema
4. Gerenciar conexões de banco de dados
5. Logging estruturado em produção

---

## 1. Graceful Shutdown

### O problema

```
1. Usuário envia requisição
2. Kubernetes envia SIGTERM
3. Servidor mata imediatamente
4. Requisição perdida = dinheiro perdido
```

### A solução

```
1. Usuário envia requisição
2. Kubernetes envia SIGTERM
3. Servidor para de aceitar novas conexões
4. Requisições em andamento completam
5. Conexões de banco são fechadas
6. Servidor encerra graciosamente
```

### Implementação

```go
package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"
)

func main() {
    srv := &http.Server{
        Addr:    ":8080",
        Handler: myRouter(),
    }

    // Iniciar servidor em goroutine
    go func() {
        log.Println("Servidor iniciando na porta :8080")
        if err := srv.ListenAndServe(); err != http.ErrServerClosed {
            log.Fatalf("Erro ao iniciar servidor: %v", err)
        }
    }()

    // Aguardar sinal de interrupção
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    log.Println("Sinal de shutdown recebido, aguardando conexões...")

    // Timeout para shutdown
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := srv.Shutdown(ctx); err != nil {
        log.Fatalf("Erro ao encerrar servidor: %v", err)
    }

    log.Println("Servidor encerrado graciosamente")
}
```

---

## 2. Health Checks

### Liveness vs Readiness

| Tipo | Pergunta | Ação se falhar |
|------|----------|----------------|
| **Liveness** | "Estou vivo?" | Reiniciar container |
| **Readiness** | "Estou pronto?" | Remover do load balancer |

### Implementação

```go
// Liveness: está rodando?
func livenessHandler(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{
        "status": "alive",
    })
}

// Readiness: está pronto para receber tráfego?
func readinessHandler(w http.ResponseWriter, r *http.Request) {
    // Verificar dependências
    checks := map[string]bool{
        "database": checkDatabase(),
        "redis":    checkRedis(),
        "kafka":    checkKafka(),
    }
    
    allOK := true
    for _, ok := range checks {
        if !ok {
            allOK = false
            break
        }
    }
    
    status := http.StatusOK
    if !allOK {
        status = http.StatusServiceUnavailable
    }
    
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(map[string]interface{}{
        "status": statusText(status),
        "checks": checks,
    })
}
```

### Kubernetes config

```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: api
    livenessProbe:
      httpGet:
        path: /health/live
        port: 8080
      initialDelaySeconds: 10
      periodSeconds: 5
    readinessProbe:
      httpGet:
        path: /health/ready
        port: 8080
      initialDelaySeconds: 5
      periodSeconds: 3
```

---

## 3. Gerenciando Sinais do Sistema

### Sinais importantes

| Sinal | Significado | Ação |
|-------|-------------|------|
| `SIGTERM` | Terminar (Kubernetes) | Graceful shutdown |
| `SIGINT` | Interrupção (Ctrl+C) | Graceful shutdown |
| `SIGHUP` | Reload config | Recarregar configurações |
| `SIGUSR1` | User-defined | Debug, metrics |

### Handler de sinais

```go
func setupSignalHandlers(ctx context.Context, cancel context.CancelFunc) {
    c := make(chan os.Signal, 1)
    signal.Notify(c, syscall.SIGINT, syscall.SIGTERM, syscall.SIGHUP)
    
    go func() {
        for {
            select {
            case <-ctx.Done():
                return
            case sig := <-c:
                switch sig {
                case syscall.SIGINT, syscall.SIGTERM:
                    log.Printf("Sinal %v recebido, iniciando shutdown...", sig)
                    cancel()
                    return
                case syscall.SIGHUP:
                    log.Println("Sinal SIGHUP recebido, recarregando config...")
                    reloadConfig()
                }
            }
        }
    }()
}
```

---

## 4. Conexões com Banco de Dados

### Padrão seguro

```go
func main() {
    // Conectar ao banco
    db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()
    
    // Configurar pool de conexões
    db.SetMaxOpenConns(25)
    db.SetMaxIdleConns(25)
    db.SetConnMaxLifetime(5 * time.Minute)
    
    // Verificar conexão
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    if err := db.PingContext(ctx); err != nil {
        log.Fatal("Falha ao conectar ao banco:", err)
    }
    
    // ... resto do código
}
```

### Shutdown com banco

```go
func gracefulShutdown(srv *http.Server, db *sql.DB) {
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit
    
    log.Println("Iniciando shutdown...")
    
    // 1. Parar de aceitar requisições
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()
    
    if err := srv.Shutdown(ctx); err != nil {
        log.Printf("Erro ao encerrar servidor: %v", err)
    }
    
    // 2. Fechar conexões pendentes no banco
    log.Println("Fechando conexões do banco...")
    db.Close()
    
    log.Println("Shutdown completo")
}
```

---

## 5. Logging Estruturado

### Usando slog (Go 1.21+)

```go
import "log/slog"

func main() {
    // Configurar logger JSON
    logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
        Level: slog.LevelInfo,
    }))
    slog.SetDefault(logger)
    
    // Usar
    slog.Info("Servidor iniciando",
        "port", 8080,
        "environment", "production",
    )
    
    slog.Error("Erro ao processar requisição",
        "error", err,
        "method", "POST",
        "path", "/spi/pacs.008",
    )
}
```

### Middleware de logging

```go
func loggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        
        // Wrappar response writer para capturar status
        wrapped := &statusResponseWriter{ResponseWriter: w, statusCode: 200}
        
        next.ServeHTTP(wrapped, r)
        
        slog.Info("Requisição",
            "method", r.Method,
            "path", r.URL.Path,
            "status", wrapped.statusCode,
            "duration", time.Since(start),
            "remote_addr", r.RemoteAddr,
        )
    })
}
```

---

## 6. Exercício Prático: Servidor Production-Ready

### Objetivo

Criar um servidor SPI completo para produção com:
- Graceful shutdown
- Health checks
- Logging estruturado
- Métricas básicas

### Solução

```go
package main

import (
    "context"
    "encoding/json"
    "fmt"
    "log/slog"
    "net/http"
    "os"
    "os/signal"
    "sync"
    "syscall"
    "time"
)

// ==================== CONFIG ====================

type Config struct {
    Port         string
    ReadTimeout  time.Duration
    WriteTimeout time.Duration
    IdleTimeout  time.Duration
}

func LoadConfig() Config {
    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }
    
    return Config{
        Port:         port,
        ReadTimeout:  15 * time.Second,
        WriteTimeout: 15 * time.Second,
        IdleTimeout:  60 * time.Second,
    }
}

// ==================== STORE ====================

type Store struct {
    mu           sync.RWMutex
    transactions map[string]interface{}
    startedAt    time.Time
}

func NewStore() *Store {
    return &Store{
        transactions: make(map[string]interface{}),
        startedAt:    time.Now(),
    }
}

func (s *Store) Add(id string, data interface{}) {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.transactions[id] = data
}

func (s *Store) Count() int {
    s.mu.RLock()
    defer s.mu.RUnlock()
    return len(s.transactions)
}

func (s *Store) Uptime() time.Duration {
    return time.Since(s.startedAt)
}

// ==================== HEALTH ====================

func livenessHandler(w http.ResponseWriter, r *http.Request) {
    respondJSON(w, http.StatusOK, map[string]string{
        "status": "alive",
    })
}

func readinessHandler(store *Store) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        // Verificar dependências
        checks := map[string]bool{
            "store": true,
        }
        
        allOK := true
        for _, ok := range checks {
            if !ok {
                allOK = false
                break
            }
        }
        
        status := http.StatusOK
        if !allOK {
            status = http.StatusServiceUnavailable
        }
        
        respondJSON(w, status, map[string]interface{}{
            "status":  statusText(status),
            "checks":  checks,
            "uptime":  store.Uptime().String(),
            "txCount": store.Count(),
        })
    }
}

// ==================== HANDLERS ====================

func processHandler(store *Store) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
            respondError(w, http.StatusMethodNotAllowed, "Method not allowed")
            return
        }
        
        var req struct {
            EndToEndID string  `json:"endToEndId"`
            Valor      float64 `json:"valor"`
        }
        
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            respondError(w, http.StatusBadRequest, "Invalid request body")
            return
        }
        
        if req.Valor <= 0 {
            respondError(w, http.StatusBadRequest, "Valor deve ser positivo")
            return
        }
        
        // Simular processamento
        time.Sleep(5 * time.Millisecond)
        
        tx := map[string]interface{}{
            "id":         fmt.Sprintf("TX-%d", time.Now().UnixNano()),
            "endToEndId": req.EndToEndID,
            "valor":      req.Valor,
            "status":     "ACCEPTED",
            "createdAt":  time.Now(),
        }
        
        store.Add(req.EndToEndID, tx)
        
        slog.Info("Transação processada",
            "endToEndId", req.EndToEndID,
            "valor", req.Valor,
        )
        
        respondJSON(w, http.StatusCreated, tx)
    }
}

// ==================== HELPERS ====================

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
    respondJSON(w, status, map[string]string{"error": message})
}

func statusText(code int) string {
    if code == http.StatusOK {
        return "healthy"
    }
    return "unhealthy"
}

// ==================== MAIN ====================

func main() {
    // Configurar logger
    logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
        Level: slog.LevelInfo,
    }))
    slog.SetDefault(logger)
    
    config := LoadConfig()
    store := NewStore()
    
    // Configurar router
    mux := http.NewServeMux()
    mux.HandleFunc("/health/live", livenessHandler)
    mux.HandleFunc("/health/ready", readinessHandler(store))
    mux.HandleFunc("/spi/process", processHandler(store))
    
    // Configurar servidor
    srv := &http.Server{
        Addr:         ":" + config.Port,
        Handler:      mux,
        ReadTimeout:  config.ReadTimeout,
        WriteTimeout: config.WriteTimeout,
        IdleTimeout:  config.IdleTimeout,
    }
    
    // Context para controlar lifecycle
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()
    
    // Handler de sinais
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    
    // Iniciar servidor
    go func() {
        slog.Info("Servidor iniciando", "port", config.Port)
        if err := srv.ListenAndServe(); err != http.ErrServerClosed {
            slog.Error("Erro ao iniciar servidor", "error", err)
            os.Exit(1)
        }
    }()
    
    slog.Info("Servidor pronto para receber requisições")
    
    // Aguardar sinal
    <-quit
    slog.Info("Sinal de shutdown recebido")
    
    // Graceful shutdown
    shutdownCtx, shutdownCancel := context.WithTimeout(ctx, 30*time.Second)
    defer shutdownCancel()
    
    if err := srv.Shutdown(shutdownCtx); err != nil {
        slog.Error("Erro ao encerrar servidor", "error", err)
    }
    
    slog.Info("Servidor encerrado graciosamente")
}
```

---

## 7. Checklist de Produção

### Antes de deployar

- [ ] Graceful shutdown implementado
- [ ] Health checks (liveness + readiness)
- [ ] Logging estruturado (JSON)
- [ ] Timeouts configurados
- [ ] Pool de conexões
- [ ] Métricas expostas
- [ ] Rate limiting
- [ ] CORS configurado

### Kubernetes

- [ ] Liveness probe configurado
- [ ] Readiness probe configurado
- [ ] Resource limits definidos
- [ ] HPA configurado (auto-scaling)

### Monitoramento

- [ ] Logs enviados para aggregator
- [ ] Métricas no Prometheus
- [ ] Alertas configurados
- [ ] Dashboard no Grafana

---

## 8. Resumo

| Conceito | Uso |
|----------|-----|
| `signal.Notify` | Capturar sinais do OS |
| `srv.Shutdown(ctx)` | Parar servidor graciosamente |
| `/health/live` | Verificar se está vivo |
| `/health/ready` | Verificar se está pronto |
| `slog.Info/Error` | Logging estruturado |
| `context.WithTimeout` | Limitar tempo de operações |

### Arquitetura de Produção

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        ┌─────▼─────┐  ┌────▼─────┐  ┌─────▼─────┐
        │  Server 1  │  │ Server 2 │  │  Server 3  │
        │            │  │          │  │            │
        │ /health/*  │  │ /health/* │  │ /health/*  │
        │ /api/*     │  │ /api/*   │  │ /api/*     │
        └─────┬──────┘  └────┬─────┘  └─────┬──────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                    ┌────────▼────────┐
                    │   PostgreSQL    │
                    └─────────────────┘
```

---

**Exercício:** **Exercicio:** production-server/
