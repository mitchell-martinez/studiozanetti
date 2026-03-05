import type { GalleryCategoriesBlock } from '~/types/wordpress'

export const mockGalleryCategoriesBlock: GalleryCategoriesBlock = {
  acf_fc_layout: 'gallery_categories',
  heading: 'Explore Galleries',
  categories: [
    {
      title: 'The Brides',
      subtitle: 'Beautiful dresses and inspo',
      image: { url: 'https://example.com/brides.jpg', alt: 'Brides', width: 1200, height: 800 },
      url: '/gallery/stylish-brides',
    },
  ],
}
