import mongoose, { Schema, Document } from 'mongoose';

export interface IAccount extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  document: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
  {
    name: { type: String, required: true },
    document: { type: String, required: true, unique: true },
    balance: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true }
);

AccountSchema.pre('save', function (next) {
  if (this.balance < 0) {
    return next(new Error('Account balance cannot be negative'));
  }
  next();
});

export const Account = mongoose.model<IAccount>('Account', AccountSchema);
