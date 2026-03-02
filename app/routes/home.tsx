import { Link } from 'react-router'
import type { MetaFunction } from 'react-router'
import { memo } from 'react'
import useIntersectionObserver from '~/hooks/useIntersectionObserver'
import styles from './home.module.scss'

export const meta: MetaFunction = () => [
  { title: 'Studio Zanetti — Professional Photography' },
  {
    name: 'description',
    content:
      'Studio Zanetti — professional photography studio specialising in weddings, portraits, and events. Capturing moments, creating memories.',
  },
  { property: 'og:title', content: 'Studio Zanetti — Professional Photography' },
  {
    property: 'og:description',
    content:
      'Studio Zanetti — professional photography studio specialising in weddings, portraits, and events.',
  },
  { property: 'og:type', content: 'website' },
  { name: 'twitter:card', content: 'summary_large_image' },
]

// ─── Service card with lazy image ────────────────────────────────────────────
interface ServiceItem {
  title: string
  desc: string
  seed: string
}

const ServiceCard = memo(({ title, desc, seed }: ServiceItem) => {
  const [ref, isVisible] = useIntersectionObserver<HTMLElement>({ rootMargin: '150px' })

  return (
    <article ref={ref} className={styles.serviceCard}>
      {isVisible ? (
        <img
          src={`https://picsum.photos/seed/${seed}/600/400`}
          alt={`${title} photography example`}
          className={styles.serviceImage}
          loading="lazy"
          decoding="async"
          width={600}
          height={400}
        />
      ) : (
        <div className={styles.serviceImageSkeleton} aria-hidden="true" />
      )}
      <div className={styles.serviceBody}>
        <h3 className={styles.serviceTitle}>{title}</h3>
        <p className={styles.serviceDesc}>{desc}</p>
      </div>
    </article>
  )
})
ServiceCard.displayName = 'ServiceCard'

const SERVICE_ITEMS: ServiceItem[] = [
  {
    title: 'Weddings',
    desc: 'Timeless imagery of your most special day, from the first look to the last dance.',
    seed: 'zanetti-wed',
  },
  {
    title: 'Portraits',
    desc: 'Elegant, natural portraits that reveal character and capture genuine emotion.',
    seed: 'zanetti-port',
  },
  {
    title: 'Events',
    desc: 'Dynamic event photography that tells the full story of your occasion.',
    seed: 'zanetti-evt',
  },
]

const Home = () => (
  <>
    <section className={styles.hero} aria-label="Hero">
      <img
        src="https://picsum.photos/seed/zanetti-hero/1600/900"
        alt="Studio Zanetti — beautiful photography"
        className={styles.heroImage}
        // Hero is above the fold — do NOT lazy-load it; eager + high priority
        fetchPriority="high"
        decoding="sync"
        width={1600}
        height={900}
      />
      <div className={styles.heroOverlay}>
        <h1 className={styles.heroTitle}>Studio Zanetti</h1>
        <p className={styles.heroTagline}>Capturing moments, creating memories</p>
        <Link to="/gallery" className={styles.heroBtn}>
          View Gallery
        </Link>
      </div>
    </section>

    <section className={styles.intro} aria-labelledby="intro-heading">
      <div className={styles.introContent}>
        <h2 id="intro-heading" className={styles.introHeading}>
          Welcome to Studio Zanetti
        </h2>
        <p>
          We believe every photograph tells a story. Studio Zanetti is a premier photography studio
          dedicated to capturing the beauty, emotion, and authenticity of life's most precious
          moments — from intimate weddings to vibrant events and timeless portraits.
        </p>
        <p>
          With an eye for detail and a passion for light, our work blends artistry with technical
          precision to create images that resonate for generations.
        </p>
        <Link to="/about" className={styles.introLink}>
          Learn About Us →
        </Link>
      </div>
    </section>

    <section className={styles.services} aria-labelledby="services-heading">
      <div className={styles.servicesInner}>
        <h2 id="services-heading" className={styles.servicesHeading}>
          What We Do
        </h2>
        <div className={styles.serviceGrid}>
          {SERVICE_ITEMS.map((item) => (
            <ServiceCard key={item.title} {...item} />
          ))}
        </div>
        <div className={styles.servicesCta}>
          <Link to="/gallery" className={styles.ctaBtn}>
            Browse Our Work
          </Link>
        </div>
      </div>
    </section>
  </>
)

export default Home
