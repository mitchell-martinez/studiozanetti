import type { Meta, StoryObj } from '@storybook/react-vite'
import HeroBlock from '~/components/blocks/HeroBlock'
import { heroBlock } from '~/dev/localLabData'
import type { HeroBlock as HeroBlockType, WPImage } from '~/types/wordpress'

type HeroArgs = Omit<HeroBlockType, 'acf_fc_layout'> & { featuredImage?: WPImage }

const meta: Meta<HeroArgs> = {
  title: 'Blocks/Hero',
  tags: ['autodocs'],
  args: {
    title: heroBlock.title,
    tagline: heroBlock.tagline,
    cta_text: heroBlock.cta_text,
    cta_url: heroBlock.cta_url,
    secondary_cta_text: heroBlock.secondary_cta_text,
    secondary_cta_url: heroBlock.secondary_cta_url,
    slides: heroBlock.slides,
    content_align: heroBlock.content_align,
    height: heroBlock.height,
    overlay_strength: heroBlock.overlay_strength,
    auto_rotate_seconds: heroBlock.auto_rotate_seconds,
    show_slide_dots: heroBlock.show_slide_dots,
    featuredImage: heroBlock.slides?.[0],
  },
  argTypes: {
    title: { control: 'text', description: 'Main heading overlay text' },
    tagline: { control: 'text', description: 'Subheading text below title' },
    cta_text: { control: 'text', description: 'Primary call-to-action button label' },
    cta_url: { control: 'text', description: 'Primary call-to-action URL' },
    secondary_cta_text: { control: 'text', description: 'Secondary button label' },
    secondary_cta_url: { control: 'text', description: 'Secondary button URL' },
    scroll_hint_text: { control: 'text', description: 'Scroll prompt text (e.g. "Scroll down")' },
    content_align: {
      control: 'inline-radio',
      options: ['left', 'center'],
      description: 'Text alignment within hero overlay',
    },
    height: {
      control: 'inline-radio',
      options: ['md', 'lg', 'full'],
      description: 'Section height (md ≈ 60vh, lg ≈ 80vh, full = 100vh)',
    },
    overlay_strength: {
      control: 'inline-radio',
      options: ['light', 'medium', 'strong'],
      description: 'Darkness of the scrim over the background image',
    },
    auto_rotate_seconds: {
      control: { type: 'number', min: 0, max: 20, step: 1 },
      description: 'Seconds between auto-slide transitions (0 = disabled)',
    },
    show_slide_dots: { control: 'boolean', description: 'Show pagination dots below slides' },
    use_featured_image: {
      control: 'boolean',
      description: 'Use the page featured image as the hero background',
    },
    slides: { control: 'object', description: 'Carousel slide images (WPImage[])' },
    background_image: { control: 'object', description: 'Single static background (WPImage)' },
    featuredImage: {
      control: 'object',
      description: 'Featured image passed separately — used when use_featured_image is true',
    },
  },
  render: ({ featuredImage, ...blockFields }) => (
    <HeroBlock block={{ acf_fc_layout: 'hero', ...blockFields }} featuredImage={featuredImage} />
  ),
}

export default meta
type Story = StoryObj<typeof meta>

/** Default hero with carousel slides and centre-aligned text. */
export const Default: Story = {}

/** Left-aligned variant for editorial layouts. */
export const LeftAligned: Story = {
  args: { content_align: 'left' },
}

/** Full-viewport hero with a strong overlay for maximum text contrast. */
export const FullHeightDark: Story = {
  args: { height: 'full', overlay_strength: 'strong' },
}
