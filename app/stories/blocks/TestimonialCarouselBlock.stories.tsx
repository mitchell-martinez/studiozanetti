import type { Meta, StoryObj } from '@storybook/react-vite'
import TestimonialCarouselBlock from '~/components/blocks/TestimonialCarouselBlock'
import testimonialBlockData from '~/components/blocks/TestimonialCarouselBlock/__mocks__/testimonialCarouselBlock.json'
import type { TestimonialCarouselBlock as TestimonialBlockType } from '~/types/wordpress'

const testimonialBlock = testimonialBlockData as unknown as TestimonialBlockType
import { blockStyleArgTypes } from '../helpers/blockArgTypes'

type TestimonialArgs = Omit<TestimonialBlockType, 'acf_fc_layout'>

const meta: Meta<TestimonialArgs> = {
  title: 'Blocks/Testimonial Carousel',
  tags: ['autodocs'],
  args: {
    heading: testimonialBlock.heading,
    subheading: testimonialBlock.subheading,
    testimonials: testimonialBlock.testimonials,
    auto_rotate_seconds: testimonialBlock.auto_rotate_seconds,
    section_theme: testimonialBlock.section_theme,
    top_spacing: testimonialBlock.top_spacing,
    bottom_spacing: testimonialBlock.bottom_spacing,
  },
  argTypes: {
    heading: { control: 'text', description: 'Section heading' },
    subheading: { control: 'text', description: 'Subheading below the main heading' },
    auto_rotate_seconds: {
      control: { type: 'number', min: 0, max: 20, step: 1 },
      description: 'Seconds between auto-rotation (0 = disabled)',
    },
    testimonials: {
      control: 'object',
      description: 'Repeater: array of { quote, name, context?, image? }',
    },
    ...blockStyleArgTypes,
  },
  render: (args) => (
    <TestimonialCarouselBlock block={{ acf_fc_layout: 'testimonial_carousel', ...args }} />
  ),
}

export default meta
type Story = StoryObj<typeof meta>

/** Default: two testimonials on rose background. */
export const Default: Story = {}

/** Faster rotation on dark background. */
export const DarkFastRotation: Story = {
  args: { section_theme: 'dark', auto_rotate_seconds: 2 },
}
