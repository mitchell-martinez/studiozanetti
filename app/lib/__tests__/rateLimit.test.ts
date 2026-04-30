import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearRateLimitStore, consumeRateLimit } from '../rateLimit'

afterEach(() => {
  clearRateLimitStore()
  vi.unstubAllEnvs()
})

describe('consumeRateLimit', () => {
  it('allows requests until the configured max is reached', () => {
    vi.stubEnv('FORM_RATE_LIMIT_MAX_REQUESTS', '2')
    vi.stubEnv('FORM_RATE_LIMIT_WINDOW_MS', '1000')

    const first = consumeRateLimit('contact:127.0.0.1', 1_000)
    const second = consumeRateLimit('contact:127.0.0.1', 1_100)
    const third = consumeRateLimit('contact:127.0.0.1', 1_200)

    expect(first.allowed).toBe(true)
    expect(second.allowed).toBe(true)
    expect(third.allowed).toBe(false)
    expect(third.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('resets the counter when the window expires', () => {
    vi.stubEnv('FORM_RATE_LIMIT_MAX_REQUESTS', '1')
    vi.stubEnv('FORM_RATE_LIMIT_WINDOW_MS', '1000')

    consumeRateLimit('contact:127.0.0.1', 1_000)
    const result = consumeRateLimit('contact:127.0.0.1', 2_001)

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(0)
  })
})