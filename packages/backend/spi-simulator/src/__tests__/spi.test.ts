import { buildPacs008, buildPacs002, buildPacs004 } from '../iso20022/messages'
import { parsePacs008, parsePacs002, parsePacs004 } from '../iso20022/parser'
import { processPayment, settlePayment, returnPayment, getTransactionByEndToEndId, listTransactions } from '../services/spiService'
import { clearTransactions } from '../models/transaction'
import { Transaction } from '../models/transaction'

const SAMPLE_ISPBS = ['16501555', '18236120']

function createSamplePacs008Xml(
  endToEndId?: string,
  overrides?: Partial<{
    amount: number
    debtorIspb: string
    creditorIspb: string
    debtorName: string
    creditorName: string
    debtorKey: string
    creditorKey: string
    txId: string
  }>
): string {
  const tx: Transaction = {
    id: 'test-tx-id',
    endToEndId: endToEndId || 'E2ETEST' + Date.now().toString(36).toUpperCase(),
    txId: overrides?.txId || 'TXTEST123',
    amount: overrides?.amount ?? 150.50,
    creditorIspb: overrides?.creditorIspb || SAMPLE_ISPBS[1],
    creditorKey: overrides?.creditorKey || 'test@creditor.com',
    creditorName: overrides?.creditorName || 'Maria Souza',
    debtorIspb: overrides?.debtorIspb || SAMPLE_ISPBS[0],
    debtorKey: overrides?.debtorKey || '123.456.789-00',
    debtorName: overrides?.debtorName || 'João Silva',
    status: 'ACCEPTED',
    createdAt: new Date().toISOString(),
  }

  return buildPacs008(tx)
}

beforeEach(() => {
  clearTransactions()
})

describe('ISO 20022 Message Generation', () => {
  test('buildPacs008 generates valid XML', () => {
    const xml = createSamplePacs008Xml('E2E-GEN-TEST-001')

    expect(xml).toContain('<?xml')
    expect(xml).toContain('pacs.008.001.08')
    expect(xml).toContain('E2E-GEN-TEST-001')
    expect(xml).toContain(SAMPLE_ISPBS[0])
    expect(xml).toContain(SAMPLE_ISPBS[1])
    expect(xml).toContain('150.50')
    expect(xml).toContain('Maria Souza')
    expect(xml).toContain('João Silva')
  })

  test('buildPacs002 generates valid status XML', () => {
    const tx: Transaction = {
      id: 'test-id',
      endToEndId: 'E2E-STATUS-TEST',
      txId: 'TX-002',
      amount: 250.00,
      creditorIspb: SAMPLE_ISPBS[1],
      creditorName: 'Maria Souza',
      debtorIspb: SAMPLE_ISPBS[0],
      debtorName: 'João Silva',
      status: 'ACCEPTED',
      createdAt: new Date().toISOString(),
    }

    const xml = buildPacs002(tx, 'ACCEPTED')

    expect(xml).toContain('<?xml')
    expect(xml).toContain('pacs.002.001.10')
    expect(xml).toContain('E2E-STATUS-TEST')
    expect(xml).toContain('ACCEPTED')
    expect(xml).toContain('250.00')
  })

  test('buildPacs004 generates valid return XML', () => {
    const tx: Transaction = {
      id: 'test-id',
      endToEndId: 'E2E-RETURN-TEST',
      txId: 'TX-004',
      amount: 500.00,
      creditorIspb: SAMPLE_ISPBS[1],
      creditorName: 'Creditor',
      creditorKey: 'creditor@pix.com',
      debtorIspb: SAMPLE_ISPBS[0],
      debtorName: 'Debtor',
      debtorKey: 'debtor@pix.com',
      status: 'RETURNED',
      returnReason: 'FRAD',
      createdAt: new Date().toISOString(),
      returnedAt: new Date().toISOString(),
      originalEndToEndId: 'E2E-ORIGINAL-TX',
    }

    const xml = buildPacs004(tx)

    expect(xml).toContain('<?xml')
    expect(xml).toContain('pacs.004.001.09')
    expect(xml).toContain('E2E-RETURN-TEST')
    expect(xml).toContain('FRAD')
    expect(xml).toContain('500.00')
  })
})

