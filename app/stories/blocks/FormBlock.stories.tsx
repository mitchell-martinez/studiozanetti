import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'
import FormBlock from '~/components/blocks/FormBlock'
import formBlockData from '~/components/blocks/FormBlock/__mocks__/formBlock.json'
import type { FormBlock as FormBlockType } from '~/types/wordpress'
import { blockStyleArgTypes } from '../helpers/blockArgTypes'

const formBlock = formBlockData as unknown as FormBlockType

type FormArgs = Omit<FormBlockType, 'acf_fc_layout'>

const meta: Meta<FormArgs> = {
  title: 'Blocks/Form',
  tags: ['autodocs'],
  args: {
    form_id: formBlock.form_id,
    heading: formBlock.heading,
    heading_tag: formBlock.heading_tag,
    heading_align: formBlock.heading_align,
    intro: formBlock.intro,
    submit_text: formBlock.submit_text,
    submit_alignment: formBlock.submit_alignment,
    success_message: formBlock.success_message,
    email_subject: formBlock.email_subject,
    email_to: formBlock.email_to,
    fields: formBlock.fields,
    section_theme: formBlock.section_theme,
    top_spacing: formBlock.top_spacing,
    bottom_spacing: formBlock.bottom_spacing,
  },
  argTypes: {
    form_id: { control: 'text', description: 'Stable secure identifier for the form block' },
    heading: { control: 'text', description: 'Visible form heading' },
    heading_tag: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      description: 'Semantic heading tag used for the visible heading',
    },
    heading_align: {
      control: 'inline-radio',
      options: ['left', 'center', 'right'],
      description: 'Heading and intro alignment',
    },
    intro: { control: 'text', description: 'Rich-text intro content (HTML)' },
    submit_text: { control: 'text', description: 'Submit button label' },
    submit_alignment: {
      control: 'inline-radio',
      options: ['left', 'center'],
      description: 'Button alignment inside the form panel',
    },
    success_message: { control: 'text', description: 'Success copy returned from the submit route' },
    email_subject: { control: 'text', description: 'Server-side email subject resolved from WordPress' },
    email_to: { control: 'text', description: 'Server-side recipient resolved from WordPress' },
    fields: { control: 'object', description: 'Field configuration repeater from WordPress' },
    ...blockStyleArgTypes,
  },
  render: (args) => (
    <MemoryRouter initialEntries={['/get-in-touch']}>
      <FormBlock block={{ acf_fc_layout: 'form_block', ...args }} />
    </MemoryRouter>
  ),
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const CenteredHeading: Story = {
  args: {
    heading_align: 'center',
    submit_alignment: 'center',
  },
}

export const DarkTheme: Story = {
  args: {
    section_theme: 'dark',
  },
}