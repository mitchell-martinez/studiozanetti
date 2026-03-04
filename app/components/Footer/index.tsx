import { Link } from 'react-router'
import type { WPMenuItem } from '~/types/wordpress'
import { toRelativePath } from '../Navbar/helpers/toRelativePath'
import styles from './Footer.module.scss'
import type { FooterProps } from './types'

/** Fallback top-level links used when WordPress menu is not configured. */
const FALLBACK_ITEMS: WPMenuItem[] = [
  { id: 1, title: 'Home', url: '/', children: [] },
  { id: 2, title: 'Gallery', url: '/gallery', children: [] },
  { id: 3, title: 'About', url: '/about', children: [] },
  { id: 4, title: 'Contact', url: '/contact', children: [] },
]

const Footer = ({ items }: FooterProps) => {
  const navItems = items.length > 0 ? items : FALLBACK_ITEMS
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <span className={styles.logo}>Studio Zanetti</span>
          <p className={styles.tagline}>Capturing moments, creating memories</p>
        </div>

        <nav className={styles.links} aria-label="Footer navigation">
          {navItems.map((item) => (
            <Link key={item.id} to={toRelativePath(item.url)} className={styles.link}>
              {item.title}
            </Link>
          ))}
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
        <p>&copy; {year} Studio Zanetti. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer
