import type { Meta, StoryObj } from '@storybook/react-vite'
import GalleriesBlock from '~/components/blocks/GalleriesBlock'
import galleriesBlockData from '~/components/blocks/GalleriesBlock/__mocks__/galleriesBlock.json'
import type { GalleriesBlock as GalleriesBlockType } from '~/types/wordpress'

type GalleriesArgs = Omit<GalleriesBlockType, 'acf_fc_layout'>
const galleriesBlock = galleriesBlockData as GalleriesBlockType

const meta: Meta<GalleriesArgs> = {
  title: 'Blocks/Galleries',
  tags: ['autodocs'],
  args: {
    heading: galleriesBlock.heading,
    description: galleriesBlock.description,
    images: galleriesBlock.images,
    desktop_columns: galleriesBlock.desktop_columns,
    mobile_columns: galleriesBlock.mobile_columns,
  },
  argTypes: {
    heading: { control: 'text', description: 'Section heading above the gallery' },
    description: { control: 'text', description: 'Optional intro copy between heading and gallery' },
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
  },
  render: (args) => <GalleriesBlock block={{ acf_fc_layout: 'galleries', ...args }} />,
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const TwoColumnsDesktop: Story = {
  args: {
    desktop_columns: 2,
  },
}
