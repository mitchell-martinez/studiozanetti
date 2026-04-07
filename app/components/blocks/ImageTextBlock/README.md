# ImageTextBlock Component

Side-by-side layout with an image and rich text content. Image position can be left or right. Image alignment, text vertical alignment, and text horizontal alignment are all configurable.

---

## WordPress Admin Setup

1. Edit a page → scroll to **Content Blocks**
2. Click **Add Row** → select **Image + Text**
3. Fill in the fields:
   - **Image** (required): Upload or select an image
   - **Heading** (optional): Section heading (renders as `<h2>`)
   - **Body** (required): Rich text content (WYSIWYG editor)
   - **Image Position** (optional): "left" (default) or "right"
   - **Image Ratio** (optional): "landscape" (4:3), "portrait" (3:4), "square" (1:1), or "auto" (natural proportions)
   - **Image Alignment** (optional): "left" (default), "centre", or "right" — controls how the image is horizontally positioned within its cropped frame (most visible when a ratio is applied)
   - **Image Max Width (px)** (optional): Caps the image width in pixels — height scales proportionally so the image is never distorted
   - **Image Max Height (px)** (optional): Caps the image height in pixels — width scales proportionally so the image is never distorted
   - **Text Vertical Alignment** (optional): "top", "middle" (default), or "bottom" — controls where the text sits relative to the image height
   - **Text Horizontal Alignment** (optional): "left" (default), "centre", or "right" — controls the text alignment within the text column
4. Save/Publish

### Controlling Image Size

If images are rendering larger than desired (e.g. at their full 1200 px upload height), use the **Image Max Width** and/or **Image Max Height** fields to constrain them. The image will shrink to fit within those bounds while maintaining its aspect ratio — it will never stretch or distort.

Set **Image Ratio** to **Auto** when you want the image to display at its natural proportions instead of being cropped to a preset ratio.

### Image Alignment

**Image Alignment** controls the focal point of the image within its cropped frame (i.e. `object-position`). This is most visible when the image is cropped to a ratio (landscape, portrait, square). When set to "Auto" ratio the image displays at its natural proportions and alignment has minimal effect.

### Text Alignment

- **Vertical alignment** controls how the text column lines up against the image: top-aligned, centred (default), or bottom-aligned.
- **Horizontal alignment** controls whether text content is left-aligned (default), centred, or right-aligned within its column.
- If only a heading is provided (no body), or only body content is provided (no heading), the single piece of content is perfectly centred in the text column. When both are present they align as a combined block.

---

## File Structure

```
components/blocks/ImageTextBlock/
  index.tsx                    ← Main component
  types.ts                     ← TypeScript interfaces
  ImageTextBlock.module.scss   ← Styles
  README.md                    ← This file
```
