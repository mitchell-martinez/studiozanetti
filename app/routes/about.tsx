import type { MetaFunction } from 'react-router'
import styles from './about.module.scss'

export const meta: MetaFunction = () => [
  { title: 'About | Studio Zanetti' },
  {
    name: 'description',
    content:
      'Meet the team behind Studio Zanetti — passionate photographers dedicated to crafting beautiful, lasting images.',
  },
  { property: 'og:title', content: 'About | Studio Zanetti' },
  {
    property: 'og:description',
    content: 'Meet the team behind Studio Zanetti.',
  },
  { name: 'twitter:card', content: 'summary_large_image' },
]

interface Pillar {
  title: string
  desc: string
}

const PILLARS: Pillar[] = [
  {
    title: 'Natural Light',
    desc: 'We seek the magic in available light — golden hours, dappled shade, and soft interiors.',
  },
  {
    title: 'Authentic Moments',
    desc: 'Posed or candid, every image reflects genuine emotion and authentic connection.',
  },
  {
    title: 'Timeless Editing',
    desc: 'Our post-processing is subtle and elegant — enhancing, never overpowering.',
  },
  {
    title: 'Bespoke Service',
    desc: 'Every client is unique. We listen, collaborate, and tailor every session to your vision.',
  },
]

const About = () => (
  <div className={styles.page}>
    <header className={styles.pageHeader}>
      <h1 className={styles.pageTitle}>About Us</h1>
      <p className={styles.pageSubtitle}>The people behind the lens</p>
    </header>

    <section className={styles.bio} aria-labelledby="bio-heading">
      <div className={styles.bioInner}>
        <div className={styles.bioImage}>
          <img
            src="https://picsum.photos/seed/zanetti-about/600/700"
            alt="Marco Zanetti, lead photographer, at work"
            loading="lazy"
            decoding="async"
            width={600}
            height={700}
          />
        </div>
        <div className={styles.bioText}>
          <h2 id="bio-heading" className={styles.bioHeading}>
            Marco Zanetti
          </h2>
          <p className={styles.bioRole}>Lead Photographer &amp; Founder</p>
          <p>
            Marco Zanetti has been capturing life's most meaningful moments for over 15 years. Born
            and raised in Florence, Italy, his love of art and beauty deeply informs his photographic
            style — blending classical composition with a modern, natural touch.
          </p>
          <p>
            After studying fine arts at the Accademia di Belle Arti, Marco travelled Europe honing
            his craft before founding Studio Zanetti with a simple mission: to create photographs
            that feel as true as the moments they preserve.
          </p>
          <p>
            Today, Studio Zanetti serves clients across Italy and internationally, bringing the same
            dedication to every project — whether a grand destination wedding or an intimate family
            portrait session.
          </p>
        </div>
      </div>
    </section>

    <section className={styles.approach} aria-labelledby="approach-heading">
      <div className={styles.approachInner}>
        <h2 id="approach-heading" className={styles.approachHeading}>
          Our Approach
        </h2>
        <div className={styles.pillars}>
          {PILLARS.map(({ title, desc }) => (
            <article key={title} className={styles.pillar}>
              {/* Decorative SVG star mark */}
              <svg
                className={styles.pillarIcon}
                viewBox="0 0 24 24"
                width="24"
                height="24"
                aria-hidden="true"
                fill="var(--color-gold)"
              >
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17 5.8 21.3l2.4-7.4L2 9.4h7.6z" />
              </svg>
              <h3 className={styles.pillarTitle}>{title}</h3>
              <p className={styles.pillarDesc}>{desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  </div>
)

export default About
