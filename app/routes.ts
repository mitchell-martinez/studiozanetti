import { type RouteConfig, route } from '@react-router/dev/routes'

export default [
  route('/', 'routes/index.tsx'),
  route('robots.txt', 'routes/robots.txt.ts'),
  route('sitemap.xml', 'routes/sitemap.xml.ts'),
  route('preview', 'routes/preview.tsx'),
  route('api/blog-posts', 'routes/api.blog-posts.ts'),
  route('api/forms/submit', 'routes/api.forms.submit.ts'),
  route('local-lab', 'routes/local-lab.tsx'),
  route('*', 'routes/$slug.tsx'),
] satisfies RouteConfig
