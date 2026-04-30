import type { Meta, StoryObj } from '@storybook/react-vite'
import RichText from '~/components/RichText'

type RichTextArgs = { html: string }

const meta: Meta<RichTextArgs> = {
  title: 'Components/RichText',
  tags: ['autodocs'],
  args: {
    html: '<h2>Rich-text preview</h2><p>This verifies <strong>WYSIWYG</strong> rendering, <em>typography</em> styling, and <a href="#">link treatment</a>.</p><ul><li>Bullet one</li><li>Bullet two</li></ul>',
  },
  argTypes: {
    html: { control: 'text', description: 'Raw HTML string from WP WYSIWYG editor' },
  },
  render: (args) => <RichText html={args.html} />,
}

export default meta
type Story = StoryObj<typeof meta>

/** Default rich-text sample with headings, lists and links. */
export const Default: Story = {}

/** Minimal paragraph-only content. */
export const ParagraphOnly: Story = {
  args: { html: '<p>A single paragraph of body text without any formatting.</p>' },
}

/**
 * Plain text with double newlines (e.g. WYSIWYG content that arrived without
 * `wpautop` applied) is auto-wrapped into paragraphs by `RichText`.
 */
export const PlainTextNewlines: Story = {
  args: {
    html: 'First paragraph typed in the editor.\n\nSecond paragraph after pressing Enter.\n\nThird paragraph for good measure.',
  },
}

/**
 * Single newlines inside a paragraph (Shift+Enter in the editor) become real
 * `<br />` line breaks rather than collapsed whitespace.
 */
export const PlainTextLineBreaks: Story = {
  args: {
    html: 'Line one of the address\nLine two of the address\nLine three of the address',
  },
}
