# GalleryGrid Component

Interactive photo gallery grid with lazy-loaded images, lightbox viewer, and keyboard navigation.

---

## Overview

The GalleryGrid displays a responsive grid of photos. Each photo can be clicked to open a fullscreen lightbox with navigation arrows. Images are lazy-loaded with intersection observer for optimal performance.

This is a reusable presentation component. Current WordPress-managed galleries use `sz_gallery` Gallery Library entries rendered through the `gallery_reference` page block and `GalleriesBlock`. `GalleryGrid` is used by local demonstrations and any caller that already has a `GalleryImage[]`; it does not fetch WordPress or define an editor workflow.

---

## Props

| Prop     | Type             | Required | Description              |
| -------- | ---------------- | -------- | ------------------------ |
| `images` | `GalleryImage[]` | Yes      | Array of images to show. |

### `GalleryImage` interface

```typescript
interface GalleryImage {
  id: number
  category: string
  alt: string
  thumbnail: string
  src: string
}
```

---

## Subcomponents

### LazyImage

Wraps each grid thumbnail with intersection-observer-based lazy loading and a skeleton placeholder.

### Lightbox

Fullscreen image viewer with:

- Close button (× icon)
- Previous / Next navigation arrows
- Keyboard support: Escape (close), ArrowLeft/ArrowRight (navigate)
- Focus trap: close button receives focus on open; focus returns to trigger element on close
- Click on backdrop to close

---

## Accessibility

- Grid items use `role="listitem"` within a `role="list"` container
- Each item has `tabIndex={0}` and responds to Enter/Space key
- Lightbox uses `role="dialog"` with `aria-modal="true"`
- Navigation buttons have descriptive `aria-label` attributes
- Focus management: focus moves to lightbox on open, returns to trigger on close
- All touch targets meet the 44×44px minimum (WCAG 2.1 AA)

---

## Performance

- Images are lazy-loaded via `IntersectionObserver` (200px root margin)
- Skeleton placeholders prevent layout shift
- Component is wrapped in `React.memo` to avoid unnecessary re-renders
- The Gallery route lazy-loads this entire component with `React.lazy`

---

## File Structure

```
components/GalleryGrid/
  index.tsx                  ← Main component
  types.ts                   ← TypeScript interfaces
  GalleryGrid.module.scss    ← Styles
  README.md                  ← This file
  __tests__/
    GalleryGrid.test.tsx     ← Unit tests
  LazyImage/
    index.tsx                ← Lazy-loaded image subcomponent
  Lightbox/
    index.tsx                ← Fullscreen lightbox subcomponent
```
