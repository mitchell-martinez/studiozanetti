import type { Meta, StoryObj } from '@storybook/react-vite'
import TextBlock from '~/components/blocks/TextBlock'
import textBlockData from '~/components/blocks/TextBlock/__mocks__/textBlock.json'
import type { TextBlock as TextBlockType } from '~/types/wordpress'
import { blockStyleArgTypes } from '../helpers/blockArgTypes'

const textBlock = textBlockData as unknown as TextBlockType

type TextArgs = Omit<TextBlockType, 'acf_fc_layout'>

const meta: Meta<TextArgs> = {
  title: 'Blocks/Text',
  tags: ['autodocs'],
  args: {
    heading: textBlock.heading,
    body: textBlock.body,
    eyebrow: textBlock.eyebrow,
    align: textBlock.align,
    block_align: textBlock.block_align ?? 'left',
    max_width: textBlock.max_width,
    cta_text: textBlock.cta_text,
    cta_url: textBlock.cta_url,
    section_theme: textBlock.section_theme,
    top_spacing: textBlock.top_spacing,
    bottom_spacing: textBlock.bottom_spacing,
  },
  argTypes: {
    heading: { control: 'text', description: 'Section heading' },
    body: { control: 'text', description: 'Rich-text body content (HTML from WP WYSIWYG)' },
    eyebrow: { control: 'text', description: 'Small label above the heading' },
    cta_text: { control: 'text', description: 'Call-to-action button label' },
    cta_url: { control: 'text', description: 'Call-to-action URL' },
    align: {
      control: 'inline-radio',
      options: ['left', 'center', 'right', 'justify'],
      description: 'Text alignment within the block',
    },
    block_align: {
      control: 'inline-radio',
      options: ['left', 'center', 'right'],
      description: 'Horizontal position of the entire block on the page',
    },
    max_width: {
      control: 'inline-radio',
      options: ['narrow', 'normal', 'wide'],
      description: 'Maximum width of the text container',
    },
    font_size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: 'Body text font size (sm = default)',
    },
    ...blockStyleArgTypes,
  },
  render: (args) => <TextBlock block={{ acf_fc_layout: 'text_block', ...args }} />,
}

export default meta
type Story = StoryObj<typeof meta>

/** Default text block with left-aligned body text. */
export const Default: Story = {}

/** Centred text, centred block on dark background. */
export const CenteredDark: Story = {
  args: { align: 'center', block_align: 'center', section_theme: 'dark' },
}

/** Right-aligned text within the block. */
export const RightAligned: Story = {
  args: { align: 'right' },
}

/** Justified text within a narrow, centred block. */
export const JustifiedNarrowCenter: Story = {
  args: { align: 'justify', block_align: 'center', max_width: 'narrow' },
}

/** Block pushed to the right of the page. */
export const BlockRight: Story = {
  args: { block_align: 'right', max_width: 'narrow' },
}

/** Narrow width, no CTA — simple content section. */
export const NarrowNoCta: Story = {
  args: { max_width: 'narrow', cta_text: '', cta_url: '' },
}
