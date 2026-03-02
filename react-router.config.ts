import type { Config } from '@react-router/dev/config'

export default {
  ssr: true,
  async prerender() {
    return ['/', '/about', '/contact']
  },
} satisfies Config
