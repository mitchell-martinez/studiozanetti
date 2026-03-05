import type { MetaFunction } from 'react-router'
import { Link } from 'react-router'
import styles from './404.module.scss'

export const meta: MetaFunction = () => [
  { title: 'Page Not Found | Studio Zanetti' },
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
        <Link to="/" className={styles.primary}>
          Back to Home
        </Link>
        <Link to="/gallery" className={styles.secondary}>
          View Gallery
        </Link>
      </div>
    </div>
  </section>
)

export default NotFoundRoute
