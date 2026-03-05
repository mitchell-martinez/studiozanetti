import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/index.tsx'),
  route('preview', 'routes/preview.tsx'),
  // Catch-all: resolves any other URL against WordPress pages.
  route(':slug', 'routes/$slug.tsx'),
  route('*', 'routes/404.tsx'),
] satisfies RouteConfig
