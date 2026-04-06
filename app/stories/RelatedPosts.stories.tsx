import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'
import RelatedPosts from '~/components/BlogPostPage/RelatedPosts'
import mockRelatedPosts from '~/components/BlogPostPage/__mocks__/mockRelatedPosts.json'
import type { WPPost } from '~/types/wordpress'

const posts = mockRelatedPosts as unknown as WPPost[]

const meta: Meta<{ posts: WPPost[] }> = {
  title: 'Components/Related Posts',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  args: { posts },
  argTypes: {
    posts: { control: 'object', description: 'Array of related WPPost objects' },
  },
  render: (args) => <RelatedPosts posts={args.posts} />,
}

export default meta
type Story = StoryObj<typeof meta>

/** Default: two related posts. */
export const Default: Story = {}

/** Empty state — renders nothing. */
export const EmptyState: Story = {
  args: { posts: [] },
}
