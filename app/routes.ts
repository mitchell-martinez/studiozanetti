import { type RouteConfig, route } from '@react-router/dev/routes'

export default [
  route('preview', 'routes/preview.tsx'),
  route('*', 'routes/$slug.tsx'),
] satisfies RouteConfig
