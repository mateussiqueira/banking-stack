import DataLoader from 'dataloader';
import { Account, IAccount } from '../models/Account';

export const createAccountLoader = (): DataLoader<string, IAccount | null> => {
  return new DataLoader<string, IAccount | null>(async (ids) => {
    const accounts = await Account.find({ _id: { $in: ids } }).lean();
    const map = new Map<string, IAccount>();
    for (const acc of accounts) {
      map.set(acc._id.toString(), acc as unknown as IAccount);
    }
    return ids.map((id) => map.get(id) ?? null);
  });
};
