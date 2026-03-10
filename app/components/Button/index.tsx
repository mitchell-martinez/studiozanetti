import { Link } from 'react-router'
import styles from './Button.module.scss'
import type { ButtonProps, ButtonSize, ButtonVariant } from './types'

const variantClass: Record<ButtonVariant, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  outline: styles.outline,
  dark: styles.dark,
  text: styles.text,
}

const sizeClass: Record<ButtonSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
}

/**
 * Checks whether a URL is external (absolute http/https or protocol-relative).
 */
const isExternal = (url: string): boolean => /^https?:\/\/|^\/\//.test(url)

/**
 * Shared Button / CTA component.
 *
 * - `href` supplied → renders `<Link>` (internal) or `<a>` (external / new-tab).
 * - No `href` → renders a native `<button>`.
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  href,
  openInNewTab = false,
  inverted = false,
  fullWidth = false,
  className,
  ariaLabel,
  type = 'button',
  onClick,
}: ButtonProps) => {
  const cls = [
    styles.btn,
    variantClass[variant],
    sizeClass[size],
    inverted && styles.inverted,
    fullWidth && styles.fullWidth,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  // External URL or new-tab → standard <a> with security attrs
  if (href && (openInNewTab || isExternal(href))) {
    return (
      <a
        href={href}
        className={cls}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
      >
        {children}
      </a>
    )
  }

  // Internal URL → react-router <Link>
  if (href) {
    return (
      <Link to={href} className={cls} aria-label={ariaLabel}>
        {children}
      </Link>
    )
  }

  // No URL → native <button>
  return (
    <button type={type} className={cls} aria-label={ariaLabel} onClick={onClick}>
      {children}
    </button>
  )
}

export default Button
