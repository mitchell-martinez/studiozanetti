import type { MetaFunction } from 'react-router'
import Button from '~/components/Button'
import styles from './404.module.scss'

export const meta: MetaFunction = () => [
  { title: 'Page Not Found | Studio Zanetti' },
  { name: 'robots', content: 'noindex, follow' },
  {
    name: 'description',
    content:
      "The page you're looking for could not be found. Explore Studio Zanetti's wedding photography pages.",
  },
]

const NotFoundRoute = () => (
  <section className={styles.wrap} aria-labelledby="not-found-title">
    <div className={styles.card}>
      <p className={styles.kicker}>404</p>
      <h1 id="not-found-title" className={styles.title}>
        This page stepped out of frame
      </h1>
      <p className={styles.text}>
        The link may be old, or the page may have moved. Let&apos;s get you back to the moments that
        matter.
      </p>
      <div className={styles.actions}>
        <Button href="/" variant="primary" size="sm">
          Back to Home
        </Button>
        <Button href="/gallery" variant="secondary" size="sm">
          View Gallery
        </Button>
      </div>
    </div>
  </section>
)

export default NotFoundRoute
