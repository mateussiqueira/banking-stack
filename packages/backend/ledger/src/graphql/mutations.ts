import { mutationWithClientMutationId, fromGlobalId } from 'graphql-relay';
import {
  GraphQLNonNull,
  GraphQLString,
  GraphQLFloat,
  GraphQLID,
} from 'graphql';
import {
  AccountType,
  TransactionType,
  TransactionTypeEnum,
  CreateAccountInput,
  CreateTransactionInput,
} from './types';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';

export const CreateAccountMutation = mutationWithClientMutationId({
  name: 'CreateAccount',
  inputFields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    document: { type: new GraphQLNonNull(GraphQLString) },
    balance: { type: GraphQLFloat },
  },
  mutateAndGetPayload: async ({ name, document, balance }) => {
    const account = await accountService.createAccount({ name, document, balance });
    return { account };
  },
  outputFields: {
    account: { type: new GraphQLNonNull(AccountType) },
  },
});

export const CreateTransactionMutation = mutationWithClientMutationId({
  name: 'CreateTransaction',
  inputFields: {
    senderAccount: { type: new GraphQLNonNull(GraphQLString) },
    receiverAccount: { type: new GraphQLNonNull(GraphQLString) },
    amount: { type: new GraphQLNonNull(GraphQLFloat) },
    description: { type: GraphQLString },
    type: { type: new GraphQLNonNull(GraphQLString) },
    idempotencyKey: { type: GraphQLString },
  },
  mutateAndGetPayload: async ({
    senderAccount,
    receiverAccount,
    amount,
    description,
    type,
    idempotencyKey,
  }) => {
    const { id: senderId } = fromGlobalId(senderAccount);
    const { id: receiverId } = fromGlobalId(receiverAccount);

    const transaction = await transactionService.createTransaction({
      senderAccount: senderId,
      receiverAccount: receiverId,
      amount,
      description,
      type,
      idempotencyKey,
    });
    return { transaction };
  },
  outputFields: {
    transaction: { type: new GraphQLNonNull(TransactionType) },
  },
});
