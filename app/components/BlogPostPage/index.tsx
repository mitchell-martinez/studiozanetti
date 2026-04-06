import RichText from '~/components/RichText'
import { stripHtml } from '~/lib/html'
import styles from './BlogPostPage.module.scss'
import { estimateReadingTime } from './helpers/readingTime'
import RelatedPosts from './RelatedPosts'
import ShareButtons from './ShareButtons'
import type { BlogPostPageProps } from './types'

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const BlogPostPage = ({ post, relatedPosts, canonicalUrl }: BlogPostPageProps) => {
  const readingTime = post.reading_time ?? estimateReadingTime(post.content.rendered)
  const title = stripHtml(post.title.rendered)

  return (
    <article className={styles.article}>
      {post.featured_image && (
        <div className={styles.heroImage}>
          <img
            src={post.featured_image.url}
            alt={post.featured_image.alt || title}
            className={styles.heroImg}
            width={post.featured_image.width}
            height={post.featured_image.height}
          />
        </div>
      )}

      <div className={styles.content}>
        <header className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          <div className={styles.meta}>
            <time dateTime={post.date}>
              {formatDate(post.date)}
            </time>
            <span className={styles.separator} aria-hidden="true">·</span>
            <span>{readingTime} min read</span>
          </div>
          {post.categories.length > 0 && (
            <div className={styles.categories}>
              {post.categories.map((cat) => (
                <span key={cat.id} className={styles.tag}>{cat.name}</span>
              ))}
            </div>
          )}
        </header>

        <div className={styles.body}>
          <RichText html={post.content.rendered} />
        </div>

        <footer className={styles.footer}>
          <ShareButtons url={canonicalUrl} title={title} />
        </footer>

        <RelatedPosts posts={relatedPosts} />
      </div>
    </article>
  )
}

export default BlogPostPage
