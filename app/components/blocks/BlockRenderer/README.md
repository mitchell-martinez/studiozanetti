# BlockRenderer Component

Renders a list of ACF Flexible Content blocks, mapping each layout type to the corresponding React component.

---

## Overview

BlockRenderer is the bridge between WordPress ACF Flexible Content fields and the React frontend. When a WordPress admin builds a page using the WYSIWYG editor with ACF blocks, the BlockRenderer automatically maps each block type to its React component.

---

## WordPress Admin Setup

1. Edit a page in the WordPress admin
2. Scroll down to the **Content Blocks** section (ACF Flexible Content field)
3. Click **"Add Row"** and select a block type:
   - **Hero** — fullscreen hero banner
   - **Text Block** — heading + rich text + optional CTA
   - **Image + Text** — side-by-side image and text
   - **Services Grid** — card grid of services
   - **Pillar Grid** — feature/value cards
4. Fill in each block's fields
5. Drag blocks to reorder them
6. Save/Publish

Unknown block types are silently skipped — no frontend crash.

---

## Props

| Prop     | Type             | Required | Description                           |
| -------- | ---------------- | -------- | ------------------------------------- |
| `blocks` | `ContentBlock[]` | Yes      | Array of ACF Flexible Content blocks. |

---

## File Structure

```
components/blocks/BlockRenderer/
  index.tsx        ← Main component
  types.ts         ← TypeScript interfaces
  README.md        ← This file
  __tests__/
    BlockRenderer.test.tsx
```
