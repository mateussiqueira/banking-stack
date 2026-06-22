import {
  parseMessage,
  buildMessage,
  buildBitmapFromFieldNums,
  buildBitmapHex,
  parseBitmap,
  formatMessageSummary,
  getAmountInCents,
  formatAmount,
  parseProcessingCode,
} from '../iso8583/parser';
import { ISOMessage } from '../iso8583/types';
import { findCard, resetAllCards, deductBalance, creditBalance } from '../services/mockCardDB';
import {
  processAuthorization as issuerAuthorize,
  processFinancial as issuerFinancial,
  processReversal as issuerReversal,
} from '../services/issuer';
import {
  processAuthorization as acquirerAuthorize,
  processFinancial as acquirerFinancial,
  processReversal as acquirerReversal,
} from '../services/acquirer';

beforeEach(() => {
  resetAllCards();
});

function buildAuthRequest(pan: string, amount: string, stan?: string): ISOMessage {
  return {
    mti: '0100',
    bitmap: [],
    fields: {
      2: pan,
      3: '000000',
      4: amount,
      7: '0623123000',
      11: stan || '123456',
      22: '022',
      41: 'TERM0001',
      49: '986',
    },
  };
}

function buildFinancialRequest(pan: string, amount: string, stan?: string): ISOMessage {
  return {
    mti: '0200',
    bitmap: [],
    fields: {
      2: pan,
      3: '000000',
      4: amount,
      7: '0623123000',
      11: stan || '654321',
      22: '022',
      41: 'TERM0001',
      49: '986',
    },
  };
}

function buildReversalRequest(pan: string, amount: string, stan?: string): ISOMessage {
  return {
    mti: '0400',
    bitmap: [],
    fields: {
      2: pan,
      3: '000000',
      4: amount,
      7: '0623123000',
      11: stan || '999999',
      22: '022',
      41: 'TERM0001',
      49: '986',
    },
  };
}

describe('ISO 8583 Parser / Builder', () => {
  it('should build an authorization request message', () => {
    const msg = buildAuthRequest('4000000000000001', '000000001000', '123456');
    const buffer = buildMessage(msg);
    const str = buffer.toString('ascii');

    expect(str.substring(0, 4)).toBe('0100');
    expect(buffer.length).toBeGreaterThan(20);
    expect(str).toContain('4000000000000001');
    expect(str).toContain('000000001000');
    expect(str).toContain('000000');
  });

  it('should round-trip build and parse', () => {
    const original = buildAuthRequest('4000000000000001', '000000001000', '123456');
    const buffer = buildMessage(original);
    const parsed = parseMessage(buffer);

    expect(parsed.mti).toBe('0100');
    expect(parsed.fields[2]).toBe('4000000000000001');
    expect(parsed.fields[3]).toBe('000000');
    expect(parsed.fields[4]).toBe('000000001000');
    expect(parsed.fields[11]).toBe('123456');
    expect(parsed.fields[41]).toBe('TERM0001');
    expect(parsed.fields[49]).toBe('986');
  });

  it('should produce a valid hex bitmap', () => {
    const bitmap = buildBitmapFromFieldNums([2, 3, 4, 7, 11, 22, 41, 49]);
    const hex = buildBitmapHex(bitmap);
    expect(hex).toHaveLength(16);
    expect(/^[0-9A-F]{16}$/.test(hex)).toBe(true);
  });

  it('should parse bitmap back to bits', () => {
    const bitmap = buildBitmapFromFieldNums([2, 3, 4, 7, 11, 22, 41, 49]);
    const hex = buildBitmapHex(bitmap);
    const parsed = parseBitmap(hex);

    expect(parsed[1]).toBe(1);
    expect(parsed[2]).toBe(1);
    expect(parsed[3]).toBe(1);
    expect(parsed[6]).toBe(1);
    expect(parsed[10]).toBe(1);
    expect(parsed[21]).toBe(1);
    expect(parsed[40]).toBe(1);
    expect(parsed[48]).toBe(1);
  });

  it('should handle LLVAR fields correctly', () => {
    const msg: ISOMessage = {
      mti: '0100',
      bitmap: [],
      fields: {
        2: '4000000000000001',
        3: '000000',
        4: '000000001000',
      },
    };
    const buffer = buildMessage(msg);
    const parsed = parseMessage(buffer);
    expect(parsed.fields[2]).toBe('4000000000000001');
  });

  it('should parse a raw authorization response', () => {
    const msg = buildAuthRequest('4000000000000001', '000000001000');
    const reqBuf = buildMessage(msg);
    const response = issuerAuthorize(parseMessage(reqBuf));
    const resBuf = buildMessage(response);
    const parsed = parseMessage(resBuf);

    expect(parsed.mti).toBe('0110');
    expect(parsed.fields[39]).toBe('00');
    expect(parsed.fields[38]).toBeDefined();
    expect(parsed.fields[38]).toHaveLength(6);
  });

  it('should handle empty or missing fields gracefully', () => {
    const msg: ISOMessage = {
      mti: '0800',
      bitmap: [],
      fields: {
        41: 'TERM0001',
      },
    };
    const buffer = buildMessage(msg);
    const parsed = parseMessage(buffer);
    expect(parsed.mti).toBe('0800');
    expect(parsed.fields[41]).toBe('TERM0001');
  });
});

