// ─── Primitive WP types ───────────────────────────────────────────────────────

export interface WPRendered {
  rendered: string
}

export interface WPImage {
  url: string
  alt: string
  width?: number
  height?: number
}

export interface HeroSlide extends WPImage {
  tagline?: string
  subtitle?: string
}

export type BlockTheme = 'light' | 'rose' | 'champagne' | 'dark'
export type ContentAlign = 'left' | 'center'
export type TextAlign = 'left' | 'center' | 'right' | 'justify'
export type BlockAlign = 'left' | 'center' | 'right'

export interface BlockStyleOptions {
  section_theme?: BlockTheme
  top_spacing?: 'none' | 'sm' | 'md' | 'lg'
  bottom_spacing?: 'none' | 'sm' | 'md' | 'lg'
  max_width?: 'narrow' | 'normal' | 'wide'
  max_width_px?: number
  background_image?: WPImage
  background_image_opacity?: number
}

// ─── ACF Flexible Content block layouts ──────────────────────────────────────
//
// Each interface maps to one Flexible Content layout in WordPress.
//
// WORDPRESS SETUP — Field Group: "Page Blocks"
//   Location: Post Type → Page (all pages)
//   Field: blocks (Flexible Content)
//     ├── Layout: hero
//     │     background_image (Image), title (Text), tagline (Text),
//     │     cta_text (Text), cta_url (URL)
//     ├── Layout: text_block
//     │     heading (Text), body (WYSIWYG),
//     │     align (Select: left|center|right|justify),
//     │     block_align (Select: left|center|right),
//     │     cta_text (Text), cta_url (URL)
//     ├── Layout: image_text
//     │     image (Image), heading (Text), body (WYSIWYG),
//     │     image_position (Select: left|right)
//     ├── Layout: services_grid
//     │     heading (Text), cta_text (Text), cta_url (URL),
//     │     services (Repeater → title (Text), description (Textarea), image (Image))
//     ├── Layout: image_block
//     │     image (Image), height (Select: md|lg|full),
//     │     overlay_strength (Select: light|medium|strong),
//     │     overlay_text (Text), text_align (Select: left|center|right),
//     │     parallax_scroll (True/False), aria_label (Text)
//     └── Layout: pillar_grid
//           heading (Text),
//           pillars (Repeater → title (Text), description (Textarea))

export interface HeroBlock {
  acf_fc_layout: 'hero'
  background_image?: WPImage
  slides?: HeroSlide[]
  use_featured_image?: boolean
  title: string
  tagline?: string
  description?: string
  caption?: string
  cta_text?: string
  cta_url?: string
  secondary_cta_text?: string
  secondary_cta_url?: string
  content_align?: ContentAlign
  height?: 'md' | 'lg' | 'full'
  overlay_strength?: 'light' | 'medium' | 'strong'
  auto_rotate_seconds?: number
  show_slide_dots?: boolean
  scroll_hint_text?: string
}

export interface TextBlock extends BlockStyleOptions {
  acf_fc_layout: 'text_block'
  heading?: string
  body: string
  align?: TextAlign
  block_align?: BlockAlign
  cta_text?: string
  cta_url?: string
  max_width?: 'narrow' | 'normal' | 'wide'
  eyebrow?: string
  font_size?: 'sm' | 'md' | 'lg'
}

export interface ImageTextBlock extends BlockStyleOptions {
  acf_fc_layout: 'image_text'
  image: WPImage
  image_mobile?: WPImage
  heading?: string
  body: string
  image_position?: 'left' | 'right'
  image_ratio?: 'landscape' | 'portrait' | 'square' | 'auto'
  image_style?: 'soft' | 'framed' | 'plain'
  image_max_width?: number
  image_max_height?: number
  eyebrow?: string
  cta_text?: string
  cta_url?: string
  image_caption?: string
  font_size?: 'sm' | 'md' | 'lg'
  url?: string
}

export interface WPServiceItem {
  title: string
  description: string
  image?: WPImage
  url?: string
}

export interface ServicesGridBlock extends BlockStyleOptions {
  acf_fc_layout: 'services_grid'
  heading?: string
  subheading?: string
  services: WPServiceItem[]
  cta_text?: string
  cta_url?: string
  max_columns?: 1 | 2 | 3 | 4
  card_style?: 'elevated' | 'outline' | 'minimal'
  text_align?: 'left' | 'center' | 'right'
  font_size?: 'sm' | 'md' | 'lg'
}

