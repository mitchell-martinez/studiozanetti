import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockProcessTimelineBlock } from '../helpers/mockBlock'
import ProcessTimelineBlock from '../index'

describe('ProcessTimelineBlock', () => {
  it('renders process steps in order', () => {
    render(<ProcessTimelineBlock block={mockProcessTimelineBlock} />)

    expect(screen.getByRole('heading', { name: 'Our Process', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('Get in touch')).toBeInTheDocument()
    expect(screen.getByText('Wedding day')).toBeInTheDocument()
  })
})
