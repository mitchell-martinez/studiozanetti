import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockTestimonialCarouselBlock } from '../helpers/mockBlock'
import TestimonialCarouselBlock from '../index'

describe('TestimonialCarouselBlock', () => {
  it('renders heading and testimonial content', () => {
    render(<TestimonialCarouselBlock block={mockTestimonialCarouselBlock} />)

    expect(screen.getByRole('heading', { name: 'Kind Words', level: 2 })).toBeInTheDocument()
    expect(screen.getByText(/captured every moment beautifully/i)).toBeInTheDocument()
    expect(screen.getByText('Alix & Richard')).toBeInTheDocument()
  })
})
