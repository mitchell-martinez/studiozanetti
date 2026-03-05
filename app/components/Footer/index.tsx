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

const Footer = ({ items, siteSettings }: FooterProps) => {
  const navItems = items.length > 0 ? items : FALLBACK_ITEMS
  const year = new Date().getFullYear()
  const { site_name, tagline, copyright_text, social_links } = siteSettings

  // Build copyright string: use custom text if provided, otherwise auto-generate
  const copyrightDisplay = copyright_text || `\u00A9 ${year} ${site_name}. All rights reserved.`

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <span className={styles.logo}>{site_name}</span>
          <p className={styles.tagline}>{tagline}</p>
        </div>

        <nav className={styles.links} aria-label="Footer navigation">
          {navItems.map((item) => (
            <Link key={item.id} to={toRelativePath(item.url)} className={styles.link}>
              {item.title}
            </Link>
          ))}
        </nav>

        {social_links.length > 0 && (
          <div className={styles.social}>
            {social_links.map((social) => (
              <a
                key={social.platform}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label={`${site_name} on ${social.platform} (opens in new tab)`}
              >
                {social.platform}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className={styles.bottom}>
        <p>{copyrightDisplay}</p>
      </div>
    </footer>
  )
}

export default Footer
