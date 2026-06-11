import mongoose, { Schema, Document } from 'mongoose'

export enum KeyType {
  CPF = 'CPF',
  CNPJ = 'CNPJ',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  RANDOM = 'RANDOM',
}

export enum AccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
}

export enum KeyStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  FROZEN = 'FROZEN',
}

export interface IPixKey extends Document {
  key: string
  keyType: KeyType
  accountType: AccountType
  ispb: string
  branch: string
  accountNumber: string
  accountHolderName: string
  accountHolderDoc: string
  status: KeyStatus
  createdAt: Date
  updatedAt: Date
}

const PixKeySchema = new Schema<IPixKey>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    keyType: {
      type: String,
      enum: Object.values(KeyType),
      required: true,
    },
    accountType: {
      type: String,
      enum: Object.values(AccountType),
      required: true,
    },
    ispb: {
      type: String,
      required: true,
    },
    branch: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    accountHolderName: {
      type: String,
      required: true,
    },
    accountHolderDoc: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(KeyStatus),
      default: KeyStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
  },
)

export const PixKey = mongoose.model<IPixKey>('PixKey', PixKeySchema)
