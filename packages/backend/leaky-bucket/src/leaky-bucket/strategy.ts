import IORedis from 'ioredis';
import { config } from '../config';

export interface BucketState {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter: number;
}

export interface LeakyBucketOptions {
  capacity: number;
  refillRate: number;
  refillInterval: number;
}

const REFILL_SCRIPT = `
  local key = KEYS[1]
  local now = tonumber(ARGV[1])
  local capacity = tonumber(ARGV[2])
  local refillRate = tonumber(ARGV[3])
  local refillInterval = tonumber(ARGV[4])
  local tokens = tonumber(ARGV[5])

  local lastRefill = redis.call('HGET', key, 'lastRefill')
  local currentTokens = redis.call('HGET', key, 'tokens')

  if lastRefill == false or currentTokens == false then
    lastRefill = now
    currentTokens = capacity
  else
    lastRefill = tonumber(lastRefill)
    currentTokens = tonumber(currentTokens)
  end

  local elapsed = now - lastRefill
  local refillAmount = math.floor(elapsed / refillInterval) * refillRate

  if refillAmount > 0 then
    currentTokens = math.min(capacity, currentTokens + refillAmount)
    lastRefill = lastRefill + (math.floor(elapsed / refillInterval) * refillInterval)
  end

  local allowed = 0
  if currentTokens >= tokens then
    currentTokens = currentTokens - tokens
    allowed = 1
  end

  redis.call('HMSET', key, 'tokens', currentTokens, 'lastRefill', lastRefill)
  redis.call('EXPIRE', key, math.ceil(capacity / refillRate * refillInterval / 1000) + 3600)

  local resetTime = lastRefill + refillInterval
  local retryAfter = 0
  if allowed == 0 then
    local timeToNextToken = refillInterval - (now - lastRefill)
    if timeToNextToken < 0 then timeToNextToken = 0 end
    local tokensNeeded = tokens - currentTokens
    retryAfter = math.ceil((timeToNextToken + (tokensNeeded - 1) * refillInterval) / 1000)
  end

  return {allowed, currentTokens, resetTime, retryAfter}
`;

const GET_STATE_SCRIPT = `
  local key = KEYS[1]
  local now = tonumber(ARGV[1])
  local capacity = tonumber(ARGV[2])
  local refillRate = tonumber(ARGV[3])
  local refillInterval = tonumber(ARGV[4])

  local lastRefill = redis.call('HGET', key, 'lastRefill')
  local currentTokens = redis.call('HGET', key, 'tokens')

  if lastRefill == false or currentTokens == false then
    return {capacity, 1, capacity, 0}
  end

  lastRefill = tonumber(lastRefill)
  currentTokens = tonumber(currentTokens)

  local elapsed = now - lastRefill
  local refillAmount = math.floor(elapsed / refillInterval) * refillRate
  currentTokens = math.min(capacity, currentTokens + refillAmount)

  local resetTime = lastRefill + refillInterval

  return {currentTokens, 1, capacity, resetTime}
`;

export class LeakyBucket {
  private redis: IORedis;
  private capacity: number;
  private refillRate: number;
  private refillInterval: number;
  private prefix: string;

  private refillSha: string | null = null;
  private getStateSha: string | null = null;

  constructor(
    redis?: IORedis,
    options?: Partial<LeakyBucketOptions>
  ) {
    this.redis = redis || new IORedis(config.redis.url);
    this.capacity = options?.capacity ?? 10;
    this.refillRate = options?.refillRate ?? 1;
    this.refillInterval = options?.refillInterval ?? 3600000;
    this.prefix = config.redis.keyPrefix;
  }

  private key(bucketKey: string): string {
    return `${this.prefix}${bucketKey}`;
  }

  private async loadScripts(): Promise<void> {
    if (!this.refillSha) {
      this.refillSha = await this.redis.script('LOAD', REFILL_SCRIPT);
    }
    if (!this.getStateSha) {
      this.getStateSha = await this.redis.script('LOAD', GET_STATE_SCRIPT);
    }
  }

  async consume(
    key: string,
    tokens: number = 1
  ): Promise<BucketState> {
    await this.loadScripts();
    const now = Date.now();

    const result = (await this.redis.evalsha(
      this.refillSha!,
      1,
      this.key(key),
      now.toString(),
      this.capacity.toString(),
      this.refillRate.toString(),
      this.refillInterval.toString(),
      tokens.toString()
    )) as [number, number, number, number];

    return {
      allowed: result[0] === 1,
      remaining: result[1],
      resetTime: result[2],
      retryAfter: result[3],
    };
  }

  async refill(key: string): Promise<number> {
    const state = await this.getState(key);

    const now = Date.now();
    const elapsed = now - state.resetTime;
    const refillAmount = Math.floor(elapsed / this.refillInterval) * this.refillRate;

    if (refillAmount > 0) {
      const newTokens = Math.min(
        this.capacity,
        state.remaining + refillAmount
      );
      await this.redis.hmset(this.key(key), {
        tokens: newTokens,
        lastRefill: now,
      });
      return newTokens;
    }

    return state.remaining;
  }

  async getState(key: string): Promise<{
    remaining: number;
    capacity: number;
    resetTime: number;
  }> {
    await this.loadScripts();
    const now = Date.now();

    const result = (await this.redis.evalsha(
      this.getStateSha!,
      1,
      this.key(key),
      now.toString(),
      this.capacity.toString(),
      this.refillRate.toString(),
      this.refillInterval.toString()
    )) as [number, number, number, number];

    return {
      remaining: result[0],
      capacity: result[2],
      resetTime: result[3],
    };
  }

  async reset(key: string): Promise<void> {
    await this.redis.del(this.key(key));
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }
}
