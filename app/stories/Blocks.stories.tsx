import type { Meta, StoryObj } from '@storybook/react-vite'
import BlockRenderer from '~/components/blocks/BlockRenderer'
import heroBlock from '~/components/blocks/HeroBlock/__mocks__/heroBlock.json'
import { fullPageBlocksA } from '~/dev/localLabData'

/**
 * Composed BlockRenderer stories that render a full sequence of blocks.
 *
 * For individual block stories with interactive Storybook Controls,
 * see the Blocks/ sidebar group (Hero, Text, Image + Text, etc.).
 */
const meta: Meta<typeof BlockRenderer> = {
  title: 'Blocks/BlockRenderer (Composed)',
  component: BlockRenderer,
  tags: ['autodocs'],
  args: {
    blocks: fullPageBlocksA,
    featuredImage: heroBlock.slides?.[0],
    interactive: false,
  },
  argTypes: {
    blocks: { control: 'object', description: 'Array of ContentBlock objects to render' },
    featuredImage: { control: 'object', description: 'Featured image for the Hero block' },
    interactive: { control: 'boolean', description: 'Enable interactive overlay mode' },
  },
}

export default meta
type Story = StoryObj<typeof meta>

/** All blocks rendered in sequence. */
export const AllBlocks: Story = {}

/** Interactive overlay mode enabled. */
export const InteractiveOverlay: Story = {
  args: { interactive: true },
}
