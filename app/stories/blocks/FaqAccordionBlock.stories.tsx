import type { Meta, StoryObj } from '@storybook/react-vite'
import FaqAccordionBlock from '~/components/blocks/FaqAccordionBlock'
import { faqBlock } from '~/dev/localLabData'
import type { FaqAccordionBlock as FaqBlockType } from '~/types/wordpress'
import { blockStyleArgTypes } from '../helpers/blockArgTypes'

type FaqArgs = Omit<FaqBlockType, 'acf_fc_layout'>

const meta: Meta<FaqArgs> = {
  title: 'Blocks/FAQ Accordion',
  tags: ['autodocs'],
  args: {
    heading: faqBlock.heading,
    intro: faqBlock.intro,
    faq_items: faqBlock.faq_items,
    open_first_item: faqBlock.open_first_item,
    section_theme: faqBlock.section_theme,
    top_spacing: faqBlock.top_spacing,
    bottom_spacing: faqBlock.bottom_spacing,
  },
  argTypes: {
    heading: { control: 'text', description: 'Section heading' },
    intro: { control: 'text', description: 'Introductory paragraph below the heading' },
    open_first_item: {
      control: 'boolean',
      description: 'Whether the first accordion item starts expanded',
    },
    faq_items: {
      control: 'object',
      description: 'Repeater: array of { question, answer (HTML) }',
    },
    ...blockStyleArgTypes,
  },
  render: (args) => <FaqAccordionBlock block={{ acf_fc_layout: 'faq_accordion', ...args }} />,
}

export default meta
type Story = StoryObj<typeof meta>

/** Default: first item open, light theme. */
export const Default: Story = {}

/** All items collapsed initially. */
export const AllCollapsed: Story = {
  args: { open_first_item: false },
}

/** Dark theme variant. */
export const DarkTheme: Story = {
  args: { section_theme: 'dark' },
}
