import type { Meta, StoryObj } from '@storybook/react-vite'
import ButtonGroupBlock from '~/components/blocks/ButtonGroupBlock'
import buttonGroupData from '~/components/blocks/ButtonGroupBlock/__mocks__/buttonGroupBlock.json'
import type { ButtonGroupBlock as ButtonGroupBlockType } from '~/types/wordpress'
import { blockStyleArgTypes } from '../helpers/blockArgTypes'

const buttonGroup = buttonGroupData as unknown as ButtonGroupBlockType

type BtnGroupArgs = Omit<ButtonGroupBlockType, 'acf_fc_layout'>

const meta: Meta<BtnGroupArgs> = {
  title: 'Blocks/Button Group',
  tags: ['autodocs'],
  args: {
    buttons: buttonGroup.buttons,
    alignment: buttonGroup.alignment,
    spacing: buttonGroup.spacing,
    section_theme: buttonGroup.section_theme,
    top_spacing: buttonGroup.top_spacing,
    bottom_spacing: buttonGroup.bottom_spacing,
  },
  argTypes: {
    buttons: {
      control: 'object',
      description:
        'Repeater: array of { label, url, variant?, size?, open_in_new_tab? }',
    },
    alignment: {
      control: 'inline-radio',
      options: ['left', 'center', 'right'],
      description: 'Horizontal alignment of the button row',
    },
    spacing: {
      control: 'inline-radio',
      options: ['tight', 'normal', 'loose'],
      description: 'Gap between buttons',
    },
    ...blockStyleArgTypes,
  },
  render: (args) => <ButtonGroupBlock block={{ acf_fc_layout: 'button_group', ...args }} />,
}

export default meta
type Story = StoryObj<typeof meta>

/** Default: centred primary + secondary buttons. */
export const Default: Story = {}

/** Left-aligned with tight spacing. */
export const LeftTight: Story = {
  args: { alignment: 'left', spacing: 'tight' },
}

/** Single CTA button on dark background. */
export const SingleDark: Story = {
  args: {
    buttons: [{ label: 'Get in Touch', url: '/contact', variant: 'primary', size: 'lg' }],
    section_theme: 'dark',
  },
}

/** Three buttons with loose spacing. */
export const ThreeButtons: Story = {
  args: {
    buttons: [
      { label: 'Weddings', url: '/weddings', variant: 'primary', size: 'md' },
      { label: 'Portraits', url: '/portraits', variant: 'outline', size: 'md' },
      { label: 'Events', url: '/events', variant: 'secondary', size: 'md' },
    ],
    spacing: 'loose',
  },
}
