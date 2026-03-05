import type { Meta, StoryObj } from '@storybook/react-vite'
import PricingPackagesBlock from '~/components/blocks/PricingPackagesBlock'
import { pricingBlock } from '~/dev/localLabData'
import type { PricingPackagesBlock as PricingBlockType } from '~/types/wordpress'
import { blockStyleArgTypes } from '../helpers/blockArgTypes'

type PricingArgs = Omit<PricingBlockType, 'acf_fc_layout'>

const meta: Meta<PricingArgs> = {
  title: 'Blocks/Pricing Packages',
  tags: ['autodocs'],
  args: {
    heading: pricingBlock.heading,
    subheading: pricingBlock.subheading,
    packages: pricingBlock.packages,
    section_theme: pricingBlock.section_theme,
    top_spacing: pricingBlock.top_spacing,
    bottom_spacing: pricingBlock.bottom_spacing,
  },
  argTypes: {
    heading: { control: 'text', description: 'Section heading' },
    subheading: { control: 'text', description: 'Subheading text' },
    packages: {
      control: 'object',
      description:
        'Repeater: array of { name, price_label?, description?, inclusions? (HTML), is_featured?, cta_text?, cta_url? }',
    },
    ...blockStyleArgTypes,
  },
  render: (args) => <PricingPackagesBlock block={{ acf_fc_layout: 'pricing_packages', ...args }} />,
}

export default meta
type Story = StoryObj<typeof meta>

/** Default: two packages, Signature featured. */
export const Default: Story = {}

/** Dark theme variant. */
export const DarkTheme: Story = {
  args: { section_theme: 'dark' },
}

/** Three packages — adds a budget tier. */
export const ThreePackages: Story = {
  args: {
    packages: [
      {
        name: 'Mini',
        price_label: '$1,200',
        description: 'Elopements and micro-weddings.',
        inclusions: '<ul><li>3 hours</li><li>Digital gallery</li></ul>',
        cta_text: 'Book Mini',
        cta_url: '/contact',
      },
      ...pricingBlock.packages,
    ],
  },
}
