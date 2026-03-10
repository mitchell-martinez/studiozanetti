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
   - **Image Ratio** (optional): "landscape" (4:3), "portrait" (3:4), "square" (1:1), or "auto" (natural proportions)
   - **Image Max Width (px)** (optional): Caps the image width in pixels — height scales proportionally so the image is never distorted
   - **Image Max Height (px)** (optional): Caps the image height in pixels — width scales proportionally so the image is never distorted
4. Save/Publish

### Controlling Image Size

If images are rendering larger than desired (e.g. at their full 1200 px upload height), use the **Image Max Width** and/or **Image Max Height** fields to constrain them. The image will shrink to fit within those bounds while maintaining its aspect ratio — it will never stretch or distort.

Set **Image Ratio** to **Auto** when you want the image to display at its natural proportions instead of being cropped to a preset ratio.

---

## File Structure

```
components/blocks/ImageTextBlock/
  index.tsx                    ← Main component
  types.ts                     ← TypeScript interfaces
  ImageTextBlock.module.scss   ← Styles
  README.md                    ← This file
```
