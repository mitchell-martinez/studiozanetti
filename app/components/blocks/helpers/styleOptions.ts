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
  corporate: 'var(--color-surface)',
}

const MAX_WIDTH_MAP: Record<NonNullable<BlockStyleOptions['max_width']>, string> = {
  narrow: '680px',
  normal: '1200px',
  wide: '1440px',
}

export function getSectionStyle(
  options?: BlockStyleOptions,
  fallbackTheme: NonNullable<BlockStyleOptions['section_theme']> = 'light',
): CSSProperties {
  const theme = options?.section_theme ?? fallbackTheme
  const style: CSSProperties & Record<string, string> = {
    background: SECTION_BG_MAP[theme],
    paddingTop: SPACING_MAP[options?.top_spacing ?? 'md'],
    paddingBottom: SPACING_MAP[options?.bottom_spacing ?? 'md'],
  }

  if (theme === 'corporate') {
    style['--color-accent'] = '#333333'
    style['--color-accent-strong'] = '#1a1a1a'
    style['--color-accent-rgb'] = '51 51 51'
    style['--color-surface-soft'] = '#f5f5f5'
    style['--color-border-soft'] = '#d0d0d0'
    style['--shadow-card'] = '0 10px 30px rgb(0 0 0 / 12%)'
    style['--color-ink-soft'] = '#555555'
  }

  if (options?.max_width_px) {
    style.maxWidth = `${options.max_width_px}px`
    style.marginLeft = 'auto'
    style.marginRight = 'auto'
  } else if (options?.max_width) {
    style.maxWidth = MAX_WIDTH_MAP[options.max_width]
    style.marginLeft = 'auto'
    style.marginRight = 'auto'
  }

  return style
}

export function getBackgroundImageStyle(options?: BlockStyleOptions): CSSProperties | undefined {
  if (!options?.background_image?.url) return undefined
  const opacity = options.background_image_opacity ?? 0.15
  return {
    backgroundImage: `linear-gradient(rgb(0 0 0 / ${1 - opacity}), rgb(0 0 0 / ${1 - opacity})), url(${options.background_image.url})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  }
}
