import { type RouteConfig, route } from '@react-router/dev/routes'

export default [
  route('/', 'routes/index.tsx'),
  route('preview', 'routes/preview.tsx'),
  route('*', 'routes/$slug.tsx'),
] satisfies RouteConfig
