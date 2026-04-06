import { Link } from 'react-router'
import { stripHtml } from '~/lib/html'
import styles from './PostCard.module.scss'
import type { PostCardProps } from './types'

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const PostCard = ({
  post,
  cardStyle = 'elevated',
  showExcerpt = true,
  showFeaturedImage = true,
  showDate = true,
  showReadingTime = true,
  layout = 'grid',
}: PostCardProps) => {
  const styleClass =
    cardStyle === 'outline'
      ? styles.cardOutline
      : cardStyle === 'minimal'
        ? styles.cardMinimal
        : styles.cardElevated

  const layoutClass = layout === 'list' ? styles.listLayout : styles.gridLayout

  return (
    <article className={`${styles.card} ${styleClass} ${layoutClass}`}>
      <Link to={`/${post.slug}`} className={styles.cardLink}>
        {showFeaturedImage && post.featured_image && (
          <div className={styles.imageWrap}>
            <img
              src={post.featured_image.url}
              alt={post.featured_image.alt || stripHtml(post.title.rendered)}
              className={styles.image}
              loading="lazy"
              decoding="async"
              width={post.featured_image.width}
              height={post.featured_image.height}
            />
          </div>
        )}
        <div className={styles.body}>
          {(showDate || showReadingTime) && (
            <div className={styles.meta}>
              {showDate && (
                <time dateTime={post.date} className={styles.date}>
                  {formatDate(post.date)}
                </time>
              )}
              {showDate && showReadingTime && post.reading_time && (
                <span className={styles.separator} aria-hidden="true">
                  ·
                </span>
              )}
              {showReadingTime && post.reading_time && (
                <span className={styles.readingTime}>{post.reading_time} min read</span>
              )}
            </div>
          )}
          <h3 className={styles.title}>{stripHtml(post.title.rendered)}</h3>
          {showExcerpt && post.excerpt.rendered && (
            <p className={styles.excerpt}>{stripHtml(post.excerpt.rendered)}</p>
          )}
        </div>
      </Link>
    </article>
  )
}

export default PostCard
