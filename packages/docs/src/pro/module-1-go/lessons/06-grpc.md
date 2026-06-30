# Aula 06: gRPC com Go — Proto Definitions e Streaming

**Duração:** 65 minutos
**Pré-requisitos:** Aulas 01-05
**Objetivo:** Comunicar microsserviços financeiros com gRPC para latência mínima.

---

## 📋 Objetivos de Aprendizagem

1. Entender por que gRPC é melhor que REST para sistemas internos
2. Definir serviços com Protocol Buffers
3. Implementar server e client gRPC em Go
4. Usar streaming unidirecional e bidirecional
5. Aplicar interceptors para autenticação e logging

---

## 1. REST vs gRPC

### Comparação

| Característica | REST/JSON | gRPC |
|----------------|-----------|------|
| **Formato** | JSON (texto) | Protobuf (binário) |
| **Tamanho** | ~100% | ~30% do JSON |
| **Velocidade** | ~1ms | ~0.1ms |
| **Streaming** | Limitado | Nativo |
| **Contrato** | OpenAPI (opcional) | Proto (obrigatório) |
| **Browser** | Nativo | Via gRPC-Web |

### Quando usar gRPC

| Caso | Recomendado |
|------|-------------|
| API pública | ❌ REST |
| Comunicação interna | ✅ gRPC |
| Tempo real / streaming | ✅ gRPC |
| Mobile / browser | ❌ REST |
| Microsserviços | ✅ gRPC |

---

## 2. Protocol Buffers (Protobuf)

### O que é?

Protobuf é um formato de serialização binário desenvolvido pelo Google:

```protobuf
// arquivo.proto
syntax = "proto3";

message Transacao {
  string id = 1;
  double valor = 2;
  string ispb_origem = 3;
  string ispb_destino = 4;
  string status = 5;
}
```

### Vantagens

1. **Contrato forte** — Schema definido antes do código
2. **Binário compacto** — Menos bytes na rede
3. **Code generation** — Go, Java, Python, etc.
4. **Versão retrocompatível** — Adicionar campos sem quebrar

---

## 3. Definindo um Serviço SPI

### Arquivo proto/spi.proto

```protobuf
syntax = "proto3";

package spi;

option go_package = "github.com/mateussiqueira/banking-stack/spi-grpc/proto/spi";

// Serviço principal
service SPIService {
  // Unary RPC
  rpc ProcessPayment(ProcessPaymentRequest) returns (ProcessPaymentResponse);
  rpc GetTransaction(GetTransactionRequest) returns (Transaction);
  
  // Server streaming
  rpc StreamTransactions(StreamRequest) returns (stream Transaction);
  
  // Bidirectional streaming
  rpc StreamPayments(stream PaymentChunk) returns (stream PaymentStatus);
}

// Messages
message ProcessPaymentRequest {
  string end_to_end_id = 1;
  double amount = 2;
  string creditor_ispb = 3;
  string creditor_name = 4;
  string debtor_ispb = 5;
  string debtor_name = 6;
}

message ProcessPaymentResponse {
  bool accepted = 1;
  string status = 2;
  string message = 3;
}

message GetTransactionRequest {
  string end_to_end_id = 1;
}

message Transaction {
  string id = 1;
  string end_to_end_id = 2;
  double amount = 3;
  string creditor_ispb = 4;
  string debtor_ispb = 5;
  string status = 6;
  int64 created_at = 7;
}

message StreamRequest {
  int32 limit = 1;
}

message PaymentChunk {
  string end_to_end_id = 1;
  double amount = 2;
  string ispb = 3;
}

message PaymentStatus {
  string end_to_end_id = 1;
  bool success = 2;
  string message = 3;
}
```

---

## 4. Gerando Código Go

### Instalar protoc

```bash
# Mac
brew install protobuf

# Linux
sudo apt install protobuf-compiler

# Verificar
protoc --version
```

### Instalar plugins Go

```bash
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
```

### Gerar código

```bash
protoc --go_out=. --go-grpc_out=. proto/spi.proto
```

### Resultado

```
proto/spi/
├── spi.pb.go        # Messages
└── spi_grpc.pb.go   # Service stubs
```

---

## 5. Implementando o Server

