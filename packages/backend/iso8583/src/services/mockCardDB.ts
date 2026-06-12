export interface MockCard {
  pan: string;
  expiry: string;
  cvv: string;
  balance: number;
  currency: string;
  status: 'active' | 'blocked' | 'expired';
  holderName: string;
  brand: string;
  initialBalance: number;
}

const defaultCards: MockCard[] = [
  {
    pan: '4000000000000001',
    expiry: '2806',
    cvv: '123',
    balance: 10000000,
    currency: 'BRL',
    status: 'active',
    holderName: 'APROVADO/SILVA',
    brand: 'visa',
    initialBalance: 10000000,
  },
  {
    pan: '4000000000000002',
    expiry: '2806',
    cvv: '456',
    balance: 500,
    currency: 'BRL',
    status: 'active',
    holderName: 'SALDO BAIXO/SILVA',
    brand: 'visa',
    initialBalance: 500,
  },
  {
    pan: '4000000000000003',
    expiry: '2806',
    cvv: '789',
    balance: 10000,
    currency: 'BRL',
    status: 'blocked',
    holderName: 'BLOQUEADO/SILVA',
    brand: 'mastercard',
    initialBalance: 10000,
  },
  {
    pan: '5000000000000004',
    expiry: '2712',
    cvv: '321',
    balance: 500000,
    currency: 'BRL',
    status: 'active',
    holderName: 'CREDITO/LIMITS',
    brand: 'mastercard',
    initialBalance: 500000,
  },
  {
    pan: '5000000000000005',
    expiry: '2506',
    cvv: '654',
    balance: 0,
    currency: 'BRL',
    status: 'expired',
    holderName: 'EXPIRADO/SILVA',
    brand: 'visa',
    initialBalance: 0,
  },
];

let cards: MockCard[] = [...defaultCards];

export function getAllCards(): MockCard[] {
  return cards.map((c) => ({ ...c }));
}

export function findCard(pan: string): MockCard | undefined {
  return cards.find((c) => c.pan === pan);
}

export function createCard(card: MockCard): MockCard {
  const existing = cards.find((c) => c.pan === card.pan);
  if (existing) {
    throw new Error(`Card with PAN ${card.pan} already exists`);
  }
  cards.push({ ...card, initialBalance: card.balance });
  return { ...card };
}

export function resetCardBalance(pan: string): MockCard | null {
  const card = cards.find((c) => c.pan === pan);
  if (!card) return null;
  card.balance = card.initialBalance;
  return { ...card };
}

export function deductBalance(pan: string, amount: number): boolean {
  const card = cards.find((c) => c.pan === pan);
  if (!card) return false;
  if (card.balance < amount) return false;
  card.balance -= amount;
  return true;
}

export function creditBalance(pan: string, amount: number): boolean {
  const card = cards.find((c) => c.pan === pan);
  if (!card) return false;
  card.balance += amount;
  return true;
}

export function resetAllCards(): void {
  for (const card of cards) {
    card.balance = card.initialBalance;
  }
}
