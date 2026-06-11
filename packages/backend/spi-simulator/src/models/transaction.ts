export type TransactionStatus =
  | 'ACCEPTED'
  | 'REJECTED'
  | 'SETTLED'
  | 'RETURNED'

export interface Transaction {
  id: string
  endToEndId: string
  txId?: string
  amount: number
  creditorIspb: string
  creditorKey?: string
  creditorName?: string
  debtorIspb: string
  debtorKey?: string
  debtorName?: string
  status: TransactionStatus
  returnReason?: string
  returnRejectionReason?: string
  createdAt: string
  settledAt?: string
  returnedAt?: string
  originalEndToEndId?: string
}

const transactions: Map<string, Transaction> = new Map()

export function addTransaction(tx: Transaction): void {
  transactions.set(tx.endToEndId, tx)
}

export function getTransaction(endToEndId: string): Transaction | undefined {
  return transactions.get(endToEndId)
}

export function updateTransaction(
  endToEndId: string,
  updates: Partial<Transaction>
): Transaction | undefined {
  const tx = transactions.get(endToEndId)
  if (!tx) return undefined
  Object.assign(tx, updates)
  return tx
}

export function getAllTransactions(): Transaction[] {
  return Array.from(transactions.values())
}

export function clearTransactions(): void {
  transactions.clear()
}
