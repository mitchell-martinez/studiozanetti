import type { Meta, StoryObj } from '@storybook/react-vite';
import ShareButtons from '~/components/BlogPostPage/ShareButtons';

const meta: Meta<{ url: string; title: string }> = {
  title: 'Components/Share Buttons',
  tags: ['autodocs'],
  args: {
    url: 'https://studiozanetti.com.au/golden-hour-wedding-shoot',
    title: 'Golden Hour Wedding Shoot',
  },
  argTypes: {
    url: { control: 'text', description: 'Canonical URL to share' },
    title: { control: 'text', description: 'Post title for share text' },
  },
  render: (args) => <ShareButtons url={args.url} title={args.title} />,
}

export default meta
type Story = StoryObj<typeof meta>

/** Default share buttons. */
export const Default: Story = {}
