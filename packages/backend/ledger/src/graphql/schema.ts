import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLInt,
  GraphQLString,
} from 'graphql';
import {
  connectionArgs,
  connectionFromArray,
  fromGlobalId,
} from 'graphql-relay';
import {
  nodeInterface,
  nodeField,
  AccountType,
  TransactionType,
  AccountConnectionType,
  TransactionConnectionType,
  TransactionTypeEnum,
  TransactionStatusEnum,
} from './types';
import { CreateAccountMutation, CreateTransactionMutation } from './mutations';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';

const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    node: nodeField,
    accounts: {
      type: new GraphQLNonNull(AccountConnectionType.connectionType),
      args: {
        ...connectionArgs,
      },
      resolve: async (_, args) => {
        const { first, after, last, before } = args;
        const afterStr = after || undefined;
        const beforeStr = before || undefined;

        const result = await accountService.getAccounts({
          first: first || undefined,
          after: afterStr,
          last: last || undefined,
          before: beforeStr,
        });

        const edges = result.accounts.map((account) => ({
          cursor: Buffer.from(account._id.toString()).toString('base64'),
          node: account,
        }));

        return {
          edges,
          pageInfo: {
            startCursor: edges.length > 0 ? edges[0].cursor : null,
            endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
            hasNextPage: result.hasNextPage,
            hasPreviousPage: result.hasPreviousPage,
          },
          totalCount: result.totalCount,
        };
      },
    },
    account: {
      type: AccountType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (_, args) => {
        const { id } = fromGlobalId(args.id);
        return accountService.getAccountById(id);
      },
    },
    transactions: {
      type: new GraphQLNonNull(TransactionConnectionType.connectionType),
      args: {
        ...connectionArgs,
        accountId: { type: GraphQLID },
      },
      resolve: async (_, args) => {
        const { first, after, last, before, accountId } = args;
        const afterStr = after || undefined;
        const beforeStr = before || undefined;
        let accountFilterId: string | undefined;

        if (accountId) {
          const resolved = fromGlobalId(accountId);
          accountFilterId = resolved.id;
        }

        const result = await transactionService.getTransactions({
          first: first || undefined,
          after: afterStr,
          last: last || undefined,
          before: beforeStr,
          accountId: accountFilterId,
        });

        const edges = result.transactions.map((tx) => ({
          cursor: Buffer.from(tx._id.toString()).toString('base64'),
          node: tx,
        }));

        return {
          edges,
          pageInfo: {
            startCursor: edges.length > 0 ? edges[0].cursor : null,
            endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
            hasNextPage: result.hasNextPage,
            hasPreviousPage: result.hasPreviousPage,
          },
          totalCount: result.totalCount,
        };
      },
    },
    transaction: {
      type: TransactionType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (_, args) => {
        const { id } = fromGlobalId(args.id);
        return transactionService.getTransactionById(id);
      },
    },
  }),
});

const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    createAccount: CreateAccountMutation,
    createTransaction: CreateTransactionMutation,
  }),
});

export const schema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
});
