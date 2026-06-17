import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.REPORT_PORT || '3008', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/banking',
  s3: {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    region: process.env.S3_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET || 'reports',
    accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
    forcePathStyle: true,
  },
  reports: {
    defaultBatchSize: 1000,
    maxFileSize: 500 * 1024 * 1024,
    presignedUrlExpiry: 3600,
  },
  logLevel: process.env.LOG_LEVEL || 'info',
};
