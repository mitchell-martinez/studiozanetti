# RichText Component

Renders trusted WordPress HTML content from WYSIWYG fields or `content.rendered`.

---

## Overview

RichText is a utility component that safely renders HTML output from WordPress. It is used by TextBlock, ImageTextBlock, and the catch-all slug route for pages using the Classic Editor or Gutenberg.

---

## WordPress Admin Usage

No special configuration needed. Any content written in:

- The WordPress **Classic Editor**
- The **Gutenberg block editor**
- ACF **WYSIWYG** fields

...is rendered by this component with consistent styling.

Blog post authors can select **Add Button** beside **Add Media** in the main Classic Editor. WordPress inserts a semantic link using this stable markup contract:

```html
<p class="sz-post-button sz-post-button--center">
  <a class="sz-post-button__link" href="/contact">Enquire now</a>
</p>
```

The wrapper also accepts `sz-post-button--left`. These links share the primary medium button style used by the React Button component. This authoring control is intentionally limited to blog posts; pages use the ACF Button Group block.

---

## Props

| Prop   | Type     | Required | Description               |
| ------ | -------- | -------- | ------------------------- |
| `html` | `string` | Yes      | Raw HTML string to render |

---

## File Structure

```
components/RichText/
  index.tsx              ← Main component
  RichText.module.scss   ← Styles
  README.md              ← This file
```
