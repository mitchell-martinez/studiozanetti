import type { Meta, StoryObj } from '@storybook/react-vite'
import BlogPostsBlock from '~/components/blocks/BlogPostsBlock'
import blogPostsBlockData from '~/components/blocks/BlogPostsBlock/__mocks__/blogPostsBlock.json'
import blogPostsData from '~/components/blocks/BlogPostsBlock/__mocks__/blogPostsData.json'
import type {
    BlogPostsBlock as BlogPostsBlockType,
    BlogPostsData,
} from '~/types/wordpress'
import { blockStyleArgTypes } from '../helpers/blockArgTypes'

const block = blogPostsBlockData as unknown as BlogPostsBlockType
const data = blogPostsData as unknown as BlogPostsData

type BlogPostsArgs = Omit<BlogPostsBlockType, 'acf_fc_layout'> & {
  blogPostsData: BlogPostsData
}

const meta: Meta<BlogPostsArgs> = {
  title: 'Blocks/Blog Posts',
  tags: ['autodocs'],
  args: {
    heading: block.heading,
    subheading: block.subheading,
    categories: block.categories,
    posts_per_page: block.posts_per_page,
    show_pagination: block.show_pagination,
    layout: block.layout,
    max_columns: block.max_columns,
    card_style: block.card_style,
    show_excerpt: block.show_excerpt,
    show_featured_image: block.show_featured_image,
    show_date: block.show_date,
    show_reading_time: block.show_reading_time,
    section_theme: block.section_theme,
    top_spacing: block.top_spacing,
    bottom_spacing: block.bottom_spacing,
    blogPostsData: data,
  },
  argTypes: {
    heading: { control: 'text', description: 'Section heading' },
    subheading: { control: 'text', description: 'Subheading below the main heading' },
    categories: {
      control: 'object',
      description: 'Array of category IDs to filter posts (empty = all posts)',
    },
    posts_per_page: {
      control: { type: 'number', min: 1, max: 12, step: 1 },
      description: 'Number of posts to show per page',
    },
    show_pagination: { control: 'boolean', description: 'Show pagination controls' },
    layout: {
      control: 'inline-radio',
      options: ['grid', 'list'],
      description: 'Card layout mode',
    },
    max_columns: {
      control: 'inline-radio',
      options: [1, 2, 3, 4],
      description: 'Maximum grid columns',
    },
    card_style: {
      control: 'inline-radio',
      options: ['elevated', 'outline', 'minimal'],
      description: 'Visual card treatment',
    },
    show_excerpt: { control: 'boolean', description: 'Show post excerpt on cards' },
    show_featured_image: { control: 'boolean', description: 'Show featured image on cards' },
    show_date: { control: 'boolean', description: 'Show published date on cards' },
    show_reading_time: { control: 'boolean', description: 'Show estimated reading time' },
    blogPostsData: { control: 'object', description: 'Pre-fetched blog posts data' },
    ...blockStyleArgTypes,
  },
  render: ({ blogPostsData: postsData, ...args }) => (
    <BlogPostsBlock
      block={{ acf_fc_layout: 'blog_posts', ...args }}
      blogPostsData={postsData}
    />
  ),
}

export default meta
type Story = StoryObj<typeof meta>

/** Default: 3-column grid with elevated cards. */
export const Default: Story = {}

/** List layout with outline cards. */
export const ListLayout: Story = {
  args: { layout: 'list', card_style: 'outline', max_columns: 2 },
}

/** Two-column minimal cards, no excerpt. */
export const TwoColumnMinimal: Story = {
  args: { max_columns: 2, card_style: 'minimal', show_excerpt: false },
}

/** Dark theme with pagination hidden. */
export const DarkNoPagination: Story = {
  args: { section_theme: 'dark', show_pagination: false },
}

/** Image-free cards with reading time only. */
export const TextOnly: Story = {
  args: { show_featured_image: false, show_date: false, show_reading_time: true },
}
