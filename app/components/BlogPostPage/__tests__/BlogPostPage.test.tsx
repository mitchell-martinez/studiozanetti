import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { WPPost } from '~/types/wordpress'
import mockPostData from '../__mocks__/mockPost.json'
import mockRelatedPosts from '../__mocks__/mockRelatedPosts.json'
import BlogPostPage from '../index'

const mockPost = mockPostData as unknown as WPPost
const relatedPosts = mockRelatedPosts as unknown as WPPost[]

const renderPage = (overrides: Partial<Parameters<typeof BlogPostPage>[0]> = {}) =>
  render(
    <MemoryRouter>
      <BlogPostPage
        post={mockPost}
        relatedPosts={relatedPosts}
        canonicalUrl="https://www.studiozanetti.com.au/golden-hour-wedding-shoot"
        {...overrides}
      />
    </MemoryRouter>,
  )

describe('BlogPostPage', () => {
  it('renders the post title as h1', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Golden Hour Wedding Shoot',
    )
  })

  it('renders the featured image', () => {
    renderPage()
    expect(screen.getByAltText('Golden Hour Wedding Shoot')).toBeInTheDocument()
  })

  it('renders the date', () => {
    renderPage()
    expect(screen.getByText(/January/)).toBeInTheDocument()
  })

  it('renders reading time', () => {
    renderPage()
    expect(screen.getByText('3 min read')).toBeInTheDocument()
  })

  it('renders category tags', () => {
    renderPage()
    expect(screen.getByText('Weddings')).toBeInTheDocument()
  })

  it('renders post content', () => {
    renderPage()
    expect(screen.getByText(/holy grail of wedding photography/)).toBeInTheDocument()
  })

  it('renders share buttons', () => {
    renderPage()
    expect(screen.getByRole('group', { name: 'Share this post' })).toBeInTheDocument()
  })

  it('renders related posts section', () => {
    renderPage()
    expect(screen.getByRole('complementary', { name: 'Related posts' })).toBeInTheDocument()
  })

  it('renders article element', () => {
    renderPage()
    const articles = screen.getAllByRole('article')
    expect(articles.length).toBeGreaterThanOrEqual(1)
  })
})
