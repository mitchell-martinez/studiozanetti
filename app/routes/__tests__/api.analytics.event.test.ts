import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const isBotMock = vi.fn<(userAgent: string) => boolean>()

vi.mock('isbot', () => ({
  isbot: (userAgent: string) => isBotMock(userAgent),
}))

vi.mock('~/lib/analytics.server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/lib/analytics.server')>()
  return {
    ...actual,
    forwardAnalyticsEvent: vi.fn(),
  }
})

import { createAnalyticsContextToken, forwardAnalyticsEvent } from '~/lib/analytics.server'
import { clearRateLimitStore } from '~/lib/rateLimit'
import { action } from '../api.analytics.event'

const validEventBase = {
  eventType: 'page_view',
  pagePath: '/weddings',
  sessionId: 'd9428888-122b-4a2f-a548-3c8fd60c3f58',
  sessionSequence: 1,
  pageId: 42,
  siteGroup: 'weddings',
  referrerCategory: 'search',
  referrerDomain: 'google.com',
  regionBucket: 'AU-NSW',
  hasPricingBlock: true,
  hasFormBlock: false,
}
const validEvent = {
  ...validEventBase,
  contextToken: createAnalyticsContextToken(validEventBase, 'test-secret'),
}

const makeRequest = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('https://studiozanetti.com.au/api/analytics/event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 Test Browser',
      'X-Forwarded-For': '203.0.113.9',
      ...headers,
    },
    body: JSON.stringify(body),
  })

beforeEach(() => {
  vi.stubEnv('SZ_ANALYTICS_INGEST_SECRET', 'test-secret')
  isBotMock.mockReturnValue(false)
})

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
  clearRateLimitStore()
})

describe('api.analytics.event action', () => {
  it('forwards a validated event without storing the client IP', async () => {
    const response = await action({
      request: makeRequest(validEvent),
      params: {},
      context: {},
    } as never)

    expect(response.status).toBe(204)
    expect(forwardAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: validEvent.eventType,
        pagePath: validEvent.pagePath,
        pageId: validEvent.pageId,
        siteGroup: validEvent.siteGroup,
        occurredAt: expect.any(String),
        sessionHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    )
    const forwardedEvent = vi.mocked(forwardAnalyticsEvent).mock.calls[0]?.[0]
    expect(forwardedEvent).not.toHaveProperty('clientIp')
    expect(forwardedEvent?.sessionId).toBeUndefined()
    expect(forwardedEvent?.contextToken).toBeUndefined()
  })

  it('rejects malformed and unknown event data', async () => {
    const response = await action({
      request: makeRequest({ ...validEvent, eventType: 'invented_event' }),
      params: {},
      context: {},
    } as never)

    expect(response.status).toBe(400)
    expect(forwardAnalyticsEvent).not.toHaveBeenCalled()
  })

  it('rejects tampered CMS page metadata', async () => {
    const response = await action({
      request: makeRequest({ ...validEvent, siteGroup: 'corporate' }),
      params: {},
      context: {},
    } as never)

    expect(response.status).toBe(403)
    expect(forwardAnalyticsEvent).not.toHaveBeenCalled()
  })

  it('rejects cross-site browser requests', async () => {
    const response = await action({
      request: makeRequest(validEvent, {
        Origin: 'https://attacker.example',
        'Sec-Fetch-Site': 'cross-site',
      }),
      params: {},
      context: {},
    } as never)

    expect(response.status).toBe(403)
    expect(forwardAnalyticsEvent).not.toHaveBeenCalled()
  })

  it('accepts the public origin supplied by a trusted reverse proxy', async () => {
    const request = new Request('http://studiozanetti:3000/api/analytics/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 Test Browser',
        'X-Forwarded-For': '203.0.113.9',
        'X-Forwarded-Host': 'studiozanetti.com.au',
        'X-Forwarded-Proto': 'https',
        Origin: 'https://studiozanetti.com.au',
        'Sec-Fetch-Site': 'same-origin',
      },
      body: JSON.stringify(validEvent),
    })

    const response = await action({ request, params: {}, context: {} } as never)

    expect(response.status).toBe(204)
    expect(forwardAnalyticsEvent).toHaveBeenCalledOnce()
  })

  it('drops identified bots without forwarding data', async () => {
    isBotMock.mockReturnValueOnce(true)

    const response = await action({
      request: makeRequest(validEvent),
      params: {},
      context: {},
    } as never)

    expect(response.status).toBe(204)
    expect(forwardAnalyticsEvent).not.toHaveBeenCalled()
  })

  it('uses the proxy-appended address rather than a spoofed first address', async () => {
    const response = await action({
      request: makeRequest(validEvent, {
        'X-Forwarded-For': '198.51.100.99, 203.0.113.9',
      }),
      params: {},
      context: {},
    } as never)

    expect(response.status).toBe(204)
    expect(forwardAnalyticsEvent).toHaveBeenCalledOnce()
  })

  it('returns an explicit error when WordPress does not persist the event', async () => {
    vi.mocked(forwardAnalyticsEvent).mockRejectedValueOnce(new Error('Unavailable'))

    const response = await action({
      request: makeRequest(validEvent),
      params: {},
      context: {},
    } as never)

    expect(response.status).toBe(503)
  })

  it('rejects oversized bodies before forwarding', async () => {
    const response = await action({
      request: makeRequest({ ...validEvent, padding: 'x'.repeat(9_000) }),
      params: {},
      context: {},
    } as never)

    expect(response.status).toBe(413)
    expect(forwardAnalyticsEvent).not.toHaveBeenCalled()
  })

  it('does not grant new rate-limit capacity when the user agent changes', async () => {
    let response = new Response(null, { status: 204 })
    for (let requestNumber = 0; requestNumber < 181; requestNumber += 1) {
      response = await action({
        request: makeRequest(validEvent, { 'User-Agent': `Browser ${requestNumber}` }),
        params: {},
        context: {},
      } as never)
    }

    expect(response.status).toBe(429)
    expect(forwardAnalyticsEvent).toHaveBeenCalledTimes(180)
  })
})