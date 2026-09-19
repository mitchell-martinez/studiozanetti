import { createHmac, timingSafeEqual } from 'node:crypto'
import { isIP } from 'node:net'
import type {
  AnalyticsClientEvent,
  AnalyticsEventType,
  AnalyticsReferrerCategory,
  AnalyticsRegionBucket,
  AnalyticsStoredEvent,
} from './analytics'

const EVENT_TYPES = new Set<AnalyticsEventType>([
  'page_view',
  'form_start',
  'form_submit',
  'scroll_depth',
])
const REFERRER_CATEGORIES = new Set<AnalyticsReferrerCategory>([
  'direct',
  'internal',
  'search',
  'ai_assistant',
  'social',
  'referral',
  'unknown',
])
const REGION_BUCKETS = new Set<AnalyticsRegionBucket>([
  'AU-NSW',
  'AU-VIC',
  'AU-QLD',
  'AU-WA',
  'AU-SA',
  'AU-TAS',
  'AU-NT',
  'international',
  'unknown',
])
const SCROLL_DEPTHS = new Set([25, 50, 75, 100])

const optionalString = (
  value: unknown,
  maxLength: number,
  pattern?: RegExp,
): string | undefined => {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string') return undefined

  const normalized = value.trim().slice(0, maxLength)
  if (!normalized || (pattern && !pattern.test(normalized))) return undefined
  return normalized
}

const optionalBoolean = (value: unknown): boolean | undefined =>
  typeof value === 'boolean' ? value : undefined

export const parseAnalyticsEvent = (value: unknown): AnalyticsClientEvent | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const candidate = value as Record<string, unknown>

  if (typeof candidate.eventType !== 'string' || !EVENT_TYPES.has(candidate.eventType as AnalyticsEventType)) {
    return null
  }
  if (
    typeof candidate.pagePath !== 'string' ||
    !candidate.pagePath.startsWith('/') ||
    candidate.pagePath.length > 512 ||
    candidate.pagePath.includes('?') ||
    candidate.pagePath.includes('#')
  ) {
    return null
  }
  if (
    typeof candidate.regionBucket !== 'string' ||
    !REGION_BUCKETS.has(candidate.regionBucket as AnalyticsRegionBucket)
  ) {
    return null
  }

  const eventType = candidate.eventType as AnalyticsEventType
  const scrollDepth =
    typeof candidate.scrollDepth === 'number' && SCROLL_DEPTHS.has(candidate.scrollDepth)
      ? (candidate.scrollDepth as 25 | 50 | 75 | 100)
      : undefined
  if (eventType === 'scroll_depth' && scrollDepth === undefined) return null

  const referrerCategory =
    typeof candidate.referrerCategory === 'string' &&
    REFERRER_CATEGORIES.has(candidate.referrerCategory as AnalyticsReferrerCategory)
      ? (candidate.referrerCategory as AnalyticsReferrerCategory)
      : undefined
  const pageId =
    typeof candidate.pageId === 'number' &&
    Number.isSafeInteger(candidate.pageId) &&
    candidate.pageId > 0
      ? candidate.pageId
      : undefined
  const sessionId = optionalString(
    candidate.sessionId,
    36,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  )
  const sessionSequence =
    typeof candidate.sessionSequence === 'number' &&
    Number.isSafeInteger(candidate.sessionSequence) &&
    candidate.sessionSequence > 0
      ? candidate.sessionSequence
      : undefined
  const contextToken = optionalString(candidate.contextToken, 64, /^[a-f0-9]{64}$/)

  return {
    eventType,
    pagePath: candidate.pagePath,
    regionBucket: candidate.regionBucket as AnalyticsRegionBucket,
    ...(sessionId ? { sessionId } : {}),
    ...(sessionSequence ? { sessionSequence } : {}),
    ...(contextToken ? { contextToken } : {}),
    ...(pageId ? { pageId } : {}),
    ...(optionalString(candidate.siteGroup, 64, /^[a-z0-9_-]+$/i)
      ? { siteGroup: optionalString(candidate.siteGroup, 64, /^[a-z0-9_-]+$/i) }
      : {}),
    ...(referrerCategory ? { referrerCategory } : {}),
    ...(optionalString(candidate.referrerDomain, 190, /^[a-z0-9.-]+$/i)
      ? { referrerDomain: optionalString(candidate.referrerDomain, 190, /^[a-z0-9.-]+$/i) }
      : {}),
    ...(scrollDepth ? { scrollDepth } : {}),
    ...(optionalString(candidate.formId, 100, /^[a-z0-9_-]+$/i)
      ? { formId: optionalString(candidate.formId, 100, /^[a-z0-9_-]+$/i) }
      : {}),
    ...(optionalBoolean(candidate.hasPricingBlock) !== undefined
      ? { hasPricingBlock: optionalBoolean(candidate.hasPricingBlock) }
      : {}),
    ...(optionalBoolean(candidate.hasFormBlock) !== undefined
      ? { hasFormBlock: optionalBoolean(candidate.hasFormBlock) }
      : {}),
  }
}

