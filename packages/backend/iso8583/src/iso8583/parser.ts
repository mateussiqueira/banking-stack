import { ISOMessage, FieldDef } from './types';
import { FIELD_DEFS } from './fields';

export function parseBitmap(hex: string): number[] {
  const bitmap: number[] = [];
  const bytes = hex.match(/.{2}/g) || [];
  for (const byteHex of bytes) {
    const byte = parseInt(byteHex, 16);
    for (let bit = 7; bit >= 0; bit--) {
      bitmap.push((byte >> bit) & 1);
    }
  }
  return bitmap;
}

export function buildBitmapHex(bitmap: number[]): string {
  let hex = '';
  for (let i = 0; i < bitmap.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      if (i + j < bitmap.length && bitmap[i + j] === 1) {
        byte |= (1 << (7 - j));
      }
    }
    hex += byte.toString(16).toUpperCase().padStart(2, '0');
  }
  return hex;
}

export function buildBitmapFromFieldNums(fieldNums: number[]): number[] {
  if (fieldNums.length === 0) return new Array(64).fill(0);
  const maxField = Math.max(...fieldNums);
  const hasSecondary = maxField > 64 || fieldNums.includes(1);
  const size = hasSecondary ? 128 : 64;
  const bitmap = new Array(size).fill(0);

  if (hasSecondary) {
    bitmap[0] = 1;
  }

  for (const num of fieldNums) {
    if (num >= 1 && num <= size) {
      bitmap[num - 1] = 1;
    }
  }

  return bitmap;
}

function readFixedField(str: string, pos: number, length: number): { value: string; consumed: number } {
  return { value: str.substring(pos, pos + length), consumed: length };
}

function readLLVAR(str: string, pos: number): { value: string; consumed: number } {
  const len = parseInt(str.substring(pos, pos + 2), 10);
  const value = str.substring(pos + 2, pos + 2 + len);
  return { value, consumed: 2 + len };
}

function readLLLVAR(str: string, pos: number): { value: string; consumed: number } {
  const len = parseInt(str.substring(pos, pos + 3), 10);
  const value = str.substring(pos + 3, pos + 3 + len);
  return { value, consumed: 3 + len };
}

function writeFixedField(value: string, length: number): string {
  return value.padEnd(length, ' ').substring(0, length);
}

function writeLLVAR(value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return len + value;
}

function writeLLLVAR(value: string): string {
  const len = value.length.toString().padStart(3, '0');
  return len + value;
}

export function parseMessage(buffer: Buffer): ISOMessage {
  const str = buffer.toString('ascii');
  let pos = 0;

  if (str.length < 20) {
    throw new Error(`Message too short: ${str.length} chars (need at least 20)`);
  }

  const mti = str.substring(pos, pos + 4);
  pos += 4;

  const primaryBitmapHex = str.substring(pos, pos + 16);
  pos += 16;
  const primaryBitmap = parseBitmap(primaryBitmapHex);

  let hasSecondary = primaryBitmap[0] === 1;
  let fullBitmap: number[] = [...primaryBitmap];

  if (hasSecondary) {
    const secondaryBitmapHex = str.substring(pos, pos + 16);
    pos += 16;
    const secondaryBitmap = parseBitmap(secondaryBitmapHex);
    fullBitmap = [...fullBitmap, ...secondaryBitmap];
  }

  const fields: Record<number, string> = {};

  for (let i = 1; i < fullBitmap.length; i++) {
    if (fullBitmap[i] !== 1) continue;

    const fieldNum = i + 1;
    if (fieldNum === 1) continue;

    const def = FIELD_DEFS[fieldNum];
    if (!def) {
      throw new Error(`Unknown field ${fieldNum} at position ${pos}`);
    }

    let result: { value: string; consumed: number };

    if (def.variableLength === 'LLLVAR') {
      result = readLLLVAR(str, pos);
    } else if (def.variableLength === 'LLVAR') {
      result = readLLVAR(str, pos);
    } else {
      result = readFixedField(str, pos, def.length);
    }

    fields[fieldNum] = result.value;
    pos += result.consumed;
  }

  return { mti, bitmap: fullBitmap, fields };
}

export function buildMessage(msg: ISOMessage): Buffer {
  const fieldNums = Object.keys(msg.fields)
    .map(Number)
    .filter((n) => n !== 1)
    .sort((a, b) => a - b);

  msg.bitmap = buildBitmapFromFieldNums(fieldNums);
  const bitmapHex = buildBitmapHex(msg.bitmap);

  let body = '';

  for (const fieldNum of fieldNums) {
    const def = FIELD_DEFS[fieldNum];
    if (!def) {
      throw new Error(`Unknown field ${fieldNum}`);
    }

    const value = msg.fields[fieldNum];

    if (def.variableLength === 'LLLVAR') {
      body += writeLLLVAR(value);
    } else if (def.variableLength === 'LLVAR') {
      body += writeLLVAR(value);
    } else {
      body += writeFixedField(value, def.length);
    }
  }

  return Buffer.from(msg.mti + bitmapHex + body, 'ascii');
}

export function formatMessageSummary(msg: ISOMessage): string {
  const lines: string[] = [];
  lines.push(`MTI: ${msg.mti}`);
  lines.push(`Bitmap: ${buildBitmapHex(msg.bitmap)} (${msg.bitmap.length} bits)`);
  const sorted = Object.keys(msg.fields).map(Number).sort((a, b) => a - b);
  for (const fieldNum of sorted) {
    const def = FIELD_DEFS[fieldNum];
    const name = def ? def.name : 'Unknown';
    const value = msg.fields[fieldNum];
    lines.push(`  Field ${fieldNum} (${name}): ${value}`);
  }
  return lines.join('\n');
}

export function getAmountInCents(amountField: string): number {
  return parseInt(amountField, 10);
}

export function formatAmount(amountField: string): string {
  const cents = getAmountInCents(amountField);
  return (cents / 100).toFixed(2);
}

export function parseProcessingCode(pc: string): { transactionType: string; fromAccount: string; toAccount: string } {
  return {
    transactionType: pc.substring(0, 2),
    fromAccount: pc.substring(2, 4),
    toAccount: pc.substring(4, 6),
  };
}
