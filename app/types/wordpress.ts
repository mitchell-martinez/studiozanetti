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
//     │     heading (Text), body (WYSIWYG), align (Select: left|center),
//     │     cta_text (Text), cta_url (URL)
//     ├── Layout: image_text
//     │     image (Image), heading (Text), body (WYSIWYG),
//     │     image_position (Select: left|right)
//     ├── Layout: services_grid
//     │     heading (Text), cta_text (Text), cta_url (URL),
//     │     services (Repeater → title (Text), description (Textarea), image (Image))
//     ├── Layout: biography
//     │     image (Image), name (Text), role (Text), bio (WYSIWYG)
//     └── Layout: pillar_grid
//           heading (Text),
//           pillars (Repeater → title (Text), description (Textarea))

export interface HeroBlock {
  acf_fc_layout: 'hero'
  background_image: WPImage
  title: string
  tagline?: string
  cta_text?: string
  cta_url?: string
}

export interface TextBlock {
  acf_fc_layout: 'text_block'
  heading?: string
  body: string
  align?: 'left' | 'center'
  cta_text?: string
  cta_url?: string
}

export interface ImageTextBlock {
  acf_fc_layout: 'image_text'
  image: WPImage
  heading?: string
  body: string
  image_position?: 'left' | 'right'
}

export interface WPServiceItem {
  title: string
  description: string
  image?: WPImage
}

export interface ServicesGridBlock {
  acf_fc_layout: 'services_grid'
  heading?: string
  services: WPServiceItem[]
  cta_text?: string
  cta_url?: string
}

export interface BiographyBlock {
  acf_fc_layout: 'biography'
  image?: WPImage
  name: string
  role?: string
  bio: string
}

export interface WPPillarItem {
  title: string
  description: string
}

export interface PillarGridBlock {
  acf_fc_layout: 'pillar_grid'
  heading?: string
  pillars: WPPillarItem[]
}

export type ContentBlock =
  | HeroBlock
  | TextBlock
  | ImageTextBlock
  | ServicesGridBlock
  | BiographyBlock
  | PillarGridBlock

// ─── Page ACF fields ──────────────────────────────────────────────────────────
//
// WORDPRESS SETUP — Field Group: "Contact Details"
//   Location: Page → slug = contact
//   Fields: contact_email (Email), contact_phone (Text),
//           contact_address (Text), contact_hours (Text)

export interface WPPageAcf {
  /** Flexible Content page builder blocks */
  blocks?: ContentBlock[]
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
  status: string
  title: WPRendered
  content: WPRendered
  excerpt: WPRendered
  yoast_head_json?: WPYoastMeta
  acf?: WPPageAcf
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
