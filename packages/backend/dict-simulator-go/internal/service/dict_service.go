package service

import (
	"fmt"

	"github.com/mateussiqueira/banking-stack/dict-simulator-go/internal/models"
	"github.com/mateussiqueira/banking-stack/dict-simulator-go/internal/validation"
)

type DICTService struct {
	store *models.Store
}

func NewDICTService(store *models.Store) *DICTService {
	return &DICTService{store: store}
}

func (s *DICTService) RegisterKey(key, keyType, accountType, ispb, branch, accountNumber, holderName, holderDoc string) (*models.PixKey, error) {
	// Validar tipo da chave
	if err := validation.ValidateKeyType(key, keyType); err != nil {
		return nil, fmt.Errorf("invalid key: %w", err)
	}

	// Validar ISPB
	if !validation.ValidateISPB(ispb) {
		return nil, fmt.Errorf("invalid ISPB: %s (must be 8 digits)", ispb)
	}

	// Formatar chave
	formattedKey := validation.FormatPixKey(key, keyType)

	// Criar chave
	pixKey := &models.PixKey{
		Key:               formattedKey,
		KeyType:           models.KeyType(keyType),
		AccountType:       models.AccountType(accountType),
		ISPB:              ispb,
		Branch:            branch,
		AccountNumber:     accountNumber,
		AccountHolderName: holderName,
		AccountHolderDoc:  holderDoc,
	}

	return s.store.CreatePixKey(pixKey)
}

func (s *DICTService) LookupKey(key string) (*models.PixKey, error) {
	return s.store.GetPixKey(key)
}

func (s *DICTService) UpdateKey(key, holderName string) (*models.PixKey, error) {
	return s.store.UpdatePixKey(key, holderName)
}

func (s *DICTService) DeactivateKey(key string) (*models.PixKey, error) {
	return s.store.DeactivatePixKey(key)
}

func (s *DICTService) ListKeys(page, limit int) ([]*models.PixKey, int) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	return s.store.ListPixKeys(page, limit)
}

func (s *DICTService) CreateClaim(key, targetISPB, targetAccount, targetBranch, targetHolderName string) (*models.AccountClaim, error) {
	// Verificar se a chave existe
	_, err := s.store.GetPixKey(key)
	if err != nil {
		return nil, fmt.Errorf("key not found: %s", key)
	}

	// Validar ISPB
	if !validation.ValidateISPB(targetISPB) {
		return nil, fmt.Errorf("invalid target ISPB: %s", targetISPB)
	}

	claim := &models.AccountClaim{
		Key:                   key,
		TargetISPB:            targetISPB,
		TargetAccount:         targetAccount,
		TargetBranch:          targetBranch,
		TargetAccountHolderName: targetHolderName,
	}

	return s.store.CreateClaim(claim)
}

func (s *DICTService) GetClaim(id string) (*models.AccountClaim, error) {
	return s.store.GetClaim(id)
}

func (s *DICTService) ConfirmClaim(id string) (*models.AccountClaim, error) {
	return s.store.ConfirmClaim(id)
}

func (s *DICTService) CancelClaim(id string) (*models.AccountClaim, error) {
	return s.store.CancelClaim(id)
}

func (s *DICTService) Clear() {
	s.store.Clear()
}
