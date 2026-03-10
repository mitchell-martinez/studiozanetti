import type { Meta, StoryObj } from '@storybook/react-vite'
import GalleriesBlock from '~/components/blocks/GalleriesBlock'
import galleriesBlockData from '~/components/blocks/GalleriesBlock/__mocks__/galleriesBlock.json'
import type { GalleriesBlock as GalleriesBlockType } from '~/types/wordpress'
import { blockStyleArgTypes } from '../helpers/blockArgTypes'

type GalleriesArgs = Omit<GalleriesBlockType, 'acf_fc_layout'>
const galleriesBlock = galleriesBlockData as GalleriesBlockType

const meta: Meta<GalleriesArgs> = {
  title: 'Blocks/Galleries',
  tags: ['autodocs'],
  args: {
    heading: galleriesBlock.heading,
    images: galleriesBlock.images,
    desktop_columns: galleriesBlock.desktop_columns,
    mobile_columns: galleriesBlock.mobile_columns,
    section_theme: galleriesBlock.section_theme,
    top_spacing: galleriesBlock.top_spacing,
    bottom_spacing: galleriesBlock.bottom_spacing,
  },
  argTypes: {
    heading: { control: 'text', description: 'Section heading above the gallery' },
    images: {
      control: 'object',
      description: 'Insert Images repeater list with image + optional caption',
    },
    desktop_columns: {
      control: { type: 'number', min: 2, max: 4, step: 1 },
      description: 'Desktop column count (defaults to 3)',
    },
    mobile_columns: {
      control: { type: 'number', min: 1, max: 3, step: 1 },
      description: 'Mobile column count (defaults to 2)',
    },
    ...blockStyleArgTypes,
  },
  render: (args) => <GalleriesBlock block={{ acf_fc_layout: 'galleries', ...args }} />,
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const RoseTheme: Story = {
  args: {
    section_theme: 'rose',
  },
}
