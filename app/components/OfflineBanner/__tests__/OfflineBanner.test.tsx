import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the useOnlineStatus hook
vi.mock('~/hooks/useOnlineStatus', () => ({
  default: vi.fn(() => true),
}))

import useOnlineStatus from '~/hooks/useOnlineStatus'
import OfflineBanner from '../index'

const mockUseOnlineStatus = vi.mocked(useOnlineStatus)

beforeEach(() => {
  mockUseOnlineStatus.mockReturnValue(true)
})

describe('OfflineBanner', () => {
  it('renders nothing when online', () => {
    mockUseOnlineStatus.mockReturnValue(true)
    const { container } = render(<OfflineBanner />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the offline banner when offline', () => {
    mockUseOnlineStatus.mockReturnValue(false)
    render(<OfflineBanner />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/you are offline/i)).toBeInTheDocument()
  })

  it('has aria-live="polite" for screen reader announcements', () => {
    mockUseOnlineStatus.mockReturnValue(false)
    render(<OfflineBanner />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
  })
})
