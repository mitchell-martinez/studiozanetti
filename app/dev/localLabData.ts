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

export const pricingBlockFivePackages: PricingPackagesBlock = {
  acf_fc_layout: 'pricing_packages',
  heading: 'Packages',
  subheading: 'Choose a package that fits your day.',
  packages: [
    {
      name: 'The Basic',
      price_label: 'From $450',
      description: 'Digital Only Package',
      pricing:
        '<p><strong>Pricing:</strong></p><ul><li>1 Hour: $450</li><li>Each Additional Hour: $350</li></ul>',
      inclusions:
        '<p><strong>Includes:</strong></p><ul><li>Ceremony &amp; limited location photos</li><li>High-resolution images delivered via secure online download</li><li>Online meeting</li></ul>',
      tagline: 'Perfect for couples on a budget or with only a few guests.',
      cta_text: 'Send Enquiry',
      cta_url: '/contact',
    },
    {
      name: 'Short & Sweet',
      price_label: 'From $970',
      description: 'Digital Only Package',
      pricing:
        '<p><strong>Pricing:</strong></p><ul><li>2 Hours: $970</li><li>3 Hours: $1,170</li><li>4 Hours: $1,370</li><li>Additional Hours: $220 per hour</li></ul>',
      inclusions:
        '<p><strong>Includes:</strong></p><ul><li>Professionally edited, high-resolution images on USB in a presentation box</li><li>Pre wedding in person or online meeting</li></ul>',
      tagline: 'Perfect for couples looking for flexibility and options.',
      cta_text: 'Send Enquiry',
      cta_url: '/contact',
    },
    {
      name: 'The Essentials',
      price_label: 'From $1,980',
      description: 'Digital Only Package',
      pricing:
        '<p><strong>Pricing:</strong></p><ul><li>Half Day, up to 6 hours: $1,980</li><li>Full Day, up to 12 hours: $2,780</li><li>Additional Hours: $220 per hour</li></ul>',
      inclusions:
        '<p><strong>Includes:</strong></p><ul><li>Professionally edited, high-resolution images on USB in a presentation box</li><li>Detailed pre-wedding planning session</li><li>Private online gallery with free guest downloads (device resolution)</li></ul>',
      tagline: 'Perfect for couples looking to capture their special day from start to finish.',
      is_featured: true,
      cta_text: 'Send Enquiry',
      cta_url: '/contact',
    },
    {
      name: 'The Exclusive',
      price_label: 'From $2,450',
      description: 'Digital & Album Package',
      pricing:
        '<p><strong>Pricing:</strong></p><ul><li>Half Day, up to 6 hours: $2,450</li><li>Full Day, up to 12 hours: $3,200</li><li>Additional Hours: $220 per hour</li></ul>',
      inclusions:
        '<p><strong>Includes:</strong></p><ul><li>Professionally edited, print-resolution images on USB in a presentation box</li><li>Pre-wedding planning session</li><li>Private online gallery with free guest downloads (device resolution)</li><li>25×25cm Bespoke Album (30 pages) with choice of linen, leather-like, or photo cover</li></ul>',
      tagline:
        'Perfect for couples who want treasured keepsakes they can look back on in years to come.',
      cta_text: 'Send Enquiry',
      cta_url: '/contact',
    },
    {
      name: 'The Ultimate',
      price_label: 'From $2,900',
      description: 'Digital, Album & Engagement',
      pricing:
        '<p><strong>Pricing:</strong></p><ul><li>Half Day, up to 6 hours: $2,900</li><li>Full Day, up to 12 hours: $3,700</li><li>Additional Hours: $220 per hour</li></ul>',
      inclusions:
        '<p><strong>Includes:</strong></p><ul><li>Professionally edited, print-resolution images on USB in a presentation box</li><li>Pre-wedding planning session</li><li>Private online gallery with free guest downloads (device resolution)</li><li>30×30cm Bespoke Album (30 pages) with choice of linen, leather-like, or photo cover</li><li>Engagement Session – 2-hour shoot with all images included (perfect for save-the-date cards!)</li></ul>',
      tagline: 'Perfect for couples looking to have every moment of their journey captured.',
      cta_text: 'Send Enquiry',
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
