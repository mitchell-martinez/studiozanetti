import type { Meta, StoryObj } from '@storybook/react-vite'
import GalleryCategoriesBlock from '~/components/blocks/GalleryCategoriesBlock'
import galleryCategoriesBlockData from '~/components/blocks/GalleryCategoriesBlock/__mocks__/galleryCategoriesBlock.json'
import type { GalleryCategoriesBlock as GalleryCategoriesBlockType } from '~/types/wordpress'

const galleryCategoriesBlock = galleryCategoriesBlockData as unknown as GalleryCategoriesBlockType
import { blockStyleArgTypes } from '../helpers/blockArgTypes'

type GalleryCategoriesArgs = Omit<GalleryCategoriesBlockType, 'acf_fc_layout'>

const meta: Meta<GalleryCategoriesArgs> = {
  title: 'Blocks/Gallery Categories',
  tags: ['autodocs'],
  args: {
    heading: galleryCategoriesBlock.heading,
    categories: galleryCategoriesBlock.categories,
    section_theme: galleryCategoriesBlock.section_theme,
    top_spacing: galleryCategoriesBlock.top_spacing,
    bottom_spacing: galleryCategoriesBlock.bottom_spacing,
  },
  argTypes: {
    heading: { control: 'text', description: 'Section heading' },
    categories: {
      control: 'object',
      description: 'Repeater: array of { title, subtitle?, image?, url }',
    },
    ...blockStyleArgTypes,
  },
  render: (args) => (
    <GalleryCategoriesBlock block={{ acf_fc_layout: 'gallery_categories', ...args }} />
  ),
}

export default meta
type Story = StoryObj<typeof meta>

/** Default: three gallery category cards on dark background. */
export const Default: Story = {}

/** Light theme variant. */
export const LightTheme: Story = {
  args: { section_theme: 'light' },
}
