import type { ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'dark' | 'text'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps {
  /** Button label content */
  children: ReactNode
  /** Visual style variant */
  variant?: ButtonVariant
  /** Size preset controlling padding / font-size */
  size?: ButtonSize
  /** URL — renders a Link (internal) or <a> (external / new tab). Omit for a <button>. */
  href?: string
  /** Open link in a new browser tab */
  openInNewTab?: boolean
  /** Inverted colour scheme for use on dark / image overlays */
  inverted?: boolean
  /** Stretch to full container width */
  fullWidth?: boolean
  /** Extra className for composition */
  className?: string
  /** Accessible label override */
  ariaLabel?: string
  /** Native button type (ignored when href is set) */
  type?: 'button' | 'submit' | 'reset'
  /** Click handler (ignored when href is set) */
  onClick?: () => void
}
