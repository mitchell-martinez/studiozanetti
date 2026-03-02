import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import type { LoaderFunctionArgs, MetaFunction } from 'react-router'
import { useLoaderData } from 'react-router'
import type { GalleryCategory, GalleryImage } from '~/types/gallery'
import styles from './gallery.module.scss'

// ─── Types ────────────────────────────────────────────────────────────────────
interface LoaderData {
  images: GalleryImage[]
}

// ─── Static placeholder data ─────────────────────────────────────────────────
// TODO: Replace with API call once backend endpoint is available.
//       Expected shape: GET /api/gallery → GalleryImage[]
const ALL_IMAGES: GalleryImage[] = [
  // Weddings
  {
    id: 1,
    category: 'Weddings',
    alt: 'Wedding ceremony',
    thumbnail: 'https://picsum.photos/seed/zanetti1/800/600',
    src: 'https://picsum.photos/seed/zanetti1/1200/900',
  },
  {
    id: 2,
    category: 'Weddings',
    alt: 'First dance',
    thumbnail: 'https://picsum.photos/seed/zanetti2/800/600',
    src: 'https://picsum.photos/seed/zanetti2/1200/900',
  },
  {
    id: 3,
    category: 'Weddings',
    alt: 'Bridal portrait',
    thumbnail: 'https://picsum.photos/seed/zanetti3/800/600',
    src: 'https://picsum.photos/seed/zanetti3/1200/900',
  },
  {
    id: 4,
    category: 'Weddings',
    alt: 'Wedding reception',
    thumbnail: 'https://picsum.photos/seed/zanetti4/800/600',
    src: 'https://picsum.photos/seed/zanetti4/1200/900',
  },
  // Portraits
  {
    id: 5,
    category: 'Portraits',
    alt: 'Studio portrait',
    thumbnail: 'https://picsum.photos/seed/zanetti5/800/600',
    src: 'https://picsum.photos/seed/zanetti5/1200/900',
  },
  {
    id: 6,
    category: 'Portraits',
    alt: 'Outdoor portrait',
    thumbnail: 'https://picsum.photos/seed/zanetti6/800/600',
    src: 'https://picsum.photos/seed/zanetti6/1200/900',
  },
  {
    id: 7,
    category: 'Portraits',
    alt: 'Family portrait',
    thumbnail: 'https://picsum.photos/seed/zanetti7/800/600',
    src: 'https://picsum.photos/seed/zanetti7/1200/900',
  },
  {
    id: 8,
    category: 'Portraits',
    alt: 'Corporate headshot',
    thumbnail: 'https://picsum.photos/seed/zanetti8/800/600',
    src: 'https://picsum.photos/seed/zanetti8/1200/900',
  },
  // Events
  {
    id: 9,
    category: 'Events',
    alt: 'Corporate event',
    thumbnail: 'https://picsum.photos/seed/zanetti9/800/600',
    src: 'https://picsum.photos/seed/zanetti9/1200/900',
  },
  {
    id: 10,
    category: 'Events',
    alt: 'Birthday celebration',
    thumbnail: 'https://picsum.photos/seed/zanetti10/800/600',
    src: 'https://picsum.photos/seed/zanetti10/1200/900',
  },
  {
    id: 11,
    category: 'Events',
    alt: 'Conference photography',
    thumbnail: 'https://picsum.photos/seed/zanetti11/800/600',
    src: 'https://picsum.photos/seed/zanetti11/1200/900',
  },
  {
    id: 12,
    category: 'Events',
    alt: 'Gala dinner',
    thumbnail: 'https://picsum.photos/seed/zanetti12/800/600',
    src: 'https://picsum.photos/seed/zanetti12/1200/900',
  },
]

const CATEGORIES: GalleryCategory[] = ['All', 'Weddings', 'Portraits', 'Events']

// ─── Loader (SSR — will be called server-side on every request) ───────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function loader(_: LoaderFunctionArgs): Promise<LoaderData> {
  // When the backend API is ready, replace the return below with:
  //   const res = await fetch(`${process.env.API_BASE_URL}/api/gallery`)
  //   if (!res.ok) throw new Response('Gallery unavailable', { status: 502 })
  //   return res.json() as Promise<LoaderData>
  return { images: ALL_IMAGES }
}

export const meta: MetaFunction = () => [
  { title: 'Gallery | Studio Zanetti' },
  {
    name: 'description',
    content:
      "Browse Studio Zanetti's photography portfolio — weddings, portraits, and events. View our work and get inspired.",
  },
  { property: 'og:title', content: 'Gallery | Studio Zanetti' },
  { name: 'twitter:card', content: 'summary_large_image' },
]

// Lazy-load GalleryGrid so its JS doesn't block the initial page paint
const GalleryGrid = lazy(() => import('~/components/GalleryGrid'))

// ─── Gallery grid skeleton ───────────────────────────────────────────────────
const GridSkeleton = () => (
  <div className={styles.skeletonGrid} aria-busy="true" aria-label="Loading gallery…">
    {Array.from({ length: 8 }, (_, i) => (
      <div key={i} className={styles.skeletonItem} />
    ))}
  </div>
)

// ─── Route component ──────────────────────────────────────────────────────────
const Gallery = () => {
  const { images } = useLoaderData<typeof loader>()
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>('All')

  const handleCategoryChange = useCallback((cat: GalleryCategory) => {
    setActiveCategory(cat)
  }, [])

  const filtered = useMemo(
    () => (activeCategory === 'All' ? images : images.filter((img) => img.category === activeCategory)),
    [images, activeCategory],
  )

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Gallery</h1>
        <p className={styles.pageSubtitle}>A selection of our finest work</p>
      </header>

      <section className={styles.content} aria-labelledby="gallery-filters">
        <div
          id="gallery-filters"
          className={styles.filters}
          role="group"
          aria-label="Filter by category"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`${styles.filterBtn} ${activeCategory === cat ? styles.filterActive : ''}`}
              onClick={() => handleCategoryChange(cat)}
              aria-pressed={activeCategory === cat}
              type="button"
            >
              {cat}
            </button>
          ))}
        </div>

        <Suspense fallback={<GridSkeleton />}>
          <GalleryGrid images={filtered} />
        </Suspense>
      </section>
    </div>
  )
}

export default Gallery
