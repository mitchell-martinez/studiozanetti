/** Renders trusted WordPress HTML content (WYSIWYG field or content.rendered). */
import styles from './RichText.module.scss'

interface RichTextProps {
  html: string
}

const RichText = ({ html }: RichTextProps) => (
  <div className={styles.richText} dangerouslySetInnerHTML={{ __html: html }} />
)

export default RichText
