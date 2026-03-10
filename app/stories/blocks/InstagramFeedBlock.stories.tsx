import type { Meta, StoryObj } from '@storybook/react-vite'
import InstagramFeedBlock from '~/components/blocks/InstagramFeedBlock'
import instagramFeedData from '~/components/blocks/InstagramFeedBlock/__mocks__/instagramFeedBlock.json'
import type { InstagramFeedBlock as InstagramFeedBlockType } from '~/types/wordpress'
import { blockStyleArgTypes } from '../helpers/blockArgTypes'

const instagramBlock = instagramFeedData as unknown as InstagramFeedBlockType

type InstagramArgs = Omit<InstagramFeedBlockType, 'acf_fc_layout'>

const meta: Meta<InstagramArgs> = {
  title: 'Blocks/Instagram Feed',
  tags: ['autodocs'],
  args: {
    heading: instagramBlock.heading,
    subheading: instagramBlock.subheading,
    username: instagramBlock.username,
    profile_url: instagramBlock.profile_url,
    cta_text: instagramBlock.cta_text,
    columns: instagramBlock.columns,
    images: instagramBlock.images,
  },
  argTypes: {
    heading: { control: 'text', description: 'Section heading' },
    subheading: { control: 'text', description: 'Subheading below the heading' },
    username: { control: 'text', description: 'Instagram username (without @)' },
    profile_url: { control: 'text', description: 'Full Instagram profile URL' },
    cta_text: {
      control: 'text',
      description: 'Follow button text (defaults to "Follow @username")',
    },
    columns: {
      control: 'inline-radio',
      options: [2, 3, 4, 6],
      description: 'Number of grid columns',
    },
    images: {
      control: 'object',
      description: 'Array of images { url, alt, width, height }',
    },
    ...blockStyleArgTypes,
  },
  render: (args) => <InstagramFeedBlock block={{ acf_fc_layout: 'instagram_feed', ...args }} />,
}

export default meta
type Story = StoryObj<typeof meta>

/** Default: 3-column grid with 6 images. */
export const Default: Story = {}

/** 2-column layout for smaller sections. */
export const TwoColumn: Story = {
  args: { columns: 2 },
}

/** 4-column layout for wider sections. */
export const FourColumn: Story = {
  args: { columns: 4 },
}

/** 6-column grid for maximum density. */
export const SixColumn: Story = {
  args: { columns: 6 },
}

/** Dark theme variant. */
export const DarkTheme: Story = {
  args: { section_theme: 'dark' },
}

/** Without heading for minimal sections. */
export const NoHeading: Story = {
  args: { heading: undefined, subheading: undefined },
}
