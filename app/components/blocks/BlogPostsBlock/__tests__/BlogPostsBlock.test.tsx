import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { BlogPostsBlock as BlogPostsBlockType, BlogPostsData } from '~/types/wordpress'
import blogPostsBlockData from '../__mocks__/blogPostsBlock.json'
import blogPostsData from '../__mocks__/blogPostsData.json'
import BlogPostsBlock from '../index'

const block = blogPostsBlockData as unknown as BlogPostsBlockType
const data = blogPostsData as unknown as BlogPostsData

const renderBlock = (
  blockOverrides: Partial<BlogPostsBlockType> = {},
  dataOverrides: Partial<BlogPostsData> = {},
) =>
  render(
    <MemoryRouter>
      <BlogPostsBlock
        block={{ ...block, ...blockOverrides }}
        blogPostsData={{ ...data, ...dataOverrides }}
      />
    </MemoryRouter>,
  )

describe('BlogPostsBlock', () => {
  it('renders heading when provided', () => {
    renderBlock()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Latest Posts')
  })

  it('renders subheading when provided', () => {
    renderBlock()
    expect(screen.getByText('Photography tips and studio news')).toBeInTheDocument()
  })

  it('renders post cards', () => {
    renderBlock()
    expect(screen.getByText('Golden Hour Wedding Shoot')).toBeInTheDocument()
    expect(screen.getByText('Behind the Scenes: Studio Portraits')).toBeInTheDocument()
    expect(screen.getByText('Event Photography Checklist')).toBeInTheDocument()
  })

  it('renders pagination when show_pagination is true and totalPages > 1', () => {
    renderBlock()
    expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument()
  })

  it('does not render pagination when show_pagination is false', () => {
    renderBlock({ show_pagination: false })
    expect(screen.queryByRole('navigation', { name: /pagination/i })).not.toBeInTheDocument()
  })

  it('renders empty message when no posts', () => {
    renderBlock({}, { posts: [], total: 0, total_pages: 0 })
    expect(screen.getByText(/No posts yet/)).toBeInTheDocument()
  })

  it('does not render heading when omitted', () => {
    renderBlock({ heading: undefined })
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })
})
