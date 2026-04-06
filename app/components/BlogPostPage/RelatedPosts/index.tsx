import PostCard from '~/components/PostCard'
import styles from './RelatedPosts.module.scss'
import type { RelatedPostsProps } from './types'

const RelatedPosts = ({ posts }: RelatedPostsProps) => {
  if (posts.length === 0) return null

  return (
    <aside className={styles.related} aria-label="Related posts">
      <h2 className={styles.heading}>Related Posts</h2>
      <div className={styles.grid}>
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            cardStyle="minimal"
            showExcerpt={false}
            showReadingTime={false}
          />
        ))}
      </div>
    </aside>
  )
}

export default RelatedPosts
