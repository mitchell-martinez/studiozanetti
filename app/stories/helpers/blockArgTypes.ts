/**
 * Shared Storybook argType definitions reused across block stories.
 *
 * The three BlockStyleOptions fields (section_theme, top_spacing,
 * bottom_spacing) appear on almost every block layout in WordPress.
 */

export const blockStyleArgTypes = {
  section_theme: {
    control: 'select',
    options: ['light', 'rose', 'champagne', 'dark'],
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
} as const
