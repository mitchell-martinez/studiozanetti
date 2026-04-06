import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { WPPost } from '~/types/wordpress'
import mockPostData from '../__mocks__/mockPost.json'
import PostCard from '../index'

const mockPost = mockPostData as unknown as WPPost

const renderCard = (props: Partial<Parameters<typeof PostCard>[0]> = {}) =>
  render(
    <MemoryRouter>
      <PostCard post={mockPost} {...props} />
    </MemoryRouter>,
  )

describe('PostCard', () => {
  it('renders the post title', () => {
    renderCard()
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
      'Golden Hour Wedding Shoot',
    )
  })

  it('renders a link to the post', () => {
    renderCard()
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/golden-hour-wedding-shoot')
  })

  it('renders the featured image when showFeaturedImage is true', () => {
    renderCard()
    const img = screen.getByAltText('Golden Hour Wedding Shoot')
    expect(img).toBeInTheDocument()
  })

  it('hides the featured image when showFeaturedImage is false', () => {
    renderCard({ showFeaturedImage: false })
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('renders the excerpt when showExcerpt is true', () => {
    renderCard()
    expect(
      screen.getByText(/Tips for capturing stunning golden hour portraits/),
    ).toBeInTheDocument()
  })

  it('hides the excerpt when showExcerpt is false', () => {
    renderCard({ showExcerpt: false })
    expect(
      screen.queryByText(/Tips for capturing stunning golden hour portraits/),
    ).not.toBeInTheDocument()
  })

  it('renders the date when showDate is true', () => {
    renderCard()
    expect(screen.getByText(/January/)).toBeInTheDocument()
  })

  it('hides the date when showDate is false', () => {
    renderCard({ showDate: false })
    expect(screen.queryByText(/January/)).not.toBeInTheDocument()
  })

  it('renders reading time when showReadingTime is true', () => {
    renderCard()
    expect(screen.getByText('3 min read')).toBeInTheDocument()
  })

  it('hides reading time when showReadingTime is false', () => {
    renderCard({ showReadingTime: false })
    expect(screen.queryByText('3 min read')).not.toBeInTheDocument()
  })
})