describe('Amount Utilities', () => {
  it('should get amount in cents', () => {
    expect(getAmountInCents('000000001000')).toBe(1000);
    expect(getAmountInCents('000100000000')).toBe(100000000);
    expect(getAmountInCents('000000000001')).toBe(1);
  });

  it('should format amount as string', () => {
    expect(formatAmount('000000001000')).toBe('10.00');
    expect(formatAmount('000100000000')).toBe('1000000.00');
  });

  it('should parse processing code', () => {
    const pc = parseProcessingCode('000000');
    expect(pc.transactionType).toBe('00');
    expect(pc.fromAccount).toBe('00');
    expect(pc.toAccount).toBe('00');
  });
});

describe('Mock Card Database', () => {
  it('should find card 4000000000000001 with balance 10000000', () => {
    const card = findCard('4000000000000001');
    expect(card).toBeDefined();
    expect(card!.balance).toBe(10000000);
  });

  it('should find card 4000000000000002 with low balance 500', () => {
    const card = findCard('4000000000000002');
    expect(card).toBeDefined();
    expect(card!.balance).toBe(500);
  });

  it('should return undefined for unknown PAN', () => {
    const card = findCard('0000000000000000');
    expect(card).toBeUndefined();
  });

  it('should deduct balance correctly', () => {
    const card = findCard('4000000000000001')!;
    const initial = card.balance;
    const result = deductBalance('4000000000000001', 1000);
    expect(result).toBe(true);
    expect(findCard('4000000000000001')!.balance).toBe(initial - 1000);
  });

  it('should credit balance correctly', () => {
    const card = findCard('4000000000000001')!;
    const initial = card.balance;
    creditBalance('4000000000000001', 5000);
    expect(findCard('4000000000000001')!.balance).toBe(initial + 5000);
  });

  it('should reject deduction with insufficient funds', () => {
    const result = deductBalance('4000000000000002', 10000);
    expect(result).toBe(false);
  });

  it('should reset card balance', () => {
    deductBalance('4000000000000001', 500000);
    expect(findCard('4000000000000001')!.balance).toBeLessThan(10000000);
    const { resetCardBalance } = require('../services/mockCardDB');
    resetCardBalance('4000000000000001');
    expect(findCard('4000000000000001')!.balance).toBe(10000000);
  });
});

describe('Issuer — Authorization (MTI 0100)', () => {
  it('should approve purchase for valid card with sufficient funds', () => {
    const req = buildAuthRequest('4000000000000001', '000000001000');
    const res = issuerAuthorize(req);
    expect(res.mti).toBe('0110');
    expect(res.fields[39]).toBe('00');
    expect(res.fields[38]).toBeDefined();
    expect(res.fields[38]).toHaveLength(6);
  });

  it('should decline with insufficient funds (code 51)', () => {
    const req = buildAuthRequest('4000000000000002', '000000100000');
    const res = issuerAuthorize(req);
    expect(res.mti).toBe('0110');
    expect(res.fields[39]).toBe('51');
  });

  it('should decline blocked card (code 05)', () => {
    const req = buildAuthRequest('4000000000000003', '000000001000');
    const res = issuerAuthorize(req);
    expect(res.mti).toBe('0110');
    expect(res.fields[39]).toBe('05');
  });

  it('should decline invalid PAN (code 14)', () => {
    const req = buildAuthRequest('0000000000000000', '000000001000');
    const res = issuerAuthorize(req);
    expect(res.fields[39]).toBe('14');
  });

  it('should decline expired card (code 54)', () => {
    const req = buildAuthRequest('5000000000000005', '000000001000');
    const res = issuerAuthorize(req);
    expect(res.fields[39]).toBe('54');
  });
});

