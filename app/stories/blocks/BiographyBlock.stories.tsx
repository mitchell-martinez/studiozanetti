import type { Meta, StoryObj } from '@storybook/react-vite'
import BiographyBlock from '~/components/blocks/BiographyBlock'
import biographyBlockData from '~/components/blocks/BiographyBlock/__mocks__/biographyBlock.json'
import type { BiographyBlock as BiographyBlockType } from '~/types/wordpress'

const biographyBlock = biographyBlockData as unknown as BiographyBlockType
import { blockStyleArgTypes } from '../helpers/blockArgTypes'

type BiographyArgs = Omit<BiographyBlockType, 'acf_fc_layout'>

const meta: Meta<BiographyArgs> = {
  title: 'Blocks/Biography',
  tags: ['autodocs'],
  args: {
    name: biographyBlock.name,
    role: biographyBlock.role,
    bio: biographyBlock.bio,
    image: biographyBlock.image,
    quote: biographyBlock.quote,
    signature_text: biographyBlock.signature_text,
    section_theme: biographyBlock.section_theme,
    top_spacing: biographyBlock.top_spacing,
    bottom_spacing: biographyBlock.bottom_spacing,
  },
  argTypes: {
    name: { control: 'text', description: 'Person name' },
    role: { control: 'text', description: 'Role / job title' },
    bio: { control: 'text', description: 'Biography text (HTML from WP WYSIWYG)' },
    quote: { control: 'text', description: 'Pull-quote text' },
    signature_text: { control: 'text', description: 'Signature label (e.g. "— Michael")' },
    image: { control: 'object', description: 'Portrait image { url, alt, width, height }' },
    ...blockStyleArgTypes,
  },
  render: (args) => <BiographyBlock block={{ acf_fc_layout: 'biography', ...args }} />,
}

export default meta
type Story = StoryObj<typeof meta>

/** Default biography section. */
export const Default: Story = {}

/** Biography on champagne background without a quote. */
export const ChampagneNoQuote: Story = {
  args: { section_theme: 'champagne', quote: '' },
}
