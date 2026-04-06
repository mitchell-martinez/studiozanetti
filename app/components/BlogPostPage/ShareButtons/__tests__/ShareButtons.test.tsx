import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ShareButtons from '../index'

describe('ShareButtons', () => {
  const defaultProps = {
    url: 'https://www.studiozanetti.com.au/test-post',
    title: 'Test Post Title',
  }

  it('renders a share label', () => {
    render(<ShareButtons {...defaultProps} />)
    expect(screen.getByText('Share')).toBeInTheDocument()
  })

  it('renders share links for all platforms', () => {
    render(<ShareButtons {...defaultProps} />)
    expect(screen.getByLabelText('Share on Facebook')).toBeInTheDocument()
    expect(screen.getByLabelText('Share on X')).toBeInTheDocument()
    expect(screen.getByLabelText('Share on Pinterest')).toBeInTheDocument()
    expect(screen.getByLabelText('Share via Email')).toBeInTheDocument()
  })

  it('encodes the URL in share links', () => {
    render(<ShareButtons {...defaultProps} />)
    const fbLink = screen.getByLabelText('Share on Facebook')
    expect(fbLink.getAttribute('href')).toContain(encodeURIComponent(defaultProps.url))
  })

  it('opens external links in a new tab', () => {
    render(<ShareButtons {...defaultProps} />)
    const fbLink = screen.getByLabelText('Share on Facebook')
    expect(fbLink).toHaveAttribute('target', '_blank')
    expect(fbLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('does not open email link in a new tab', () => {
    render(<ShareButtons {...defaultProps} />)
    const emailLink = screen.getByLabelText('Share via Email')
    expect(emailLink).not.toHaveAttribute('target')
  })

  it('has proper group role and aria-label', () => {
    render(<ShareButtons {...defaultProps} />)
    expect(screen.getByRole('group', { name: 'Share this post' })).toBeInTheDocument()
  })
})
