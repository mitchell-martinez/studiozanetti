import type { GalleryImage } from '~/types/gallery'
import type {
  BiographyBlock,
  ContentBlock,
  FaqAccordionBlock,
  GalleryCategoriesBlock,
  HeroBlock,
  ImageTextBlock,
  PillarGridBlock,
  PricingPackagesBlock,
  ProcessTimelineBlock,
  ServicesGridBlock,
  TestimonialCarouselBlock,
  TextBlock,
  WPImage,
  WPMenuItem,
  WPSiteSettings,
} from '~/types/wordpress'

const image = (id: number, alt: string): WPImage => ({
  url: `https://picsum.photos/seed/zanetti-${id}/1600/1000`,
  alt,
  width: 1600,
  height: 1000,
})

export const demoMenu: WPMenuItem[] = [
  { id: 1, title: 'Home', url: '/', children: [] },
  {
    id: 2,
    title: 'Galleries',
    url: '/galleries',
    children: [
      { id: 21, title: 'Weddings', url: '/galleries/weddings', children: [] },
      { id: 22, title: 'Events', url: '/galleries/events', children: [] },
    ],
  },
  { id: 3, title: 'Prices', url: '/prices', children: [] },
  { id: 4, title: 'Contact', url: '/contact', children: [] },
]

export const demoSiteSettings: WPSiteSettings = {
  site_name: 'Studio Zanetti',
  tagline: 'Wedding & Event Photography',
  copyright_text: '',
  social_links: [
    { platform: 'Instagram', url: 'https://instagram.com' },
    { platform: 'Facebook', url: 'https://facebook.com' },
  ],
}

export const demoGalleryImages: GalleryImage[] = Array.from({ length: 9 }).map((_, index) => ({
  id: index + 1,
  category: index % 2 === 0 ? 'Weddings' : 'Events',
  alt: `Gallery image ${index + 1}`,
  thumbnail: `https://picsum.photos/seed/thumb-${index + 1}/600/400`,
  src: `https://picsum.photos/seed/full-${index + 1}/1800/1200`,
}))

export const heroBlock: HeroBlock = {
  acf_fc_layout: 'hero',
  title: 'Timeless Wedding Photography',
  tagline: 'Natural storytelling with editorial elegance.',
  cta_text: 'View Galleries',
  cta_url: '/galleries',
  secondary_cta_text: 'Check Pricing',
  secondary_cta_url: '/prices',
  slides: [image(1, 'Bride and groom portrait'), image(2, 'Ceremony moment')],
  content_align: 'center',
  height: 'lg',
  overlay_strength: 'medium',
  show_slide_dots: true,
  auto_rotate_seconds: 4,
}

export const textBlock: TextBlock = {
  acf_fc_layout: 'text_block',
  eyebrow: 'About Studio Zanetti',
  heading: 'Photography that feels like your day',
  body: '<p>We blend documentary moments with gentle direction so your photos feel genuine and refined.</p>',
  align: 'left',
  block_align: 'left',
  max_width: 'normal',
  section_theme: 'light',
  top_spacing: 'md',
  bottom_spacing: 'md',
}

export const imageTextBlock: ImageTextBlock = {
  acf_fc_layout: 'image_text',
  eyebrow: 'Our Approach',
  heading: 'Calm guidance, beautiful results',
  body: '<p>From timeline planning to final gallery delivery, we make the process simple and enjoyable.</p>',
  image: image(3, 'Couple portrait at sunset'),
  image_mobile: image(4, 'Mobile crop portrait'),
  image_position: 'right',
  image_ratio: 'portrait',
  image_style: 'soft',
  cta_text: 'See the Process',
  cta_url: '/what-we-do',
  section_theme: 'champagne',
  top_spacing: 'lg',
  bottom_spacing: 'lg',
}

export const servicesBlock: ServicesGridBlock = {
  acf_fc_layout: 'services_grid',
  heading: 'Photography Services',
  subheading: 'Flexible options tailored to your event.',
  columns: 3,
  card_style: 'elevated',
  services: [
    {
      title: 'Weddings',
      description: 'Full-day coverage with two photographers.',
      image: image(5, 'Wedding'),
    },
    {
      title: 'Engagements',
      description: 'Relaxed sessions in meaningful locations.',
      image: image(6, 'Engagement'),
    },
    {
      title: 'Events',
      description: 'Corporate, private and milestone coverage.',
      image: image(7, 'Event'),
    },
  ],
  cta_text: 'Enquire Now',
  cta_url: '/contact',
  section_theme: 'rose',
  top_spacing: 'md',
  bottom_spacing: 'lg',
}

