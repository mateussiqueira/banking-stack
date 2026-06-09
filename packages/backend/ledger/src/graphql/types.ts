import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLFloat,
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInt,
} from 'graphql';
import {
  globalIdField,
  nodeDefinitions,
  connectionDefinitions,
  fromGlobalId,
} from 'graphql-relay';
import { accountService } from '../services/accountService';

const { nodeInterface, nodeField } = nodeDefinitions(
  async (globalId) => {
    const { type, id } = fromGlobalId(globalId);
    if (type === 'Account') {
      return accountService.getAccountById(id);
    }
    if (type === 'Transaction') {
      const { transactionService } = await import('../services/transactionService');
      return transactionService.getTransactionById(id);
    }
    return null;
  },
  (obj) => {
    if (obj.name !== undefined && obj.document !== undefined) {
      return 'Account';
    }
    if (obj.senderAccount !== undefined || obj.type !== undefined) {
      return 'Transaction';
    }
    return null;
  }
);

export { nodeInterface, nodeField };

export const TransactionTypeEnum = new GraphQLEnumType({
  name: 'TransactionType',
  values: {
    PIX: { value: 'PIX' },
    TED: { value: 'TED' },
    DOC: { value: 'DOC' },
    TRANSFER: { value: 'TRANSFER' },
  },
});

export const TransactionStatusEnum = new GraphQLEnumType({
  name: 'TransactionStatus',
  values: {
    PENDING: { value: 'PENDING' },
    COMPLETED: { value: 'COMPLETED' },
    FAILED: { value: 'FAILED' },
    REVERTED: { value: 'REVERTED' },
  },
});

export const AccountType = new GraphQLObjectType({
  name: 'Account',
  fields: () => ({
    id: globalIdField('Account'),
    _id: { type: GraphQLID, resolve: (parent) => parent._id.toString() },
    name: { type: new GraphQLNonNull(GraphQLString) },
    document: { type: new GraphQLNonNull(GraphQLString) },
    balance: { type: new GraphQLNonNull(GraphQLFloat) },
    createdAt: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (parent) =>
        parent.createdAt instanceof Date
          ? parent.createdAt.toISOString()
          : new Date(parent.createdAt).toISOString(),
    },
  }),
  interfaces: [nodeInterface],
});

export const TransactionType = new GraphQLObjectType({
  name: 'Transaction',
  fields: () => ({
    id: globalIdField('Transaction'),
    _id: { type: GraphQLID, resolve: (parent) => parent._id.toString() },
    sender: {
      type: new GraphQLNonNull(AccountType),
      resolve: async (parent) => {
        const senderId = parent.senderAccount?.toString?.() ?? parent.senderAccount;
        return accountService.getAccountById(senderId);
      },
    },
    receiver: {
      type: new GraphQLNonNull(AccountType),
      resolve: async (parent) => {
        const receiverId = parent.receiverAccount?.toString?.() ?? parent.receiverAccount;
        return accountService.getAccountById(receiverId);
      },
    },
    amount: { type: new GraphQLNonNull(GraphQLFloat) },
    description: { type: GraphQLString },
    type: { type: new GraphQLNonNull(TransactionTypeEnum) },
    status: { type: new GraphQLNonNull(TransactionStatusEnum) },
    createdAt: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (parent) =>
        parent.createdAt instanceof Date
          ? parent.createdAt.toISOString()
          : new Date(parent.createdAt).toISOString(),
    },
  }),
  interfaces: [nodeInterface],
});

export const AccountConnectionType = connectionDefinitions({
  nodeType: AccountType,
  name: 'Account',
  connectionFields: () => ({
    totalCount: { type: GraphQLInt, description: 'Total number of items' },
  }),
});

export const TransactionConnectionType = connectionDefinitions({
  nodeType: TransactionType,
  name: 'Transaction',
  connectionFields: () => ({
    totalCount: { type: GraphQLInt, description: 'Total number of items' },
  }),
});

export const CreateAccountInput = new GraphQLInputObjectType({
  name: 'CreateAccountInput',
  fields: {
    clientMutationId: { type: GraphQLString },
    name: { type: new GraphQLNonNull(GraphQLString) },
    document: { type: new GraphQLNonNull(GraphQLString) },
    balance: { type: GraphQLFloat },
  },
});

export const CreateTransactionInput = new GraphQLInputObjectType({
  name: 'CreateTransactionInput',
  fields: {
    clientMutationId: { type: GraphQLString },
    senderAccount: { type: new GraphQLNonNull(GraphQLID) },
    receiverAccount: { type: new GraphQLNonNull(GraphQLID) },
    amount: { type: new GraphQLNonNull(GraphQLFloat) },
    description: { type: GraphQLString },
    type: { type: new GraphQLNonNull(TransactionTypeEnum) },
  },
});
