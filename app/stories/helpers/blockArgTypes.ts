/**
 * Shared Storybook argType definitions reused across block stories.
 *
 * The BlockStyleOptions fields appear on almost every block layout in WordPress.
 */

export const blockStyleArgTypes = {
  section_theme: {
    control: 'select',
    options: ['light', 'rose', 'champagne', 'dark', 'corporate'],
    description: 'Block colour theme (WP field: Section Theme)',
    table: { category: 'Style Options' },
  },
  top_spacing: {
    control: 'select',
    options: ['none', 'sm', 'md', 'lg'],
    description: 'Padding above the section (WP field: Top Spacing)',
    table: { category: 'Style Options' },
  },
  bottom_spacing: {
    control: 'select',
    options: ['none', 'sm', 'md', 'lg'],
    description: 'Padding below the section (WP field: Bottom Spacing)',
    table: { category: 'Style Options' },
  },
  max_width: {
    control: 'select',
    options: ['narrow', 'normal', 'wide'],
    description: 'Constrain block inner width (WP field: Max Width)',
    table: { category: 'Style Options' },
  },
  max_width_px: {
    control: { type: 'number', min: 0, step: 50 },
    description: 'Custom max width in pixels (overrides preset)',
    table: { category: 'Style Options' },
  },
  background_image: {
    control: 'object',
    description: 'Background image behind the block { url, alt, width, height }',
    table: { category: 'Style Options' },
  },
  background_image_opacity: {
    control: { type: 'number', min: 0, max: 1, step: 0.1 },
    description: 'Opacity of the background image (0–1)',
    table: { category: 'Style Options' },
  },
} as const
