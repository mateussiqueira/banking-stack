package models

import "time"

type ClaimStatus string

const (
	ClaimStatusOpen     ClaimStatus = "OPEN"
	ClaimStatusWaiting  ClaimStatus = "WAITING"
	ClaimStatusCompleted ClaimStatus = "COMPLETED"
	ClaimStatusCancelled ClaimStatus = "CANCELLED"
)

type AccountClaim struct {
	ID                    string      `json:"id"`
	Key                   string      `json:"key"`
	TargetISPB            string      `json:"targetIspb"`
	TargetAccount         string      `json:"targetAccount"`
	TargetBranch          string      `json:"targetBranch"`
	TargetAccountHolderName string   `json:"targetAccountHolderName"`
	Status                ClaimStatus `json:"status"`
	CreatedAt             time.Time   `json:"createdAt"`
	UpdatedAt             time.Time   `json:"updatedAt"`
}
