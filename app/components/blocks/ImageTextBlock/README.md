# ImageTextBlock Component

Side-by-side layout with an image and rich text content. Image position can be left or right.

---

## WordPress Admin Setup

1. Edit a page → scroll to **Content Blocks**
2. Click **Add Row** → select **Image + Text**
3. Fill in the fields:
   - **Image** (required): Upload or select an image
   - **Heading** (optional): Section heading (renders as `<h2>`)
   - **Body** (required): Rich text content (WYSIWYG editor)
   - **Image Position** (optional): "left" (default) or "right"
4. Save/Publish

---

## File Structure

```
components/blocks/ImageTextBlock/
  index.tsx                    ← Main component
  types.ts                     ← TypeScript interfaces
  ImageTextBlock.module.scss   ← Styles
  README.md                    ← This file
```
