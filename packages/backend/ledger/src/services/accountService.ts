import { Account, IAccount } from '../models/Account';
import { Types } from 'mongoose';

export const accountService = {
  async createAccount(data: {
    name: string;
    document: string;
    balance?: number;
  }): Promise<IAccount> {
    const existing = await Account.findOne({ document: data.document });
    if (existing) {
      throw new Error(`Account with document ${data.document} already exists`);
    }
    const account = await Account.create({
      name: data.name,
      document: data.document,
      balance: data.balance ?? 0,
    });
    return account;
  },

  async getAccountById(id: string): Promise<IAccount | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return Account.findById(id);
  },

  async getAccounts(
    pagination: { first?: number; after?: string; last?: number; before?: string }
  ): Promise<{
    accounts: IAccount[];
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    const { first = 10, after, last, before } = pagination;

    let query: Record<string, unknown> = {};
    let sortDir: 1 | -1 = 1;
    let limit = first;

    if (last) {
      sortDir = -1;
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

    const totalCount = await Account.countDocuments();
    const accounts = await Account.find(query)
      .sort({ _id: sortDir })
      .limit(limit + 1)
      .lean();

    const hasMore = accounts.length > limit;
    if (hasMore) accounts.pop();

    if (last) accounts.reverse();

    return {
      accounts: accounts as unknown as IAccount[],
      totalCount,
      hasNextPage: after ? hasMore : last ? false : hasMore,
      hasPreviousPage: before ? hasMore : false,
    };
  },

  async getBalance(id: string): Promise<number> {
    const account = await this.getAccountById(id);
    if (!account) throw new Error('Account not found');
    return account.balance;
  },
};

// TODO: handle concurrent balance updates with optimistic locking
