import DataLoader from 'dataloader';
import { Transaction, ITransaction } from '../models/Transaction';

export const createTransactionLoader = (): DataLoader<string, ITransaction | null> => {
  return new DataLoader<string, ITransaction | null>(async (ids) => {
    const transactions = await Transaction.find({ _id: { $in: ids } }).lean();
    const map = new Map<string, ITransaction>();
    for (const tx of transactions) {
      map.set(tx._id.toString(), tx as unknown as ITransaction);
    }
    return ids.map((id) => map.get(id) ?? null);
  });
};