export interface WPPillarItem {
  title: string
  description: string
}

export interface PillarGridBlock extends BlockStyleOptions {
  acf_fc_layout: 'pillar_grid'
  heading?: string
  subheading?: string
  pillars: WPPillarItem[]
  columns?: 2 | 3 | 4
}

export interface WPTestimonialItem {
  quote: string
  name: string
  context?: string
  image?: WPImage
}

export interface TestimonialCarouselBlock extends BlockStyleOptions {
  acf_fc_layout: 'testimonial_carousel'
  heading?: string
  subheading?: string
  testimonials: WPTestimonialItem[]
  auto_rotate_seconds?: number
}

export interface WPFaqItem {
  question: string
  answer: string
}

export interface FaqAccordionBlock extends BlockStyleOptions {
  acf_fc_layout: 'faq_accordion'
  heading?: string
  intro?: string
  faq_items: WPFaqItem[]
  open_first_item?: boolean
}

export interface WPProcessStep {
  title: string
  description: string
  image?: WPImage
}

export interface ProcessTimelineBlock extends BlockStyleOptions {
  acf_fc_layout: 'process_timeline'
  heading?: string
  intro?: string
  steps: WPProcessStep[]
}

export interface WPPackageItem {
  name: string
  price_label?: string
  description?: string
  pricing?: string
  inclusions?: string
  tagline?: string
  is_featured?: boolean
  cta_text?: string
  cta_url?: string
}

export interface PricingPackagesBlock extends BlockStyleOptions {
  acf_fc_layout: 'pricing_packages'
  heading?: string
  subheading?: string
  packages: WPPackageItem[]
}

export interface WPGalleryCategoryItem {
  title: string
  subtitle?: string
  image?: WPImage
  url: string
}

export interface GalleryCategoriesBlock extends BlockStyleOptions {
  acf_fc_layout: 'gallery_categories'
  heading?: string
  categories: WPGalleryCategoryItem[]
}

export interface WPGalleriesImageItem {
  image: WPImage
  caption?: string
}

export interface GalleriesBlock extends BlockStyleOptions {
  acf_fc_layout: 'galleries'
  heading?: string
  description?: string
  images: WPGalleriesImageItem[]
  desktop_columns?: number
  mobile_columns?: number
}

export interface ImageBlock {
  acf_fc_layout: 'image_block'
  image: WPImage
  height?: 'md' | 'lg' | 'full'
  overlay_strength?: 'light' | 'medium' | 'strong'
  overlay_text?: string
  title?: string
  subtitle?: string
  text_align?: 'left' | 'center' | 'right'
  parallax_scroll?: boolean
  aria_label?: string
  heading_tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  title_pop_out?: boolean
  subtitle_pop_out?: boolean
  text_max_width?: 'narrow' | 'semi-narrow' | 'normal' | 'wide' | 'full'
  heading_opacity?: number
  image_shadow_strength?: number
}

// ─── Shared Button sub-field ─────────────────────────────────────────────────

export interface WPButton {
  label: string
  url: string
  variant?: 'primary' | 'secondary' | 'outline' | 'dark' | 'text'
  size?: 'sm' | 'md' | 'lg'
  open_in_new_tab?: boolean
}

// ─── Button Group block ─────────────────────────────────────────────────────

export interface ButtonGroupBlock extends BlockStyleOptions {
  acf_fc_layout: 'button_group'
  buttons: WPButton[]
  alignment?: BlockAlign
  spacing?: 'tight' | 'normal' | 'loose'
}

// ─── Text Grid block ────────────────────────────────────────────────────────

export interface WPTextGridItem {
  title?: string
  body?: string
  cta_text?: string
  cta_url?: string
}

export interface TextGridBlock extends BlockStyleOptions {
  acf_fc_layout: 'text_grid'
  heading?: string
  subheading?: string
  items: WPTextGridItem[]
  max_columns?: 1 | 2 | 3 | 4
  card_style?: 'elevated' | 'outline' | 'minimal'
  text_align?: 'left' | 'center' | 'right'
  font_size?: 'sm' | 'md' | 'lg'
  cta_variant?: 'primary' | 'secondary' | 'outline' | 'dark' | 'text'
  cta_size?: 'sm' | 'md' | 'lg'
}

// ─── Instagram Feed block ───────────────────────────────────────────────────

