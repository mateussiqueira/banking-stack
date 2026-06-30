package models

import "time"

type KeyType string

const (
	KeyTypeCPF    KeyType = "CPF"
	KeyTypeCNPJ   KeyType = "CNPJ"
	KeyTypeEmail  KeyType = "EMAIL"
	KeyTypePhone  KeyType = "PHONE"
	KeyTypeRandom KeyType = "RANDOM"
)

type AccountType string

const (
	AccountTypeChecking AccountType = "CHECKING"
	AccountTypeSavings  AccountType = "SAVINGS"
)

type KeyStatus string

const (
	KeyStatusActive  KeyStatus = "ACTIVE"
	KeyStatusBlocked KeyStatus = "BLOCKED"
	KeyStatusFrozen  KeyStatus = "FROZEN"
)

type PixKey struct {
	ID                string        `json:"id"`
	Key               string        `json:"key"`
	KeyType           KeyType       `json:"keyType"`
	AccountType       AccountType   `json:"accountType"`
	ISPB              string        `json:"ispb"`
	Branch            string        `json:"branch"`
	AccountNumber     string        `json:"accountNumber"`
	AccountHolderName string        `json:"accountHolderName"`
	AccountHolderDoc  string        `json:"accountHolderDoc"`
	Status            KeyStatus     `json:"status"`
	CreatedAt         time.Time     `json:"createdAt"`
	UpdatedAt         time.Time     `json:"updatedAt"`
}
