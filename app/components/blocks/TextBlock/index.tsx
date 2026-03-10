import Button from '~/components/Button'
import { getSectionStyle } from '../helpers/styleOptions'
import RichText from '../RichText'
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

const TextBlock = ({ block, dark }: TextBlockProps) => (
  <section
    className={styles.section}
    style={
      dark
        ? { ...getSectionStyle(block), background: 'var(--color-light-gray)' }
        : getSectionStyle(block)
    }
  >
    <div
      className={[
        styles.textContent,
        textAlignClass[block.align ?? 'left'],
        blockAlignClass[block.block_align ?? 'left'],
        widthClass[block.max_width ?? 'normal'],
      ]
        .filter(Boolean)
        .join(' ')}
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

export default TextBlock
