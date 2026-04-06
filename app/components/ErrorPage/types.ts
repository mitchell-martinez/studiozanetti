export type ErrorVariant = 'offline' | 'server' | 'generic'

export interface ErrorPageProps {
  /** Which flavour of error to display */
  variant: ErrorVariant
  /** Optional HTTP status code shown as the kicker (e.g. 502) */
  status?: number
}
