import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { FaqAccordionBlock as FaqAccordionBlockType } from '~/types/wordpress'
import testFaqAccordionBlock from '../__mocks__/testFaqAccordionBlock.json'
import FaqAccordionBlock from '../index'

const mockFaqAccordionBlock = testFaqAccordionBlock as FaqAccordionBlockType

describe('FaqAccordionBlock', () => {
  it('renders question and toggles answer visibility', () => {
    render(<FaqAccordionBlock block={mockFaqAccordionBlock} />)

    expect(screen.getByText('Do you travel?')).toBeInTheDocument()
    expect(screen.getByText('Yes, across Sydney and beyond.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /do you travel/i }))
    expect(screen.queryByText('Yes, across Sydney and beyond.')).not.toBeInTheDocument()
  })
})
