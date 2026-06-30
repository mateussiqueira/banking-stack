import mongoose, { Schema, Document } from 'mongoose';

export type TransactionType = 'PIX' | 'TED' | 'DOC' | 'TRANSFER';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERTED';

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  senderAccount: mongoose.Types.ObjectId;
  receiverAccount: mongoose.Types.ObjectId;
  amount: number;
  description?: string;
  type: TransactionType;
  status: TransactionStatus;
  idempotencyKey?: string;
  createdAt: Date;
  completedAt?: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    senderAccount: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    receiverAccount: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, default: '' },
    type: {
      type: String,
      enum: ['PIX', 'TED', 'DOC', 'TRANSFER'],
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED', 'REVERTED'],
      default: 'PENDING',
    },
    completedAt: { type: Date },
    idempotencyKey: { type: String, unique: true, sparse: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Transaction = mongoose.model<ITransaction>(
  'Transaction',
  TransactionSchema
);
