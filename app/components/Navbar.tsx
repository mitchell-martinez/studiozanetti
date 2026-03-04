import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import type { WPMenuItem } from '~/types/wordpress'
import styles from './Navbar.module.scss'

// ─── Props ────────────────────────────────────────────────────────────────────
export interface NavbarProps {
  /** Navigation menu items from WordPress. Falls back to defaults when empty. */
  items: WPMenuItem[]
}

// ─── Fallback used until WordPress menu is configured ─────────────────────────
const FALLBACK_ITEMS: WPMenuItem[] = [
  { id: 1, title: 'Home', url: '/', children: [] },
  { id: 2, title: 'Gallery', url: '/gallery', children: [] },
  { id: 3, title: 'About', url: '/about', children: [] },
  { id: 4, title: 'Contact', url: '/contact', children: [] },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a WordPress absolute URL to a relative path for react-router. */
function toRelativePath(url: string): string {
  if (url.startsWith('/')) return url
  try {
    const parsed = new URL(url)
    return parsed.pathname + parsed.search + parsed.hash || '/'
  } catch {
    return url
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
const Navbar = ({ items }: NavbarProps) => {
  const navItems = items.length > 0 ? items : FALLBACK_ITEMS
  const location = useLocation()

  const [menuOpen, setMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<number | null>(null)
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset menu state on navigation — uses the React-recommended render-phase
  // "adjusting state when a prop changes" pattern to avoid both the
  // react-hooks/set-state-in-effect and react-hooks/refs lint warnings.
  const locationKey = location.pathname + location.search
  const [prevLocation, setPrevLocation] = useState(locationKey)

  if (locationKey !== prevLocation) {
    setPrevLocation(locationKey)
    setMenuOpen(false)
    setOpenDropdown(null)
  }

  const closeMenu = useCallback(() => {
    setMenuOpen(false)
    setOpenDropdown(null)
  }, [])

  const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), [])

  // Desktop: open dropdown on mouseenter (debounced to avoid flicker)
  const handleMouseEnter = useCallback((id: number) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current)
    setOpenDropdown(id)
  }, [])

  const handleMouseLeave = useCallback(() => {
    dropdownTimeoutRef.current = setTimeout(() => setOpenDropdown(null), 150)
  }, [])

  // Mobile: toggle dropdown accordion
  const toggleDropdown = useCallback((id: number) => {
    setOpenDropdown((prev) => (prev === id ? null : id))
  }, [])

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenDropdown(null)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <header className={styles.header}>
      {/* Skip to main content — a11y */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <nav className={styles.nav} aria-label="Main navigation">
        <Link to="/" className={styles.logo} aria-label="Studio Zanetti — home">
          Studio Zanetti
        </Link>

        <button
          className={styles.menuToggle}
          onClick={toggleMenu}
          aria-expanded={menuOpen}
          aria-controls="main-nav-list"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          type="button"
        >
          <span className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`} />
        </button>

        <ul
          id="main-nav-list"
          className={`${styles.navList} ${menuOpen ? styles.navListOpen : ''}`}
          role="list"
        >
          {navItems.map((item) => {
            const path = toRelativePath(item.url)
            const hasChildren = item.children.length > 0

            return (
              <li
                key={item.id}
                className={hasChildren ? styles.hasDropdown : undefined}
                onMouseEnter={hasChildren ? () => handleMouseEnter(item.id) : undefined}
                onMouseLeave={hasChildren ? handleMouseLeave : undefined}
              >
                <div className={styles.navItemWrap}>
                  <NavLink
                    to={path}
                    end={path === '/'}
                    className={({ isActive }) =>
                      `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                    }
                    onClick={closeMenu}
                  >
                    {item.title}
                  </NavLink>

                  {hasChildren && (
                    <button
                      className={`${styles.dropdownToggle} ${
                        openDropdown === item.id ? styles.dropdownToggleOpen : ''
                      }`}
                      onClick={() => toggleDropdown(item.id)}
                      aria-expanded={openDropdown === item.id}
                      aria-label={`Show ${item.title} submenu`}
                      type="button"
                    >
                      <svg
                        className={styles.caretIcon}
                        width="10"
                        height="6"
                        viewBox="0 0 10 6"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M1 1l4 4 4-4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {hasChildren && (
                  <ul
                    className={`${styles.dropdown} ${
                      openDropdown === item.id ? styles.dropdownOpen : ''
                    }`}
                    role="list"
                  >
                    {item.children.map((child) => (
                      <li key={child.id}>
                        <NavLink
                          to={toRelativePath(child.url)}
                          className={({ isActive }) =>
                            `${styles.dropdownLink} ${isActive ? styles.dropdownLinkActive : ''}`
                          }
                          onClick={closeMenu}
                        >
                          {child.title}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}

export default Navbar
