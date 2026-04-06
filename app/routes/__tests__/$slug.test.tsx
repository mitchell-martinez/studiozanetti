import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CmsPage, { loader } from '../$slug'

vi.mock('~/lib/wordpress', () => ({
  getPageBySlug: vi.fn(),
  getPageByPath: vi.fn(),
  getPostBySlug: vi.fn(),
  getPostsByCategories: vi.fn(),
  getRelatedPosts: vi.fn(),
}))

import { getPageByPath, getPageBySlug, getPostBySlug } from '~/lib/wordpress'
import mockPageData from '../__mocks__/mockPage.json'

afterEach(() => {
  vi.clearAllMocks()
})

const mockPage = { ...mockPageData }

const renderCmsPage = (loaderFn: () => unknown) => {
  const router = createMemoryRouter([{ path: '/*', element: <CmsPage />, loader: loaderFn }], {
    initialEntries: ['/pricing'],
  })
  render(<RouterProvider router={router} />)
}

describe('CmsPage route', () => {
  describe('rendering', () => {
    it('renders a page with native WP content (no ACF blocks)', async () => {
      renderCmsPage(() => ({ type: 'page', page: mockPage }))
      await waitFor(() =>
        expect(screen.getByRole('heading', { name: 'Pricing', level: 1 })).toBeInTheDocument(),
      )
      expect(screen.getByText('Our pricing details')).toBeInTheDocument()
    })

    it('renders ACF blocks when blocks array is present', async () => {
      const pageWithBlocks = {
        ...mockPage,
        acf: {
          blocks: [
            {
              acf_fc_layout: 'text_block' as const,
              heading: 'Block Heading',
              body: '<p>Block body text</p>',
            },
          ],
        },
      }
      renderCmsPage(() => ({ type: 'page', page: pageWithBlocks }))
      await waitFor(() =>
        expect(
          screen.getByRole('heading', { name: 'Block Heading', level: 2 }),
        ).toBeInTheDocument(),
      )
    })

    it('falls back to content.rendered when blocks array is empty', async () => {
      const pageNoBlocks = { ...mockPage, acf: { blocks: [] } }
      renderCmsPage(() => ({ type: 'page', page: pageNoBlocks }))
      await waitFor(() =>
        expect(screen.getByRole('heading', { name: 'Pricing', level: 1 })).toBeInTheDocument(),
      )
    })
  })

  describe('loader', () => {
    const makeArgs = (slug: string) => ({
      params: { '*': slug },
      request: new Request(`http://localhost/${slug}`),
      context: {},
    })

    it('maps root path to the home slug', async () => {
      vi.mocked(getPageBySlug).mockResolvedValueOnce(mockPage as never)
      const result = await loader(makeArgs('') as never)
      expect(result).toEqual({ type: 'page', page: mockPage, canonicalUrl: 'https://www.studiozanetti.com.au' })
      expect(getPageBySlug).toHaveBeenCalledWith('home')
    })

    it('returns page data when WordPress returns a match', async () => {
      vi.mocked(getPageBySlug).mockResolvedValueOnce(mockPage as never)
      const result = await loader(makeArgs('pricing') as never)
      expect(result).toEqual({
        type: 'page',
        page: mockPage,
        canonicalUrl: 'https://www.studiozanetti.com.au/pricing',
      })
    })

    it('throws a 404 Response when the page is not found', async () => {
      vi.mocked(getPageBySlug).mockResolvedValueOnce(null)
      vi.mocked(getPostBySlug).mockResolvedValueOnce(null)
      await expect(loader(makeArgs('nonexistent') as never)).rejects.toBeInstanceOf(Response)
    })

    it('throws a 404 Response when WordPress is unavailable', async () => {
      vi.mocked(getPageBySlug).mockResolvedValueOnce(null)
      vi.mocked(getPostBySlug).mockResolvedValueOnce(null)
      await expect(loader(makeArgs('pricing') as never)).rejects.toBeInstanceOf(Response)
    })

    it('falls back to getPageByPath for hierarchical slugs', async () => {
      const galleryChild = {
        ...mockPage,
        id: 20,
        slug: 'stylish-brides',
        parent: 10,
        title: { rendered: 'Stylish Brides' },
      }
      // getPageBySlug returns null for "gallery/stylish-brides"
      vi.mocked(getPageBySlug).mockResolvedValueOnce(null)
      // getPageByPath resolves the hierarchical path
      vi.mocked(getPageByPath).mockResolvedValueOnce(galleryChild as never)

      const result = await loader(makeArgs('gallery/stylish-brides') as never)
      expect(result).toEqual({
        type: 'page',
        page: galleryChild,
        canonicalUrl: 'https://www.studiozanetti.com.au/gallery/stylish-brides',
      })
      expect(getPageByPath).toHaveBeenCalledWith('gallery/stylish-brides')
    })

    it('does not call getPageByPath for single-segment slugs', async () => {
      vi.mocked(getPageBySlug).mockResolvedValueOnce(null)
      vi.mocked(getPostBySlug).mockResolvedValueOnce(null)
      await expect(loader(makeArgs('pricing') as never)).rejects.toBeInstanceOf(Response)
      expect(getPageByPath).not.toHaveBeenCalled()
    })

    it('throws a 404 for container_only pages', async () => {
      const containerPage = {
        ...mockPage,
        id: 10,
        slug: 'gallery',
        parent: 0,
        acf: { container_only: true },
      }
      vi.mocked(getPageBySlug).mockResolvedValueOnce(containerPage as never)
      vi.mocked(getPostBySlug).mockResolvedValueOnce(null)
      await expect(loader(makeArgs('gallery') as never)).rejects.toBeInstanceOf(Response)
    })
  })
})
