import type { Meta, StoryObj } from '@storybook/react-vite'
import ImageBlock from '~/components/blocks/ImageBlock'
import imageData from '~/components/blocks/ImageBlock/__mocks__/imageBlock.json'
import type { ImageBlock as ImageBlockType } from '~/types/wordpress'

const baseBlock = imageData as unknown as ImageBlockType

type ImageArgs = Omit<ImageBlockType, 'acf_fc_layout'>

const meta: Meta<ImageArgs> = {
  title: 'Blocks/Image',
  tags: ['autodocs'],
  args: {
    image: baseBlock.image,
    height: baseBlock.height,
    overlay_strength: baseBlock.overlay_strength,
    title: baseBlock.title,
    subtitle: baseBlock.subtitle,
    overlay_text: baseBlock.overlay_text,
    text_align: baseBlock.text_align,
    parallax_scroll: baseBlock.parallax_scroll,
    aria_label: baseBlock.aria_label,
  },
  argTypes: {
    image: { control: 'object', description: 'Background image { url, alt, width, height }' },
    height: {
      control: 'inline-radio',
      options: ['md', 'lg', 'full'],
      description: 'Section height (md ≈ 68vh, lg ≈ 86vh, full = 100vh)',
    },
    overlay_strength: {
      control: 'inline-radio',
      options: ['light', 'medium', 'strong'],
      description: 'Darkness of scrim overlay (leave blank for none)',
    },
    overlay_text: { control: 'text', description: 'Large text displayed over the image' },
    title: { control: 'text', description: 'Centred title text over the image' },
    subtitle: { control: 'text', description: 'Subtitle displayed below the title' },
    heading_tag: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      description: 'HTML heading tag for the title (default: h2)',
    },
    title_pop_out: {
      control: 'boolean',
      description: 'Enlarge the title text on mouseover (enabled by default)',
    },
    subtitle_pop_out: {
      control: 'boolean',
      description: 'Enlarge the subtitle text on mouseover (disabled by default)',
    },
    text_max_width: {
      control: 'select',
      options: ['narrow', 'semi-narrow', 'normal', 'wide', 'full'],
      description: 'Maximum width of overlay text content',
    },
    text_align: {
      control: 'inline-radio',
      options: ['left', 'center', 'right'],
      description: 'Overlay text alignment',
    },
    parallax_scroll: {
      control: 'boolean',
      description: 'Enable parallax depth scroll effect (CSS background-attachment: fixed)',
    },
    aria_label: { control: 'text', description: 'Custom aria-label for the section' },
  },
  render: (args) => (
    <>
      {/* Spacer to allow scrolling for parallax demo */}
      <div style={{ height: '50vh', background: '#f9f5f4', display: 'grid', placeItems: 'center' }}>
        <p style={{ fontSize: '1.2rem', color: '#8f7f8d' }}>↓ Scroll to see the effect ↓</p>
      </div>
      <ImageBlock block={{ acf_fc_layout: 'image_block', ...args }} />
      <div
        style={{ height: '100vh', background: '#f9f5f4', display: 'grid', placeItems: 'center' }}
      >
        <p style={{ fontSize: '1.2rem', color: '#8f7f8d' }}>Content continues below…</p>
      </div>
    </>
  ),
}

export default meta
type Story = StoryObj<typeof meta>

/** Default static image with overlay text and light scrim. */
export const Default: Story = {}

/** Full-screen height with strong overlay for maximum drama. */
export const FullHeightStrong: Story = {
  args: { height: 'full', overlay_strength: 'strong', overlay_text: 'A Moment in Time' },
}

/** Medium height with no overlay — pure visual divider. */
export const MinimalDivider: Story = {
  args: { height: 'md', overlay_strength: undefined, overlay_text: undefined },
}

/** Left-aligned text with medium overlay. */
export const LeftAligned: Story = {
  args: { text_align: 'left', overlay_strength: 'medium' },
}

/** Right-aligned text with medium overlay. */
export const RightAligned: Story = {
  args: { text_align: 'right', overlay_strength: 'medium' },
}

/** Title and subtitle without overlay text. */
export const TitleSubtitle: Story = {
  args: {
    title: 'Our Story',
    subtitle: 'A decade of capturing love and light',
    overlay_text: undefined,
    overlay_strength: 'medium',
  },
}

/** Parallax scroll enabled for a cinematic depth effect. */
export const ParallaxScroll: Story = {
  args: {
    parallax_scroll: true,
    overlay_strength: 'light',
  },
}

/** Pop-out title and subtitle with strong overlay. */
export const PopOutText: Story = {
  args: {
    title: 'Our Story',
    subtitle: 'A decade of capturing love and light',
    title_pop_out: true,
    subtitle_pop_out: true,
    overlay_strength: 'medium',
    overlay_text: undefined,
  },
}

/** H1 heading tag for primary page hero usage. */
export const H1Heading: Story = {
  args: {
    title: 'Studio Zanetti',
    heading_tag: 'h1',
    overlay_strength: 'medium',
    overlay_text: undefined,
  },
}

/** Narrow text width for minimal captions. */
export const NarrowText: Story = {
  args: {
    title: 'Intimate',
    subtitle: 'Small moments, big feelings',
    text_max_width: 'narrow',
    overlay_strength: 'medium',
    overlay_text: undefined,
  },
}

/** Full-width text for editorial spreads. */
export const FullWidthText: Story = {
  args: {
    title: 'Gallery',
    subtitle: 'Browse our complete collection of wedding and portrait photography',
    text_max_width: 'full',
    overlay_strength: 'medium',
    overlay_text: undefined,
  },
}
