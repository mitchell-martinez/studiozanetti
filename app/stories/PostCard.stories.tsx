import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'
import PostCard from '~/components/PostCard'
import mockPostData from '~/components/PostCard/__mocks__/mockPost.json'
import type { WPPost } from '~/types/wordpress'

const mockPost = mockPostData as unknown as WPPost

type PostCardArgs = {
  post: WPPost
  cardStyle: 'elevated' | 'outline' | 'minimal'
  showExcerpt: boolean
  showFeaturedImage: boolean
  showDate: boolean
  showReadingTime: boolean
  layout: 'grid' | 'list'
}

const meta: Meta<PostCardArgs> = {
  title: 'Components/Post Card',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div style={{ maxWidth: 400 }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  args: {
    post: mockPost,
    cardStyle: 'elevated',
    showExcerpt: true,
    showFeaturedImage: true,
    showDate: true,
    showReadingTime: true,
    layout: 'grid',
  },
  argTypes: {
    post: { control: 'object', description: 'WordPress post data' },
    cardStyle: {
      control: 'inline-radio',
      options: ['elevated', 'outline', 'minimal'],
      description: 'Visual card treatment',
    },
    showExcerpt: { control: 'boolean', description: 'Show post excerpt' },
    showFeaturedImage: { control: 'boolean', description: 'Show featured image' },
    showDate: { control: 'boolean', description: 'Show published date' },
    showReadingTime: { control: 'boolean', description: 'Show reading time estimate' },
    layout: {
      control: 'inline-radio',
      options: ['grid', 'list'],
      description: 'Card layout variant',
    },
  },
  render: (args) => (
    <PostCard
      post={args.post}
      cardStyle={args.cardStyle}
      showExcerpt={args.showExcerpt}
      showFeaturedImage={args.showFeaturedImage}
      showDate={args.showDate}
      showReadingTime={args.showReadingTime}
      layout={args.layout}
    />
  ),
}

export default meta
type Story = StoryObj<typeof meta>

/** Default elevated card in grid layout. */
export const Default: Story = {}

/** Outline card variant. */
export const Outline: Story = {
  args: { cardStyle: 'outline' },
}

/** Minimal card variant. */
export const Minimal: Story = {
  args: { cardStyle: 'minimal' },
}

/** List layout — horizontal orientation. */
export const ListLayout: Story = {
  args: { layout: 'list' },
}

/** Card with no image, date or reading time. */
export const TextOnly: Story = {
  args: { showFeaturedImage: false, showDate: false, showReadingTime: false },
}
