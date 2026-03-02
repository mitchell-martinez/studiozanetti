import SEO from '../components/SEO'
import styles from './About.module.css'

function About() {
  return (
    <>
      <SEO
        title="About"
        description="Meet the team behind Studio Zanetti — passionate photographers dedicated to crafting beautiful, lasting images."
      />

      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>About Us</h1>
          <p className={styles.pageSubtitle}>The people behind the lens</p>
        </header>

        <section className={styles.bio}>
          <div className={styles.bioInner}>
            <div className={styles.bioImage}>
              <img
                src="https://picsum.photos/seed/zanetti-about/600/700"
                alt="Photographer at work"
              />
            </div>
            <div className={styles.bioText}>
              <h2 className={styles.bioHeading}>Marco Zanetti</h2>
              <p className={styles.bioRole}>Lead Photographer & Founder</p>
              <p>
                Marco Zanetti has been capturing life's most meaningful moments for over 15 years.
                Born and raised in Florence, Italy, his love of art and beauty deeply informs
                his photographic style — blending classical composition with a modern, natural touch.
              </p>
              <p>
                After studying fine arts at the Accademia di Belle Arti, Marco travelled Europe
                honing his craft before founding Studio Zanetti with a simple mission: to create
                photographs that feel as true as the moments they preserve.
              </p>
              <p>
                Today, Studio Zanetti serves clients across Italy and internationally, bringing the
                same dedication to every project — whether a grand destination wedding or an intimate
                family portrait session.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.approach}>
          <div className={styles.approachInner}>
            <h2 className={styles.approachHeading}>Our Approach</h2>
            <div className={styles.pillars}>
              {[
                { icon: '✦', title: 'Natural Light', desc: 'We seek the magic in available light — golden hours, dappled shade, and soft interiors.' },
                { icon: '✦', title: 'Authentic Moments', desc: 'Posed or candid, every image reflects genuine emotion and authentic connection.' },
                { icon: '✦', title: 'Timeless Editing', desc: 'Our post-processing is subtle and elegant — enhancing, never overpowering.' },
                { icon: '✦', title: 'Bespoke Service', desc: 'Every client is unique. We listen, collaborate, and tailor every session to your vision.' },
              ].map(({ icon, title, desc }) => (
                <article key={title} className={styles.pillar}>
                  <span className={styles.pillarIcon}>{icon}</span>
                  <h3 className={styles.pillarTitle}>{title}</h3>
                  <p className={styles.pillarDesc}>{desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

export default About