describe('Issuer — Financial Presentment (MTI 0200)', () => {
  it('should approve and deduct balance', () => {
    const card = findCard('4000000000000001')!;
    const initialBalance = card.balance;

    const req = buildFinancialRequest('4000000000000001', '000000005000');
    const res = issuerFinancial(req);

    expect(res.mti).toBe('0210');
    expect(res.fields[39]).toBe('00');
    expect(findCard('4000000000000001')!.balance).toBe(initialBalance - 5000);
  });

  it('should decline with insufficient funds', () => {
    const req = buildFinancialRequest('4000000000000002', '000000010000');
    const res = issuerFinancial(req);
    expect(res.fields[39]).toBe('51');
  });
});

describe('Issuer — Reversal (MTI 0400)', () => {
  it('should reverse a previous financial transaction', () => {
    const card = findCard('4000000000000001')!;
    issuerFinancial(buildFinancialRequest('4000000000000001', '000000005000'));
    const afterDeduction = findCard('4000000000000001')!.balance;

    const req = buildReversalRequest('4000000000000001', '000000005000');
    const res = issuerReversal(req);

    expect(res.mti).toBe('0410');
    expect(res.fields[39]).toBe('00');
    expect(findCard('4000000000000001')!.balance).toBe(afterDeduction + 5000);
  });
});

describe('Acquirer — Full Flow', () => {
  it('should route authorization request and return response', () => {
    const req = buildAuthRequest('4000000000000001', '000000001000');
    const { response } = acquirerAuthorize(req);
    expect(response).toBeDefined();
    expect(response.mti).toBe('0110');
    expect(response.fields[39]).toBe('00');
  });

  it('should route financial request and deduct balance', () => {
    const card = findCard('4000000000000001')!;
    const initialBalance = card.balance;

    const req = buildFinancialRequest('4000000000000001', '000000010000');
    const { response } = acquirerFinancial(req);

    expect(response.fields[39]).toBe('00');
    expect(findCard('4000000000000001')!.balance).toBe(initialBalance - 10000);
  });

  it('should route reversal request and restore balance', () => {
    const card = findCard('4000000000000001')!;
    acquirerFinancial(buildFinancialRequest('4000000000000001', '000000007000'));
    const afterDeduction = findCard('4000000000000001')!.balance;

    const req = buildReversalRequest('4000000000000001', '000000007000');
    const { response } = acquirerReversal(req);

    expect(response.fields[39]).toBe('00');
    expect(findCard('4000000000000001')!.balance).toBe(afterDeduction + 7000);
  });

  it('should fail on missing PAN', () => {
    const req: ISOMessage = { mti: '0100', bitmap: [], fields: { 4: '000000001000' } };
    const { response, error } = acquirerAuthorize(req);
    expect(error).toBe('Missing PAN (Field 2)');
    expect(response.fields[39]).toBe('12');
  });
});

describe('End-to-End Parsing', () => {
  it('should build, parse, and process a complete auth flow', () => {
    const request = buildAuthRequest('4000000000000001', '000000001500', '777777');
    const wireBuffer = buildMessage(request);
    const parsedRequest = parseMessage(wireBuffer);

    expect(parsedRequest.fields[2]).toBe('4000000000000001');
    expect(parsedRequest.fields[4]).toBe('000000001500');

    const response = issuerAuthorize(parsedRequest);
    const responseBuffer = buildMessage(response);
    const parsedResponse = parseMessage(responseBuffer);

    expect(parsedResponse.mti).toBe('0110');
    expect(parsedResponse.fields[39]).toBe('00');
    expect(parsedResponse.fields[38]).toBeDefined();
  });
});
