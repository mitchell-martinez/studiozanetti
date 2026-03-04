# HeroBlock Component

Fullscreen hero banner with background image, title, optional tagline, and call-to-action button.

---

## WordPress Admin Setup

1. Edit a page → scroll to **Content Blocks**
2. Click **Add Row** → select **Hero**
3. Fill in the fields:
   - **Background Image** (required): Upload or select a high-quality image (recommended: 1600×900+)
   - **Title** (required): The main hero heading (renders as `<h1>`)
   - **Tagline** (optional): Italic subtitle displayed below the title
   - **CTA Text** (optional): Button label (e.g. "View Gallery")
   - **CTA URL** (optional): Where the button links to (e.g. "/gallery")
4. Save/Publish

---

## Performance

- Background image uses `fetchPriority="high"` and `decoding="sync"` since it's above the fold
- Explicit `width`/`height` attributes prevent layout shift

---

## File Structure

```
components/blocks/HeroBlock/
  index.tsx              ← Main component
  types.ts               ← TypeScript interfaces
  HeroBlock.module.scss  ← Styles
  README.md              ← This file
```
