import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function rateLimit(
  identifier: string,
  limit: number = 10,
  windowSeconds: number = 60
) {
  const key = `rate_limit:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  // Remove old entries
  await redis.zremrangebyscore(key, 0, windowStart);

  // Count current entries
  const current = await redis.zcard(key);

  if (current >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: windowStart + windowSeconds * 1000,
    };
  }

  // Add current request
  await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` });
  await redis.expire(key, windowSeconds);

  return {
    success: true,
    limit,
    remaining: limit - current - 1,
    reset: windowStart + windowSeconds * 1000,
  };
}
