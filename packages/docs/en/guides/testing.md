# Testing Strategy

## Overview

Banking Challenges uses a multi-layer testing strategy:

1. **Unit Tests**: Isolated functions and services
2. **Integration Tests**: Component interaction
3. **API Tests**: HTTP/GraphQL endpoints
4. **Transaction Tests**: Atomicity and concurrency

---

## Test Runners

| Package | Runner | Config File |
|---------|--------|-------------|
| All Backend | **Jest** | `jest.config.ts` |
| Landing Page | **Jest** + Testing Library | `jest.config.ts` |
| KYC System | **Vitest** | `vite.config.ts` |

---

## Running Tests

```bash
# All tests
pnpm test

# Specific package
pnpm --filter @banking/ledger test

# Watch mode
pnpm --filter @banking/kyc-system test:watch

# With coverage
pnpm test -- --coverage
```

---

## Testing Patterns

### Backend (Jest)

```typescript
import { accountService } from '../services/accountService';

describe('AccountService', () => {
  beforeEach(async () => {
    await Account.deleteMany({});
  });

  it('should create an account', async () => {
    const account = await accountService.createAccount({
      name: 'John Doe',
      document: '123.456.789-00',
    });

    expect(account.name).toBe('John Doe');
    expect(account.balance).toBe(0);
  });

  it('should reject duplicate documents', async () => {
    await accountService.createAccount({
      name: 'John',
      document: '123.456.789-00',
    });

    await expect(
      accountService.createAccount({
        name: 'Jane',
        document: '123.456.789-00',
      })
    ).rejects.toThrow('already exists');
  });
});
```

### Transaction Tests

```typescript
describe('Transaction Atomicity', () => {
  it('should transfer funds atomically', async () => {
    const sender = await accountService.createAccount({ name: 'A', document: '1', balance: 500 });
    const receiver = await accountService.createAccount({ name: 'B', document: '2', balance: 0 });

    await transactionService.createTransaction({
      senderAccount: sender._id.toString(),
      receiverAccount: receiver._id.toString(),
      amount: 200,
      type: 'PIX',
    });

    const updatedSender = await accountService.getAccountById(sender._id.toString());
    const updatedReceiver = await accountService.getAccountById(receiver._id.toString());

    expect(updatedSender!.balance).toBe(300);
    expect(updatedReceiver!.balance).toBe(200);
  });
});
```

### Frontend (Vitest + Testing Library)

```typescript
import { render, screen } from '@testing-library/react';
import { KYCStepper } from './KYCStepper';

describe('KYCStepper', () => {
  it('should display current step', () => {
    render(<KYCStepper currentStep={2} totalSteps={4} />);
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
  });
});
```

---

## What to Test

- **Validations**: Input validation, business rules
- **Boundaries**: Edge cases, limits
- **Error paths**: Error handling, error responses
- **Transactions**: Atomicity, rollback
- **Concurrency**: Race conditions, deadlocks
- **API contracts**: Request/response format, status codes
- **Pagination**: Cursor-based pagination, limits

---

## CI Integration

Tests run automatically on every push via CI pipeline:

```yaml
- run: pnpm test
```

Test results appear in GitHub Actions.
