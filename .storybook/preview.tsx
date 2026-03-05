import type { Preview } from '@storybook/react'
import { MemoryRouter } from 'react-router'
import '../app/styles/global.scss'

const preview: Preview = {
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    controls: { expanded: true },
  },
}

export default preview
