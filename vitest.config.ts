import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./app/test/setup.ts'],
    include: ['app/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['app/**/*.{ts,tsx}'],
      exclude: [
        'app/test/**',
        'app/entry.client.tsx',
        'app/entry.server.tsx',
        'app/**/*.module.scss',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, 'app'),
    },
  },
  css: {
    modules: {
      // Return class names as-is so snapshot tests are deterministic
      generateScopedName: '[local]',
    },
  },
})
