# ImageBlock

A full-width image block with an optional parallax scroll effect. By default, the image displays as a static banner. Toggle **Parallax Scroll** to enable a cinematic depth effect where the background image stays fixed while the page scrolls over it (using CSS `background-attachment: fixed`).

> **Note:** On iOS Safari, `background-attachment: fixed` is not supported and the image gracefully falls back to a static background.

## WordPress Setup

This block is available as an **Image** layout within the **Page Blocks** flexible content field.

### Fields

| Field               | Type       | Required | Description                                                                                                               |
| ------------------- | ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| Image               | Image      | ✅       | The full-width background image. Use high-resolution landscape images (≥ 1600 × 1000px) for best results.                 |
| Height              | Select     | —        | Section height: **Medium** (68vh), **Large** (86vh, default), or **Full Screen** (100vh). Same options as the Hero block. |
| Overlay Strength    | Select     | —        | Optional dark overlay: **Light**, **Medium**, or **Strong**. Leave empty for no overlay.                                  |
| Overlay Text        | Text       | —        | Optional large text displayed centred over the image.                                                                     |
| Title               | Text       | —        | Optional centred title over the image.                                                                                    |
| Title Pop Out       | True/False | —        | Enlarge the title text on mouseover. **On by default**.                                                                   |
| Subtitle            | Text       | —        | Optional subtitle displayed below the title.                                                                              |
| Subtitle Pop Out    | True/False | —        | Enlarge the subtitle text on mouseover. **Off by default**.                                                               |
| Text Align          | Select     | —        | Alignment of overlay text: **Centre** (default), **Left**, or **Right**.                                                  |
| Parallax Scroll     | True/False | —        | Toggle parallax depth effect on or off. **Off by default** (static banner).                                               |
| Accessibility Label | Text       | —        | Custom `aria-label` for the section. Defaults to "Full-width image banner".                                               |

### How to Add

1. Edit a page in the WordPress admin.
2. In the **Page Blocks** flexible content field, click **Add Block**.
3. Select **Image**.
4. Upload or select a high-quality landscape image.
5. Adjust height and overlay settings as desired.
6. Optionally toggle **Parallax Scroll** for a depth effect.
7. Publish or update the page.

### Tips

- **Image quality**: Use landscape images at least 1600px wide for best results across all screen sizes.
- **Static mode**: Leave Parallax Scroll off for a simple full-width banner — great as a visual divider between content blocks.
- **Overlay text**: Keep it short — 3–6 words works best for visual impact.
- **Overlay strength**: If using text, set an overlay strength of at least "Light" to ensure readability.
- **Accessibility**: The block respects the `prefers-reduced-motion` system setting — parallax is automatically disabled (background scrolls normally) for users who have motion reduction enabled.
- **Mobile**: On iOS Safari, `background-attachment: fixed` is not supported. The image will display as a static background instead. This is expected behaviour and provides a good fallback experience.
- **Height**: Use "Medium" for section dividers between content blocks, "Large" or "Full Screen" for more dramatic visual breaks.

### Screenshots

_Add screenshots of the block in the WordPress admin and on the frontend here._
