import type { Meta, StoryObj } from '@storybook/react-vite'
import PillarGridBlock from '~/components/blocks/PillarGridBlock'
import pillarBlockData from '~/components/blocks/PillarGridBlock/__mocks__/pillarGridBlock.json'
import type { PillarGridBlock as PillarGridBlockType } from '~/types/wordpress'

const pillarBlock = pillarBlockData as unknown as PillarGridBlockType
import { blockStyleArgTypes } from '../helpers/blockArgTypes'

type PillarArgs = Omit<PillarGridBlockType, 'acf_fc_layout'>

const meta: Meta<PillarArgs> = {
  title: 'Blocks/Pillar Grid',
  tags: ['autodocs'],
  args: {
    heading: pillarBlock.heading,
    subheading: pillarBlock.subheading,
    columns: pillarBlock.columns,
    pillars: pillarBlock.pillars,
    section_theme: pillarBlock.section_theme,
    top_spacing: pillarBlock.top_spacing,
    bottom_spacing: pillarBlock.bottom_spacing,
  },
  argTypes: {
    heading: { control: 'text', description: 'Section heading' },
    subheading: { control: 'text', description: 'Subheading below the main heading' },
    columns: {
      control: 'inline-radio',
      options: [2, 3, 4],
      description: 'Number of grid columns',
    },
    pillars: {
      control: 'object',
      description: 'Repeater: array of { title, description }',
    },
    ...blockStyleArgTypes,
  },
  render: (args) => <PillarGridBlock block={{ acf_fc_layout: 'pillar_grid', ...args }} />,
}

export default meta
type Story = StoryObj<typeof meta>

/** Default: 3-column pillar grid on champagne. */
export const Default: Story = {}

/** 2-column dark variant. */
export const TwoColumnDark: Story = {
  args: { columns: 2, section_theme: 'dark' },
}

/** 4-column with extra pillars. */
export const FourColumns: Story = {
  args: {
    columns: 4,
    pillars: [
      ...pillarBlock.pillars,
      { title: 'Aftercare', description: 'Album design & reprints available.' },
    ],
  },
}
