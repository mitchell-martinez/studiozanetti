import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CmsPage, { loader } from '../$slug'

vi.mock('~/lib/wordpress', () => ({
  getPageByPath: vi.fn(),
}))

import { getPageByPath } from '~/lib/wordpress'
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
      renderCmsPage(() => ({ page: mockPage }))
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
      renderCmsPage(() => ({ page: pageWithBlocks }))
      await waitFor(() =>
        expect(
          screen.getByRole('heading', { name: 'Block Heading', level: 2 }),
        ).toBeInTheDocument(),
      )
    })

    it('falls back to content.rendered when blocks array is empty', async () => {
      const pageNoBlocks = { ...mockPage, acf: { blocks: [] } }
      renderCmsPage(() => ({ page: pageNoBlocks }))
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
      vi.mocked(getPageByPath).mockResolvedValueOnce(mockPage as never)
      const result = await loader(makeArgs('') as never)
      expect(result).toEqual({ page: mockPage, canonicalUrl: 'https://www.studiozanetti.com.au' })
      expect(getPageByPath).toHaveBeenCalledWith('home', { requireExactPath: true })
    })

    it('returns page data when WordPress returns a match', async () => {
      vi.mocked(getPageByPath).mockResolvedValueOnce(mockPage as never)
      const result = await loader(makeArgs('pricing') as never)
      expect(result).toEqual({
        page: mockPage,
        canonicalUrl: 'https://www.studiozanetti.com.au/pricing',
      })
    })

    it('passes nested paths through to path lookup', async () => {
      vi.mocked(getPageByPath).mockResolvedValueOnce(mockPage as never)
      await loader(makeArgs('gallery/stylish-brides') as never)
      expect(getPageByPath).toHaveBeenCalledWith('gallery/stylish-brides', {
        requireExactPath: true,
      })
    })

    it('throws a 404 Response when the page is not found', async () => {
      vi.mocked(getPageByPath).mockResolvedValueOnce(null)
      await expect(loader(makeArgs('nonexistent') as never)).rejects.toBeInstanceOf(Response)
    })

    it('throws a 404 Response when WordPress is unavailable', async () => {
      vi.mocked(getPageByPath).mockResolvedValueOnce(null)
      await expect(loader(makeArgs('pricing') as never)).rejects.toBeInstanceOf(Response)
    })
  })
})
