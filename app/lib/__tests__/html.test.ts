import { describe, expect, it } from 'vitest'
import { decodeHtmlEntities, stripHtml } from '../html'

describe('decodeHtmlEntities', () => {
  it('decodes numeric entities', () => {
    expect(decodeHtmlEntities('Trevor&#8217;s')).toBe('Trevor\u2019s')
  })

  it('decodes hex entities', () => {
    expect(decodeHtmlEntities('&#x2019;')).toBe('\u2019')
  })

  it('decodes named entities', () => {
    expect(decodeHtmlEntities('&amp; &lt; &gt; &quot;')).toBe('& < > "')
  })

  it('converts &nbsp; to a normal space', () => {
    expect(decodeHtmlEntities('&nbsp;Hello')).toBe(' Hello')
  })

  it('handles curly quotes', () => {
    expect(decodeHtmlEntities('&lsquo;Hello&rsquo;')).toBe('\u2018Hello\u2019')
    expect(decodeHtmlEntities('&ldquo;Hello&rdquo;')).toBe('\u201CHello\u201D')
  })

  it('passes through unknown entities unchanged', () => {
    expect(decodeHtmlEntities('&foobar;')).toBe('&foobar;')
  })

  it('returns plain text unchanged', () => {
    expect(decodeHtmlEntities('Hello world')).toBe('Hello world')
  })
})

describe('stripHtml', () => {
  it('strips tags and decodes entities', () => {
    expect(stripHtml('<p>Trevor&#8217;s Wedding</p>')).toBe('Trevor\u2019s Wedding')
  })

  it('trims whitespace', () => {
    expect(stripHtml('  <span>Hello</span>  ')).toBe('Hello')
  })

  it('converts &nbsp; to space in stripped output', () => {
    expect(stripHtml('&nbsp; Rosanne and Trevor&#8217;s Wedding')).toBe(
      'Rosanne and Trevor\u2019s Wedding',
    )
  })

  it('handles empty string', () => {
    expect(stripHtml('')).toBe('')
  })
})
