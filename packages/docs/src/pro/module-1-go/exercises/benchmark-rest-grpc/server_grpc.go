//go:build ignore

package main

import (
	"log"
	"net"
	"net/rpc"
	"time"
)

type TransactionRequest struct {
	ID     string
	Amount float64
	Type   string
}

type TransactionResponse struct {
	ID          string
	Status      string
	Amount      float64
	ProcessedAt string
}

type TransactionService struct{}

func (s *TransactionService) ProcessPayment(req TransactionRequest, resp *TransactionResponse) error {
	*resp = TransactionResponse{
		ID:          req.ID,
		Status:      "completed",
		Amount:      req.Amount,
		ProcessedAt: time.Now().UTC().Format(time.RFC3339Nano),
	}
	return nil
}

func (s *TransactionService) GetTransaction(req TransactionRequest, resp *TransactionResponse) error {
	*resp = TransactionResponse{
		ID:          req.ID,
		Status:      "completed",
		Amount:      req.Amount,
		ProcessedAt: time.Now().UTC().Format(time.RFC3339Nano),
	}
	return nil
}

func main() {
	svc := new(TransactionService)
	rpc.Register(svc)

	l, err := net.Listen("tcp", ":9092")
	if err != nil {
		log.Fatal("listen error:", err)
	}
	defer l.Close()

	log.Println("RPC server listening on :9092")
	for {
		conn, err := l.Accept()
		if err != nil {
			log.Println("accept error:", err)
			continue
		}
		go rpc.ServeConn(conn)
	}
}