```go
package main

import (
    "context"
    "fmt"
    "log"
    "net"
    "sync"
    "time"

    "google.golang.org/grpc"
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/status"
    
    pb "github.com/mateussiqueira/banking-stack/spi-grpc/proto/spi"
)

type spiServer struct {
    pb.UnimplementedSPIServiceServer
    mu           sync.RWMutex
    transactions map[string]*pb.Transaction
}

func newSPIServer() *spiServer {
    return &spiServer{
        transactions: make(map[string]*pb.Transaction),
    }
}

// Unary RPC
func (s *spiServer) ProcessPayment(ctx context.Context, req *pb.ProcessPaymentRequest) (*pb.ProcessPaymentResponse, error) {
    // Validar
    if req.Amount <= 0 {
        return nil, status.Errorf(codes.InvalidArgument, "amount must be positive")
    }
    
    if len(req.CreditorIspb) != 8 || len(req.DebtorIspb) != 8 {
        return nil, status.Errorf(codes.InvalidArgument, "ISPB must be 8 digits")
    }
    
    // Criar transação
    tx := &pb.Transaction{
        Id:            fmt.Sprintf("TX-%d", time.Now().UnixNano()),
        EndToEndId:    req.EndToEndId,
        Amount:        req.Amount,
        CreditorIspb:  req.CreditorIspb,
        DebtorIspb:    req.DebtorIspb,
        Status:        "ACCEPTED",
        CreatedAt:     time.Now().Unix(),
    }
    
    s.mu.Lock()
    s.transactions[tx.EndToEndId] = tx
    s.mu.Unlock()
    
    return &pb.ProcessPaymentResponse{
        Accepted: true,
        Status:   "ACCEPTED",
        Message:  "Payment processed successfully",
    }, nil
}

// Unary RPC
func (s *spiServer) GetTransaction(ctx context.Context, req *pb.GetTransactionRequest) (*pb.Transaction, error) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    
    tx, ok := s.transactions[req.EndToEndId]
    if !ok {
        return nil, status.Errorf(codes.NotFound, "transaction not found")
    }
    
    return tx, nil
}

// Server streaming
func (s *spiServer) StreamTransactions(req *pb.StreamRequest, stream pb.SPIService_StreamTransactionsServer) error {
    s.mu.RLock()
    defer s.mu.RUnlock()
    
    count := 0
    for _, tx := range s.transactions {
        if int32(count) >= req.Limit {
            break
        }
        
        if err := stream.Send(tx); err != nil {
            return err
        }
        count++
        
        time.Sleep(100 * time.Millisecond) // Simular latência
    }
    
    return nil
}

// Bidirectional streaming
func (s *spiServer) StreamPayments(stream pb.SPIService_StreamPaymentsServer) error {
    for {
        chunk, err := stream.Recv()
        if err != nil {
            return err
        }
        
        // Processar chunk
        status := &pb.PaymentStatus{
            EndToEndId: chunk.EndToEndId,
            Success:    true,
            Message:    "Processed",
        }
        
        // Enviar status
        if err := stream.Send(status); err != nil {
            return err
        }
    }
}

func main() {
    lis, err := net.Listen("tcp", ":50051")
    if err != nil {
        log.Fatalf("failed to listen: %v", err)
    }
    
    grpcServer := grpc.NewServer()
    pb.RegisterSPIServiceServer(grpcServer, newSPIServer())
    
    log.Println("SPI gRPC server running on :50051")
    if err := grpcServer.Serve(lis); err != nil {
        log.Fatalf("failed to serve: %v", err)
    }
}
```

---

## 6. Implementando o Client

