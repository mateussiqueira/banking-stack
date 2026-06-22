import mongoose, { Types } from 'mongoose';
import { Transaction, ITransaction, TransactionStatus } from '../models/Transaction';
import { Account } from '../models/Account';

export const transactionService = {
  async createTransaction(data: {
    senderAccount: string;
    receiverAccount: string;
    amount: number;
    description?: string;
    type: string;
  }): Promise<ITransaction> {
    if (data.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    if (data.senderAccount === data.receiverAccount) {
      throw new Error('Sender and receiver must be different');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const sender = await Account.findById(data.senderAccount).session(session);
      if (!sender) {
        throw new Error('Sender account not found');
      }

      const receiver = await Account.findById(data.receiverAccount).session(session);
      if (!receiver) {
        throw new Error('Receiver account not found');
      }

      if (sender.balance < data.amount) {
        throw new Error('Insufficient funds');
      }

      const [transaction] = await Transaction.create(
        [
          {
            senderAccount: new Types.ObjectId(data.senderAccount),
            receiverAccount: new Types.ObjectId(data.receiverAccount),
            amount: data.amount,
            description: data.description ?? '',
            type: data.type,
            status: 'COMPLETED' as TransactionStatus,
            completedAt: new Date(),
          },
        ],
        { session }
      );

      sender.balance -= data.amount;
      receiver.balance += data.amount;

      await sender.save({ session });
      await receiver.save({ session });

      await session.commitTransaction();

      return transaction;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  async getTransactionById(id: string): Promise<ITransaction | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return Transaction.findById(id);
  },

  async getTransactions(
    pagination: {
      first?: number;
      after?: string;
      last?: number;
      before?: string;
      accountId?: string;
    }
  ): Promise<{
    transactions: ITransaction[];
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    const { first = 10, after, last, before, accountId } = pagination;

    const filter: Record<string, unknown> = {};
    if (accountId) {
      filter.$or = [
        { senderAccount: new Types.ObjectId(accountId) },
        { receiverAccount: new Types.ObjectId(accountId) },
      ];
    }

    let query: Record<string, unknown> = { ...filter };
    let sortDir: 1 | -1 = -1;
    let limit = first;

    if (last) {
      sortDir = 1;
      limit = last;
    }

    if (after) {
      const decoded = Buffer.from(after, 'base64').toString('utf-8');
      query = { ...query, _id: { $gt: new Types.ObjectId(decoded) } };
    }

    if (before) {
      const decoded = Buffer.from(before, 'base64').toString('utf-8');
      query = { ...query, _id: { $lt: new Types.ObjectId(decoded) } };
    }

    const totalCount = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(query)
      .sort({ _id: sortDir })
      .limit(limit + 1)
      .lean();

    const hasMore = transactions.length > limit;
    if (hasMore) transactions.pop();

    if (last) transactions.reverse();

    return {
      transactions: transactions as unknown as ITransaction[],
      totalCount,
      hasNextPage: after ? hasMore : false,
      hasPreviousPage: before ? hasMore : false,
    };
  },
};

// TODO: add idempotency key to prevent duplicate transactions on retry
