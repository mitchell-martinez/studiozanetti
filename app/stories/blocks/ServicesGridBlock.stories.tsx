import type { Meta, StoryObj } from '@storybook/react-vite'
import ServicesGridBlock from '~/components/blocks/ServicesGridBlock'
import servicesBlockData from '~/components/blocks/ServicesGridBlock/__mocks__/servicesGridBlock.json'
import type { ServicesGridBlock as ServicesGridBlockType } from '~/types/wordpress'

const servicesBlock = servicesBlockData as unknown as ServicesGridBlockType
import { blockStyleArgTypes } from '../helpers/blockArgTypes'

type ServicesArgs = Omit<ServicesGridBlockType, 'acf_fc_layout'>

const meta: Meta<ServicesArgs> = {
  title: 'Blocks/Services Grid',
  tags: ['autodocs'],
  args: {
    heading: servicesBlock.heading,
    subheading: servicesBlock.subheading,
    columns: servicesBlock.columns,
    card_style: servicesBlock.card_style,
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
    columns: {
      control: 'inline-radio',
      options: [2, 3, 4],
      description: 'Number of grid columns',
    },
    card_style: {
      control: 'inline-radio',
      options: ['elevated', 'outline', 'minimal'],
      description: 'Visual card treatment',
    },
    services: {
      control: 'object',
      description: 'Repeater: array of { title, description, image? }',
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
  args: { columns: 2, card_style: 'minimal' },
}

/** 4-column outline variant on dark theme. */
export const FourColumnDark: Story = {
  args: { columns: 4, card_style: 'outline', section_theme: 'dark' },
}
