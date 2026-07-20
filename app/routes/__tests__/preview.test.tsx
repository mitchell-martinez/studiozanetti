import { act, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getPreviewContent, getRelatedPosts } from '~/lib/wordpress'
import PreviewPage, { loader } from '../preview'

vi.mock('~/lib/wordpress', () => ({
  getPreviewContent: vi.fn(),
  getPostsByCategories: vi.fn(),
  getRelatedPosts: vi.fn(),
}))

const loaderData = {
  type: 'page' as const,
  page: {
    id: 42,
    slug: 'pricing',
    parent: 0,
    status: 'draft',
    title: { rendered: 'Saved pricing' },
    content: { rendered: '<p>Saved content</p>' },
    excerpt: { rendered: '' },
    acf: {
      blocks: [
        {
          acf_fc_layout: 'text_block' as const,
          heading: 'Saved heading',
          body: '<p>Saved block body</p>',
        },
      ],
    },
  },
  isIframe: true,
  blogPostsData: undefined,
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PreviewPage route', () => {
  it('loads a private post preview through the post contract', async () => {
    const post = {
      id: 11930,
      slug: 'private-wedding-post',
      status: 'private',
      title: { rendered: 'Private wedding post' },
      content: { rendered: '<p>Private post content</p>' },
      excerpt: { rendered: '' },
      date: '2026-07-20T10:00:00+00:00',
      modified: '2026-07-20T10:00:00+00:00',
      categories: [{ id: 7, name: 'Weddings', slug: 'weddings' }],
    }
    vi.mocked(getPreviewContent).mockResolvedValueOnce({ type: 'post', content: post })
    vi.mocked(getRelatedPosts).mockResolvedValueOnce([])

    const result = await loader({
      request: new Request('https://frontend.example/preview?id=11930&secret=test-secret'),
      params: {},
      context: undefined,
      unstable_pattern: '/preview',
    })

    expect(getPreviewContent).toHaveBeenCalledWith(11930, 'test-secret')
    expect(getRelatedPosts).toHaveBeenCalledWith(11930, [7], 3)
    expect(result).toMatchObject({ type: 'post', post, relatedPosts: [] })
  })

  it('renders a private post with the existing blog post layout', async () => {
    const postData = {
      type: 'post' as const,
      post: {
        id: 11930,
        slug: 'private-wedding-post',
        status: 'private',
        title: { rendered: 'Private wedding post' },
        content: { rendered: '<p>Private post content</p>' },
        excerpt: { rendered: '' },
        date: '2026-07-20T10:00:00+00:00',
        modified: '2026-07-20T10:00:00+00:00',
        categories: [],
      },
      isIframe: false,
      relatedPosts: [],
      canonicalUrl: 'https://frontend.example/private-wedding-post',
    }
    const router = createMemoryRouter(
      [{ path: '/preview', element: <PreviewPage />, loader: () => postData }],
      { initialEntries: ['/preview'] },
    )

    render(<RouterProvider router={router} />)

    expect(
      await screen.findByRole('heading', { name: 'Private wedding post', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getByText('Private post content')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('unpublished content')
  })

  it('replaces loader content with a live draft snapshot from the editor', async () => {
    const postMessage = vi.fn()
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: { postMessage },
    })

    const router = createMemoryRouter(
      [{ path: '/preview', element: <PreviewPage />, loader: () => loaderData }],
      { initialEntries: ['/preview'] },
    )

    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Saved heading', level: 2 })).toBeInTheDocument()
      expect(postMessage).toHaveBeenCalledWith(
        { source: 'sz-preview', action: 'ready-for-state' },
        '*',
      )
    })

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            source: 'sz-editor',
            action: 'preview-state',
            page: {
              title: { rendered: 'Unsaved pricing' },
              acf: {
                blocks: [
                  {
                    acf_fc_layout: 'text_block',
                    heading: 'Unsaved heading',
                    body: '<p>Unsaved block body</p>',
                  },
                ],
              },
            },
          },
        }),
      )
    })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Unsaved heading', level: 2 })).toBeInTheDocument()
    })

  })
})