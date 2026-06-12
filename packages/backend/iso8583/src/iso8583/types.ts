export interface ISOMessage {
  mti: string;
  bitmap: number[];
  fields: Record<number, string>;
}

export interface FieldDef {
  number: number;
  name: string;
  type: 'n' | 'a' | 'an' | 'b' | 'z' | 's';
  length: number;
  variableLength?: 'LLVAR' | 'LLLVAR';
  maxLength?: number;
}

export interface ProcessingCodeParsed {
  transactionType: string;
  fromAccount: string;
  toAccount: string;
}

export enum TransactionType {
  PURCHASE = '00',
  CASH_WITHDRAWAL = '01',
  REFUND = '20',
  DEPOSIT = '21',
  PURCHASE_CASHBACK = '09',
  BALANCE_INQUIRY = '31',
  TRANSFER = '40',
  PAYMENT = '50',
}

export enum CardType {
  VISA = 'visa',
  MASTERCARD = 'mastercard',
  ELO = 'elo',
  AMEX = 'amex',
  UNKNOWN = 'unknown',
}

export enum ProcessingCode {
  PURCHASE = '000000',
  CASH_WITHDRAWAL = '010000',
  REFUND = '200000',
  PURCHASE_CASHBACK = '090000',
  BALANCE_INQUIRY = '310000',
  TRANSFER = '400000',
  PAYMENT = '500000',
}
