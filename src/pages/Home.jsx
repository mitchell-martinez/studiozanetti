import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import styles from './Home.module.css'

function Home() {
  return (
    <>
      <SEO
        title="Home"
        description="Studio Zanetti — professional photography studio specializing in weddings, portraits, and events. Capturing moments, creating memories."
      />

      <section className={styles.hero} aria-label="Hero">
        <img
          src="https://picsum.photos/seed/zanetti-hero/1600/900"
          alt="Studio Zanetti hero — beautiful photography"
          className={styles.heroImage}
        />
        <div className={styles.heroOverlay}>
          <h1 className={styles.heroTitle}>Studio Zanetti</h1>
          <p className={styles.heroTagline}>Capturing moments, creating memories</p>
          <Link to="/gallery" className={styles.heroBtn}>
            View Gallery
          </Link>
        </div>
      </section>

      <section className={styles.intro}>
        <div className={styles.introContent}>
          <h2 className={styles.introHeading}>Welcome to Studio Zanetti</h2>
          <p>
            We believe every photograph tells a story. Studio Zanetti is a premier photography
            studio dedicated to capturing the beauty, emotion, and authenticity of life's most
            precious moments — from intimate weddings to vibrant events and timeless portraits.
          </p>
          <p>
            With an eye for detail and a passion for light, our work blends artistry with
            technical precision to create images that resonate for generations.
          </p>
          <Link to="/about" className={styles.introLink}>
            Learn About Us →
          </Link>
        </div>
      </section>

      <section className={styles.services} aria-label="Services">
        <div className={styles.servicesInner}>
          <h2 className={styles.servicesHeading}>What We Do</h2>
          <div className={styles.serviceGrid}>
            {[
              { title: 'Weddings', desc: 'Timeless imagery of your most special day, from the first look to the last dance.', seed: 'zanetti-wed' },
              { title: 'Portraits', desc: 'Elegant, natural portraits that reveal character and capture genuine emotion.', seed: 'zanetti-port' },
              { title: 'Events', desc: 'Dynamic event photography that tells the full story of your occasion.', seed: 'zanetti-evt' },
            ].map(({ title, desc, seed }) => (
              <article key={title} className={styles.serviceCard}>
                <img
                  src={`https://picsum.photos/seed/${seed}/600/400`}
                  alt={title}
                  className={styles.serviceImage}
                  loading="lazy"
                />
                <div className={styles.serviceBody}>
                  <h3 className={styles.serviceTitle}>{title}</h3>
                  <p className={styles.serviceDesc}>{desc}</p>
                </div>
              </article>
            ))}
          </div>
          <div className={styles.servicesCta}>
            <Link to="/gallery" className={styles.ctaBtn}>Browse Our Work</Link>
          </div>
        </div>
      </section>
    </>
  )
}

export default Home
