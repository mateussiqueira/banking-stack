import IORedis from 'ioredis';
import { LeakyBucket, BucketState } from '../leaky-bucket/strategy';
import { authService } from '../services/authService';

jest.mock('ioredis');

const MockRedis = IORedis as jest.MockedClass<typeof IORedis>;
const mockRedisInstance = {
  script: jest.fn(),
  evalsha: jest.fn(),
  hmset: jest.fn(),
  hget: jest.fn(),
  del: jest.fn(),
  ping: jest.fn(),
} as unknown as jest.Mocked<IORedis>;

beforeEach(() => {
  jest.clearAllMocks();
  (MockRedis as jest.Mock).mockImplementation(() => mockRedisInstance);
});

describe('Leaky Bucket Strategy', () => {
  describe('Token Consumption', () => {
    it('should consume tokens when available', async () => {
      mockRedisInstance.evalsha.mockResolvedValue([1, 9, 0, 0]);

      const bucket = new LeakyBucket(mockRedisInstance, {
        capacity: 10,
        refillRate: 1,
        refillInterval: 3600000,
      });

      const result = await bucket.consume('test-user', 1);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('should block when tokens exhausted', async () => {
      mockRedisInstance.evalsha.mockResolvedValue([0, 0, 1000, 3600]);

      const bucket = new LeakyBucket(mockRedisInstance, {
        capacity: 1,
        refillRate: 1,
        refillInterval: 3600000,
      });

      const result = await bucket.consume('test-user', 1);

      expect(result.allowed).toBe(true);

      mockRedisInstance.evalsha.mockResolvedValue([0, 0, 2000, 3600]);

      const result2 = await bucket.consume('test-user', 1);

      expect(result2.allowed).toBe(false);
      expect(result2.remaining).toBe(0);
    });

    it('should allow burst up to capacity', async () => {
      mockRedisInstance.evalsha
        .mockResolvedValueOnce([1, 9, 0, 0])
        .mockResolvedValueOnce([1, 8, 0, 0])
        .mockResolvedValueOnce([1, 7, 0, 0])
        .mockResolvedValueOnce([1, 6, 0, 0])
        .mockResolvedValueOnce([1, 5, 0, 0])
        .mockResolvedValueOnce([1, 4, 0, 0])
        .mockResolvedValueOnce([1, 3, 0, 0])
        .mockResolvedValueOnce([1, 2, 0, 0])
        .mockResolvedValueOnce([1, 1, 0, 0])
        .mockResolvedValueOnce([1, 0, 0, 0]);

      const bucket = new LeakyBucket(mockRedisInstance, {
        capacity: 10,
        refillRate: 1,
        refillInterval: 3600000,
      });

      for (let i = 0; i < 10; i++) {
        const result = await bucket.consume('burst-user', 1);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(9 - i);
      }
    });

    it('should return retryAfter when limited', async () => {
      mockRedisInstance.evalsha.mockResolvedValue([0, 0, 5000, 120]);

      const bucket = new LeakyBucket(mockRedisInstance, {
        capacity: 1,
        refillRate: 1,
        refillInterval: 3600000,
      });

      const result = await bucket.consume('limited-user', 1);

      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
    });
  });

  describe('Token Refill', () => {
    it('should refill tokens over time', async () => {
      mockRedisInstance.evalsha.mockResolvedValue([1, 10, 0, 0]);

      const bucket = new LeakyBucket(mockRedisInstance, {
        capacity: 10,
        refillRate: 2,
        refillInterval: 3600000,
      });

      await bucket.consume('refill-user', 5);
      expect(mockRedisInstance.evalsha).toHaveBeenCalled();
    });

    it('should not exceed capacity on refill', async () => {
      mockRedisInstance.hget
        .mockResolvedValueOnce(Date.now().toString())
        .mockResolvedValueOnce('9');

      mockRedisInstance.evalsha.mockResolvedValue([1, 10, 0, 0]);

      const bucket = new LeakyBucket(mockRedisInstance, {
        capacity: 10,
        refillRate: 2,
        refillInterval: 3600000,
      });

      const state = await bucket.getState('refill-user');
      expect(state.capacity).toBe(10);
    });
  });

  describe('State Management', () => {
    it('should return current bucket state', async () => {
      mockRedisInstance.evalsha.mockResolvedValue([7, 1, 10, 1000]);

      const bucket = new LeakyBucket(mockRedisInstance, {
        capacity: 10,
        refillRate: 1,
        refillInterval: 3600000,
      });

      const state = await bucket.getState('state-user');

      expect(state.remaining).toBe(7);
      expect(state.capacity).toBe(10);
      expect(state.resetTime).toBe(1000);
    });

    it('should reset bucket state', async () => {
      mockRedisInstance.del.mockResolvedValue(1);

      const bucket = new LeakyBucket(mockRedisInstance, {
        capacity: 10,
        refillRate: 1,
        refillInterval: 3600000,
      });

      await bucket.reset('reset-user');
      expect(mockRedisInstance.del).toHaveBeenCalled();
    });
  });

  describe('Multi-tenant Isolation', () => {
    it('should isolate rate limits per tenant', async () => {
      mockRedisInstance.evalsha
        .mockResolvedValueOnce([1, 9, 0, 0])
        .mockResolvedValueOnce([1, 4, 0, 0])
        .mockResolvedValueOnce([1, 9, 0, 0])
        .mockResolvedValueOnce([1, 8, 0, 0])
        .mockResolvedValueOnce([1, 4, 0, 0])
        .mockResolvedValueOnce([1, 3, 0, 0]);

      const bucket = new LeakyBucket(mockRedisInstance, {
        capacity: 10,
        refillRate: 1,
        refillInterval: 3600000,
      });

      const tenantA = await bucket.consume('tenant-a', 1);
      const tenantB = await bucket.consume('tenant-b', 6);

      expect(tenantA.allowed).toBe(true);
      expect(tenantA.remaining).toBe(9);
      expect(tenantB.allowed).toBe(true);
      expect(tenantB.remaining).toBe(4);

      const tenantA2 = await bucket.consume('tenant-a', 1);
      expect(tenantA2.allowed).toBe(true);
      expect(tenantA2.remaining).toBe(9);
    });
  });

  describe('Auth Service', () => {
    it('should register a new user', () => {
      const user = authService.createUser('John Doe', 'john@example.com');
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.apiKey).toMatch(/^banking_/);
    });

    it('should reject duplicate email', () => {
      authService.createUser('John', 'dup@example.com');
      expect(() => {
        authService.createUser('John 2', 'dup@example.com');
      }).toThrow('already exists');
    });

    it('should generate and validate JWT', () => {
      const user = authService.createUser('Token User', 'token@example.com');
      const token = authService.generateToken(user.id);
      expect(token).toBeTruthy();

      const decoded = authService.validateToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded!.email).toBe('token@example.com');
    });

    it('should validate API key', () => {
      const user = authService.createUser('Key User', 'key@example.com');
      const found = authService.validateApiKey(user.apiKey);
      expect(found).toBeDefined();
      expect(found!.id).toBe(user.id);
    });

    it('should reject invalid token', () => {
      const decoded = authService.validateToken('invalid-token');
      expect(decoded).toBeNull();
    });
  });

  describe('Integration: Auth → Query → Rate Limited', () => {
    it('should simulate full flow', async () => {
      const user = authService.createUser('Integration', 'integration@test.com');
      const token = authService.generateToken(user.id);
      expect(token).toBeTruthy();

      const decoded = authService.validateToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded!.userId).toBe(user.id);

      mockRedisInstance.evalsha
        .mockResolvedValue([1, 9, 0, 0])
        .mockResolvedValue([1, 8, 0, 0])
        .mockResolvedValue([0, 0, 5000, 3600]);

      const bucket = new LeakyBucket(mockRedisInstance, {
        capacity: 2,
        refillRate: 1,
        refillInterval: 3600000,
      });

      const result1 = await bucket.consume(`pix-query:${user.id}`, 1);
      expect(result1.allowed).toBe(true);

      const result2 = await bucket.consume(`pix-query:${user.id}`, 1);
      expect(result2.allowed).toBe(true);

      const result3 = await bucket.consume(`pix-query:${user.id}`, 1);
      expect(result3.allowed).toBe(false);
      expect(result3.retryAfter).toBeGreaterThan(0);
    });
  });

  describe('GraphQL Mutation', () => {
    it('should resolve queryPixKey mutation', async () => {
      mockRedisInstance.evalsha.mockResolvedValue([1, 9, 0, 0]);

      const bucket = new LeakyBucket(mockRedisInstance, {
        capacity: 10,
        refillRate: 1,
        refillInterval: 3600000,
      });

      const { createResolvers } = await import('../graphql/resolvers');
      const resolvers = createResolvers(bucket);

      const result = await resolvers.queryPixKey(
        { key: 'matthewsiqueira@gmail.com' },
        {}
      );

      expect(result.success).toBe(true);
      expect(result.ownerName).toBe('Matthew Siqueira');
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid Pix key format', async () => {
      const bucket = new LeakyBucket(mockRedisInstance, {
        capacity: 10,
        refillRate: 1,
        refillInterval: 3600000,
      });

      const { createResolvers } = await import('../graphql/resolvers');
      const resolvers = createResolvers(bucket);

      const result = await resolvers.queryPixKey({ key: 'not-a-key' }, {});

      expect(result.success).toBe(false);
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Invalid Pix key format');
    });

    it('should resolve bucketStatus query', async () => {
      mockRedisInstance.evalsha.mockResolvedValue([8, 1, 10, 3000]);

      const bucket = new LeakyBucket(mockRedisInstance, {
        capacity: 10,
        refillRate: 1,
        refillInterval: 3600000,
      });

      const { createResolvers } = await import('../graphql/resolvers');
      const resolvers = createResolvers(bucket);

      const result = await resolvers.bucketStatus(
        { key: 'test-bucket' },
        {}
      );

      expect(result.remaining).toBe(8);
      expect(result.capacity).toBe(10);
      expect(result.resetTime).toBe(3000);
    });
  });
});
