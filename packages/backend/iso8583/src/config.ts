import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3004', 10),
  issuerApiUrl: process.env.ISSUER_API_URL || 'http://localhost:3004',
  acquirerApiUrl: process.env.ACQUIRER_API_URL || 'http://localhost:3004',
  defaultCurrency: process.env.DEFAULT_CURRENCY || '986',
  defaultTerminal: process.env.DEFAULT_TERMINAL || 'TERM0001',
  defaultMerchantId: process.env.DEFAULT_MERCHANT_ID || 'MERCH001',
  nodeEnv: process.env.NODE_ENV || 'development',
  defaultAmount: '000000001000',
};
