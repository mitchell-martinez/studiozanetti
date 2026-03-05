import type { StorybookConfig } from '@storybook/react-vite'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const config: StorybookConfig = {
  stories: ['../app/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (config) => {
    config.resolve ??= {}
    config.resolve.alias ??= {}
    config.optimizeDeps ??= {}

    const problematicDeps = ['airbnb-js-shims', '@ampproject/remapping', 'polished', 'util']
    const include = config.optimizeDeps.include ?? []
    const exclude = config.optimizeDeps.exclude ?? []

    config.optimizeDeps.include = include.filter(
      (id) => !problematicDeps.some((pkg) => id === pkg || id.startsWith(`${pkg}/`)),
    )
    config.optimizeDeps.exclude = [...exclude, ...problematicDeps]

    config.plugins = (config.plugins ?? []).filter((plugin) => {
      const pluginName = typeof plugin === 'object' && plugin ? plugin.name : ''
      return pluginName !== 'react-router' && pluginName !== 'react-router-dev'
    })

    config.resolve.alias = {
      ...(config.resolve.alias as Record<string, string>),
      '~': resolve(__dirname, '../app'),
    }

    return config
  },
}

export default config
