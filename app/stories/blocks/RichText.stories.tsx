import type { Meta, StoryObj } from '@storybook/react-vite'
import RichText from '~/components/blocks/RichText'

type RichTextArgs = { html: string }

const meta: Meta<RichTextArgs> = {
  title: 'Blocks/RichText',
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
