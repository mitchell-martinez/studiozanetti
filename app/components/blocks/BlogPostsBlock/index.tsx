import { useCallback, useState } from 'react'
import Pagination from '~/components/Pagination'
import PostCard from '~/components/PostCard'
import { getBackgroundImageStyle, getSectionStyle } from '../helpers/styleOptions'
import sharedStyles from '../shared.module.scss'
import styles from './BlogPostsBlock.module.scss'
import type { BlogPostsBlockProps } from './types'

const BlogPostsBlock = ({ block, blogPostsData }: BlogPostsBlockProps) => {
  const [postsData, setPostsData] = useState(blogPostsData)
  const [loading, setLoading] = useState(false)

  const layout = block.layout ?? 'grid'
  const bgImageStyle = getBackgroundImageStyle(block)

  const handlePageChange = useCallback(
    async (page: number) => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: String(page),
          per_page: String(block.posts_per_page ?? 6),
        })
        if (Array.isArray(block.categories) && block.categories.length > 0) {
          params.set('categories', block.categories.join(','))
        }
        const res = await fetch(`/api/blog-posts?${params}`)
        if (res.ok) {
          const data = await res.json()
          if (data.posts) {
            setPostsData(data)
          }
        }
      } catch {
        // Graceful degradation — stay on current page
      } finally {
        setLoading(false)
      }
    },
    [block.posts_per_page, block.categories],
  )

  return (
    <section className={styles.section} style={getSectionStyle(block)}>
      {bgImageStyle && (
        <div className={sharedStyles.backgroundImage} style={bgImageStyle} aria-hidden="true" />
      )}
      <div className={styles.inner}>
        {block.heading && <h2 className={styles.heading}>{block.heading}</h2>}
        {block.subheading && <p className={styles.subheading}>{block.subheading}</p>}

        {postsData.posts.length === 0 ? (
          <p className={styles.empty}>No posts yet — check back soon.</p>
        ) : (
          <div
            className={`${styles.grid} ${layout === 'list' ? styles.listLayout : ''} ${loading ? styles.loading : ''}`}
            style={
              block.max_columns && layout === 'grid'
                ? ({ '--max-cols': block.max_columns } as React.CSSProperties)
                : undefined
            }
          >
            {postsData.posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                cardStyle={block.card_style}
                showExcerpt={block.show_excerpt !== false}
                showFeaturedImage={block.show_featured_image !== false}
                showDate={block.show_date !== false}
                showReadingTime={block.show_reading_time !== false}
                layout={layout}
              />
            ))}
          </div>
        )}

        {block.show_pagination !== false && postsData.total_pages > 1 && (
          <Pagination
            currentPage={postsData.page}
            totalPages={postsData.total_pages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </section>
  )
}

export default BlogPostsBlock
