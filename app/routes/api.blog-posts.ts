import type { LoaderFunctionArgs } from 'react-router'
import { getPostsByCategories } from '~/lib/wordpress'

/**
 * Resource route — returns blog-posts JSON for client-side pagination.
 *
 *   GET /api/blog-posts?page=2&per_page=6&categories=1,3
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1)
  const perPage = Math.min(
    50,
    Math.max(1, parseInt(url.searchParams.get('per_page') ?? '6', 10) || 6),
  )
  const categoriesParam = url.searchParams.get('categories') ?? ''
  const categoryIds = categoriesParam
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n > 0)

  const data = await getPostsByCategories(categoryIds, page, perPage)

  return Response.json(data, {
    headers: { 'Cache-Control': 'public, max-age=60, s-maxage=120' },
  })
}