```go
package main

import (
    "context"
    "fmt"
    "log"
    "time"

    "google.golang.org/grpc"
    "google.golang.org/grpc/credentials/insecure"
    
    pb "github.com/mateussiqueira/banking-stack/spi-grpc/proto/spi"
)

func main() {
    // Conectar ao server
    conn, err := grpc.Dial("localhost:50051", 
        grpc.WithTransportCredentials(insecure.NewCredentials()))
    if err != nil {
        log.Fatalf("did not connect: %v", err)
    }
    defer conn.Close()
    
    client := pb.NewSPIServiceClient(conn)
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    // 1. Unary RPC - Processar pagamento
    fmt.Println("=== Processando Pagamento ===")
    resp, err := client.ProcessPayment(ctx, &pb.ProcessPaymentRequest{
        EndToEndId:   "E2E20240101120000TEST",
        Amount:       250.50,
        CreditorIspb: "60701190",
        CreditorName: "João Silva",
        DebtorIspb:   "00000000",
        DebtorName:   "Maria Santos",
    })
    if err != nil {
        log.Fatalf("could not process payment: %v", err)
    }
    fmt.Printf("Status: %s | Accepted: %v\n\n", resp.Status, resp.Accepted)
    
    // 2. Unary RPC - Buscar transação
    fmt.Println("=== Buscando Transação ===")
    tx, err := client.GetTransaction(ctx, &pb.GetTransactionRequest{
        EndToEndId: "E2E20240101120000TEST",
    })
    if err != nil {
        log.Fatalf("could not get transaction: %v", err)
    }
    fmt.Printf("Tx: %s | R$ %.2f | %s\n\n", tx.Id, tx.Amount, tx.Status)
    
    // 3. Server streaming
    fmt.Println("=== Streaming Transações ===")
    stream, err := client.StreamTransactions(ctx, &pb.StreamRequest{Limit: 3})
    if err != nil {
        log.Fatalf("could not stream: %v", err)
    }
    
    for {
        tx, err := stream.Recv()
        if err != nil {
            break
        }
        fmt.Printf("  Stream: %s | R$ %.2f\n", tx.EndToEndId, tx.Amount)
    }
    
    fmt.Println("\n✅ Demo concluída!")
}
```

---

## 7. Interceptors (Middleware gRPC)

### Logging Interceptor

```go
func loggingInterceptor(
    ctx context.Context,
    req interface{},
    info *grpc.UnaryServerInfo,
    handler grpc.UnaryHandler,
) (interface{}, error) {
    start := time.Now()
    
    // Chamar handler
    resp, err := handler(ctx, req)
    
    // Log
    log.Printf("Method: %s | Duration: %v | Error: %v",
        info.FullMethod, time.Since(start), err)
    
    return resp, err
}

// Usar
grpcServer := grpc.NewServer(
    grpc.UnaryInterceptor(loggingInterceptor),
)
```

### Auth Interceptor

```go
func authInterceptor(
    ctx context.Context,
    req interface{},
    info *grpc.UnaryServerInfo,
    handler grpc.UnaryHandler,
) (interface{}, error) {
    // Pular auth para health check
    if info.FullMethod == "/spi.SPIService/Health" {
        return handler(ctx, req)
    }
    
    // Extrair token
    md, ok := metadata.FromIncomingContext(ctx)
    if !ok {
        return nil, status.Errorf(codes.Unauthenticated, "missing metadata")
    }
    
    tokens := md.Get("authorization")
    if len(tokens) == 0 {
        return nil, status.Errorf(codes.Unauthenticated, "missing token")
    }
    
    // Validar token
    if !validToken(tokens[0]) {
        return nil, status.Errorf(codes.Unauthenticated, "invalid token")
    }
    
    return handler(ctx, req)
}
```

---

## 8. Exercício Prático: SPI gRPC

### Objetivo

Criar um servidor e client SPI usando gRPC com:
1. Unary RPC para processar pagamento
2. Server streaming para listar transações
3. Validação de ISPB

### Solução

```go
// Ver exercises/06-grpc-spi/
```

---

## 9. Resumo

| Conceito | Uso |
|----------|-----|
| **Unary RPC** | Request/Response simples |
| **Server Streaming** | Enviar múltiplas respostas |
| **Client Streaming** | Enviar múltiplos requests |
| **Bidirectional** | Streaming em ambas direções |
| **Interceptor** | Middleware (auth, logging) |
| **Protobuf** | Schema binário compacto |

### gRPC Status Codes

| Código | Nome | Uso |
|--------|------|-----|
| 0 | OK | Sucesso |
| 3 | INVALID_ARGUMENT | Parâmetros inválidos |
| 5 | NOT_FOUND | Recurso não encontrado |
| 8 | RESOURCE_EXHAUSTED | Rate limit |
| 13 | INTERNAL | Erro interno |
| 14 | UNAVAILABLE | Serviço indisponível |

---

**Exercício:** **Exercicio:** grpc-spi/
