import { createContext, useContext } from 'react'
import type {
  AnalyticsEventDetails,
  AnalyticsEventType,
  AnalyticsVisitContext,
} from '~/lib/analytics'

interface AnalyticsContextValue {
  trackEvent: (eventType: AnalyticsEventType, details?: AnalyticsEventDetails) => void
  getVisitContext: () => AnalyticsVisitContext | undefined
}

export const AnalyticsContext = createContext<AnalyticsContextValue>({
  trackEvent: () => undefined,
  getVisitContext: () => undefined,
})

export const useAnalytics = () => useContext(AnalyticsContext)