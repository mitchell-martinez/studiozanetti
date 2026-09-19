import { describe, expect, it } from 'vitest'
import {
  createAnalyticsContextToken,
  createAnalyticsSessionHash,
  getTrustedClientIp,
  hasValidAnalyticsContext,
  parseAnalyticsEvent,
} from '../analytics.server'

const makeRequest = (forwardedFor: string) =>
  new Request('https://studiozanetti.com.au/api/analytics/event', {
    headers: {
      'User-Agent': 'Test Browser',
      'X-Forwarded-For': forwardedFor,
    },
  })

const sessionId = 'd9428888-122b-4a2f-a548-3c8fd60c3f58'

describe('analytics server privacy boundaries', () => {
  it('uses the proxy-appended address rather than a spoofable first address', () => {
    expect(getTrustedClientIp(makeRequest('198.51.100.99, 203.0.113.9'))).toBe('203.0.113.9')
  })

  it('rejects non-IP forwarded values', () => {
    expect(getTrustedClientIp(makeRequest('not-an-ip'))).toBeNull()
  })

  it('creates stable same-day tab hashes that rotate across UTC days', () => {
    const first = createAnalyticsSessionHash(
      sessionId,
      new Date('2026-09-19T01:00:00.000Z'),
      'test-secret',
    )
    const sameDay = createAnalyticsSessionHash(
      sessionId,
      new Date('2026-09-19T23:59:59.000Z'),
      'test-secret',
    )
    const nextDay = createAnalyticsSessionHash(
      sessionId,
      new Date('2026-09-20T00:00:00.000Z'),
      'test-secret',
    )

    expect(first).toBe(sameDay)
    expect(nextDay).not.toBe(first)
  })

  it('does not create a fingerprint when the browser session ID is unavailable', () => {
    expect(
      createAnalyticsSessionHash(undefined, new Date('2026-09-19T01:00:00.000Z'), 'test-secret'),
    ).toBeUndefined()
  })

  it('rejects page paths containing query strings or fragments', () => {
    const baseEvent = {
      eventType: 'page_view',
      regionBucket: 'unknown',
    }

    expect(parseAnalyticsEvent({ ...baseEvent, pagePath: '/contact?email=private' })).toBeNull()
    expect(parseAnalyticsEvent({ ...baseEvent, pagePath: '/contact#form' })).toBeNull()
  })

  it('rejects page metadata changed after its context was signed', () => {
    const event = {
      eventType: 'page_view' as const,
      pagePath: '/weddings',
      pageId: 42,
      siteGroup: 'weddings',
      regionBucket: 'AU-NSW' as const,
      hasPricingBlock: true,
      hasFormBlock: false,
    }
    const contextToken = createAnalyticsContextToken(event, 'test-secret')

    expect(hasValidAnalyticsContext({ ...event, contextToken }, 'test-secret')).toBe(true)
    expect(
      hasValidAnalyticsContext(
        { ...event, siteGroup: 'corporate', contextToken },
        'test-secret',
      ),
    ).toBe(false)
  })
})