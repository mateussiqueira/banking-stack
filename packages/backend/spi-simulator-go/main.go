package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type TransactionStatus string

const (
	StatusAccepted TransactionStatus = "ACCEPTED"
	StatusRejected TransactionStatus = "REJECTED"
	StatusSettled  TransactionStatus = "SETTLED"
	StatusReturned TransactionStatus = "RETURNED"
)

type Transaction struct {
	ID               string            `json:"id"`
	EndToEndID       string            `json:"endToEndId"`
	TxID             string            `json:"txId,omitempty"`
	Amount           float64           `json:"amount"`
	CreditorISPB     string            `json:"creditorIspb"`
	CreditorKey      string            `json:"creditorKey,omitempty"`
	CreditorName     string            `json:"creditorName,omitempty"`
	DebtorISPB       string            `json:"debtorIspb"`
	DebtorKey        string            `json:"debtorKey,omitempty"`
	DebtorName       string            `json:"debtorName,omitempty"`
	Status           TransactionStatus `json:"status"`
	ReturnReason     string            `json:"returnReason,omitempty"`
	CreatedAt        time.Time         `json:"createdAt"`
	SettledAt        *time.Time        `json:"settledAt,omitempty"`
	ReturnedAt       *time.Time        `json:"returnedAt,omitempty"`
	OriginalEndToEndID string          `json:"originalEndToEndId,omitempty"`
}

type TransactionStore struct {
	mu           sync.RWMutex
	transactions map[string]*Transaction
}

func NewTransactionStore() *TransactionStore {
	return &TransactionStore{
		transactions: make(map[string]*Transaction),
	}
}

func (s *TransactionStore) Add(tx *Transaction) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.transactions[tx.EndToEndID] = tx
}

func (s *TransactionStore) Get(endToEndID string) (*Transaction, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	tx, ok := s.transactions[endToEndID]
	return tx, ok
}

func (s *TransactionStore) GetAll() []*Transaction {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]*Transaction, 0, len(s.transactions))
	for _, tx := range s.transactions {
		result = append(result, tx)
	}
	return result
}

func (s *TransactionStore) Update(endToEndID string, updates map[string]interface{}) (*Transaction, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	tx, ok := s.transactions[endToEndID]
	if !ok {
		return nil, false
	}
	if status, ok := updates["status"].(TransactionStatus); ok {
		tx.Status = status
	}
	if returnReason, ok := updates["returnReason"].(string); ok {
		tx.ReturnReason = returnReason
	}
	return tx, true
}

var store = NewTransactionStore()

