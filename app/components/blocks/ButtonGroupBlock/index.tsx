import Button from '~/components/Button'
import { getSectionStyle } from '../helpers/styleOptions'
import styles from './ButtonGroupBlock.module.scss'
import type { ButtonGroupBlockProps } from './types'

const alignClass: Record<string, string> = {
  left: styles.alignLeft,
  center: styles.alignCenter,
  right: styles.alignRight,
}

const spacingClass: Record<string, string> = {
  tight: styles.spacingTight,
  normal: styles.spacingNormal,
  loose: styles.spacingLoose,
}

const ButtonGroupBlock = ({ block }: ButtonGroupBlockProps) => {
  if (!block.buttons?.length) return null

  const alignment = alignClass[block.alignment ?? 'center'] ?? ''
  const spacing = spacingClass[block.spacing ?? 'normal'] ?? ''

  return (
    <section className={`${styles.section} ${spacing}`} style={getSectionStyle(block)}>
      <div className={`${styles.buttonRow} ${alignment}`}>
        {block.buttons.map((btn, i) => (
          <Button
            key={`${btn.url}-${i}`}
            href={btn.url}
            variant={btn.variant ?? 'primary'}
            size={btn.size ?? 'md'}
            openInNewTab={btn.open_in_new_tab}
          >
            {btn.label}
          </Button>
        ))}
      </div>
    </section>
  )
}

export default ButtonGroupBlock
