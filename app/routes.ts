import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('gallery', 'routes/gallery.tsx'),
  route('about', 'routes/about.tsx'),
  route('contact', 'routes/contact.tsx'),
  // Catch-all: resolves any other URL against WordPress pages.
  // Static routes above always take priority over this dynamic segment.
  route(':slug', 'routes/$slug.tsx'),
] satisfies RouteConfig
