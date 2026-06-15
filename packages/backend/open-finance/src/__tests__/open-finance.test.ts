import {
  createConsent,
  getConsent,
  deleteConsent,
  validateConsentActive,
  hasPermission,
  authoriseConsent,
} from '../services/consentService';
import {
  listAccounts,
  getAccountByUser,
  getBalances,
  getTransactions,
} from '../services/accountService';
import {
  createPayment,
  getPayment,
  processPayment,
} from '../services/paymentService';

describe('Open Finance - Consent Management', () => {
  it('should create a consent', () => {
    const consent = createConsent('user-001', 'client-001', [
      'ACCOUNTS_READ',
      'ACCOUNTS_BALANCES_READ',
      'ACCOUNTS_TRANSACTIONS_READ',
    ]);

    expect(consent.id).toBeDefined();
    expect(consent.status).toBe('AWAITING_AUTHORISATION');
    expect(consent.permissions).toContain('ACCOUNTS_READ');
  });

  it('should authorise a consent', () => {
    const consent = createConsent('user-001', 'client-001', ['ACCOUNTS_READ']);
    const authorised = authoriseConsent(consent.id);

    expect(authorised).not.toBeNull();
    expect(authorised!.status).toBe('AUTHORISED');
  });

  it('should retrieve a consent by id', () => {
    const consent = createConsent('user-001', 'client-001', ['ACCOUNTS_READ']);
    const found = getConsent(consent.id);

    expect(found).toBeDefined();
    expect(found!.id).toBe(consent.id);
  });

  it('should delete a consent', () => {
    const consent = createConsent('user-001', 'client-001', ['ACCOUNTS_READ']);
    const deleted = deleteConsent(consent.id);

    expect(deleted).toBe(true);
    expect(getConsent(consent.id)).toBeUndefined();
  });

  it('should validate active consent', () => {
    const consent = createConsent('user-001', 'client-001', ['ACCOUNTS_READ']);
    expect(validateConsentActive(consent.id)).toBe(false);

    authoriseConsent(consent.id);
    expect(validateConsentActive(consent.id)).toBe(true);
  });

  it('should check permissions on consent', () => {
    const consent = createConsent('user-001', 'client-001', ['ACCOUNTS_READ', 'PIX_WRITE']);
    authoriseConsent(consent.id);

    expect(hasPermission(consent.id, 'ACCOUNTS_READ')).toBe(true);
    expect(hasPermission(consent.id, 'PIX_WRITE')).toBe(true);
    expect(hasPermission(consent.id, 'ACCOUNTS_BALANCES_READ')).toBe(false);
  });
});

describe('Open Finance - Accounts', () => {
  const userId = 'user-001';

  it('should list accounts for user', () => {
    const accounts = listAccounts(userId);
    expect(accounts.length).toBeGreaterThan(0);
    expect(accounts[0].userId).toBe(userId);
  });

  it('should get account by user id', () => {
    const accounts = listAccounts(userId);
    const account = getAccountByUser(userId, accounts[0].id);

    expect(account).toBeDefined();
    expect(account!.id).toBe(accounts[0].id);
  });

  it('should not return account for different user', () => {
    const accounts = listAccounts(userId);
    const account = getAccountByUser('user-999', accounts[0].id);

    expect(account).toBeUndefined();
  });

  it('should return balances for account', () => {
    const accounts = listAccounts(userId);
    const balances = getBalances(accounts[0].id);

    expect(balances).toBeDefined();
    expect(balances!.currency).toBe('BRL');
    expect(balances!.availableAmount).toBeGreaterThanOrEqual(0);
  });

  it('should return paginated transactions', () => {
    const accounts = listAccounts(userId);
    const result = getTransactions(accounts[0].id, 1, 5);

    expect(result.data.length).toBeLessThanOrEqual(5);
    expect(result.total).toBeGreaterThan(0);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(5);
  });
});

describe('Open Finance - Accounts Without Consent (should fail)', () => {
  it('should not have access before consent authorisation', () => {
    const consent = createConsent('user-001', 'client-001', ['ACCOUNTS_READ']);

    expect(validateConsentActive(consent.id)).toBe(false);
  });

  it('should not have permission if not granted', () => {
    const consent = createConsent('user-001', 'client-001', ['PIX_WRITE']);
    authoriseConsent(consent.id);

    expect(hasPermission(consent.id, 'ACCOUNTS_READ')).toBe(false);
  });

  it('should not find user without consent', () => {
    const accounts = listAccounts('user-999');
    expect(accounts.length).toBe(0);
  });
});

describe('Open Finance - Payments', () => {
  const debtorAccount = {
    number: '12345-6',
    agency: '0001',
    accountType: 'CONTA_CORRENTE',
    ispb: '12345678',
    documentNumber: '12345678000190',
  };

  const creditorAccount = {
    number: '98765-4',
    agency: '0002',
    accountType: 'CONTA_CORRENTE',
    ispb: '87654321',
    documentNumber: '98765432000110',
  };

  it('should create a payment', () => {
    const payment = createPayment(
      'user-001',
      150.0,
      'BRL',
      debtorAccount,
      creditorAccount,
      'Maria Silva',
      '98765432000110',
      'Pagamento de serviço'
    );

    expect(payment.id).toBeDefined();
    expect(payment.status).toBe('PDNG');
    expect(payment.amount).toBe(150.0);
    expect(payment.endToEndId).toBeDefined();
  });

  it('should process a payment', () => {
    const payment = createPayment(
      'user-001',
      250.0,
      'BRL',
      debtorAccount,
      creditorAccount,
      'João Santos',
      '11222333000181',
      'Pagamento referente nota fiscal'
    );

    const processed = processPayment(payment.id);
    expect(processed).not.toBeNull();
    expect(processed!.status).toBe('ACSC');
  });

  it('should get payment status', () => {
    const payment = createPayment(
      'user-001',
      99.9,
      'BRL',
      debtorAccount,
      creditorAccount,
      'Ana Costa',
      '55443322000199',
      'Reembolso'
    );

    processPayment(payment.id);
    const found = getPayment(payment.id);

    expect(found).toBeDefined();
    expect(found!.status).toBe('ACSC');
    expect(found!.amount).toBe(99.9);
  });

  it('should return null for non-existent payment', () => {
    const found = getPayment('non-existent-id');
    expect(found).toBeUndefined();
  });
});
