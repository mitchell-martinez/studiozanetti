import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, useLocation } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAnalytics } from '../context'
import AnalyticsProvider from '../index'
import type { AnalyticsVisitContext } from '~/lib/analytics'

const sendBeacon = vi.fn<(url: string, data?: BodyInit | null) => boolean>(() => true)

const EventButton = () => {
  const { trackEvent } = useAnalytics()
  return (
    <button type="button" onClick={() => trackEvent('form_start', { formId: 'contact' })}>
      Start form
    </button>
  )
}

const VisitContextButton = ({
  onSnapshot,
}: {
  onSnapshot: (context: AnalyticsVisitContext | undefined) => void
}) => {
  const { getVisitContext } = useAnalytics()
  return (
    <button type="button" onClick={() => onSnapshot(getVisitContext())}>
      Read visit
    </button>
  )
}

const NavigationExample = () => {
  const location = useLocation()
  return (
    <AnalyticsProvider
      page={{
        pagePath: location.pathname,
        pageId: location.pathname === '/weddings' ? 42 : 43,
        siteGroup: 'weddings',
        hasPricingBlock: false,
        hasFormBlock: false,
        contextToken: 'a'.repeat(64),
      }}
    >
      <Link to="/weddings/pricing">Pricing</Link>
    </AnalyticsProvider>
  )
}

