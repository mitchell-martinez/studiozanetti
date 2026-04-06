import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { WPPost } from '~/types/wordpress'
import mockRelatedPosts from '../../__mocks__/mockRelatedPosts.json'
import RelatedPosts from '../index'

const relatedPosts = mockRelatedPosts as unknown as WPPost[]

describe('RelatedPosts', () => {
  it('renders nothing when posts array is empty', () => {
    const { container } = render(
      <MemoryRouter>
        <RelatedPosts posts={[]} />
      </MemoryRouter>,
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders the heading', () => {
    render(
      <MemoryRouter>
        <RelatedPosts posts={relatedPosts} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Related Posts')
  })

  it('renders all related post cards', () => {
    render(
      <MemoryRouter>
        <RelatedPosts posts={relatedPosts} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Behind the Scenes: Studio Portraits')).toBeInTheDocument()
    expect(screen.getByText('Event Photography Checklist')).toBeInTheDocument()
  })

  it('has proper aside aria-label', () => {
    render(
      <MemoryRouter>
        <RelatedPosts posts={relatedPosts} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('complementary', { name: 'Related posts' })).toBeInTheDocument()
  })
})
