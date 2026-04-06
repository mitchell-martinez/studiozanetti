import Button from '~/components/Button';
import styles from './ErrorPage.module.scss';
import type { ErrorPageProps, ErrorVariant } from './types';

const CONTENT: Record<ErrorVariant, { kicker: string; title: string; text: string }> = {
  offline: {
    kicker: 'Offline',
    title: "You're offline",
    text: "It looks like you've lost your internet connection. Check your connection and try again.",
  },
  server: {
    kicker: 'Server Error',
    title: "We're having trouble connecting",
    text: "Our server isn't responding right now. Please try again in a moment.",
  },
  generic: {
    kicker: 'Error',
    title: 'Something went wrong',
    text: 'An unexpected error occurred. Please try again or head back to the homepage.',
  },
}

/** SVG icons for each error variant — kept inline to avoid extra network requests. */
const ICONS: Record<ErrorVariant, React.ReactNode> = {
  offline: (
    <svg
      viewBox="0 0 24 24"
      width="48"
      height="48"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        d="M1 6s4-4 11-4 11 4 11 4M5 10s2.5-2.5 7-2.5 7 2.5 7 2.5M9 14s1.5-1.5 3-1.5 3 1.5 3 1.5M12 18h.01"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
    </svg>
  ),
  server: (
    <svg
      viewBox="0 0 24 24"
      width="48"
      height="48"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="8" rx="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" />
      <circle cx="6" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="6" cy="18" r="1" fill="currentColor" stroke="none" />
      <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
    </svg>
  ),
  generic: (
    <svg
      viewBox="0 0 24 24"
      width="48"
      height="48"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" />
    </svg>
  ),
}

const ErrorPage = ({ variant, status }: ErrorPageProps) => {
  const content = CONTENT[variant]
  const kicker = status ? `${status}` : content.kicker

  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <section className={styles.wrap} aria-labelledby="error-title">
      <div className={styles.card}>
        <div className={styles.iconWrap}>{ICONS[variant]}</div>
        <p className={styles.kicker}>{kicker}</p>
        <h1 id="error-title" className={styles.title}>
          {content.title}
        </h1>
        <p className={styles.text}>{content.text}</p>
        <div className={styles.actions}>
          <Button variant="primary" size="sm" onClick={handleRetry}>
            Try Again
          </Button>
          <Button href="/" variant="secondary" size="sm">
            Back to Home
          </Button>
        </div>
      </div>
    </section>
  )
}

export default ErrorPage
