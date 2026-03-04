# TextBlock Component

A text section with heading, rich text body, and optional call-to-action link.

---

## WordPress Admin Setup

1. Edit a page → scroll to **Content Blocks**
2. Click **Add Row** → select **Text Block**
3. Fill in the fields:
   - **Heading** (optional): Section heading (renders as `<h2>`)
   - **Body** (required): Rich text content (WYSIWYG editor)
   - **Align** (optional): "center" to center-align content
   - **CTA Text** (optional): Link label (e.g. "Read more")
   - **CTA URL** (optional): Where the link points to
4. Save/Publish

---

## File Structure

```
components/blocks/TextBlock/
  index.tsx              ← Main component
  types.ts               ← TypeScript interfaces
  TextBlock.module.scss  ← Styles
  README.md              ← This file
```
