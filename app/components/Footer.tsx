import { Link } from 'react-router'
import styles from './Footer.module.scss'

const Footer = () => {
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <span className={styles.logo}>Studio Zanetti</span>
          <p className={styles.tagline}>Capturing moments, creating memories</p>
        </div>

        <nav className={styles.links} aria-label="Footer navigation">
          <Link to="/" className={styles.link}>
            Home
          </Link>
          <Link to="/gallery" className={styles.link}>
            Gallery
          </Link>
          <Link to="/about" className={styles.link}>
            About
          </Link>
          <Link to="/contact" className={styles.link}>
            Contact
          </Link>
        </nav>

        <div className={styles.social}>
          <a
            href="https://instagram.com/studiozanetti"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialLink}
            aria-label="Studio Zanetti on Instagram (opens in new tab)"
          >
            Instagram
          </a>
          <a
            href="https://facebook.com/studiozanetti"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialLink}
            aria-label="Studio Zanetti on Facebook (opens in new tab)"
          >
            Facebook
          </a>
        </div>
      </div>

      <div className={styles.bottom}>
        <p>© {year} Studio Zanetti. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer
