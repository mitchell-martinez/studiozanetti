interface RateLimitEntry {
  count: number
  resetAt: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
  resetAt: number
  limit: number
}

export interface RateLimitSettings {
  windowMs: number
  maxRequests: number
}

const DEFAULT_WINDOW_MS = 15 * 60 * 1000
const DEFAULT_MAX_REQUESTS = 5
const MAX_RATE_LIMIT_ENTRIES = 10_000
const rateLimitStore = new Map<string, RateLimitEntry>()

export function getRateLimitSettings() {
  const windowMs = Math.max(
    1000,
    Number.parseInt(process.env.FORM_RATE_LIMIT_WINDOW_MS ?? '', 10) || DEFAULT_WINDOW_MS,
  )
  const maxRequests = Math.max(
    1,
    Number.parseInt(process.env.FORM_RATE_LIMIT_MAX_REQUESTS ?? '', 10) || DEFAULT_MAX_REQUESTS,
  )

  return { windowMs, maxRequests }
}

export function consumeRateLimit(key: string, now = Date.now()): RateLimitResult {
  return consumeRateLimitWithSettings(key, getRateLimitSettings(), now)
}

export function consumeRateLimitWithSettings(
  key: string,
  settings: RateLimitSettings,
  now = Date.now(),
): RateLimitResult {
  const { maxRequests, windowMs } = settings

  if (rateLimitStore.size >= MAX_RATE_LIMIT_ENTRIES) {
    for (const [storedKey, storedEntry] of rateLimitStore) {
      if (storedEntry.resetAt <= now) rateLimitStore.delete(storedKey)
    }
    while (rateLimitStore.size >= MAX_RATE_LIMIT_ENTRIES) {
      const oldestKey = rateLimitStore.keys().next().value
      if (oldestKey === undefined) break
      rateLimitStore.delete(oldestKey)
    }
  }

  const existing = rateLimitStore.get(key)
  const hasExpired = !existing || existing.resetAt <= now

  const entry: RateLimitEntry = hasExpired
    ? { count: 1, resetAt: now + windowMs }
    : { count: existing.count + 1, resetAt: existing.resetAt }

  rateLimitStore.set(key, entry)

  const remaining = Math.max(0, maxRequests - entry.count)
  const allowed = entry.count <= maxRequests
  const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000))

  return {
    allowed,
    remaining,
    retryAfterSeconds,
    resetAt: entry.resetAt,
    limit: maxRequests,
  }
}

export function clearRateLimitStore() {
  rateLimitStore.clear()
}