import { describe, expect, it } from 'vitest'
import { estimateReadingTime } from '../readingTime'

describe('estimateReadingTime', () => {
  it('returns 1 for very short content', () => {
    expect(estimateReadingTime('<p>Hello world</p>')).toBe(1)
  })

  it('strips HTML tags before counting words', () => {
    const html = '<p>word</p> '.repeat(200)
    expect(estimateReadingTime(html)).toBe(1)
  })

  it('returns correct estimate for longer content', () => {
    const html = '<p>' + 'word '.repeat(600) + '</p>'
    expect(estimateReadingTime(html)).toBe(3)
  })

  it('rounds up to the nearest minute', () => {
    const html = '<p>' + 'word '.repeat(210) + '</p>'
    expect(estimateReadingTime(html)).toBe(2)
  })

  it('handles empty string', () => {
    expect(estimateReadingTime('')).toBe(1)
  })
})
