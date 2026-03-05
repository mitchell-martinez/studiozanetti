import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockFaqAccordionBlock } from '../helpers/mockBlock'
import FaqAccordionBlock from '../index'

describe('FaqAccordionBlock', () => {
  it('renders question and toggles answer visibility', () => {
    render(<FaqAccordionBlock block={mockFaqAccordionBlock} />)

    expect(screen.getByText('Do you travel?')).toBeInTheDocument()
    expect(screen.getByText('Yes, across Sydney and beyond.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /do you travel/i }))
    expect(screen.queryByText('Yes, across Sydney and beyond.')).not.toBeInTheDocument()
  })
})
