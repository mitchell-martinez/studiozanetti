# Button

Shared, reusable Button / CTA component used across the entire site. Consolidates 7 previously duplicated button implementations into a single flexible primitive.

## Usage

```tsx
import Button from '~/components/Button'

// Internal link (uses React Router <Link>)
<Button href="/contact" variant="primary">Send Enquiry</Button>

// External link (uses <a target="_blank">)
<Button href="https://instagram.com/example-studio" variant="outline">Instagram</Button>

// Native <button> (no href)
<Button onClick={handleSubmit} variant="primary" type="submit">Submit</Button>
```

## Props

| Prop           | Type                                                        | Default     | Description                                    |
| -------------- | ----------------------------------------------------------- | ----------- | ---------------------------------------------- |
| `children`     | `ReactNode`                                                 | —           | Button label content (required)                |
| `variant`      | `'primary' \| 'secondary' \| 'outline' \| 'dark' \| 'text'` | `'primary'` | Visual style                                   |
| `size`         | `'sm' \| 'md' \| 'lg'`                                      | `'md'`      | Size preset                                    |
| `href`         | `string`                                                    | —           | URL — renders Link or `<a>` when set           |
| `openInNewTab` | `boolean`                                                   | `false`     | Open link in a new browser tab                 |
| `inverted`     | `boolean`                                                   | `false`     | Inverted colour scheme for dark/image overlays |
| `fullWidth`    | `boolean`                                                   | `false`     | Stretch to full container width                |
| `className`    | `string`                                                    | —           | Extra CSS class for composition                |
| `ariaLabel`    | `string`                                                    | —           | Accessible label override                      |
| `type`         | `'button' \| 'submit' \| 'reset'`                           | `'button'`  | Native button type (ignored when href is set)  |
| `onClick`      | `() => void`                                                | —           | Click handler (ignored when href is set)       |

## Variants

| Variant     | Appearance                              | Use Case                             |
| ----------- | --------------------------------------- | ------------------------------------ |
| `primary`   | Accent fill, pill shape                 | Main CTAs                            |
| `secondary` | Soft fill, soft border, pill            | Secondary actions                    |
| `outline`   | Accent border, no fill, pill            | Pricing, subtle emphasis             |
| `dark`      | Dark fill, rectangular (4px radius)     | ServicesGrid section CTA             |
| `text`      | No background, link-style, no uppercase | Inline CTAs in TextBlock, ImageBlock |

## Sizes

| Size | Padding          | Text Transform |
| ---- | ---------------- | -------------- |
| `sm` | `0.55rem 1.2rem` | None           |
| `md` | `0.85rem 2rem`   | Uppercase      |
| `lg` | `1rem 2.8rem`    | Uppercase      |

## Inverted Mode

Use `inverted` on dark overlays (Hero, ImageBlock):

```tsx
<Button href="/contact" variant="primary" inverted>Book Now</Button>
<Button href="/gallery" variant="secondary" inverted>View Gallery</Button>
```

## Smart Element Selection

- **No `href`** → renders `<button>` (native)
- **Internal `href`** (e.g. `/contact`) → renders React Router `<Link>`
- **External `href`** (e.g. `https://...`) or `openInNewTab` → renders `<a target="_blank" rel="noopener noreferrer">`

## Accessibility

- Minimum tap target: 44×44px on all sizes
- `focus-visible` ring: 3px accent outline
- `aria-label` prop for screen reader overrides
- External links include `rel="noopener noreferrer"`
