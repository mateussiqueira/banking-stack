import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3005', 10),
  host: process.env.HOST || '0.0.0.0',
  webhookSecret: process.env.WEBHOOK_SECRET || 'banking-workflow-secret',
  maxExecutionTime: parseInt(process.env.MAX_EXECUTION_TIME || '30000', 10),
  storagePath: process.env.STORAGE_PATH || './data',
};
