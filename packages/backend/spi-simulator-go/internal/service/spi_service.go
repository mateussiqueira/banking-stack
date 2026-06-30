package service

import (
	"fmt"
	"math"
	"time"

	"github.com/google/uuid"
	"github.com/mateussiqueira/banking-stack/spi-simulator-go/internal/iso20022"
	"github.com/mateussiqueira/banking-stack/spi-simulator-go/internal/models"
)

// ISPB codes válidos (subset para simulação)
var validISPBs = map[string]bool{
	"00000000": true, // Banco do Brasil
	"00360305": true, // Itaú Unibanco
	"60701190": true, // Itaú BBA
	"34162660": true, // Itaú
	"09512591": true, // Mercado Pago
	"12345678": true, // ISPB teste 1
	"87654321": true, // ISPB teste 2
}

type SPIService struct {
	store *models.TransactionStore
}

func NewSPIService(store *models.TransactionStore) *SPIService {
	return &SPIService{store: store}
}

type ProcessResult struct {
	Transaction *models.Transaction
	StatusXML   []byte
}

func (s *SPIService) ProcessPayment(xmlData []byte) (*ProcessResult, error) {
	doc, err := iso20022.ParsePacs008(xmlData)
	if err != nil {
		return nil, fmt.Errorf("invalid pacs.008: %w", err)
	}

	tx := doc.FIToFICstmrCdtTrf.CdtTrfTxInf[0]
	endToEndID := tx.PmtId.EndToEndId
	amount := tx.IntrBkSttlmAmt.Value
	creditorISPB := tx.CdtrAgt.FinInstnId.ClrSysId.MmbId
	debtorISPB := tx.DbtrAgt.FinInstnId.ClrSysId.MmbId

	// Validações
	if !s.validateIspb(debtorISPB) {
		return nil, fmt.Errorf("invalid debtor ISPB: %s", debtorISPB)
	}
	if !s.validateIspb(creditorISPB) {
		return nil, fmt.Errorf("invalid creditor ISPB: %s", creditorISPB)
	}
	if amount <= 0 || amount > 100000000 {
		return nil, fmt.Errorf("invalid amount: %.2f (must be between 0 and 100,000,000)", amount)
	}
	if _, exists := s.store.Get(endToEndID); exists {
		return nil, fmt.Errorf("duplicate EndToEndId: %s", endToEndID)
	}

	// Criar transação
	transaction := &models.Transaction{
		ID:           uuid.New().String(),
		EndToEndID:   endToEndID,
		TxID:         tx.PmtId.TxId,
		Amount:       amount,
		CreditorISPB: creditorISPB,
		CreditorName: tx.Cdtr.Nm,
		DebtorISPB:   debtorISPB,
		DebtorName:   tx.Dbtr.Nm,
		Status:       models.StatusAccepted,
		CreatedAt:    time.Now(),
	}

	s.store.Add(transaction)

	// Gerar pacs.002
	statusXML, err := iso20022.BuildPacs002(endToEndID, tx.PmtId.TxId, "ACCP")
	if err != nil {
		return nil, fmt.Errorf("failed to build pacs.002: %w", err)
	}

	return &ProcessResult{
		Transaction: transaction,
		StatusXML:   statusXML,
	}, nil
}

func (s *SPIService) SettlePayment(endToEndID string) (*ProcessResult, error) {
	tx, ok := s.store.Get(endToEndID)
	if !ok {
		return nil, fmt.Errorf("transaction not found: %s", endToEndID)
	}
	if tx.Status != models.StatusAccepted {
		return nil, fmt.Errorf("transaction cannot be settled: status is %s (expected ACCEPTED)", tx.Status)
	}

	now := time.Now()
	tx.Status = models.StatusSettled
	tx.SettledAt = &now
	s.store.Update(tx)

	statusXML, err := iso20022.BuildPacs002(endToEndID, tx.TxID, "ACSP")
	if err != nil {
		return nil, fmt.Errorf("failed to build pacs.002: %w", err)
	}

	return &ProcessResult{
		Transaction: tx,
		StatusXML:   statusXML,
	}, nil
}

type ReturnResult struct {
	ReturnTransaction *models.Transaction
	ReturnXML         []byte
}

func (s *SPIService) ReturnPayment(endToEndID, reasonCode, additionalInfo string) (*ReturnResult, error) {
	original, ok := s.store.Get(endToEndID)
	if !ok {
		return nil, fmt.Errorf("original transaction not found: %s", endToEndID)
	}
	if original.Status != models.StatusSettled {
		return nil, fmt.Errorf("transaction cannot be returned: status is %s (expected SETTLED)", original.Status)
	}

	now := time.Now()

	// Atualizar transação original
	original.Status = models.StatusReturned
	original.ReturnedAt = &now
	s.store.Update(original)

	// Criar transação de retorno (ISPBs invertidos)
	returnTx := &models.Transaction{
		ID:                   uuid.New().String(),
		EndToEndID:           fmt.Sprintf("RET%s", endToEndID),
		TxID:                 fmt.Sprintf("RET%s", original.TxID),
		Amount:               original.Amount,
		CreditorISPB:         original.DebtorISPB,
		CreditorName:         original.DebtorName,
		DebtorISPB:           original.CreditorISPB,
		DebtorName:           original.CreditorName,
		Status:               models.StatusReturned,
		ReturnReason:         reasonCode,
		ReturnRejectionReason: additionalInfo,
		CreatedAt:            now,
		OriginalEndToEndID:   endToEndID,
	}

	s.store.Add(returnTx)

	returnXML, err := iso20022.BuildPacs004(endToEndID, original.TxID, original.Amount, reasonCode, additionalInfo)
	if err != nil {
		return nil, fmt.Errorf("failed to build pacs.004: %w", err)
	}

	return &ReturnResult{
		ReturnTransaction: returnTx,
		ReturnXML:         returnXML,
	}, nil
}

func (s *SPIService) GetTransaction(endToEndID string) (*models.Transaction, bool) {
	return s.store.Get(endToEndID)
}

func (s *SPIService) ListTransactions() []*models.Transaction {
	return s.store.GetAll()
}

func (s *SPIService) ClearTransactions() {
	s.store.Clear()
}

func (s *SPIService) validateIspb(ispb string) bool {
	return validISPBs[ispb]
}

func GenerateEndToEndID() string {
	timestamp := time.Now().Format("20060102150405")
	shortUUID := uuid.New().String()[:8]
	return fmt.Sprintf("E2E%s%s", timestamp, shortUUID)
}

func RoundMoney(amount float64) float64 {
	return math.Round(amount*100) / 100
}
