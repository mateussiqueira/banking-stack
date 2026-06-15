import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.NFSE_PORT || '3007', 10),
  host: process.env.NFSE_HOST || '0.0.0.0',
  storage: {
    type: process.env.NFSE_STORAGE || 'memory',
    filePath: process.env.NFSE_FILE_PATH || './data/nfse.json',
  },
  defaultMunicipality: process.env.NFSE_DEFAULT_MUNICIPALITY || '3550308',
  defaultIssAliquota: parseFloat(process.env.NFSE_DEFAULT_ISS_ALIQUOTA || '5.0'),
  homologation: process.env.NFSE_HOMOLOGATION === 'true' || true,
};
