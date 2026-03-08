import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { TestimonialCarouselBlock as TestimonialCarouselBlockType } from '~/types/wordpress'
import testTestimonialCarouselBlock from '../__mocks__/testTestimonialCarouselBlock.json'
import TestimonialCarouselBlock from '../index'

const mockTestimonialCarouselBlock = testTestimonialCarouselBlock as TestimonialCarouselBlockType

describe('TestimonialCarouselBlock', () => {
  it('renders heading and testimonial content', () => {
    render(<TestimonialCarouselBlock block={mockTestimonialCarouselBlock} />)

    expect(screen.getByRole('heading', { name: 'Kind Words', level: 2 })).toBeInTheDocument()
    expect(screen.getByText(/captured every moment beautifully/i)).toBeInTheDocument()
    expect(screen.getByText('Alix & Richard')).toBeInTheDocument()
  })
})
