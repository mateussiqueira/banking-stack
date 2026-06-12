import { ISOMessage } from '../iso8583/types';
import { findCard, deductBalance, creditBalance } from './mockCardDB';
import { buildBitmapFromFieldNums, getAmountInCents, parseProcessingCode } from '../iso8583/parser';
import { MTI_REQUEST_MAP } from '../iso8583/fields';
import { v4 as uuid } from 'uuid';
import dayjs from 'dayjs';

function makeResponse(
  requestMti: string,
  requestFields: Record<number, string>,
  responseCode: string,
  approvalCode?: string,
  extraFields?: Record<number, string>,
): ISOMessage {
  const responseMti = MTI_REQUEST_MAP[requestMti] || '0110';
  const fields: Record<number, string> = {};

  const copyFields = [2, 3, 4, 7, 11, 12, 13, 41, 42, 49];
  for (const f of copyFields) {
    if (requestFields[f] !== undefined) {
      fields[f] = requestFields[f];
    }
  }

  fields[37] = uuid().replace(/-/g, '').substring(0, 12).toUpperCase();
  fields[39] = responseCode;

  if (approvalCode) {
    fields[38] = approvalCode;
  } else if (responseCode === '00') {
    const rrn = uuid().replace(/-/g, '').substring(0, 6).toUpperCase();
    fields[38] = rrn;
  }

  if (extraFields) {
    for (const [k, v] of Object.entries(extraFields)) {
      fields[Number(k)] = v;
    }
  }

  const fieldNums = Object.keys(fields).map(Number).sort((a, b) => a - b);
  return { mti: responseMti, bitmap: buildBitmapFromFieldNums(fieldNums), fields };
}

function generateApprovalCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function validateCard(pan: string): { valid: boolean; code: string; message: string } {
  const card = findCard(pan);
  if (!card) {
    return { valid: false, code: '14', message: 'Invalid Card Number' };
  }
  if (card.status === 'blocked') {
    return { valid: false, code: '05', message: 'Do Not Honor' };
  }
  if (card.status === 'expired') {
    return { valid: false, code: '54', message: 'Expired Card' };
  }
  return { valid: true, code: '00', message: 'Valid' };
}

function checkSufficientFunds(pan: string, amount: number): boolean {
  const card = findCard(pan);
  if (!card) return false;
  return card.balance >= amount;
}

export function processAuthorization(req: ISOMessage): ISOMessage {
  const pan = req.fields[2];
  const amount = req.fields[4] ? getAmountInCents(req.fields[4]) : 0;
  const processingCode = req.fields[3] || '000000';

  if (!pan) {
    return makeResponse(req.mti, req.fields, '14');
  }

  const pc = parseProcessingCode(processingCode);
  if (pc.transactionType === '31') {
    return makeResponse(req.mti, req.fields, '00', 'BALANCE', {
      '44': `AVAILABLE BALANCE: ${findCard(pan)?.balance || 0}`,
    });
  }

  const validation = validateCard(pan);
  if (!validation.valid) {
    return makeResponse(req.mti, req.fields, validation.code);
  }

  if (pc.transactionType === '20' || pc.transactionType === '21') {
    return makeResponse(req.mti, req.fields, '00', generateApprovalCode());
  }

  if (!checkSufficientFunds(pan, amount)) {
    return makeResponse(req.mti, req.fields, '51');
  }

  const approvalCode = generateApprovalCode();
  return makeResponse(req.mti, req.fields, '00', approvalCode);
}

export function processFinancial(req: ISOMessage): ISOMessage {
  const pan = req.fields[2];
  const amount = req.fields[4] ? getAmountInCents(req.fields[4]) : 0;
  const processingCode = req.fields[3] || '000000';

  if (!pan) {
    return makeResponse(req.mti, req.fields, '14');
  }

  const validation = validateCard(pan);
  if (!validation.valid) {
    return makeResponse(req.mti, req.fields, validation.code);
  }

  const pc = parseProcessingCode(processingCode);

  if (pc.transactionType === '20' || pc.transactionType === '21') {
    creditBalance(pan, amount);
    return makeResponse(req.mti, req.fields, '00', generateApprovalCode());
  }

  if (!checkSufficientFunds(pan, amount)) {
    return makeResponse(req.mti, req.fields, '51');
  }

  const deducted = deductBalance(pan, amount);
  if (!deducted) {
    return makeResponse(req.mti, req.fields, '51');
  }

  const approvalCode = generateApprovalCode();
  return makeResponse(req.mti, req.fields, '00', approvalCode);
}

export function processReversal(req: ISOMessage): ISOMessage {
  const pan = req.fields[2];
  const amount = req.fields[4] ? getAmountInCents(req.fields[4]) : 0;
  const stan = req.fields[11] || '000000';

  if (!pan) {
    return makeResponse(req.mti, req.fields, '14');
  }

  if (amount <= 0) {
    return makeResponse(req.mti, req.fields, '13');
  }

  const credited = creditBalance(pan, amount);
  if (!credited) {
    return makeResponse(req.mti, req.fields, '12');
  }

  return makeResponse(req.mti, req.fields, '00', 'REVERS', {
    '44': `REVERSAL OK STAN:${stan}`,
  });
}
