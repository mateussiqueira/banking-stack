import mongoose, { Schema, Document } from 'mongoose'

export enum ClaimStatus {
  OPEN = 'OPEN',
  WAITING = 'WAITING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface IAccountClaim extends Document {
  key: string
  targetIspb: string
  targetAccount: string
  targetBranch: string
  targetAccountHolderName: string
  status: ClaimStatus
  createdAt: Date
  updatedAt: Date
}

const AccountClaimSchema = new Schema<IAccountClaim>(
  {
    key: {
      type: String,
      required: true,
    },
    targetIspb: {
      type: String,
      required: true,
    },
    targetAccount: {
      type: String,
      required: true,
    },
    targetBranch: {
      type: String,
      required: true,
    },
    targetAccountHolderName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ClaimStatus),
      default: ClaimStatus.OPEN,
    },
  },
  {
    timestamps: true,
  },
)

export const AccountClaim = mongoose.model<IAccountClaim>('AccountClaim', AccountClaimSchema)
