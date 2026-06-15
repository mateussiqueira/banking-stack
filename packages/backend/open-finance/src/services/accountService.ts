import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { Account, Balance, Transaction, TransactionType } from '../open-finance/types';

const accounts: Map<string, Account> = new Map();
const transactions: Map<string, Transaction[]> = new Map();

function generateMockTransaction(
  accountId: string,
  type: TransactionType,
  amount: number,
  description: string,
  daysAgo: number
): Transaction {
  return {
    id: uuidv4(),
    accountId,
    type,
    amount: Math.round(amount * 100) / 100,
    currency: 'BRL',
    transactionDateTime: dayjs().subtract(daysAgo, 'day').toISOString(),
    description,
    category: type.startsWith('PIX') ? 'PIX' : 'TRANSFERENCIA',
    creditorName: amount < 0 ? undefined : 'Favorecido Teste',
    debtorName: amount > 0 ? undefined : 'Pagador Teste',
  };
}

function generateMockTransactions(accountId: string): Transaction[] {
  return [
    generateMockTransaction(accountId, 'PIX_TRANSFERENCIA', -150.0, 'PIX enviado para Maria Silva', 0),
    generateMockTransaction(accountId, 'PIX_PAGAMENTO', -32.5, 'Pagamento de conta de luz', 1),
    generateMockTransaction(accountId, 'TED', -2500.0, 'Transferência para investimentos', 2),
    generateMockTransaction(accountId, 'PIX_TRANSFERENCIA', 3200.0, 'Salário recebido', 3),
    generateMockTransaction(accountId, 'PAGAMENTO_BOLETO', -189.9, 'Boleto telefone', 4),
    generateMockTransaction(accountId, 'PIX_TRANSFERENCIA', -45.0, 'PIX para João Pereira', 5),
    generateMockTransaction(accountId, 'TARIFA', -12.0, 'Tarifa manutenção conta', 6),
    generateMockTransaction(accountId, 'PIX_TRANSFERENCIA', 200.0, 'Reembolso', 7),
    generateMockTransaction(accountId, 'PAGAMENTO_CONTA_ENERGIA', -287.35, 'Conta de energia', 10),
    generateMockTransaction(accountId, 'PIX_PAGAMENTO', -89.9, 'Streaming', 14),
  ];
}

function generateDefaultAccounts(): void {
  const userAccounts = [
    {
      userId: 'user-001',
      type: 'CONTA_DEPOSITO_A_VISTA' as const,
      subtype: 'CONTA_CORRENTE_INDIVIDUAL' as const,
      number: '12345-6',
      agency: '0001',
    },
    {
      userId: 'user-001',
      type: 'CONTA_POUPANCA' as const,
      subtype: 'CONTA_POUPANCA_INDIVIDUAL' as const,
      number: '78901-2',
      agency: '0001',
    },
    {
      userId: 'user-002',
      type: 'CONTA_DEPOSITO_A_VISTA' as const,
      subtype: 'CONTA_CORRENTE_CONJUNTA' as const,
      number: '34567-8',
      agency: '0002',
    },
  ];

  for (const acc of userAccounts) {
    const id = uuidv4();
    const account: Account = {
      id,
      ...acc,
      brandName: 'Banking Bank S.A.',
      companyName: 'Banking Tecnologia Financeira',
      openingDate: dayjs().subtract(2, 'year').toISOString(),
      status: 'AVAILABLE',
      currency: 'BRL',
      balance: {
        currency: 'BRL',
        availableAmount: Math.round(Math.random() * 50000 * 100) / 100,
        blockedAmount: 0,
        automaticallyInvestedAmount: 0,
        amount: 0,
        updateDateTime: dayjs().toISOString(),
      },
      overdraftLimits: {
        overdraftContractedLimit: 5000,
        overdraftUsedLimit: 0,
        overdraftUsedLimitPercentage: 0,
      },
    };

    account.balance.amount = account.balance.availableAmount;
    account.balance.amount = account.balance.availableAmount;

    accounts.set(id, account);
    transactions.set(id, generateMockTransactions(id));
  }
}

generateDefaultAccounts();

export function listAccounts(userId: string): Account[] {
  return Array.from(accounts.values()).filter((a) => a.userId === userId);
}

export function getAccount(id: string): Account | undefined {
  return accounts.get(id);
}

export function getAccountByUser(userId: string, accountId: string): Account | undefined {
  const account = accounts.get(accountId);
  if (!account || account.userId !== userId) return undefined;
  return account;
}

export function getBalances(accountId: string): Balance | undefined {
  const account = accounts.get(accountId);
  return account?.balance;
}

export function getTransactions(
  accountId: string,
  page: number = 1,
  limit: number = 20
): { data: Transaction[]; total: number; page: number; limit: number; totalPages: number } {
  const txns = transactions.get(accountId) || [];
  const sorted = [...txns].sort(
    (a, b) => dayjs(b.transactionDateTime).unix() - dayjs(a.transactionDateTime).unix()
  );
  const total = sorted.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const data = sorted.slice(start, start + limit);

  return { data, total, page, limit, totalPages };
}

export function getAccountIdsByUser(userId: string): string[] {
  return Array.from(accounts.values())
    .filter((a) => a.userId === userId)
    .map((a) => a.id);
}
