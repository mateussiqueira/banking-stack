import { ISOMessage } from '../iso8583/types';
import { MTI_LABELS } from '../iso8583/fields';
import {
  processAuthorization as issuerAuthorize,
  processFinancial as issuerFinancial,
  processReversal as issuerReversal,
} from './issuer';

export interface AcquirerLog {
  timestamp: string;
  mti: string;
  pan: string;
  amount: string;
  responseCode: string;
  stan?: string;
}

const logs: AcquirerLog[] = [];

export function getLogs(): AcquirerLog[] {
  return [...logs];
}

function logTransaction(req: ISOMessage, res: ISOMessage): void {
  logs.push({
    timestamp: new Date().toISOString(),
    mti: req.mti,
    pan: req.fields[2] || 'N/A',
    amount: req.fields[4] || '0',
    responseCode: res.fields[39] || 'ERR',
    stan: req.fields[11],
  });
}

function validateRequest(req: ISOMessage): string | null {
  if (!req.mti || req.mti.length !== 4) {
    return 'Invalid MTI';
  }
  if (!MTI_LABELS[req.mti]) {
    return `Unknown MTI: ${req.mti}`;
  }
  if (!req.fields[2]) {
    return 'Missing PAN (Field 2)';
  }
  if (!req.fields[4] && req.mti !== '0800') {
    return 'Missing Amount (Field 4)';
  }
  if (!req.fields[3] && req.mti !== '0800') {
    return 'Missing Processing Code (Field 3)';
  }
  return null;
}

export function processAuthorization(req: ISOMessage): { response: ISOMessage; error?: string } {
  const error = validateRequest(req);
  if (error) {
    return { response: buildErrorResponse(req, '12'), error };
  }

  const response = issuerAuthorize(req);
  logTransaction(req, response);
  return { response };
}

export function processFinancial(req: ISOMessage): { response: ISOMessage; error?: string } {
  const error = validateRequest(req);
  if (error) {
    return { response: buildErrorResponse(req, '12'), error };
  }

  const response = issuerFinancial(req);
  logTransaction(req, response);
  return { response };
}

export function processReversal(req: ISOMessage): { response: ISOMessage; error?: string } {
  const error = validateRequest(req);
  if (error) {
    return { response: buildErrorResponse(req, '12'), error };
  }

  const response = issuerReversal(req);
  logTransaction(req, response);
  return { response };
}

function buildErrorResponse(req: ISOMessage, code: string): ISOMessage {
  const responseMti = req.mti.charAt(3) === '0'
    ? req.mti.substring(0, 3) + '1' + req.mti.charAt(3)
    : req.mti;

  const fields: Record<number, string> = {};
  const copyFields = [2, 3, 4, 7, 11, 41, 49];
  for (const f of copyFields) {
    if (req.fields[f] !== undefined) {
      fields[f] = req.fields[f];
    }
  }
  fields[39] = code;

  return {
    mti: responseMti,
    bitmap: [],
    fields,
  };
}
