import { buildSchema } from 'graphql';

export const schema = buildSchema(`
  type PixKeyResult {
    success: Boolean!
    keyType: String
    ownerName: String
    ownerDocument: String
    bank: String
    isValid: Boolean!
    message: String
  }

  type BucketState {
    remaining: Int!
    capacity: Int!
    resetTime: Float!
  }

  type Query {
    bucketStatus(key: String!): BucketState
  }

  type Mutation {
    queryPixKey(key: String!): PixKeyResult!
  }
`);
