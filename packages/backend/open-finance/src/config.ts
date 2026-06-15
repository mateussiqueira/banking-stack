import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.OPEN_FINANCE_PORT || '3006', 10),
  host: process.env.OPEN_FINANCE_HOST || '0.0.0.0',
  jwtSecret: process.env.OF_JWT_SECRET || 'open-finance-simulator-secret-key-dev-only',
  jwtExpiresIn: process.env.OF_JWT_EXPIRES_IN || '3600s',
  issuer: process.env.OF_ISSUER || 'https://simulator.openfinance.banking.com',
  consentDurationDays: parseInt(process.env.OF_CONSENT_DURATION_DAYS || '365', 10),
};
