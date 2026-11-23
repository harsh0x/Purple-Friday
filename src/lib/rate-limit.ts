import logger from "./logger";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

// In-Memory sliding-window LRU bucket
interface MemoryBucket {
  timestamps: number[];
}

const memoryStore = new Map<string, MemoryBucket>();
const MAX_MEMORY_KEYS = 5000;

/**
 * Prune stale keys if memory store grows large
 */
function cleanupMemoryStore(now: number, windowMs: number) {
  if (memoryStore.size <= MAX_MEMORY_KEYS) return;

  for (const [key, bucket] of memoryStore.entries()) {
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
    if (bucket.timestamps.length === 0) {
      memoryStore.delete(key);
    }
  }
}

/**
 * In-memory sliding-window rate limiter
 */
function checkMemoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  cleanupMemoryStore(now, windowMs);

  let bucket = memoryStore.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    memoryStore.set(key, bucket);
  }

  // Filter timestamps within current window
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  const resetAt = bucket.timestamps.length > 0 ? bucket.timestamps[0] + windowMs : now + windowMs;

  if (bucket.timestamps.length >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetAt,
    };
  }

  bucket.timestamps.push(now);

  return {
    success: true,
    limit,
    remaining: limit - bucket.timestamps.length,
    resetAt,
  };
}

/**
 * Upstash REST Redis sliding-window implementation
 */
async function checkUpstashRateLimit(
  url: string,
  token: string,
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const clearBefore = now - windowMs;
  const redisKey = `ratelimit:${key}`;

  try {
    // Multi-command pipeline via Upstash REST: ZREMRANGEBYSCORE, ZADD, ZCARD, EXPIRE
    const response = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["ZREMRANGEBYSCORE", redisKey, "0", String(clearBefore)],
        ["ZADD", redisKey, String(now), `${now}-${Math.random()}`],
        ["ZCARD", redisKey],
        ["PEXPIRE", redisKey, String(windowMs)],
      ]),
    });

    if (!response.ok) {
      throw new Error(`Upstash returned status ${response.status}`);
    }

    const data = await response.json();
    const currentCount = Number(data[2]?.result ?? 1);

    return {
      success: currentCount <= limit,
      limit,
      remaining: Math.max(0, limit - currentCount),
      resetAt: now + windowMs,
    };
  } catch (err) {
    logger.warn({ err }, "Upstash rate limiting failed, falling back to in-memory limiter");
    return checkMemoryRateLimit(key, limit, windowMs);
  }
}

let hasLoggedUpstashWarning = false;

/**
 * Universal sliding-window rate limit entry point
 */
export async function checkRateLimit(
  key: string,
  limit: number = 60,
  windowMs: number = 60000
): Promise<RateLimitResult> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken && !upstashUrl.includes("sample-app")) {
    return checkUpstashRateLimit(upstashUrl, upstashToken, key, limit, windowMs);
  }

  if (process.env.NODE_ENV === "production" && !hasLoggedUpstashWarning) {
    hasLoggedUpstashWarning = true;
    console.warn(
      "⚠️ [RateLimit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set in production. Falling back to in-memory rate limiting."
    );
  }

  return checkMemoryRateLimit(key, limit, windowMs);
}

/**
 * Derive a secure client rate limit key from IP address and route name
 */
export function getClientKey(req: Request, routeName: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwarded ? forwarded.split(",")[0].trim() : realIp || "127.0.0.1";

  return `${routeName}:${ip}`;
}

