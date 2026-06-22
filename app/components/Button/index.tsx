import { useNavigate } from 'react-router'
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
 * Returns true when URL points to a non-studiozanetti domain and should open in a new tab.
 */
const shouldOpenInNewTabForDomain = (url: string): boolean => {
  if (!/^https?:\/\/|^\/\//.test(url)) return false

  try {
    const parsed = new URL(url.startsWith('//') ? `https:${url}` : url)
    const host = parsed.hostname.toLowerCase()
    return host !== 'studiozanetti.com.au' && !host.endsWith('.studiozanetti.com.au')
  } catch {
    return true
  }
}

/**
 * Shared Button / CTA component.
 *
 * Always renders a semantic native `<button>`.
 *
 * - Relative/internal paths and studiozanetti absolute URLs navigate in the same tab.
 * - Non-studiozanetti absolute URLs open in a new tab.
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  href,
  inverted = false,
  fullWidth = false,
  className,
  ariaLabel,
  type = 'button',
  disabled = false,
  onClick,
}: ButtonProps) => {
  const navigate = useNavigate()

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

  const handleClick = () => {
    if (disabled) return

    onClick?.()

    if (!href) return

    if (shouldOpenInNewTabForDomain(href)) {
      window.open(href, '_blank', 'noopener,noreferrer')
      return
    }

    try {
      const parsed = new URL(href.startsWith('//') ? `https:${href}` : href)
      navigate(`${parsed.pathname || '/'}${parsed.search}${parsed.hash}`)
    } catch {
      navigate(href)
    }
  }

  return (
    <button
      type={type}
      className={cls}
      aria-label={ariaLabel}
      data-href={href}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export default Button
