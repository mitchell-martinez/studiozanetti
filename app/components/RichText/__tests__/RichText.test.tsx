import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import RichText from '../index'

describe('RichText', () => {
  it('renders pre-formatted HTML untouched', () => {
    const html = '<p>Hello <strong>world</strong></p>'
    const { container } = render(<RichText html={html} />)
    expect(container.querySelector('p')?.innerHTML).toBe('Hello <strong>world</strong>')
  })

  it('wraps plain text with double newlines into multiple paragraphs', () => {
    const { container } = render(<RichText html={'First.\n\nSecond.\n\nThird.'} />)
    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs).toHaveLength(3)
    expect(paragraphs[0].textContent).toBe('First.')
    expect(paragraphs[1].textContent).toBe('Second.')
    expect(paragraphs[2].textContent).toBe('Third.')
  })

  it('converts single newlines inside a paragraph into <br /> elements', () => {
    const { container } = render(<RichText html={'Line one\nLine two'} />)
    const paragraph = container.querySelector('p')!
    expect(paragraph.querySelectorAll('br')).toHaveLength(1)
    expect(paragraph.textContent).toBe('Line oneLine two')
  })

  it('renders nothing breaking for an empty string', () => {
    const { container } = render(<RichText html="" />)
    expect(container.querySelector('p')).toBeNull()
  })
})
