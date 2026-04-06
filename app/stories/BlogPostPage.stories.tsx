import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'
import BlogPostPage from '~/components/BlogPostPage'
import mockPostData from '~/components/BlogPostPage/__mocks__/mockPost.json'
import mockRelatedPostsData from '~/components/BlogPostPage/__mocks__/mockRelatedPosts.json'
import type { WPPost } from '~/types/wordpress'

const mockPost = mockPostData as unknown as WPPost
const mockRelatedPosts = mockRelatedPostsData as unknown as WPPost[]

type BlogPostArgs = {
  post: WPPost
  relatedPosts: WPPost[]
  canonicalUrl: string
}

const meta: Meta<BlogPostArgs> = {
  title: 'Pages/Blog Post',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  args: {
    post: mockPost,
    relatedPosts: mockRelatedPosts,
    canonicalUrl: 'https://studiozanetti.com.au/golden-hour-wedding-shoot',
  },
  argTypes: {
    post: { control: 'object', description: 'Full WordPress post data' },
    relatedPosts: { control: 'object', description: 'Array of related WPPost objects' },
    canonicalUrl: { control: 'text', description: 'Canonical URL for share buttons' },
  },
  render: (args) => (
    <BlogPostPage
      post={args.post}
      relatedPosts={args.relatedPosts}
      canonicalUrl={args.canonicalUrl}
    />
  ),
}

export default meta
type Story = StoryObj<typeof meta>

/** Full blog post page with hero, content, share buttons, and related posts. */
export const Default: Story = {}

/** Post with no related posts. */
export const NoRelatedPosts: Story = {
  args: { relatedPosts: [] },
}

/** Post with no featured image. */
export const NoFeaturedImage: Story = {
  args: {
    post: { ...mockPost, featured_image: null } as unknown as WPPost,
  },
}
