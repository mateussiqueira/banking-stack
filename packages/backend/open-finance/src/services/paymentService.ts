import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { PaymentConsent, PaymentStatus, PaymentAccount, Account } from '../open-finance/types';

const payments: Map<string, PaymentConsent> = new Map();
const paymentAccounts: Map<string, Account> = new Map();

export function createPayment(
  userId: string,
  amount: number,
  currency: string,
  debtorAccount: PaymentAccount,
  creditorAccount: PaymentAccount,
  creditorName: string,
  creditorDocument: string,
  description: string
): PaymentConsent {
  const id = uuidv4();
  const endToEndId = `E${dayjs().format('YYYYMMDD')}${uuidv4().replace(/-/g, '').substring(0, 22).toUpperCase()}`;

  const payment: PaymentConsent = {
    id,
    userId,
    status: 'PDNG',
    amount: Math.round(amount * 100) / 100,
    currency,
    debtorAccount,
    creditorAccount,
    creditorName,
    creditorDocument,
    description,
    endToEndId,
    creationDateTime: dayjs().toISOString(),
    statusUpdateDateTime: dayjs().toISOString(),
    transactionId: uuidv4(),
  };

  payments.set(id, payment);
  return payment;
}

export function getPayment(id: string): PaymentConsent | undefined {
  return payments.get(id);
}

export function updatePaymentStatus(id: string, status: PaymentStatus): PaymentConsent | null {
  const payment = payments.get(id);
  if (!payment) return null;

  payment.status = status;
  payment.statusUpdateDateTime = dayjs().toISOString();
  payments.set(id, payment);
  return payment;
}

export function processPayment(id: string): PaymentConsent | null {
  return updatePaymentStatus(id, 'ACSC');
}

export function rejectPayment(id: string): PaymentConsent | null {
  return updatePaymentStatus(id, 'RJCT');
}

export function listPaymentsByUser(userId: string): PaymentConsent[] {
  return Array.from(payments.values()).filter((p) => p.userId === userId);
}

export function getPayments(): Map<string, PaymentConsent> {
  return payments;
}

// TODO: add payment confirmation webhook callback
