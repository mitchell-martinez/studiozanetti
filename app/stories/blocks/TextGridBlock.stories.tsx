import type { Meta, StoryObj } from '@storybook/react-vite'
import TextGridBlock from '~/components/blocks/TextGridBlock'
import textGridData from '~/components/blocks/TextGridBlock/__mocks__/textGridBlock.json'
import type { TextGridBlock as TextGridBlockType } from '~/types/wordpress'
import { blockStyleArgTypes } from '../helpers/blockArgTypes'

const textGrid = textGridData as unknown as TextGridBlockType

type TextGridArgs = Omit<TextGridBlockType, 'acf_fc_layout'>

const meta: Meta<TextGridArgs> = {
  title: 'Blocks/Text Grid',
  tags: ['autodocs'],
  args: {
    heading: textGrid.heading,
    subheading: textGrid.subheading,
    items: textGrid.items,
    max_columns: textGrid.max_columns,
    card_style: textGrid.card_style,
    text_align: textGrid.text_align,
    font_size: textGrid.font_size,
    section_theme: textGrid.section_theme,
    top_spacing: textGrid.top_spacing,
    bottom_spacing: textGrid.bottom_spacing,
  },
  argTypes: {
    heading: { control: 'text', description: 'Section heading' },
    subheading: { control: 'text', description: 'Subheading below the main heading' },
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
      description: 'Text alignment inside each card',
    },
    font_size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: 'Font size for card title and body (sm by default)',
    },
    items: {
      control: 'object',
      description: 'Repeater: array of { title?, body?, cta_text?, cta_url? }',
    },
    ...blockStyleArgTypes,
  },
  render: (args) => <TextGridBlock block={{ acf_fc_layout: 'text_grid', ...args }} />,
}

export default meta
type Story = StoryObj<typeof meta>

/** Default: 3-column elevated cards centred. */
export const Default: Story = {}

/** 2-column outline cards on champagne. */
export const TwoColumnOutline: Story = {
  args: { max_columns: 2, card_style: 'outline', section_theme: 'champagne' },
}

/** 4-column minimal cards on dark. */
export const FourColumnDark: Story = {
  args: { max_columns: 4, card_style: 'minimal', section_theme: 'dark' },
}

/** Left-aligned text. */
export const LeftAligned: Story = {
  args: { text_align: 'left' },
}

/** Items with optional title and body. */
export const OptionalFields: Story = {
  args: {
    items: [
      { title: 'Title only' },
      { body: 'Body text only, no title.' },
      { title: 'Both', body: 'Has both title and body.' },
    ],
  },
}
