import mongoose, { Schema, Document } from 'mongoose';

export type ReportType = 'TRANSACTIONS' | 'ACCOUNTS' | 'SETTLEMENTS' | 'CUSTOM';
export type ReportFormat = 'XLSX' | 'CSV' | 'JSON' | 'PDF';
export type ReportStatus = 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';

export interface IReport extends Document {
  name: string;
  type: ReportType;
  format: ReportFormat;
  filters: Record<string, unknown>;
  status: ReportStatus;
  fileUrl?: string;
  fileSize?: number;
  recordCount?: number;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

const ReportSchema = new Schema<IReport>(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['TRANSACTIONS', 'ACCOUNTS', 'SETTLEMENTS', 'CUSTOM'],
      required: true,
    },
    format: {
      type: String,
      enum: ['XLSX', 'CSV', 'JSON', 'PDF'],
      required: true,
    },
    filters: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ['PENDING', 'GENERATING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    fileUrl: { type: String },
    fileSize: { type: Number },
    recordCount: { type: Number },
    completedAt: { type: Date },
    error: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true },
  }
);

export const Report = mongoose.model<IReport>('Report', ReportSchema);
