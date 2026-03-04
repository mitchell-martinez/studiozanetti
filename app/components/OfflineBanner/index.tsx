import useOnlineStatus from '~/hooks/useOnlineStatus'
import styles from './OfflineBanner.module.scss'

const OfflineBanner = () => {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className={styles.banner} role="status" aria-live="polite">
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          d="M1 6s4-4 11-4 11 4 11 4M5 10s2.5-2.5 7-2.5 7 2.5 7 2.5M9 14s1.5-1.5 3-1.5 3 1.5 3 1.5M12 18h.01"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
      </svg>
      You are offline — some content may not be available.
    </div>
  )
}

export default OfflineBanner