export interface InstagramFeedBlock extends BlockStyleOptions {
  acf_fc_layout: 'instagram_feed'
  heading?: string
  subheading?: string
  username: string
  profile_url: string
  images: WPImage[]
  cta_text?: string
  columns?: 2 | 3 | 4 | 6
}

export type ContentBlock =
  | HeroBlock
  | TextBlock
  | ImageTextBlock
  | ServicesGridBlock
  | PillarGridBlock
  | TestimonialCarouselBlock
  | FaqAccordionBlock
  | ProcessTimelineBlock
  | PricingPackagesBlock
  | GalleryCategoriesBlock
  | GalleriesBlock
  | ImageBlock
  | ButtonGroupBlock
  | TextGridBlock
  | InstagramFeedBlock

// ─── Page ACF fields ──────────────────────────────────────────────────────────
//
// WORDPRESS SETUP — Field Group: "Contact Details"
//   Location: Page → slug = contact
//   Fields: contact_email (Email), contact_phone (Text),
//           contact_address (Text), contact_hours (Text)

export interface WPPageAcf {
  /** Flexible Content page builder blocks */
  blocks?: ContentBlock[]
  /** Optional nav menu location override for this page (e.g. primary, weddings, events) */
  menu_override?: string
  /** When true, this page exists only for URL hierarchy — direct access returns 404 */
  container_only?: boolean
  /** Contact page — set via "Contact Details" field group */
  contact_email?: string
  contact_phone?: string
  contact_address?: string
  contact_hours?: string
}

// ─── Yoast SEO meta (populated when Yoast SEO plugin is active) ───────────────
export interface WPYoastMeta {
  title?: string
  description?: string
  og_image?: Array<{ url: string }>
}

// ─── WordPress REST API page response ─────────────────────────────────────────
export interface WPPage {
  id: number
  slug: string
  parent: number
  status: string
  title: WPRendered
  content: WPRendered
  excerpt: WPRendered
  yoast_head_json?: WPYoastMeta
  acf?: WPPageAcf
  featured_image?: WPImage
}

// ─── Gallery Custom Post Type ──────────────────────────────────────────────────
//
// WORDPRESS SETUP — Custom Post Type slug: gallery_photo
//   Field Group: "Gallery Photo"
//   Location: Post Type → gallery_photo
//   Fields: category (Select: Weddings|Portraits|Events),
//           full_image (Image), thumbnail_image (Image)

export interface WPGalleryPhotoAcf {
  category: 'Weddings' | 'Portraits' | 'Events'
  full_image: WPImage
  thumbnail_image?: WPImage
}

export interface WPGalleryPhoto {
  id: number
  title: WPRendered
  acf: WPGalleryPhotoAcf
}

// ─── Navigation Menu ──────────────────────────────────────────────────────────
//
// WORDPRESS SETUP — Appearance → Menus
//   1. Create a new menu (e.g. "Primary Navigation")
//   2. Add pages, custom links, or categories as menu items
//   3. Drag items right to create sub-items (dropdown children)
//   4. Under "Menu Settings", assign to the "Primary Navigation" location
//
//   Example structure:
//     Home           → /
//     Gallery        → /gallery
//       Weddings     → /gallery?category=Weddings
//       Portraits    → /gallery?category=Portraits
//       Events       → /gallery?category=Events
//     About          → /about
//     Contact        → /contact
//
// The sz-headless mu-plugin exposes menus via:
//   GET /wp-json/sz/v1/nav-menu/primary

export interface WPMenuItem {
  id: number
  title: string
  url: string
  children: WPMenuItem[]
}

// ─── Site Settings (ACF Options Page) ─────────────────────────────────────────
//
// WORDPRESS SETUP — ACF Options Page: "Site Settings"
//   The mu-plugin auto-registers this page. Create a Field Group with:
//     Location: Options Page → Site Settings
//     Fields:
//       site_name      (Text)    — Brand name shown in header/footer
//       tagline        (Text)    — Subtitle shown in footer
//       copyright_text (Text)    — Footer copyright (auto-generated if blank)
//       social_links   (Repeater)
//         ├── platform (Text)    — e.g. "Instagram"
//         └── url      (URL)     — e.g. "https://instagram.com/example-studio"
//
// Fetched once in root.tsx and passed to Navbar + Footer.
// REST endpoint: GET /wp-json/sz/v1/site-settings

export interface WPSocialLink {
  platform: string
  url: string
}

export interface WPSiteSettings {
  site_name: string
  tagline: string
  copyright_text: string
  social_links: WPSocialLink[]
}
