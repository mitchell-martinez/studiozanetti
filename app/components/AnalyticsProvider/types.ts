import type { AnalyticsPageContext } from '~/lib/analytics'

export interface AnalyticsProviderProps {
  children: React.ReactNode
  page?: AnalyticsPageContext
}