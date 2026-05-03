// In-memory token bucket rate limiter.
// For production scale, swap the Map for Upstash Redis:
// https://upstash.com/docs/redis/sdks/ratelimit-ts/overview

type BucketEntry = { count: number; resetAt: number }

const store = new Map<string, BucketEntry>()

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs }
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt }
}

// Prune expired entries every 10 minutes to prevent memory growth
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 10 * 60 * 1000)
