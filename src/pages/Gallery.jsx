import { useState } from 'react'
import SEO from '../components/SEO'
import GalleryGrid from '../components/GalleryGrid'
import styles from './Gallery.module.css'

const CATEGORIES = ['All', 'Weddings', 'Portraits', 'Events']

const ALL_IMAGES = [
  // Weddings
  { id: 1, category: 'Weddings', alt: 'Wedding ceremony', thumbnail: 'https://picsum.photos/seed/zanetti1/800/600', src: 'https://picsum.photos/seed/zanetti1/1200/900' },
  { id: 2, category: 'Weddings', alt: 'First dance', thumbnail: 'https://picsum.photos/seed/zanetti2/800/600', src: 'https://picsum.photos/seed/zanetti2/1200/900' },
  { id: 3, category: 'Weddings', alt: 'Bridal portrait', thumbnail: 'https://picsum.photos/seed/zanetti3/800/600', src: 'https://picsum.photos/seed/zanetti3/1200/900' },
  { id: 4, category: 'Weddings', alt: 'Wedding reception', thumbnail: 'https://picsum.photos/seed/zanetti4/800/600', src: 'https://picsum.photos/seed/zanetti4/1200/900' },
  // Portraits
  { id: 5, category: 'Portraits', alt: 'Studio portrait', thumbnail: 'https://picsum.photos/seed/zanetti5/800/600', src: 'https://picsum.photos/seed/zanetti5/1200/900' },
  { id: 6, category: 'Portraits', alt: 'Outdoor portrait', thumbnail: 'https://picsum.photos/seed/zanetti6/800/600', src: 'https://picsum.photos/seed/zanetti6/1200/900' },
  { id: 7, category: 'Portraits', alt: 'Family portrait', thumbnail: 'https://picsum.photos/seed/zanetti7/800/600', src: 'https://picsum.photos/seed/zanetti7/1200/900' },
  { id: 8, category: 'Portraits', alt: 'Corporate headshot', thumbnail: 'https://picsum.photos/seed/zanetti8/800/600', src: 'https://picsum.photos/seed/zanetti8/1200/900' },
  // Events
  { id: 9, category: 'Events', alt: 'Corporate event', thumbnail: 'https://picsum.photos/seed/zanetti9/800/600', src: 'https://picsum.photos/seed/zanetti9/1200/900' },
  { id: 10, category: 'Events', alt: 'Birthday celebration', thumbnail: 'https://picsum.photos/seed/zanetti10/800/600', src: 'https://picsum.photos/seed/zanetti10/1200/900' },
  { id: 11, category: 'Events', alt: 'Conference photography', thumbnail: 'https://picsum.photos/seed/zanetti11/800/600', src: 'https://picsum.photos/seed/zanetti11/1200/900' },
  { id: 12, category: 'Events', alt: 'Gala dinner', thumbnail: 'https://picsum.photos/seed/zanetti12/800/600', src: 'https://picsum.photos/seed/zanetti12/1200/900' },
]

function Gallery() {
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = activeCategory === 'All'
    ? ALL_IMAGES
    : ALL_IMAGES.filter(img => img.category === activeCategory)

  return (
    <>
      <SEO
        title="Gallery"
        description="Browse Studio Zanetti's photography portfolio — weddings, portraits, and events. View our work and get inspired."
      />

      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Gallery</h1>
          <p className={styles.pageSubtitle}>A selection of our finest work</p>
        </header>

        <section className={styles.content}>
          <div className={styles.filters} role="group" aria-label="Filter by category">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`${styles.filterBtn} ${activeCategory === cat ? styles.filterActive : ''}`}
                onClick={() => setActiveCategory(cat)}
                aria-pressed={activeCategory === cat}
              >
                {cat}
              </button>
            ))}
          </div>

          <GalleryGrid images={filtered} />
        </section>
      </div>
    </>
  )
}

export default Gallery
