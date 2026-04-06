import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import Pagination from '~/components/Pagination'

function PaginationPreview({
  totalPages,
  initialPage,
}: {
  totalPages: number
  initialPage: number
}) {
  const [page, setPage] = useState(initialPage)
  return (
    <Pagination
      currentPage={page}
      totalPages={totalPages}
      onPageChange={setPage}
    />
  )
}

const meta: Meta<{ totalPages: number; initialPage: number }> = {
  title: 'Components/Pagination',
  tags: ['autodocs'],
  args: {
    totalPages: 5,
    initialPage: 1,
  },
  argTypes: {
    totalPages: {
      control: { type: 'number', min: 1, max: 50, step: 1 },
      description: 'Total number of pages',
    },
    initialPage: {
      control: { type: 'number', min: 1, max: 50, step: 1 },
      description: 'Starting page number',
    },
  },
  render: (args) => <PaginationPreview {...args} />,
}

export default meta
type Story = StoryObj<typeof meta>

/** Default: 5 pages starting on page 1. */
export const Default: Story = {}

/** Many pages — shows ellipsis. */
export const ManyPages: Story = {
  args: { totalPages: 20, initialPage: 10 },
}

/** Single page — hides pagination. */
export const SinglePage: Story = {
  args: { totalPages: 1 },
}

/** Two pages. */
export const TwoPages: Story = {
  args: { totalPages: 2 },
}
