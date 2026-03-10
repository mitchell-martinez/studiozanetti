/** Renders trusted WordPress HTML content (WYSIWYG field or content.rendered). */
import styles from './RichText.module.scss'

type FontSize = 'sm' | 'md' | 'lg'

interface RichTextProps {
  html: string
  /** Body font size — sm (default), md, or lg */
  fontSize?: FontSize
}

const sizeClass: Record<FontSize, string> = {
  sm: styles.fontSm,
  md: styles.fontMd,
  lg: styles.fontLg,
}

const RichText = ({ html, fontSize = 'sm' }: RichTextProps) => (
  <div
    className={`${styles.richText} ${sizeClass[fontSize]}`}
    dangerouslySetInnerHTML={{ __html: html }}
  />
)

export default RichText
