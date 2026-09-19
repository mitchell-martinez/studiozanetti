import { useEffect, useEffectEvent, useRef } from 'react'
import { useLocation } from 'react-router'
import {
  classifyVisitSource,
  getRegionBucket,
  type AnalyticsClientEvent,
  type AnalyticsEventDetails,
  type AnalyticsEventType,
  type AnalyticsReferrer,
  type AnalyticsVisitContext,
} from '~/lib/analytics'
import type { AnalyticsProviderProps } from './types'
import { AnalyticsContext } from './context'

const SESSION_STORAGE_KEY = 'sz_analytics_session'
const SESSION_SEQUENCE_KEY = 'sz_analytics_sequence'
const VISIT_STORAGE_KEY = 'sz_analytics_visit'
const SESSION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MAX_VISIT_DURATION_SECONDS = 7 * 24 * 60 * 60
const VISIT_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000

interface StoredVisitContext {
  source: AnalyticsReferrer
  landingPage: string
  regionBucket: AnalyticsVisitContext['regionBucket']
  startedAtMs: number
  currentPage: string
  pageStartedAtMs: number
  lastActiveAtMs: number
  pagesViewed: number
}

const normalizePagePath = (pathname: string): string => {
  const normalized = pathname.replace(/^\/+|\/+$/g, '')
  return normalized ? `/${normalized}` : '/'
}

const readStoredVisitContext = (): StoredVisitContext | null => {
  try {
    const value = JSON.parse(window.sessionStorage.getItem(VISIT_STORAGE_KEY) ?? 'null') as unknown
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    const candidate = value as Partial<StoredVisitContext>
    if (
      !candidate.source ||
      typeof candidate.source.category !== 'string' ||
      typeof candidate.landingPage !== 'string' ||
      typeof candidate.regionBucket !== 'string' ||
      typeof candidate.startedAtMs !== 'number' ||
      typeof candidate.currentPage !== 'string' ||
      typeof candidate.pageStartedAtMs !== 'number' ||
      typeof candidate.lastActiveAtMs !== 'number' ||
      !Number.isSafeInteger(candidate.pagesViewed) ||
      (candidate.pagesViewed ?? 0) < 1
    ) return null

    return candidate as StoredVisitContext
  } catch {
    return null
  }
}

const storeVisitContext = (context: StoredVisitContext) => {
  try {
    window.sessionStorage.setItem(VISIT_STORAGE_KEY, JSON.stringify(context))
  } catch {
    // The in-memory copy remains available when browser storage is blocked.
  }
}

const getBrowserRegion = () => {
  try {
    return getRegionBucket(Intl.DateTimeFormat().resolvedOptions().timeZone)
  } catch {
    return getRegionBucket(undefined)
  }
}

const getSessionContext = (): { sessionId?: string; sessionSequence?: number } => {
  try {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
    const sessionId = existing && SESSION_ID_PATTERN.test(existing)
      ? existing
      : window.crypto.randomUUID()
    if (!existing || existing !== sessionId) {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId)
    }
    const currentSequence = Number.parseInt(
      window.sessionStorage.getItem(SESSION_SEQUENCE_KEY) ?? '0',
      10,
    )
    const sessionSequence = Number.isSafeInteger(currentSequence) && currentSequence >= 0
      ? currentSequence + 1
      : 1
    window.sessionStorage.setItem(SESSION_SEQUENCE_KEY, String(sessionSequence))
    return { sessionId, sessionSequence }
  } catch {
    return {}
  }
}

const sendEvent = (event: AnalyticsClientEvent) => {
  const body = JSON.stringify(event)
  if (navigator.sendBeacon?.('/api/analytics/event', body)) return

  void fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => undefined)
}

