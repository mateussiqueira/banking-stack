export type ConsentStatus = 'AWAITING_AUTHORISATION' | 'AUTHORISED' | 'REJECTED' | 'REVOKED';

export interface Consent {
  id: string;
  status: ConsentStatus;
  userId: string;
  clientId: string;
  permissions: ConsentPermission[];
  expirationDateTime: string;
  transactionFromDateTime?: string;
  transactionToDateTime?: string;
  creationDateTime: string;
  statusUpdateDateTime: string;
}

export type ConsentPermission =
  | 'ACCOUNTS_READ'
  | 'ACCOUNTS_BALANCES_READ'
  | 'ACCOUNTS_TRANSACTIONS_READ'
  | 'ACCOUNTS_OVERDRAFT_LIMITS_READ'
  | 'CREDIT_CARDS_ACCOUNTS_READ'
  | 'CREDIT_CARDS_ACCOUNTS_BILLS_READ'
  | 'CREDIT_CARDS_ACCOUNTS_TRANSACTIONS_READ'
  | 'LOANS_READ'
  | 'LOANS_WARRANTIES_READ'
  | 'LOANS_SCHEDULED_INSTALMENTS_READ'
  | 'LOANS_PAYMENTS_READ'
  | 'FINANCINGS_READ'
  | 'FINANCINGS_WARRANTIES_READ'
  | 'FINANCINGS_SCHEDULED_INSTALMENTS_READ'
  | 'FINANCINGS_PAYMENTS_READ'
  | 'INVOICE_FINANCINGS_READ'
  | 'INVOICE_FINANCINGS_WARRANTIES_READ'
  | 'INVOICE_FINANCINGS_SCHEDULED_INSTALMENTS_READ'
  | 'INVOICE_FINANCINGS_PAYMENTS_READ'
  | 'PIX_SCHEDULE_READ'
  | 'PIX_SCHEDULE_WRITE'
  | 'PIX_READ'
  | 'PIX_WRITE';

export interface Account {
  id: string;
  userId: string;
  type: AccountType;
  subtype: AccountSubtype;
  brandName: string;
  companyName: string;
  number: string;
  agency: string;
  openingDate: string;
  status: AccountStatus;
  currency: string;
  balance: Balance;
  overdraftLimits?: OverdraftLimits;
}

export type AccountType = 'CONTA_DEPOSITO_A_VISTA' | 'CONTA_POUPANCA' | 'CONTA_PAGAMENTO';

export type AccountSubtype =
  | 'CONTA_CORRENTE_INDIVIDUAL'
  | 'CONTA_CORRENTE_CONJUNTA'
  | 'CONTA_POUPANCA_INDIVIDUAL'
  | 'CONTA_POUPANCA_CONJUNTA';

export type AccountStatus = 'AVAILABLE' | 'UNAVAILABLE';

export interface Balance {
  currency: string;
  availableAmount: number;
  blockedAmount: number;
  automaticallyInvestedAmount: number;
  amount: number;
  updateDateTime: string;
}

export interface OverdraftLimits {
  overdraftContractedLimit: number;
  overdraftUsedLimit: number;
  overdraftUsedLimitPercentage: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  transactionDateTime: string;
  description: string;
  category: string;
  creditorName?: string;
  debtorName?: string;
  creditorDocument?: string;
  debtorDocument?: string;
}

export type TransactionType =
  | 'PIX_TRANSFERENCIA'
  | 'PIX_PAGAMENTO'
  | 'TED'
  | 'DOC'
  | 'TRANSFERENCIA_MESMA_INSTITUICAO'
  | 'PAGAMENTO_BOLETO'
  | 'PAGAMENTO_CONTA_ENERGIA'
  | 'PAGAMENTO_CONTA_AGUA'
  | 'PAGAMENTO_CONTA_TELEFONE'
  | 'PAGAMENTO_FOLHA'
  | 'TARIFA'
  | 'ANUIDADE'
  | 'OUTROS';

export type PaymentStatus =
  | 'ACSC'
  | 'ACCC'
  | 'ACSP'
  | 'ACWP'
  | 'ACFC'
  | 'PDNG'
  | 'RJCT';

export interface PaymentConsent {
  id: string;
  userId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  debtorAccount: PaymentAccount;
  creditorAccount: PaymentAccount;
  creditorName: string;
  creditorDocument: string;
  description: string;
  endToEndId: string;
  creationDateTime: string;
  statusUpdateDateTime: string;
  transactionId?: string;
}

export interface PaymentAccount {
  number: string;
  agency: string;
  accountType: string;
  ispb: string;
  documentNumber: string;
}

export interface User {
  id: string;
  name: string;
  document: string;
  accounts: string[];
}

export interface FapiHeaders {
  'x-fapi-interaction-id': string;
  'x-fapi-auth-date': string;
  'x-fapi-customer-ip-address': string;
  'x-client-certificate': string;
  'x-fapi-customer-last-logged-time': string;
}