afterEach(() => {
  window.sessionStorage.clear()
  Object.defineProperty(document, 'referrer', { configurable: true, value: '' })
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe('AnalyticsProvider', () => {
  it('sends one classified page view without raw timezone or referrer data', async () => {
    vi.stubGlobal('navigator', { ...navigator, sendBeacon })

    render(
      <MemoryRouter initialEntries={['/pricing?utm_source=newsletter']}>
        <AnalyticsProvider
          page={{
            pagePath: '/pricing',
            pageId: 42,
            siteGroup: 'weddings',
            hasPricingBlock: false,
            hasFormBlock: false,
            contextToken: 'a'.repeat(64),
          }}
        >
          <div>Pricing</div>
        </AnalyticsProvider>
      </MemoryRouter>,
    )

    await waitFor(() => expect(sendBeacon).toHaveBeenCalledOnce())
    const payload = JSON.parse(sendBeacon.mock.calls[0]?.[1] as string)

    expect(payload).toMatchObject({
      eventType: 'page_view',
      pagePath: '/pricing',
      pageId: 42,
      siteGroup: 'weddings',
    })
    expect(payload).not.toHaveProperty('timeZone')
    expect(payload).not.toHaveProperty('referrer')
    expect(payload).not.toHaveProperty('utmSource')
  })

  it('sends explicit form events through context', async () => {
    vi.stubGlobal('navigator', { ...navigator, sendBeacon })
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/contact']}>
        <AnalyticsProvider
          page={{
            pagePath: '/contact',
            pageId: 7,
            siteGroup: 'corporate',
            hasPricingBlock: false,
            hasFormBlock: true,
            contextToken: 'a'.repeat(64),
          }}
        >
          <EventButton />
        </AnalyticsProvider>
      </MemoryRouter>,
    )

    await waitFor(() => expect(sendBeacon).toHaveBeenCalledTimes(1))
    await user.click(screen.getByRole('button', { name: 'Start form' }))

    expect(sendBeacon).toHaveBeenCalledTimes(2)
    const pageView = JSON.parse(sendBeacon.mock.calls[0]?.[1] as string)
    const formStart = JSON.parse(sendBeacon.mock.calls[1]?.[1] as string)
    expect(formStart).toMatchObject({
      eventType: 'form_start',
      pagePath: '/contact',
      formId: 'contact',
      hasFormBlock: true,
      sessionId: pageView.sessionId,
      sessionSequence: 2,
    })
    expect(pageView.sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
    expect(pageView.sessionSequence).toBe(1)
  })

  it('attributes later client-side navigations as internal', async () => {
    vi.stubGlobal('navigator', { ...navigator, sendBeacon })
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/weddings']}>
        <NavigationExample />
      </MemoryRouter>,
    )

    await waitFor(() => expect(sendBeacon).toHaveBeenCalledTimes(1))
    await user.click(screen.getByRole('link', { name: 'Pricing' }))
    await waitFor(() => expect(sendBeacon).toHaveBeenCalledTimes(2))

    expect(JSON.parse(sendBeacon.mock.calls[1]?.[1] as string)).toMatchObject({
      pagePath: '/weddings/pricing',
      referrerCategory: 'internal',
    })
  })

  it('preserves the original source during an active same-origin visit', async () => {
    vi.stubGlobal('navigator', { ...navigator, sendBeacon })
    vi.spyOn(Date, 'now').mockReturnValue(120_000)
    Object.defineProperty(document, 'referrer', {
      configurable: true,
      value: `${window.location.origin}/pricing`,
    })
    window.sessionStorage.setItem('sz_analytics_visit', JSON.stringify({
      source: { category: 'search', domain: 'google.com.au' },
      landingPage: '/weddings',
      regionBucket: 'AU-VIC',
      startedAtMs: 1_000,
      currentPage: '/pricing',
      pageStartedAtMs: 100_000,
      lastActiveAtMs: 119_000,
      pagesViewed: 2,
    }))
    const onSnapshot = vi.fn()

    render(
      <MemoryRouter initialEntries={['/contact']}>
        <AnalyticsProvider
          page={{
            pagePath: '/contact',
            pageId: 7,
            siteGroup: 'weddings',
            hasPricingBlock: false,
            hasFormBlock: true,
            contextToken: 'a'.repeat(64),
          }}
        >
          <VisitContextButton onSnapshot={onSnapshot} />
        </AnalyticsProvider>
      </MemoryRouter>,
    )

    await waitFor(() => expect(sendBeacon).toHaveBeenCalledOnce())
    fireEvent.click(screen.getByRole('button', { name: 'Read visit' }))
    expect(onSnapshot).toHaveBeenCalledWith(expect.objectContaining({
      sourceCategory: 'search',
      sourceDomain: 'google.com.au',
      landingPage: '/weddings',
      pagesViewed: 3,
      siteDurationSeconds: 119,
      pageDurationSeconds: 0,
    }))
  })

  it('starts a new visit after 30 minutes of inactivity', async () => {
    vi.stubGlobal('navigator', { ...navigator, sendBeacon })
    vi.spyOn(Date, 'now').mockReturnValue(2_000_000)
    window.sessionStorage.setItem('sz_analytics_visit', JSON.stringify({
      source: { category: 'search', domain: 'google.com.au' },
      landingPage: '/old-visit',
      regionBucket: 'AU-VIC',
      startedAtMs: 1_000,
      currentPage: '/old-visit',
      pageStartedAtMs: 1_000,
      lastActiveAtMs: 100_000,
      pagesViewed: 8,
    }))
    const onSnapshot = vi.fn()

    render(
      <MemoryRouter initialEntries={['/contact']}>
        <AnalyticsProvider
          page={{
            pagePath: '/contact',
            pageId: 7,
            siteGroup: 'weddings',
            hasPricingBlock: false,
            hasFormBlock: true,
            contextToken: 'a'.repeat(64),
          }}
        >
          <VisitContextButton onSnapshot={onSnapshot} />
        </AnalyticsProvider>
      </MemoryRouter>,
    )

    await waitFor(() => expect(sendBeacon).toHaveBeenCalledOnce())
    fireEvent.click(screen.getByRole('button', { name: 'Read visit' }))
    expect(onSnapshot).toHaveBeenCalledWith(expect.objectContaining({
      sourceCategory: 'direct',
      landingPage: '/contact',
      pagesViewed: 1,
      siteDurationSeconds: 0,
    }))
  })

  it('starts a new visit for a fresh external arrival in the same tab', async () => {
    vi.stubGlobal('navigator', { ...navigator, sendBeacon })
    vi.spyOn(Date, 'now').mockReturnValue(120_000)
    Object.defineProperty(document, 'referrer', {
      configurable: true,
      value: 'https://www.google.com/search?q=photographer',
    })
    window.sessionStorage.setItem('sz_analytics_visit', JSON.stringify({
      source: { category: 'direct' },
      landingPage: '/old-visit',
      regionBucket: 'AU-VIC',
      startedAtMs: 1_000,
      currentPage: '/old-visit',
      pageStartedAtMs: 100_000,
      lastActiveAtMs: 119_000,
      pagesViewed: 3,
    }))
    const onSnapshot = vi.fn()

    render(
      <MemoryRouter initialEntries={['/contact']}>
        <AnalyticsProvider
          page={{
            pagePath: '/contact',
            pageId: 7,
            siteGroup: 'weddings',
            hasPricingBlock: false,
            hasFormBlock: true,
            contextToken: 'a'.repeat(64),
          }}
        >
          <VisitContextButton onSnapshot={onSnapshot} />
        </AnalyticsProvider>
      </MemoryRouter>,
    )

    await waitFor(() => expect(sendBeacon).toHaveBeenCalledOnce())
    fireEvent.click(screen.getByRole('button', { name: 'Read visit' }))
    expect(onSnapshot).toHaveBeenCalledWith(expect.objectContaining({
      sourceCategory: 'search',
      sourceDomain: 'google.com',
      landingPage: '/contact',
      pagesViewed: 1,
    }))
  })

  it('omits visit context when the current page becomes inactive for over 30 minutes', async () => {
    vi.stubGlobal('navigator', { ...navigator, sendBeacon })
    let now = 1_000
    vi.spyOn(Date, 'now').mockImplementation(() => now)
    const onSnapshot = vi.fn()

    render(
      <MemoryRouter initialEntries={['/contact']}>
        <AnalyticsProvider
          page={{
            pagePath: '/contact',
            pageId: 7,
            siteGroup: 'weddings',
            hasPricingBlock: false,
            hasFormBlock: true,
            contextToken: 'a'.repeat(64),
          }}
        >
          <VisitContextButton onSnapshot={onSnapshot} />
        </AnalyticsProvider>
      </MemoryRouter>,
    )

    await waitFor(() => expect(sendBeacon).toHaveBeenCalledOnce())
    now += (30 * 60 * 1000) + 1
    fireEvent.click(screen.getByRole('button', { name: 'Read visit' }))
    expect(onSnapshot).toHaveBeenCalledWith(undefined)
    expect(window.sessionStorage.getItem('sz_analytics_visit')).toBeNull()
  })
})