import { act, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PreviewPage from '../preview'

vi.mock('~/lib/wordpress', () => ({
  getPreviewPage: vi.fn(),
  getPostsByCategories: vi.fn(),
}))

const loaderData = {
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

    expect(postMessage).toHaveBeenCalledWith({ source: 'sz-preview', action: 'ready-for-state' }, '*')
  })
})