import type { Meta, StoryObj } from '@storybook/react-vite'
import ServicesGridBlock from '~/components/blocks/ServicesGridBlock'
import servicesBlockData from '~/components/blocks/ServicesGridBlock/__mocks__/servicesGridBlock.json'
import type { ServicesGridBlock as ServicesGridBlockType } from '~/types/wordpress'
import { blockStyleArgTypes } from '../helpers/blockArgTypes'

const servicesBlock = servicesBlockData as unknown as ServicesGridBlockType

type ServicesArgs = Omit<ServicesGridBlockType, 'acf_fc_layout'>

const meta: Meta<ServicesArgs> = {
  title: 'Blocks/Services Grid',
  tags: ['autodocs'],
  args: {
    heading: servicesBlock.heading,
    subheading: servicesBlock.subheading,
    max_columns: servicesBlock.max_columns,
    card_style: servicesBlock.card_style,
    text_align: servicesBlock.text_align,
    font_size: servicesBlock.font_size,
    services: servicesBlock.services,
    cta_text: servicesBlock.cta_text,
    cta_url: servicesBlock.cta_url,
    section_theme: servicesBlock.section_theme,
    top_spacing: servicesBlock.top_spacing,
    bottom_spacing: servicesBlock.bottom_spacing,
  },
  argTypes: {
    heading: { control: 'text', description: 'Section heading' },
    subheading: { control: 'text', description: 'Subheading below the main heading' },
    cta_text: { control: 'text', description: 'Call-to-action button label' },
    cta_url: { control: 'text', description: 'Call-to-action URL' },
    max_columns: {
      control: 'inline-radio',
      options: [1, 2, 3, 4],
      description: 'Maximum number of columns the grid can expand to',
    },
    card_style: {
      control: 'inline-radio',
      options: ['elevated', 'outline', 'minimal'],
      description: 'Visual card treatment',
    },
    text_align: {
      control: 'inline-radio',
      options: ['left', 'center', 'right'],
      description: 'Text alignment inside each service card',
    },
    font_size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: 'Font size for card title and description (sm by default)',
    },
    services: {
      control: 'object',
      description: 'Repeater: array of { title, description, image?, url? }',
    },
    ...blockStyleArgTypes,
  },
  render: (args) => <ServicesGridBlock block={{ acf_fc_layout: 'services_grid', ...args }} />,
}

export default meta
type Story = StoryObj<typeof meta>

/** Default: 3-column elevated cards on rose background. */
export const Default: Story = {}

/** Minimal card style, 2-column layout. */
export const TwoColumnMinimal: Story = {
  args: { max_columns: 2, card_style: 'minimal' },
}

/** 4-column outline variant on dark theme. */
export const FourColumnDark: Story = {
  args: { max_columns: 4, card_style: 'outline', section_theme: 'dark' },
}

/** Single-column layout. */
export const SingleColumn: Story = {
  args: { max_columns: 1 },
}

/** Centre-aligned text inside cards. */
export const CentreAligned: Story = {
  args: { text_align: 'center' },
}

/** Cards with URLs become fully clickable links. */
export const ClickableCards: Story = {
  args: {
    services: servicesBlock.services.map((s) => ({ ...s, url: '/sample' })),
  },
}
