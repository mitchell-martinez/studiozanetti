# TextGridBlock

A responsive grid of text cards with optional per-card CTA buttons. Ideal for "why choose us" sections, feature lists, or value propositions.

## WordPress Setup

This block appears in the **Page Blocks** flexible content field as **"Text Grid"**.

### Fields

| Field | Type | Description |
| --- | --- | --- |
| **Heading** | Text | Optional section heading |
| **Subheading** | Text | Optional subtitle below the heading |
| **Items** (Repeater) | Repeater | Grid items (min 1) |
| ↳ Title | Text | Card heading (required) |
| ↳ Body | Textarea | Card body text (required) |
| ↳ CTA Text | Text | Optional link label |
| ↳ CTA URL | URL | Optional link destination |
| **Columns** | Select | `2` · `3` · `4` — number of columns at widest breakpoint |
| **Card Style** | Select | `elevated` · `outline` · `minimal` |
| **Text Align** | Select | `left` · `center` · `right` |
| Section Theme | Select | Light · Rose · Champagne · Dark |
| Top Spacing | Select | None · Small · Medium · Large |
| Bottom Spacing | Select | None · Small · Medium · Large |

### Usage Tips

- Use **3 columns** (default) for balanced layouts on most pages.
- Use **2 columns** for longer descriptions or alongside other narrow blocks.
- Cards without a CTA URL will simply omit the link — no empty button is rendered.
- The `minimal` card style removes all card chrome — perfect when used with the Dark theme.
- Each card CTA uses the `text` button variant (link-style) for a subtle, non-intrusive look.

### Difference from PillarGrid

PillarGrid is a simpler block with title + description pillars and no per-item CTAs. Use **TextGrid** when you need per-card actions, more card style options, or when the grid items link to different pages.

## Accessibility

- Semantic `<article>` elements for each card.
- All CTA links have minimum 44px tap targets.
- Colour contrast meets WCAG 2.1 AA for all theme/card-style combinations.
