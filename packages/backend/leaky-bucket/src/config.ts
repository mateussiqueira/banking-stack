import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.LEAKY_BUCKET_PORT || '3009', 10),
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    keyPrefix: 'leaky-bucket:',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  logLevel: process.env.LOG_LEVEL || 'info',
};
