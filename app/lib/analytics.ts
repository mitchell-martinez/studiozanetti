export type AnalyticsReferrerCategory =
  | 'direct'
  | 'internal'
  | 'search'
  | 'ai_assistant'
  | 'social'
  | 'referral'
  | 'unknown'

export type AnalyticsRegionBucket =
  | 'AU-NSW'
  | 'AU-VIC'
  | 'AU-QLD'
  | 'AU-WA'
  | 'AU-SA'
  | 'AU-TAS'
  | 'AU-NT'
  | 'international'
  | 'unknown'

export interface AnalyticsReferrer {
  category: AnalyticsReferrerCategory
  domain?: string
}

export type AnalyticsEventType =
  | 'page_view'
  | 'form_start'
  | 'form_submit'
  | 'scroll_depth'

export interface AnalyticsClientEvent {
  eventType: AnalyticsEventType
  pagePath: string
  sessionId?: string
  sessionSequence?: number
  contextToken?: string
  pageId?: number
  siteGroup?: string
  referrerCategory?: AnalyticsReferrerCategory
  referrerDomain?: string
  regionBucket: AnalyticsRegionBucket
  scrollDepth?: 25 | 50 | 75 | 100
  formId?: string
  hasPricingBlock?: boolean
  hasFormBlock?: boolean
}

export interface AnalyticsStoredEvent extends AnalyticsClientEvent {
  occurredAt: string
  sessionHash?: string
}

export interface AnalyticsPageContext {
  pagePath: string
  pageId: number
  siteGroup: string
  hasPricingBlock: boolean
  hasFormBlock: boolean
  contextToken?: string
}

export interface AnalyticsVisitContext {
  sourceCategory: AnalyticsReferrerCategory
  sourceDomain?: string
  landingPage: string
  regionBucket: AnalyticsRegionBucket
  pagesViewed: number
  siteDurationSeconds: number
  pageDurationSeconds: number
}

export type AnalyticsEventDetails = Pick<AnalyticsClientEvent, 'formId' | 'scrollDepth'>

const AI_ASSISTANT_DOMAINS = [
  'chatgpt.com',
  'chat.openai.com',
  'claude.ai',
  'copilot.microsoft.com',
  'gemini.google.com',
  'perplexity.ai',
] as const

const SEARCH_DOMAINS = [
  'bing.com',
  'duckduckgo.com',
  'google.com',
  'google.com.au',
  'search.brave.com',
  'search.yahoo.com',
] as const

const SOCIAL_DOMAINS = [
  'facebook.com',
  'instagram.com',
  'linkedin.com',
  'pinterest.com',
  'tiktok.com',
  'x.com',
] as const

const AUSTRALIAN_TIMEZONES: Readonly<Record<string, AnalyticsRegionBucket>> = {
  'Australia/ACT': 'AU-NSW',
  'Australia/Adelaide': 'AU-SA',
  'Australia/Brisbane': 'AU-QLD',
  'Australia/Broken_Hill': 'AU-NSW',
  'Australia/Canberra': 'AU-NSW',
  'Australia/Currie': 'AU-TAS',
  'Australia/Darwin': 'AU-NT',
  'Australia/Eucla': 'AU-WA',
  'Australia/Hobart': 'AU-TAS',
  'Australia/Lindeman': 'AU-QLD',
  'Australia/Lord_Howe': 'AU-NSW',
  'Australia/Melbourne': 'AU-VIC',
  'Australia/NSW': 'AU-NSW',
  'Australia/North': 'AU-NT',
  'Australia/Perth': 'AU-WA',
  'Australia/Queensland': 'AU-QLD',
  'Australia/South': 'AU-SA',
  'Australia/Sydney': 'AU-NSW',
  'Australia/Tasmania': 'AU-TAS',
  'Australia/Victoria': 'AU-VIC',
  'Australia/West': 'AU-WA',
  'Australia/Yancowinna': 'AU-NSW',
}

const UNKNOWN_TIMEZONES = new Set([
  'Etc/GMT',
  'Etc/UCT',
  'Etc/UTC',
  'Etc/Universal',
  'Etc/Zulu',
  'GMT',
  'UCT',
  'UTC',
  'Universal',
  'Zulu',
])

const matchesDomain = (hostname: string, domain: string): boolean =>
  hostname === domain || hostname.endsWith(`.${domain}`)

const matchesAnyDomain = (hostname: string, domains: readonly string[]): boolean =>
  domains.some((domain) => matchesDomain(hostname, domain))

export const isIpAddressHostname = (hostname: string): boolean => {
  const normalized = hostname.trim().replace(/^\[|\]$/g, '').replace(/\.$/, '')
  try {
    const canonical = new URL(`http://${normalized}`).hostname.replace(/^\[|\]$/g, '')
    return canonical.includes(':') || /^(?:\d{1,3}\.){3}\d{1,3}$/.test(canonical)
  } catch {
    return normalized.includes(':') || /^(?:\d{1,3}\.){3}\d{1,3}$/.test(normalized)
  }
}

export const classifyReferrer = (
  referrer: string,
  currentOrigin: string,
): AnalyticsReferrer => {
  if (!referrer.trim()) return { category: 'direct' }

  try {
    const referrerUrl = new URL(referrer)
    const currentUrl = new URL(currentOrigin)
    const hostname = referrerUrl.hostname.toLowerCase().replace(/^www\./, '')

    if (referrerUrl.origin === currentUrl.origin) {
      return { category: 'internal' }
    }
    if (isIpAddressHostname(hostname)) {
      return { category: 'unknown' }
    }
    if (matchesAnyDomain(hostname, AI_ASSISTANT_DOMAINS)) {
      return { category: 'ai_assistant', domain: hostname }
    }
    if (matchesAnyDomain(hostname, SEARCH_DOMAINS)) {
      return { category: 'search', domain: hostname }
    }
    if (matchesAnyDomain(hostname, SOCIAL_DOMAINS)) {
      return { category: 'social', domain: hostname }
    }

    return { category: 'referral', domain: hostname }
  } catch {
    return { category: 'unknown' }
  }
}

export const getRegionBucket = (timeZone: string | undefined): AnalyticsRegionBucket => {
  if (!timeZone) return 'unknown'

  const australianRegion = AUSTRALIAN_TIMEZONES[timeZone]
  if (australianRegion) return australianRegion
  if (UNKNOWN_TIMEZONES.has(timeZone)) return 'unknown'

  try {
    new Intl.DateTimeFormat('en-AU', { timeZone }).format()
    return timeZone.includes('/') ? 'international' : 'unknown'
  } catch {
    return 'unknown'
  }
}
