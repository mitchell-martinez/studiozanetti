import { describe, it, expect } from 'vitest'
import { autoParagraph } from '../helpers/autoParagraph'

describe('autoParagraph', () => {
  it('returns an empty string for empty input', () => {
    expect(autoParagraph('')).toBe('')
  })

  it('wraps a single line of plain text in a paragraph', () => {
    expect(autoParagraph('Hello world')).toBe('<p>Hello world</p>')
  })

  it('treats double newlines as paragraph breaks', () => {
    const input = 'First paragraph.\n\nSecond paragraph.'
    expect(autoParagraph(input)).toBe('<p>First paragraph.</p>\n<p>Second paragraph.</p>')
  })

  it('treats single newlines inside a block as <br />', () => {
    const input = 'Line one\nLine two'
    expect(autoParagraph(input)).toBe('<p>Line one<br />Line two</p>')
  })

  it('handles a mix of paragraph breaks and line breaks', () => {
    const input = 'Para one line one\nPara one line two\n\nPara two'
    expect(autoParagraph(input)).toBe(
      '<p>Para one line one<br />Para one line two</p>\n<p>Para two</p>',
    )
  })

  it('normalises CRLF and CR line endings', () => {
    expect(autoParagraph('A\r\n\r\nB')).toBe('<p>A</p>\n<p>B</p>')
    expect(autoParagraph('A\rB')).toBe('<p>A<br />B</p>')
  })

  it('collapses three or more newlines into a single paragraph break', () => {
    expect(autoParagraph('A\n\n\n\nB')).toBe('<p>A</p>\n<p>B</p>')
  })

  it('skips empty paragraphs produced by surrounding whitespace', () => {
    expect(autoParagraph('\n\nHello\n\n')).toBe('<p>Hello</p>')
  })

  it('leaves content that already contains block-level HTML untouched', () => {
    const input = '<p>Already wrapped.</p>\n<p>Second.</p>'
    expect(autoParagraph(input)).toBe(input)
  })

  it('does not wrap a heading in an extra paragraph', () => {
    const input = '<h2>Title</h2>'
    expect(autoParagraph(input)).toBe(input)
  })

  it('wraps loose text that sits between block-level elements', () => {
    const input =
      '<h2>Title</h2>\n\nIntro paragraph one.\n\n<h2>Section</h2>\n\nBody paragraph with <strong>bold</strong>.'
    expect(autoParagraph(input)).toBe(
      '<h2>Title</h2>\n<p>Intro paragraph one.</p>\n<h2>Section</h2>\n<p>Body paragraph with <strong>bold</strong>.</p>',
    )
  })

  it('strips a lone &nbsp; placeholder line between blocks', () => {
    const input = '<h2>Title</h2>\n&nbsp;\n\nIntro paragraph.'
    expect(autoParagraph(input)).toBe('<h2>Title</h2>\n<p>Intro paragraph.</p>')
  })

  it('still wraps when only inline tags are present', () => {
    const input = 'Hello <strong>bold</strong> world\n\nNext para with <em>italic</em>'
    expect(autoParagraph(input)).toBe(
      '<p>Hello <strong>bold</strong> world</p>\n<p>Next para with <em>italic</em></p>',
    )
  })
})
