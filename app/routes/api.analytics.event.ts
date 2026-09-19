import { isbot } from 'isbot'
import type { ActionFunctionArgs } from 'react-router'
import {
  createAnalyticsSessionHash,
  forwardAnalyticsEvent,
  getTrustedClientIp,
  hasValidAnalyticsContext,
  parseAnalyticsEvent,
} from '~/lib/analytics.server'
import { consumeRateLimitWithSettings } from '~/lib/rateLimit'

const ANALYTICS_RATE_LIMIT = { maxRequests: 180, windowMs: 60_000 }
const MAX_ANALYTICS_BODY_BYTES = 8_192

export async function action({ request }: ActionFunctionArgs): Promise<Response> {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed.' }, { status: 405 })
  }

  const requestOrigin = new URL(request.url).origin
  const origin = request.headers.get('origin')
  const fetchSite = request.headers.get('sec-fetch-site')
  if ((origin && origin !== requestOrigin) || (fetchSite && fetchSite !== 'same-origin')) {
    return new Response(null, { status: 403 })
  }

  const userAgent = request.headers.get('user-agent') ?? ''
  if (userAgent && isbot(userAgent)) {
    return new Response(null, { status: 204 })
  }

  const clientIp = getTrustedClientIp(request)
  const rateLimit = consumeRateLimitWithSettings(
    `analytics:${clientIp ?? 'unknown'}`,
    ANALYTICS_RATE_LIMIT,
  )
  if (!rateLimit.allowed) {
    return new Response(null, {
      status: 429,
      headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
    })
  }

  const contentLength = Number.parseInt(request.headers.get('content-length') ?? '0', 10)
  if (contentLength > MAX_ANALYTICS_BODY_BYTES) {
    return new Response(null, { status: 413 })
  }

  let bodyText: string
  try {
    bodyText = await request.text()
  } catch {
    return Response.json({ error: 'Invalid analytics payload.' }, { status: 400 })
  }
  if (new TextEncoder().encode(bodyText).byteLength > MAX_ANALYTICS_BODY_BYTES) {
    return new Response(null, { status: 413 })
  }

  let body: unknown
  try {
    body = JSON.parse(bodyText)
  } catch {
    return Response.json({ error: 'Invalid analytics payload.' }, { status: 400 })
  }

  const event = parseAnalyticsEvent(body)
  if (!event) {
    return Response.json({ error: 'Invalid analytics payload.' }, { status: 400 })
  }
  if (!hasValidAnalyticsContext(event)) {
    return new Response(null, { status: 403 })
  }

  const occurredAt = new Date()
  const { contextToken: _contextToken, sessionId, ...storedEvent } = event
  try {
    await forwardAnalyticsEvent({
      ...storedEvent,
      occurredAt: occurredAt.toISOString(),
      sessionHash: createAnalyticsSessionHash(sessionId, occurredAt),
    })
  } catch (error) {
    console.error('[analytics] WordPress ingest failed', error)
    return new Response(null, { status: 503 })
  }

  return new Response(null, { status: 204 })
}