export const biographyBlock: BiographyBlock = {
  acf_fc_layout: 'biography',
  image: image(8, 'Photographer portrait'),
  name: 'Michael Zanetti',
  role: 'Lead Photographer',
  bio: '<p>I capture real, heartfelt moments with an artistic eye and a calm presence.</p>',
  quote: 'Your photos should feel like your story, not a template.',
  signature_text: '— Michael',
  section_theme: 'light',
  top_spacing: 'lg',
  bottom_spacing: 'lg',
}

export const pillarBlock: PillarGridBlock = {
  acf_fc_layout: 'pillar_grid',
  heading: 'What couples value most',
  subheading: 'Consistency from planning to final delivery.',
  columns: 3,
  pillars: [
    { title: 'Preparation', description: 'Clear guidance before the day.' },
    { title: 'Presence', description: 'Calm direction when it matters.' },
    { title: 'Delivery', description: 'Beautiful gallery turnaround.' },
  ],
  section_theme: 'champagne',
  top_spacing: 'md',
  bottom_spacing: 'md',
}

export const testimonialBlock: TestimonialCarouselBlock = {
  acf_fc_layout: 'testimonial_carousel',
  heading: 'Kind words',
  subheading: 'From recent couples and clients.',
  testimonials: [
    {
      quote: 'Absolutely incredible from start to finish.',
      name: 'Emily & Josh',
      context: 'Wedding Couple',
    },
    { quote: 'Beautiful photos and an easy experience.', name: 'Sophie', context: 'Private Event' },
  ],
  auto_rotate_seconds: 5,
  section_theme: 'rose',
  top_spacing: 'lg',
  bottom_spacing: 'lg',
}

export const faqBlock: FaqAccordionBlock = {
  acf_fc_layout: 'faq_accordion',
  heading: 'Frequently Asked Questions',
  intro: 'A few common questions before booking.',
  faq_items: [
    {
      question: 'How far in advance should we book?',
      answer: '<p>Most couples book 6–12 months ahead.</p>',
    },
    {
      question: 'Do you travel?',
      answer: '<p>Yes, we travel across Australia for weddings and events.</p>',
    },
  ],
  open_first_item: true,
  section_theme: 'light',
  top_spacing: 'md',
  bottom_spacing: 'lg',
}

export const processBlock: ProcessTimelineBlock = {
  acf_fc_layout: 'process_timeline',
  heading: 'How it works',
  intro: 'A simple process from first chat to final gallery.',
  steps: [
    { title: 'Discovery Call', description: 'We discuss your vision and priorities.' },
    { title: 'Planning', description: 'Timeline and locations are mapped clearly.' },
    { title: 'Photography Day', description: 'Documentary + directed moments throughout.' },
    { title: 'Delivery', description: 'You receive an edited online gallery.' },
  ],
  section_theme: 'champagne',
  top_spacing: 'md',
  bottom_spacing: 'md',
}

export const pricingBlock: PricingPackagesBlock = {
  acf_fc_layout: 'pricing_packages',
  heading: 'Packages',
  subheading: 'Choose a package that fits your day.',
  packages: [
    {
      name: 'Essentials',
      price_label: '$2,900',
      description: 'Perfect for intimate celebrations.',
      inclusions: '<ul><li>6 hours coverage</li><li>Online gallery</li></ul>',
      cta_text: 'Book Essentials',
      cta_url: '/contact',
    },
    {
      name: 'Signature',
      price_label: '$4,500',
      description: 'Full day coverage + engagement session.',
      inclusions: '<ul><li>10 hours coverage</li><li>Second photographer</li></ul>',
      is_featured: true,
      cta_text: 'Book Signature',
      cta_url: '/contact',
    },
  ],
  section_theme: 'light',
  top_spacing: 'lg',
  bottom_spacing: 'lg',
}

export const galleryCategoriesBlock: GalleryCategoriesBlock = {
  acf_fc_layout: 'gallery_categories',
  heading: 'Explore galleries',
  categories: [
    {
      title: 'Weddings',
      subtitle: 'Romantic storytelling',
      image: image(9, 'Wedding gallery'),
      url: '/galleries/weddings',
    },
    {
      title: 'Events',
      subtitle: 'Corporate & private',
      image: image(10, 'Events gallery'),
      url: '/galleries/events',
    },
    {
      title: 'Portraits',
      subtitle: 'Natural and editorial',
      image: image(11, 'Portrait gallery'),
      url: '/galleries/portraits',
    },
  ],
  section_theme: 'dark',
  top_spacing: 'md',
  bottom_spacing: 'md',
}

export const fullPageBlocksA: ContentBlock[] = [
  heroBlock,
  textBlock,
  imageTextBlock,
  servicesBlock,
  testimonialBlock,
  faqBlock,
]

export const fullPageBlocksB: ContentBlock[] = [
  heroBlock,
  biographyBlock,
  pillarBlock,
  processBlock,
  pricingBlock,
  galleryCategoriesBlock,
]
