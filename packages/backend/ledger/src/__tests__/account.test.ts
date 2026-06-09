import mongoose from 'mongoose';
import { Account } from '../models/Account';
import { accountService } from '../services/accountService';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/banking-ledger-test';

beforeAll(async () => {
  await mongoose.connect(MONGO_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

beforeEach(async () => {
  await Account.deleteMany({});
});

describe('Account Service', () => {
  describe('createAccount', () => {
    it('should create an account with valid data', async () => {
      const account = await accountService.createAccount({
        name: 'John Doe',
        document: '12345678901',
        balance: 1000,
      });

      expect(account).toBeDefined();
      expect(account.name).toBe('John Doe');
      expect(account.document).toBe('12345678901');
      expect(account.balance).toBe(1000);
    });

    it('should create account with zero balance by default', async () => {
      const account = await accountService.createAccount({
        name: 'Jane Doe',
        document: '98765432101',
      });

      expect(account.balance).toBe(0);
    });

    it('should reject duplicate document', async () => {
      await accountService.createAccount({
        name: 'John Doe',
        document: '12345678901',
      });

      await expect(
        accountService.createAccount({
          name: 'John Doe 2',
          document: '12345678901',
        })
      ).rejects.toThrow(/already exists/i);
    });
  });

  describe('getAccountById', () => {
    it('should return account by id', async () => {
      const created = await accountService.createAccount({
        name: 'John Doe',
        document: '12345678901',
      });

      const found = await accountService.getAccountById(created._id.toString());
      expect(found).toBeDefined();
      expect(found!.name).toBe('John Doe');
    });

    it('should return null for non-existent id', async () => {
      const result = await accountService.getAccountById(
        new mongoose.Types.ObjectId().toString()
      );
      expect(result).toBeNull();
    });

    it('should return null for invalid id', async () => {
      const result = await accountService.getAccountById('invalid-id');
      expect(result).toBeNull();
    });
  });

  describe('getAccounts', () => {
    it('should return paginated accounts', async () => {
      await accountService.createAccount({
        name: 'Account 1',
        document: '11111111111',
      });
      await accountService.createAccount({
        name: 'Account 2',
        document: '22222222222',
      });
      await accountService.createAccount({
        name: 'Account 3',
        document: '33333333333',
      });

      const result = await accountService.getAccounts({ first: 2 });
      expect(result.accounts.length).toBe(2);
      expect(result.totalCount).toBe(3);
      expect(result.hasNextPage).toBe(true);
    });
  });

  describe('getBalance', () => {
    it('should return account balance', async () => {
      const account = await accountService.createAccount({
        name: 'John Doe',
        document: '12345678901',
        balance: 500,
      });

      const balance = await accountService.getBalance(account._id.toString());
      expect(balance).toBe(500);
    });

    it('should throw for non-existent account', async () => {
      await expect(
        accountService.getBalance(new mongoose.Types.ObjectId().toString())
      ).rejects.toThrow('Account not found');
    });
  });
});
