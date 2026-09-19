import { describe, expect, it } from 'vitest'
import { classifyReferrer, classifyVisitSource, getRegionBucket } from '../analytics'

describe('classifyReferrer', () => {
  const origin = 'https://studiozanetti.com.au'

  it.each([
    ['https://www.google.com/search?q=photographer', 'search'],
    ['https://www.google.com.au/search?q=photographer', 'search'],
    ['https://chatgpt.com/c/example', 'ai_assistant'],
    ['https://www.instagram.com/studio/', 'social'],
    ['https://example.com/article', 'referral'],
    ['https://studiozanetti.com.au/pricing', 'internal'],
  ] as const)('classifies %s as %s', (referrer, category) => {
    expect(classifyReferrer(referrer, origin).category).toBe(category)
  })

  it('classifies an empty referrer as direct without inventing a source', () => {
    expect(classifyReferrer('', origin)).toEqual({ category: 'direct' })
  })

  it('keeps malformed referrers unknown', () => {
    expect(classifyReferrer('not a URL', origin)).toEqual({ category: 'unknown' })
  })

  it('does not treat lookalike domains as known sources', () => {
    expect(classifyReferrer('https://chatgpt.com.example.test/', origin)).toEqual({
      category: 'referral',
      domain: 'chatgpt.com.example.test',
    })
  })

  it('does not retain IP-literal referrer hosts', () => {
    for (const referrer of [
      'https://203.0.113.10/path',
      'https://203.0.113.10./path',
      'https://2130706433/path',
      'https://0x7f000001/path',
      'https://127.1/path',
      'https://[2001:db8::1]/path',
    ]) {
      expect(classifyReferrer(referrer, origin)).toEqual({ category: 'unknown' })
    }
  })
})

describe('classifyVisitSource', () => {
  const origin = 'https://studiozanetti.com.au'

  it.each(['chatgpt.com', 'chatgpt'])('recognizes the exact ChatGPT source marker %s', (source) => {
    expect(classifyVisitSource('', origin, `${origin}/?utm_source=${source}`)).toEqual({
      category: 'ai_assistant',
      domain: 'chatgpt.com',
    })
  })

  it('does not retain arbitrary or lookalike source markers', () => {
    expect(classifyVisitSource('', origin, `${origin}/?utm_source=private-value`)).toEqual({
      category: 'direct',
    })
    expect(classifyVisitSource('', origin, `${origin}/?utm_source=chatgpt.com.example.test`)).toEqual({
      category: 'direct',
    })
  })

  it('prefers an observed external referrer over a conflicting marker', () => {
    expect(classifyVisitSource(
      'https://www.google.com/search?q=photographer',
      origin,
      `${origin}/?utm_source=chatgpt.com`,
    )).toEqual({ category: 'search', domain: 'google.com' })
  })

  it('ignores source markers on URLs outside the current origin', () => {
    expect(classifyVisitSource('', origin, 'https://example.test/?utm_source=chatgpt.com')).toEqual({
      category: 'direct',
    })
  })
})

describe('getRegionBucket', () => {
  it.each([
    ['Australia/Sydney', 'AU-NSW'],
    ['Australia/Melbourne', 'AU-VIC'],
    ['Australia/Brisbane', 'AU-QLD'],
    ['Australia/Perth', 'AU-WA'],
    ['Australia/Adelaide', 'AU-SA'],
    ['Australia/Hobart', 'AU-TAS'],
    ['Australia/Darwin', 'AU-NT'],
    ['Australia/Broken_Hill', 'AU-NSW'],
    ['Australia/Victoria', 'AU-VIC'],
  ] as const)('maps %s to %s', (timeZone, region) => {
    expect(getRegionBucket(timeZone)).toBe(region)
  })

  it('keeps privacy-reduced UTC timezones unknown', () => {
    expect(getRegionBucket('UTC')).toBe('unknown')
    expect(getRegionBucket('Etc/UTC')).toBe('unknown')
  })

  it('classifies explicit non-Australian zones as international', () => {
    expect(getRegionBucket('Europe/London')).toBe('international')
  })

  it('keeps missing and malformed values unknown', () => {
    expect(getRegionBucket(undefined)).toBe('unknown')
    expect(getRegionBucket('Sydney')).toBe('unknown')
    expect(getRegionBucket('invented/timezone')).toBe('unknown')
  })
})
