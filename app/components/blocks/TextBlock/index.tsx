import Button from '~/components/Button'
import RichText from '~/components/RichText'
import { getSectionStyle } from '../helpers/styleOptions'
import styles from './TextBlock.module.scss'
import type { TextBlockProps } from './types'

const textAlignClass: Record<string, string | undefined> = {
  left: styles.textLeft,
  center: styles.textCenter,
  right: styles.textRight,
  justify: styles.textJustify,
}

const blockAlignClass: Record<string, string | undefined> = {
  left: styles.blockLeft,
  center: styles.blockCenter,
  right: styles.blockRight,
}

const widthClass: Record<string, string | undefined> = {
  narrow: styles.maxNarrow,
  normal: styles.maxNormal,
  wide: styles.maxWide,
}

const TextBlock = ({ block, dark }: TextBlockProps) => {
  // TextBlock uses max_width for its inner text container, not the outer section.
  // Strip both so getSectionStyle doesn't constrain the full-width section background.
  const { max_width: _textWidth, max_width_px: _textWidthPx, ...sectionOptions } = block

  return (
    <section
      className={styles.section}
      style={
        dark
          ? { ...getSectionStyle(sectionOptions), background: 'var(--color-light-gray)' }
          : getSectionStyle(sectionOptions)
      }
    >
      <div
        className={[
          styles.textContent,
          textAlignClass[block.align ?? 'center'],
          blockAlignClass[block.block_align ?? 'center'],
          !block.max_width_px ? widthClass[block.max_width ?? 'normal'] : undefined,
        ]
          .filter(Boolean)
          .join(' ')}
        style={block.max_width_px ? { maxWidth: `${block.max_width_px}px` } : undefined}
      >
        {block.eyebrow && <p className={styles.eyebrow}>{block.eyebrow}</p>}
        {block.heading && <h2 className={styles.textHeading}>{block.heading}</h2>}
        <RichText html={block.body} fontSize={block.font_size} />
        {block.cta_text && block.cta_url && (
          <Button href={block.cta_url} variant="text" size="sm">
            {block.cta_text} →
          </Button>
        )}
      </div>
    </section>
  )
}

export default TextBlock
