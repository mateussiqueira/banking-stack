package models

import "time"

type TransactionStatus string

const (
	StatusAccepted TransactionStatus = "ACCEPTED"
	StatusRejected TransactionStatus = "REJECTED"
	StatusSettled  TransactionStatus = "SETTLED"
	StatusReturned TransactionStatus = "RETURNED"
)

type Transaction struct {
	ID                   string            `json:"id"`
	EndToEndID           string            `json:"endToEndId"`
	TxID                 string            `json:"txId,omitempty"`
	Amount               float64           `json:"amount"`
	CreditorISPB         string            `json:"creditorIspb"`
	CreditorKey          string            `json:"creditorKey,omitempty"`
	CreditorName         string            `json:"creditorName"`
	DebtorISPB           string            `json:"debtorIspb"`
	DebtorKey            string            `json:"debtorKey,omitempty"`
	DebtorName           string            `json:"debtorName"`
	Status               TransactionStatus `json:"status"`
	ReturnReason         string            `json:"returnReason,omitempty"`
	ReturnRejectionReason string           `json:"returnRejectionReason,omitempty"`
	CreatedAt            time.Time         `json:"createdAt"`
	SettledAt            *time.Time        `json:"settledAt,omitempty"`
	ReturnedAt           *time.Time        `json:"returnedAt,omitempty"`
	OriginalEndToEndID   string            `json:"originalEndToEndId,omitempty"`
}
