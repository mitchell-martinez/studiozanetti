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

  it('allows multiple FAQs to remain open at once', () => {
    const blockWithClosedFirstItem: FaqAccordionBlockType = {
      ...mockFaqAccordionBlock,
      open_first_item: false,
      faq_items: [
        ...(mockFaqAccordionBlock.faq_items ?? []),
        {
          question: 'How long does it take?',
          answer: '<p>Gallery delivery in about 3 weeks.</p>',
        },
      ],
    }

    render(<FaqAccordionBlock block={blockWithClosedFirstItem} />)

    const firstQuestion = screen.getByRole('button', { name: /do you travel/i })
    const secondQuestion = screen.getByRole('button', { name: /how long does it take/i })

    fireEvent.click(firstQuestion)
    fireEvent.click(secondQuestion)

    expect(firstQuestion).toHaveAttribute('aria-expanded', 'true')
    expect(secondQuestion).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Yes, across Sydney and beyond.')).toBeInTheDocument()
    expect(screen.getByText('Gallery delivery in about 3 weeks.')).toBeInTheDocument()
  })
})
