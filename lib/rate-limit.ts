import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  limit: number;
  serviceUnavailable?: boolean;
};

type Limiter = InstanceType<typeof Ratelimit>;

const localStore = new Map<
  string,
  { count: number; resetAt: number }
>();

const limiterCache = new Map<string, Limiter>();

function getLimiter(limit: number, windowMs: number): Limiter | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  const cacheKey = `${limit}:${windowSeconds}`;

  const existing = limiterCache.get(cacheKey);

  if (existing) {
    return existing;
  }

  const limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    prefix: "nexus:ratelimit",
    timeout: 1000,
  });

  limiterCache.set(cacheKey, limiter);

  return limiter;
}

function localRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const existing = localStore.get(key);

  if (!existing || existing.resetAt <= now) {
    localStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      retryAfterSeconds: Math.ceil(windowMs / 1000),
      limit,
    };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((existing.resetAt - now) / 1000)
      ),
      limit,
    };
  }

  existing.count += 1;

  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((existing.resetAt - now) / 1000)
    ),
    limit,
  };
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const limiter = getLimiter(limit, windowMs);

  if (!limiter) {
    if (process.env.NODE_ENV === "production") {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: 30,
        limit,
        serviceUnavailable: true,
      };
    }

    return localRateLimit(key, limit, windowMs);
  }

  try {
    const result = await limiter.limit(key);

    return {
      allowed: result.success,
      remaining: Math.max(0, result.remaining),
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((result.reset - Date.now()) / 1000)
      ),
      limit: result.limit,
    };
  } catch {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 5,
      limit,
      serviceUnavailable: true,
    };
  }
}
