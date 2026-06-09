import mongoose from 'mongoose';
import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/banking-ledger-test';

let senderId: string;
let receiverId: string;

beforeAll(async () => {
  await mongoose.connect(MONGO_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

beforeEach(async () => {
  await Account.deleteMany({});
  await Transaction.deleteMany({});

  const sender = await accountService.createAccount({
    name: 'Sender',
    document: '11111111111',
    balance: 1000,
  });
  const receiver = await accountService.createAccount({
    name: 'Receiver',
    document: '22222222222',
    balance: 500,
  });

  senderId = sender._id.toString();
  receiverId = receiver._id.toString();
});

describe('Transaction Service', () => {
  describe('createTransaction', () => {
    it('should create a transaction and update balances', async () => {
      const tx = await transactionService.createTransaction({
        senderAccount: senderId,
        receiverAccount: receiverId,
        amount: 200,
        description: 'Test payment',
        type: 'PIX',
      });

      expect(tx).toBeDefined();
      expect(tx.amount).toBe(200);
      expect(tx.status).toBe('COMPLETED');
      expect(tx.type).toBe('PIX');
      expect(tx.description).toBe('Test payment');

      const sender = await accountService.getAccountById(senderId);
      const receiver = await accountService.getAccountById(receiverId);

      expect(sender!.balance).toBe(800);
      expect(receiver!.balance).toBe(700);
    });

    it('should reject zero amount', async () => {
      await expect(
        transactionService.createTransaction({
          senderAccount: senderId,
          receiverAccount: receiverId,
          amount: 0,
          type: 'PIX',
        })
      ).rejects.toThrow('Amount must be positive');
    });

    it('should reject negative amount', async () => {
      await expect(
        transactionService.createTransaction({
          senderAccount: senderId,
          receiverAccount: receiverId,
          amount: -50,
          type: 'PIX',
        })
      ).rejects.toThrow('Amount must be positive');
    });

    it('should prevent insufficient funds', async () => {
      await expect(
        transactionService.createTransaction({
          senderAccount: senderId,
          receiverAccount: receiverId,
          amount: 2000,
          type: 'TED',
        })
      ).rejects.toThrow('Insufficient funds');
    });

    it('should reject same sender and receiver', async () => {
      await expect(
        transactionService.createTransaction({
          senderAccount: senderId,
          receiverAccount: senderId,
          amount: 100,
          type: 'TRANSFER',
        })
      ).rejects.toThrow('Sender and receiver must be different');
    });

    it('should handle concurrent transactions atomically', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        transactionService
          .createTransaction({
            senderAccount: senderId,
            receiverAccount: receiverId,
            amount: 150,
            type: 'PIX',
          })
          .catch(() => null)
      );

      const results = await Promise.all(promises);
      const successful = results.filter((r) => r !== null);

      const sender = await accountService.getAccountById(senderId);
      const totalDebited = successful.length * 150;
      expect(sender!.balance).toBe(1000 - totalDebited);
    });
  });

  describe('getTransactionById', () => {
    it('should return transaction by id', async () => {
      const created = await transactionService.createTransaction({
        senderAccount: senderId,
        receiverAccount: receiverId,
        amount: 150,
        type: 'DOC',
      });

      const found = await transactionService.getTransactionById(
        created._id.toString()
      );
      expect(found).toBeDefined();
      expect(found!.amount).toBe(150);
      expect(found!.type).toBe('DOC');
    });

    it('should return null for non-existent id', async () => {
      const result = await transactionService.getTransactionById(
        new mongoose.Types.ObjectId().toString()
      );
      expect(result).toBeNull();
    });
  });

  describe('getTransactions', () => {
    it('should list transactions with pagination', async () => {
      for (let i = 0; i < 5; i++) {
        await transactionService.createTransaction({
          senderAccount: senderId,
          receiverAccount: receiverId,
          amount: 50,
          type: 'PIX',
        });
      }

      const result = await transactionService.getTransactions({ first: 3 });
      expect(result.transactions.length).toBe(3);
      expect(result.totalCount).toBe(5);
      expect(result.hasNextPage).toBe(true);
    });

    it('should filter transactions by accountId', async () => {
      await transactionService.createTransaction({
        senderAccount: senderId,
        receiverAccount: receiverId,
        amount: 100,
        type: 'PIX',
      });

      const result = await transactionService.getTransactions({
        first: 10,
        accountId: senderId,
      });
      expect(result.transactions.length).toBe(1);
    });
  });
});
