import type { Meta, StoryObj } from '@storybook/react-vite'
import ImageTextBlock from '~/components/blocks/ImageTextBlock'
import imageTextBlockData from '~/components/blocks/ImageTextBlock/__mocks__/imageTextBlock.json'
import type { ImageTextBlock as ImageTextBlockType } from '~/types/wordpress'
import { blockStyleArgTypes } from '../helpers/blockArgTypes'

const imageTextBlock = imageTextBlockData as unknown as ImageTextBlockType

type ImageTextArgs = Omit<ImageTextBlockType, 'acf_fc_layout'>

const meta: Meta<ImageTextArgs> = {
  title: 'Blocks/Image + Text',
  tags: ['autodocs'],
  args: {
    heading: imageTextBlock.heading,
    body: imageTextBlock.body,
    eyebrow: imageTextBlock.eyebrow,
    image: imageTextBlock.image,
    image_mobile: imageTextBlock.image_mobile,
    image_position: imageTextBlock.image_position,
    image_ratio: imageTextBlock.image_ratio,
    image_style: imageTextBlock.image_style,
    image_alignment: imageTextBlock.image_alignment,
    text_vertical_align: imageTextBlock.text_vertical_align,
    text_horizontal_align: imageTextBlock.text_horizontal_align,
    cta_text: imageTextBlock.cta_text,
    cta_url: imageTextBlock.cta_url,
    image_caption: imageTextBlock.image_caption,
    section_theme: imageTextBlock.section_theme,
    top_spacing: imageTextBlock.top_spacing,
    bottom_spacing: imageTextBlock.bottom_spacing,
  },
  argTypes: {
    heading: { control: 'text', description: 'Section heading beside the image' },
    body: { control: 'text', description: 'Rich-text body content (HTML from WP WYSIWYG)' },
    eyebrow: { control: 'text', description: 'Small label above the heading' },
    image: { control: 'object', description: 'Primary image object { url, alt, width, height }' },
    image_mobile: {
      control: 'object',
      description: 'Optional mobile-optimised crop { url, alt, width, height }',
    },
    image_position: {
      control: 'inline-radio',
      options: ['left', 'right'],
      description: 'Image placement relative to text',
    },
    image_ratio: {
      control: 'inline-radio',
      options: ['landscape', 'portrait', 'square', 'auto'],
      description: 'Image aspect ratio. "Auto" uses the natural image proportions.',
    },
    image_style: {
      control: 'inline-radio',
      options: ['soft', 'framed', 'plain'],
      description: 'Visual treatment for the image',
    },
    image_alignment: {
      control: 'inline-radio',
      options: ['left', 'center', 'right'],
      description:
        'Horizontal alignment of the image within its frame (most visible when cropped to a ratio)',
    },
    image_max_width: {
      control: { type: 'number', min: 0, step: 50 },
      description: 'Optional max width in px. Height scales proportionally.',
    },
    image_max_height: {
      control: { type: 'number', min: 0, step: 50 },
      description: 'Optional max height in px. Width scales proportionally.',
    },
    cta_text: { control: 'text', description: 'Call-to-action button label' },
    cta_url: { control: 'text', description: 'Call-to-action URL' },
    image_caption: { control: 'text', description: 'Short caption centred below the image' },
    url: {
      control: 'text',
      description:
        'Optional URL — makes the entire block clickable. Internal paths use client routing.',
    },
    font_size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: 'Body text font size (sm = default)',
    },
    text_vertical_align: {
      control: 'inline-radio',
      options: ['top', 'middle', 'bottom'],
      description: 'Vertical alignment of the text column relative to the image (default: middle)',
    },
    text_horizontal_align: {
      control: 'inline-radio',
      options: ['left', 'center', 'right'],
      description: 'Horizontal alignment of text content (default: left)',
    },
    ...blockStyleArgTypes,
  },
  render: (args) => <ImageTextBlock block={{ acf_fc_layout: 'image_text', ...args }} />,
}

export default meta
type Story = StoryObj<typeof meta>

/** Default: image right, portrait ratio, soft style. */
export const Default: Story = {}

/** Image on the left with framed treatment. */
export const ImageLeftFramed: Story = {
  args: { image_position: 'left', image_style: 'framed' },
}

/** Landscape image, dark theme. */
export const LandscapeDark: Story = {
  args: { image_ratio: 'landscape', section_theme: 'dark' },
}

/** Auto ratio with custom max dimensions — image stays proportional. */
export const CustomSizing: Story = {
  args: { image_ratio: 'auto', image_max_width: 400, image_max_height: 500 },
}

/** Image with a caption displayed below it. */
export const WithCaption: Story = {
  args: { image_caption: 'Golden hour at the Yarra Valley' },
}

/** Entire block is clickable as an internal link. */
export const ClickableBlock: Story = {
  args: { url: '/about-us' },
}

/** Entire block links to an external URL. */
export const ExternalLink: Story = {
  args: { url: 'https://studiozanetti.com.au' },
}

/** Image centred within its frame. */
export const ImageAlignCentre: Story = {
  args: { image_alignment: 'center' },
}

/** Image right-aligned within its frame. */
export const ImageAlignRight: Story = {
  args: { image_alignment: 'right' },
}

/** Text vertically aligned to the top of the image. */
export const TextAlignTop: Story = {
  args: { text_vertical_align: 'top' },
}

/** Text vertically aligned to the bottom of the image. */
export const TextAlignBottom: Story = {
  args: { text_vertical_align: 'bottom' },
}

/** Centre-aligned text. */
export const TextHorizontalCentre: Story = {
  args: { text_horizontal_align: 'center' },
}

/** Right-aligned text. */
export const TextHorizontalRight: Story = {
  args: { text_horizontal_align: 'right' },
}

/** Heading only — no body content — centred vertically. */
export const HeadingOnly: Story = {
  args: { body: '', text_vertical_align: 'middle' },
}

/** Body only — no heading or eyebrow. */
export const BodyOnly: Story = {
  args: { heading: undefined, eyebrow: undefined, text_vertical_align: 'middle' },
}