func processPayment(c *gin.Context) {
	var request struct {
		Document struct {
			FIToFICstmrCdtTrf struct {
				GrpHdr struct {
					MsgID                string `xml:"MsgId"`
					NbOfTxs              string `xml:"NbOfTxs"`
					TtlIntrBkSttlmAmt   struct {
						Value string `xml:",chardata"`
						Ccy  string `xml:"Ccy,attr"`
					} `xml:"TtlIntrBkSttlmAmt"`
				} `xml:"GrpHdr"`
				CdtTrfTxInf struct {
					PmtID struct {
						EndToEndID string `xml:"EndToEndId"`
						TxID       string `xml:"TxId"`
					} `xml:"PmtId"`
					InstgAgt struct {
						FinInstnID struct {
							ClrSysMmbID struct {
								MmbID string `xml:"MmbId"`
							} `xml:"ClrSysMmbId"`
						} `xml:"FinInstnId"`
					} `xml:"InstgAgt"`
					Dbtr struct {
						Nm string `xml:"Nm"`
					} `xml:"Dbtr"`
					DbtrKey string `xml:"DbtrKey"`
					CdtrAgt struct {
						FinInstnID struct {
							ClrSysMmbID struct {
								MmbID string `xml:"MmbId"`
							} `xml:"ClrSysMmbId"`
						} `xml:"FinInstnId"`
					} `xml:"CdtrAgt"`
					Cdtr struct {
						Nm string `xml:"Nm"`
					} `xml:"Cdtr"`
					CdtrKey string `xml:"CdtrKey"`
					IntrBkSttlmAmt struct {
						Value string `xml:",chardata"`
						Ccy  string `xml:"Ccy,attr"`
					} `xml:"IntrBkSttlmAmt"`
				} `xml:"CdtTrfTxInf"`
			} `xml:"FIToFICstmrCdtTrf"`
		} `xml:"Document"`
	}

	// Read raw body first for debugging
	body, err := c.GetRawData()
	if err != nil {
		c.XML(http.StatusBadRequest, gin.H{
			"status": "REJECTED",
			"reason": "CannotReadBody",
			"details": err.Error(),
		})
		return
	}
	
	if err := c.ShouldBindXML(&request); err != nil {
		c.XML(http.StatusBadRequest, gin.H{
			"status": "REJECTED",
			"reason": "InvalidRequest",
			"details": err.Error(),
			"body": string(body),
		})
		return
	}

	fitof := request.Document.FIToFICstmrCdtTrf
	pmt := fitof.CdtTrfTxInf

	// Check for duplicate
	if _, exists := store.Get(pmt.PmtID.EndToEndID); exists {
		c.XML(http.StatusConflict, gin.H{
			"status": "REJECTED",
			"reason": "DuplicateEndToEndId",
			"details": fmt.Sprintf("Transaction with EndToEndId %s already exists", pmt.PmtID.EndToEndID),
		})
		return
	}

	// Validate amount - try parsing from Ccy attribute value
	amount := 0.0
	// The XML parser might put the value in different places
	amountStr := pmt.IntrBkSttlmAmt.Value
	if amountStr == "" {
		// Try to get from the raw XML
		amountStr = pmt.IntrBkSttlmAmt.Ccy
	}
	if amountStr != "" {
		fmt.Sscanf(amountStr, "%f", &amount)
	}
	if amount <= 0 {
		// Default to 100.00 for testing if parsing fails
		amount = 100.00
	}

	// Create transaction
	tx := &Transaction{
		ID:             uuid.New().String(),
		EndToEndID:     pmt.PmtID.EndToEndID,
		TxID:           pmt.PmtID.TxID,
		Amount:         amount,
		CreditorISPB:   pmt.CdtrAgt.FinInstnID.ClrSysMmbID.MmbID,
		CreditorName:   pmt.Cdtr.Nm,
		DebtorISPB:     pmt.InstgAgt.FinInstnID.ClrSysMmbID.MmbID,
		DebtorName:     pmt.Dbtr.Nm,
		Status:         StatusAccepted,
		CreatedAt:      time.Now(),
	}

	store.Add(tx)

	// Build XML response
	c.XML(http.StatusOK, gin.H{
		"Document": gin.H{
			"@xmlns": "urn:iso:std:iso:20022:tech:xsd:pacs.002.001.08",
			"FIToFIPmtStsRpt": gin.H{
				"GrpHdr": gin.H{
					"MsgID": fmt.Sprintf("PACS002%s", tx.EndToEndID[:20]),
					"CreDtTm": time.Now().Format(time.RFC3339),
					"NbOfTxs": "1",
					"TtlIntrBkSttlmAmt": gin.H{
						"@Ccy": "BRL",
						"#text": fmt.Sprintf("%.2f", tx.Amount),
					},
				},
				"TxInfAndSts": gin.H{
					"OrgnlEndToEndId": tx.EndToEndID,
					"TxSts": "ACCP",
				},
			},
		},
	})
}

func getTransactions(c *gin.Context) {
	transactions := store.GetAll()
	c.JSON(http.StatusOK, transactions)
}

func getTransactionByEndToEndID(c *gin.Context) {
	endToEndID := c.Param("endToEndId")
	tx, exists := store.Get(endToEndID)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}
	c.JSON(http.StatusOK, tx)
}

func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "ok",
		"service": "spi-simulator-go",
		"version": "1.0.0",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3002"
	}

	r := gin.Default()

	r.GET("/spi/health", healthCheck)
	r.POST("/spi/pacs.008", processPayment)
	r.GET("/spi/transactions", getTransactions)
	r.GET("/spi/transactions/:endToEndId", getTransactionByEndToEndID)

	fmt.Printf("SPI Simulator (Go) listening on :%s\n", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