const analyticsContextValue = (event: Pick<AnalyticsClientEvent, 'pagePath' | 'pageId' | 'siteGroup' | 'hasPricingBlock' | 'hasFormBlock'>) =>
  [
    event.pagePath,
    event.pageId ?? 0,
    event.siteGroup ?? '',
    event.hasPricingBlock ? 1 : 0,
    event.hasFormBlock ? 1 : 0,
  ].join('\n')

export const createAnalyticsContextToken = (
  event: Pick<AnalyticsClientEvent, 'pagePath' | 'pageId' | 'siteGroup' | 'hasPricingBlock' | 'hasFormBlock'>,
  secret = process.env.SZ_ANALYTICS_INGEST_SECRET,
): string | undefined => {
  if (!secret) return undefined
  return createHmac('sha256', secret).update(analyticsContextValue(event)).digest('hex')
}

export const hasValidAnalyticsContext = (
  event: AnalyticsClientEvent,
  secret = process.env.SZ_ANALYTICS_INGEST_SECRET,
): boolean => {
  const expected = createAnalyticsContextToken(event, secret)
  if (!expected || !event.contextToken) return false
  const providedBuffer = Buffer.from(event.contextToken)
  const expectedBuffer = Buffer.from(expected)
  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  )
}

export const getTrustedClientIp = (request: Request): string | null => {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const candidate = forwardedFor?.split(',').at(-1)?.trim()
  return candidate && isIP(candidate) ? candidate : null
}

export const createAnalyticsSessionHash = (
  sessionId: string | undefined,
  occurredAt: Date,
  secret = process.env.SZ_ANALYTICS_INGEST_SECRET,
): string | undefined => {
  if (!secret || !sessionId) return undefined

  const dateSalt = occurredAt.toISOString().slice(0, 10)
  return createHmac('sha256', secret)
    .update(`${dateSalt}\n${sessionId}`)
    .digest('hex')
}

const getAnalyticsEndpoint = (): string => {
  const wordpressUrl = process.env.WORDPRESS_URL?.replace(/\/$/, '')
  if (!wordpressUrl) throw new Error('WORDPRESS_URL is not configured')
  return `${wordpressUrl}/wp-json/sz/v1/analytics/events`
}

export const forwardAnalyticsEvent = async (event: AnalyticsStoredEvent): Promise<void> => {
  const secret = process.env.SZ_ANALYTICS_INGEST_SECRET
  if (!secret) throw new Error('SZ_ANALYTICS_INGEST_SECRET is not configured')

  const response = await fetch(getAnalyticsEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-SZ-Analytics-Key': secret,
    },
    body: JSON.stringify({ events: [{ ...event, sessionId: undefined }] }),
    signal: AbortSignal.timeout(5_000),
  })

  if (!response.ok) {
    throw new Error(`WordPress analytics ingest returned ${response.status}`)
  }
}
