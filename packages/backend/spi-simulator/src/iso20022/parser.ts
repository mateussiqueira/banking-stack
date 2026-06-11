import { XMLParser } from 'fast-xml-parser'
import {
  Pacs008Document,
  Pacs002Document,
  Pacs004Document,
  CreditTransferTransaction,
  TransactionInformation,
  PaymentReturn,
} from './schemas'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name: string) =>
    ['CdtTrfTxInf', 'TxInfAndSts', 'TxInf'].includes(name),
  parseTagValue: true,
  trimValues: true,
})

interface ParsedPacs008 {
  endToEndId: string
  txId?: string
  amount: number
  creditorIspb: string
  creditorName?: string
  debtorIspb: string
  debtorName?: string
  creditorKey?: string
  debtorKey?: string
}

interface ParsedPacs002 {
  endToEndId: string
  txId?: string
  status: string
  reasonCode?: string
  additionalInfo?: string
}

interface ParsedPacs004 {
  endToEndId: string
  txId?: string
  amount: number
  originalEndToEndId: string
  reasonCode: string
  additionalInfo?: string
  creditorIspb: string
  debtorIspb: string
}

function extractTxFromArray(
  tx: CreditTransferTransaction | CreditTransferTransaction[]
): CreditTransferTransaction {
  return Array.isArray(tx) ? tx[0] : tx
}

function extractTxInfFromArray(
  tx: TransactionInformation | TransactionInformation[]
): TransactionInformation {
  return Array.isArray(tx) ? tx[0] : tx
}

function extractTxInfFromArrayReturn(
  tx: PaymentReturn | PaymentReturn[]
): PaymentReturn {
  return Array.isArray(tx) ? tx[0] : tx
}

export function parsePacs008(xml: string): ParsedPacs008 {
  const parsed = parser.parse(xml) as { Document?: Pacs008Document }

  if (!parsed?.Document?.FIToFICstmrCdtTrf) {
    throw new Error('Invalid pacs.008: missing Document/FIToFICstmrCdtTrf')
  }

  const doc = parsed.Document.FIToFICstmrCdtTrf
  const tx = extractTxFromArray(doc.CdtTrfTxInf)

  if (!tx?.PmtId?.EndToEndId) {
    throw new Error('Invalid pacs.008: missing EndToEndId')
  }

  if (tx.IntrBkSttlmAmt === undefined || tx.IntrBkSttlmAmt === null) {
    throw new Error('Invalid pacs.008: missing InterBankSettlementAmount')
  }

  const amount = parseFloat(String(tx.IntrBkSttlmAmt))
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Invalid pacs.008: amount must be positive')
  }

  const debtorIspbRaw =
    tx.DbtrAgt?.FinInstnId?.ClrSysMmbId?.MmbId ??
    tx.InstgAgt?.FinInstnId?.ClrSysMmbId?.MmbId
  if (debtorIspbRaw === undefined || debtorIspbRaw === null) {
    throw new Error('Invalid pacs.008: missing debtor ISPB')
  }
  const debtorIspb = String(debtorIspbRaw)

  const creditorIspbRaw = tx.CdtrAgt?.FinInstnId?.ClrSysMmbId?.MmbId
  if (creditorIspbRaw === undefined || creditorIspbRaw === null) {
    throw new Error('Invalid pacs.008: missing creditor ISPB')
  }
  const creditorIspb = String(creditorIspbRaw)

  return {
    endToEndId: tx.PmtId.EndToEndId,
    txId: tx.PmtId.TxId,
    amount,
    creditorIspb,
    creditorName: tx.Cdtr?.Nm,
    debtorIspb,
    debtorName: tx.Dbtr?.Nm,
    creditorKey: tx.CdtrAcct?.Id?.Othr?.Id || tx.CdtrAcct?.Id?.Iban,
    debtorKey: tx.DbtrAcct?.Id?.Othr?.Id || tx.DbtrAcct?.Id?.Iban,
  }
}

export function parsePacs002(xml: string): ParsedPacs002 {
  const parsed = parser.parse(xml) as { Document?: Pacs002Document }

  if (!parsed?.Document?.FIToFIPmtStsRpt) {
    throw new Error('Invalid pacs.002: missing Document/FIToFIPmtStsRpt')
  }

  const doc = parsed.Document.FIToFIPmtStsRpt
  const txInf = extractTxInfFromArray(doc.TxInfAndSts)

  if (!txInf?.OrgnlEndToEndId) {
    throw new Error('Invalid pacs.002: missing OrgnlEndToEndId')
  }

  if (!txInf?.TxSts) {
    throw new Error('Invalid pacs.002: missing TxSts')
  }

  return {
    endToEndId: txInf.OrgnlEndToEndId,
    txId: txInf.OrgnlTxId,
    status: txInf.TxSts,
    reasonCode: txInf.StsRsnInf?.Rsn?.Cd,
    additionalInfo: txInf.StsRsnInf?.AddtlInf,
  }
}

export function parsePacs004(xml: string): ParsedPacs004 {
  const parsed = parser.parse(xml) as { Document?: Pacs004Document }

  if (!parsed?.Document?.FIToFIPmtRtr) {
    throw new Error('Invalid pacs.004: missing Document/FIToFIPmtRtr')
  }

  const doc = parsed.Document.FIToFIPmtRtr
  const txInf = extractTxInfFromArrayReturn(doc.TxInf)

  if (!txInf?.PmtId?.EndToEndId) {
    throw new Error('Invalid pacs.004: missing EndToEndId')
  }

  if (!txInf.IntrBkSttlmAmt) {
    throw new Error('Invalid pacs.004: missing InterBankSettlementAmount')
  }

  if (!txInf.RtrInf?.Rsn?.Cd) {
    throw new Error('Invalid pacs.004: missing return reason code')
  }

  const amount = parseFloat(txInf.IntrBkSttlmAmt)
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Invalid pacs.004: amount must be positive')
  }

  const creditorIspbRaw = txInf.CdtrAgt?.FinInstnId?.ClrSysMmbId?.MmbId
  const debtorIspbRaw = txInf.DbtrAgt?.FinInstnId?.ClrSysMmbId?.MmbId

  if (creditorIspbRaw === undefined || creditorIspbRaw === null) {
    throw new Error('Invalid pacs.004: missing creditor ISPB')
  }
  if (debtorIspbRaw === undefined || debtorIspbRaw === null) {
    throw new Error('Invalid pacs.004: missing debtor ISPB')
  }

  const creditorIspb = String(creditorIspbRaw)
  const debtorIspb = String(debtorIspbRaw)

  return {
    endToEndId: txInf.PmtId.EndToEndId,
    txId: txInf.PmtId.TxId,
    amount,
    originalEndToEndId:
      txInf.OrgnlPmtInfAndSts?.OrgnlEndToEndId || txInf.PmtId.EndToEndId,
    reasonCode: txInf.RtrInf.Rsn.Cd,
    additionalInfo: txInf.RtrInf.AddtlInf,
    creditorIspb,
    debtorIspb,
  }
}
