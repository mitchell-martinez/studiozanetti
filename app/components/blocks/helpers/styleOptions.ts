import type { CSSProperties } from 'react'
import type { BlockStyleOptions } from '~/types/wordpress'

const SPACING_MAP: Record<NonNullable<BlockStyleOptions['top_spacing']>, string> = {
  none: '0',
  sm: '2rem',
  md: '3.5rem',
  lg: '5rem',
}

const SECTION_BG_MAP: Record<NonNullable<BlockStyleOptions['section_theme']>, string> = {
  light: 'var(--color-surface)',
  rose: 'var(--color-surface-soft)',
  champagne: 'var(--color-light-gray)',
  dark: 'var(--color-dark)',
}

export function getSectionStyle(
  options?: BlockStyleOptions,
  fallbackTheme: NonNullable<BlockStyleOptions['section_theme']> = 'light',
): CSSProperties {
  const theme = options?.section_theme ?? fallbackTheme
  return {
    background: SECTION_BG_MAP[theme],
    paddingTop: SPACING_MAP[options?.top_spacing ?? 'md'],
    paddingBottom: SPACING_MAP[options?.bottom_spacing ?? 'md'],
  }
}
