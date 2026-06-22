import { FastifyRequest, FastifyReply } from 'fastify';
import { LeakyBucket } from '../leaky-bucket/strategy';

export interface RateLimiterOptions {
  capacity?: number;
  refillRate?: number;
  refillInterval?: number;
  keyPrefix?: string;
  tokensPerRequest?: number;
  onLimited?: (request: FastifyRequest, reply: FastifyReply, state: {
    retryAfter: number;
    remaining: number;
    resetTime: number;
  }) => void;
}

export function createRateLimiter(
  bucket: LeakyBucket,
  options: RateLimiterOptions = {}
) {
  const {
    capacity = 10,
    refillRate = 1,
    refillInterval = 3600000,
    keyPrefix = 'rate-limit',
    tokensPerRequest = 1,
  } = options;

  return async function rateLimiter(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const userId = request.user?.userId || request.ip;

    const bucketKey = `${keyPrefix}:${userId}:${request.routeOptions.url || request.url}`;

    const result = await bucket.consume(bucketKey, tokensPerRequest);

    reply.header('X-RateLimit-Limit', capacity.toString());
    reply.header('X-RateLimit-Remaining', result.remaining.toString());
    reply.header('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());

    if (!result.allowed) {
      reply.header('Retry-After', result.retryAfter.toString());

      if (options.onLimited) {
        options.onLimited(request, reply, {
          retryAfter: result.retryAfter,
          remaining: result.remaining,
          resetTime: result.resetTime,
        });
      }

      reply.status(429).send({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Retry after ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter,
        resetTime: result.resetTime,
      });
    }
  };
}

// TODO: add configurable rate limit per route, not just per user