const AnalyticsProvider = ({ children, page }: AnalyticsProviderProps) => {
  const location = useLocation()
  const trackedNavigationKey = useRef<string | null>(null)
  const hasTrackedInitialPage = useRef(false)
  const visitContext = useRef<StoredVisitContext | null>(null)

  const recordVisitPageView = (pagePath: string, source: AnalyticsReferrer) => {
    const now = Date.now()
    const existing = visitContext.current ?? readStoredVisitContext()
    const hasExternalEntry = source.category !== 'direct' && source.category !== 'internal'
    const shouldContinueVisit =
      existing &&
      !hasExternalEntry &&
      now - existing.lastActiveAtMs <= VISIT_INACTIVITY_TIMEOUT_MS
    const nextVisit: StoredVisitContext = shouldContinueVisit
      ? {
          ...existing,
          currentPage: pagePath,
          pageStartedAtMs: now,
          lastActiveAtMs: now,
          pagesViewed: Math.min(existing.pagesViewed + 1, 1000),
        }
      : {
          source,
          landingPage: pagePath,
          regionBucket: getBrowserRegion(),
          startedAtMs: now,
          currentPage: pagePath,
          pageStartedAtMs: now,
          lastActiveAtMs: now,
          pagesViewed: 1,
        }
    visitContext.current = nextVisit
    storeVisitContext(nextVisit)
  }

  const getVisitContext = (): AnalyticsVisitContext | undefined => {
    const storedVisit = visitContext.current ?? readStoredVisitContext()
    if (!storedVisit || storedVisit.currentPage !== page?.pagePath) return undefined
    const now = Date.now()
    if (now - storedVisit.lastActiveAtMs > VISIT_INACTIVITY_TIMEOUT_MS) {
      visitContext.current = null
      try {
        window.sessionStorage.removeItem(VISIT_STORAGE_KEY)
      } catch {
        // No persisted context needs clearing when browser storage is blocked.
      }
      return undefined
    }
    visitContext.current = storedVisit
    const toDurationSeconds = (startedAtMs: number) =>
      Math.min(MAX_VISIT_DURATION_SECONDS, Math.max(0, Math.floor((now - startedAtMs) / 1000)))

    return {
      sourceCategory: storedVisit.source.category,
      ...(storedVisit.source.domain ? { sourceDomain: storedVisit.source.domain } : {}),
      landingPage: storedVisit.landingPage,
      regionBucket: storedVisit.regionBucket,
      pagesViewed: storedVisit.pagesViewed,
      siteDurationSeconds: toDurationSeconds(storedVisit.startedAtMs),
      pageDurationSeconds: toDurationSeconds(storedVisit.pageStartedAtMs),
    }
  }

  const buildEvent = (
    eventType: AnalyticsEventType,
    details: AnalyticsEventDetails = {},
  ): AnalyticsClientEvent | null => {
    if (!page?.contextToken) return null
    const session = getSessionContext()

    return {
      eventType,
      pagePath: page.pagePath,
      ...session,
      contextToken: page.contextToken,
      pageId: page.pageId,
      siteGroup: page.siteGroup,
      regionBucket: getBrowserRegion(),
      hasPricingBlock: page.hasPricingBlock,
      hasFormBlock: page.hasFormBlock,
      ...details,
    }
  }

  const trackEvent = (
    eventType: AnalyticsEventType,
    details: AnalyticsEventDetails = {},
  ) => {
    const event = buildEvent(eventType, details)
    if (event) sendEvent(event)
  }

  const trackPageView = useEffectEvent(() => {
    if (!page) return
    const referrer = hasTrackedInitialPage.current
      ? { category: 'internal' as const }
      : classifyVisitSource(document.referrer, window.location.origin, window.location.href)
    hasTrackedInitialPage.current = true
    recordVisitPageView(page.pagePath, referrer)
    const event = buildEvent('page_view')
    if (!event) return

    sendEvent({
      ...event,
      referrerCategory: referrer.category,
      referrerDomain: referrer.domain,
    })
  })

  const trackScrollDepth = useEffectEvent((threshold: 25 | 50 | 75 | 100) => {
    trackEvent('scroll_depth', { scrollDepth: threshold })
  })

  useEffect(() => {
    if (
      !page ||
      page.pagePath !== normalizePagePath(location.pathname) ||
      trackedNavigationKey.current === location.key
    ) return
    trackedNavigationKey.current = location.key
    trackPageView()
  }, [location.key, location.pathname, page])

  useEffect(() => {
    if (!page?.hasPricingBlock) return

    const sentThresholds = new Set<number>()
    let animationFrame = 0
    const measure = () => {
      animationFrame = 0
      const documentHeight = document.documentElement.scrollHeight
      const viewportBottom = window.scrollY + window.innerHeight
      const percentage = documentHeight > 0 ? (viewportBottom / documentHeight) * 100 : 0

      for (const threshold of [25, 50, 75, 100] as const) {
        if (percentage >= threshold && !sentThresholds.has(threshold)) {
          sentThresholds.add(threshold)
          trackScrollDepth(threshold)
        }
      }
    }
    const scheduleMeasurement = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(measure)
    }

    scheduleMeasurement()
    window.addEventListener('scroll', scheduleMeasurement, { passive: true })
    window.addEventListener('resize', scheduleMeasurement)
    return () => {
      window.removeEventListener('scroll', scheduleMeasurement)
      window.removeEventListener('resize', scheduleMeasurement)
      if (animationFrame) window.cancelAnimationFrame(animationFrame)
    }
  }, [location.key, page?.hasPricingBlock])

  return (
    <AnalyticsContext.Provider value={{ getVisitContext, trackEvent }}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export default AnalyticsProvider