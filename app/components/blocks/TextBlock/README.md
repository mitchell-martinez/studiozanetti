# TextBlock Component

A text section with heading, rich text body, and optional call-to-action link.
Supports independent **text alignment** (left / centre / right / justified) and **block alignment** (left / centre / right).

---

## WordPress Admin Setup

1. Edit a page → scroll to **Content Blocks**
2. Click **Add Row** → select **Text Block**
3. Fill in the fields:
   - **Eyebrow** (optional): Small uppercase label above the heading
   - **Heading** (optional): Section heading (renders as `<h2>`)
   - **Body** (required): Rich text content (WYSIWYG editor)
   - **Text Align** (optional, default "Left"): Alignment of text _within_ the block — Left, Centre, Right, or Justified
   - **Block Align** (optional, default "Left"): Horizontal position of the _entire block_ on the page — Left, Centre, or Right
   - **Max Width** (optional, default "Normal"): Constrains the block width — Narrow (560 px), Normal (680 px), or Wide (920 px)
   - **CTA Text** (optional): Link label (e.g. "Read more")
   - **CTA URL** (optional): Where the link points to
  - **Background Image** (optional): Section background image
  - **Background Image Opacity** (optional): Image visibility where 0 is fully dimmed and 1 is fully visible
  - **Background Image Shadow Strength** (optional): Extra darkening layer where 0 is no shadow, 0.5 is reasonably strong, and 1 is black
   - **Section Theme** / **Top Spacing** / **Bottom Spacing**: Shared style options (see global docs)
4. Save/Publish

### Alignment Tips

| Text Align | Block Align | Visual result                                                 |
| ---------- | ----------- | ------------------------------------------------------------- |
| Left       | Left        | Default — text left-aligned, block sits on the left           |
| Centre     | Centre      | Centred text in a centred block (great for pull-quotes)       |
| Right      | Right       | Right-aligned text pushed to the right margin                 |
| Justified  | Centre      | Even paragraph edges in a centred block                       |
| Left       | Centre      | Left-aligned text but the block itself is centred on the page |

---

## File Structure

```
components/blocks/TextBlock/
  index.tsx              ← Main component
  types.ts               ← TypeScript interfaces
  TextBlock.module.scss  ← Styles
  README.md              ← This file
  __tests__/
    TextBlock.test.tsx   ← Unit tests
```
