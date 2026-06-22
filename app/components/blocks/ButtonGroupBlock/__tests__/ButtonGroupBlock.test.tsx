import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { ButtonGroupBlock as ButtonGroupBlockType } from '~/types/wordpress'
import mockData from '../__mocks__/buttonGroupBlock.json'
import ButtonGroupBlock from '../index'

const base = mockData as unknown as ButtonGroupBlockType

const renderBlock = (overrides: Partial<ButtonGroupBlockType> = {}) =>
  render(
    <MemoryRouter>
      <ButtonGroupBlock block={{ ...base, ...overrides }} />
    </MemoryRouter>,
  )

describe('ButtonGroupBlock', () => {
  it('renders all buttons', () => {
    renderBlock()
    expect(screen.getByRole('button', { name: 'Send Enquiry' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'View Gallery' })).toBeInTheDocument()
  })

  it('renders nothing when buttons array is empty', () => {
    const { container } = renderBlock({ buttons: [] })
    expect(container.firstChild).toBeNull()
  })

  it('applies center alignment by default', () => {
    const { container } = renderBlock()
    const row = container.querySelector('section > div')!
    expect(row.className).toMatch(/alignCenter/)
  })

  it('applies left alignment', () => {
    const { container } = renderBlock({ alignment: 'left' })
    const row = container.querySelector('section > div')!
    expect(row.className).toMatch(/alignLeft/)
  })

  it('applies right alignment', () => {
    const { container } = renderBlock({ alignment: 'right' })
    const row = container.querySelector('section > div')!
    expect(row.className).toMatch(/alignRight/)
  })

  it('applies tight spacing', () => {
    const { container } = renderBlock({ spacing: 'tight' })
    expect(container.querySelector('section')!.className).toMatch(/spacingTight/)
  })

  it('applies loose spacing', () => {
    const { container } = renderBlock({ spacing: 'loose' })
    expect(container.querySelector('section')!.className).toMatch(/spacingLoose/)
  })

  it('buttons point to the correct URLs via data-href', () => {
    renderBlock()
    expect(screen.getByRole('button', { name: 'Send Enquiry' })).toHaveAttribute(
      'data-href',
      '/contact',
    )
    expect(screen.getByRole('button', { name: 'View Gallery' })).toHaveAttribute(
      'data-href',
      '/gallery',
    )
  })
})
