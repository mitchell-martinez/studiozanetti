import type { Meta, StoryObj } from '@storybook/react-vite'
import ProcessTimelineBlock from '~/components/blocks/ProcessTimelineBlock'
import { processBlock } from '~/dev/localLabData'
import type { ProcessTimelineBlock as ProcessBlockType } from '~/types/wordpress'
import { blockStyleArgTypes } from '../helpers/blockArgTypes'

type ProcessArgs = Omit<ProcessBlockType, 'acf_fc_layout'>

const meta: Meta<ProcessArgs> = {
  title: 'Blocks/Process Timeline',
  tags: ['autodocs'],
  args: {
    heading: processBlock.heading,
    intro: processBlock.intro,
    steps: processBlock.steps,
    section_theme: processBlock.section_theme,
    top_spacing: processBlock.top_spacing,
    bottom_spacing: processBlock.bottom_spacing,
  },
  argTypes: {
    heading: { control: 'text', description: 'Section heading' },
    intro: { control: 'text', description: 'Introductory paragraph' },
    steps: {
      control: 'object',
      description: 'Repeater: array of { title, description, image? }',
    },
    ...blockStyleArgTypes,
  },
  render: (args) => <ProcessTimelineBlock block={{ acf_fc_layout: 'process_timeline', ...args }} />,
}

export default meta
type Story = StoryObj<typeof meta>

/** Default: four-step timeline on champagne. */
export const Default: Story = {}

/** Dark theme with custom intro text. */
export const DarkTheme: Story = {
  args: { section_theme: 'dark', intro: 'Four simple steps to your perfect day.' },
}