describe('ISO 20022 Message Parsing', () => {
  test('parsePacs008 extracts all fields', () => {
    const xml = createSamplePacs008Xml('E2E-PARSE-TEST-001')
    const parsed = parsePacs008(xml)

    expect(parsed.endToEndId).toBe('E2E-PARSE-TEST-001')
    expect(parsed.amount).toBe(150.50)
    expect(parsed.debtorIspb).toBe(SAMPLE_ISPBS[0])
    expect(parsed.creditorIspb).toBe(SAMPLE_ISPBS[1])
    expect(parsed.debtorName).toBe('João Silva')
    expect(parsed.creditorName).toBe('Maria Souza')
    expect(parsed.creditorKey).toBe('test@creditor.com')
    expect(parsed.debtorKey).toBe('123.456.789-00')
  })

  test('parsePacs008 rejects invalid XML', () => {
    expect(() => parsePacs008('<invalid></invalid>')).toThrow()
    expect(() => parsePacs008('')).toThrow()
  })

  test('parsePacs008 rejects missing EndToEndId', () => {
    const badXml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>MSG123</MsgId>
    </GrpHdr>
    <CdtTrfTxInf>
      <IntrBkSttlmAmt>100.00</IntrBkSttlmAmt>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`
    expect(() => parsePacs008(badXml)).toThrow(/EndToEndId/)
  })

  test('parsePacs002 extracts status', () => {
    const tx: Transaction = {
      id: 'test-id',
      endToEndId: 'E2E-PARSE-002',
      txId: 'TX-002',
      amount: 100.00,
      creditorIspb: SAMPLE_ISPBS[1],
      debtorIspb: SAMPLE_ISPBS[0],
      status: 'SETTLED',
      createdAt: new Date().toISOString(),
    }
    const xml = buildPacs002(tx, 'SETTLED')
    const parsed = parsePacs002(xml)

    expect(parsed.endToEndId).toBe('E2E-PARSE-002')
    expect(parsed.status).toBe('SETTLED')
  })

  test('parsePacs004 extracts return info', () => {
    const tx: Transaction = {
      id: 'test-id',
      endToEndId: 'E2E-PARSE-004',
      txId: 'TX-004',
      amount: 300.00,
      creditorIspb: SAMPLE_ISPBS[1],
      debtorIspb: SAMPLE_ISPBS[0],
      status: 'RETURNED',
      returnReason: 'FRAD',
      createdAt: new Date().toISOString(),
      originalEndToEndId: 'E2E-ORIG-001',
    }

    const xml = buildPacs004(tx)
    const parsed = parsePacs004(xml)

    expect(parsed.endToEndId).toBe('E2E-PARSE-004')
    expect(parsed.reasonCode).toBe('FRAD')
    expect(parsed.amount).toBe(300.00)
  })
})

describe('SPI Service', () => {
  test('processPayment creates and accepts a transaction', () => {
    const xml = createSamplePacs008Xml('E2E-SERVICE-TEST-001')
    const result = processPayment(xml)

    expect(result.transaction.status).toBe('ACCEPTED')
    expect(result.transaction.endToEndId).toBe('E2E-SERVICE-TEST-001')
    expect(result.transaction.amount).toBe(150.50)
    expect(result.transaction.creditorIspb).toBe(SAMPLE_ISPBS[1])
    expect(result.transaction.debtorIspb).toBe(SAMPLE_ISPBS[0])

    expect(result.statusXml).toContain('pacs.002.001.10')
    expect(result.statusXml).toContain('ACCEPTED')
  })

  test('processPayment rejects duplicate endToEndId', () => {
    const xml = createSamplePacs008Xml('E2E-DUP-TEST')
    processPayment(xml)

    expect(() => processPayment(xml)).toThrow(/Duplicate/)
  })

  test('processPayment rejects invalid debtor ISPB', () => {
    const xml = createSamplePacs008Xml('E2E-INV-ISPB', { debtorIspb: '00000000' })
    expect(() => processPayment(xml)).toThrow(/Invalid debtor ISPB/)
  })

  test('processPayment rejects invalid creditor ISPB', () => {
    const xml = createSamplePacs008Xml('E2E-INV-ISPB2', { creditorIspb: '99999999' })
    expect(() => processPayment(xml)).toThrow(/Invalid creditor ISPB/)
  })

  test('processPayment rejects zero amount', () => {
    const xml = createSamplePacs008Xml('E2E-ZERO-AMT', { amount: 0 })
    expect(() => processPayment(xml)).toThrow(/positive/)
  })

  test('settlePayment completes a transaction', () => {
    const xml = createSamplePacs008Xml('E2E-SETTLE-TEST')
    processPayment(xml)

    const result = settlePayment('E2E-SETTLE-TEST')

    expect(result.transaction.status).toBe('SETTLED')
    expect(result.transaction.settledAt).toBeDefined()
    expect(result.statusXml).toContain('SETTLED')
  })

  test('settlePayment rejects non-existent transaction', () => {
    expect(() => settlePayment('E2E-NONEXISTENT')).toThrow(/not found/)
  })

  test('settlePayment rejects non-ACCEPTED transaction', () => {
    const xml = createSamplePacs008Xml('E2E-SETTLE-FAIL')
    processPayment(xml)
    settlePayment('E2E-SETTLE-FAIL')

    expect(() => settlePayment('E2E-SETTLE-FAIL')).toThrow(/expected ACCEPTED/)
  })

  test('returnPayment processes a return', () => {
    const xml = createSamplePacs008Xml('E2E-RETURN-TEST')
    processPayment(xml)
    settlePayment('E2E-RETURN-TEST')

    const result = returnPayment('E2E-RETURN-TEST', 'FRAD', 'Fraud suspected')

    expect(result.transaction.status).toBe('RETURNED')
    expect(result.transaction.returnReason).toBe('FRAD')
    expect(result.transaction.originalEndToEndId).toBe('E2E-RETURN-TEST')
    expect(result.returnXml).toContain('pacs.004.001.09')
    expect(result.returnXml).toContain('FRAD')

    const original = getTransactionByEndToEndId('E2E-RETURN-TEST')
    expect(original?.status).toBe('RETURNED')
  })

  test('returnPayment rejects non-SETTLED transaction', () => {
    const xml = createSamplePacs008Xml('E2E-RETURN-FAIL')
    processPayment(xml)

    expect(() => returnPayment('E2E-RETURN-FAIL', 'FRAD')).toThrow(
      /expected SETTLED/
    )
  })

  test('getTransactionByEndToEndId returns transaction', () => {
    createSamplePacs008Xml('E2E-GET-TEST')
    const xml = createSamplePacs008Xml('E2E-GET-TEST')
    processPayment(xml)

    const tx = getTransactionByEndToEndId('E2E-GET-TEST')
    expect(tx).toBeDefined()
    expect(tx?.endToEndId).toBe('E2E-GET-TEST')
  })

  test('getTransactionByEndToEndId returns undefined for missing', () => {
    const tx = getTransactionByEndToEndId('E2E-MISSING')
    expect(tx).toBeUndefined()
  })
})

describe('End-to-End Flows', () => {
  test('full payment lifecycle: accept -> settle -> return', () => {
    const xml = createSamplePacs008Xml('E2E-FULL-LIFECYCLE')
    const payment = processPayment(xml)
    expect(payment.transaction.status).toBe('ACCEPTED')

    const settled = settlePayment('E2E-FULL-LIFECYCLE')
    expect(settled.transaction.status).toBe('SETTLED')

    const returned = returnPayment('E2E-FULL-LIFECYCLE', 'DUPL', 'Duplicate transaction')
    expect(returned.transaction.status).toBe('RETURNED')
    expect(returned.transaction.returnReason).toBe('DUPL')

    const original = getTransactionByEndToEndId('E2E-FULL-LIFECYCLE')
    expect(original?.status).toBe('RETURNED')

    const returnTx = getTransactionByEndToEndId(returned.transaction.endToEndId)
    expect(returnTx).toBeDefined()
    expect(returnTx?.originalEndToEndId).toBe('E2E-FULL-LIFECYCLE')
  })

  test('multiple transactions are tracked independently', () => {
    for (let i = 1; i <= 5; i++) {
      const e2eId = `E2E-MULTI-${i}`
      const xml = createSamplePacs008Xml(e2eId, { amount: i * 100 })
      processPayment(xml)
    }

    const all = listTransactions()
    expect(all).toHaveLength(5)

    for (let i = 1; i <= 5; i++) {
      const tx = getTransactionByEndToEndId(`E2E-MULTI-${i}`)
      expect(tx).toBeDefined()
      expect(tx?.amount).toBe(i * 100)
    }
  })
})
