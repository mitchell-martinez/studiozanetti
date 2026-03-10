# ServicesGridBlock Component

Responsive grid of service cards with images, titles, descriptions, and an optional CTA. Each card can optionally link to a URL — when a URL is provided the entire card becomes clickable (no separate CTA button).

---

## WordPress Admin Setup

1. Edit a page → scroll to **Content Blocks**
2. Click **Add Row** → select **Services Grid**
3. Fill in the fields:
   - **Heading** (optional): Section heading above the grid
   - **Subheading** (optional): Short text below the heading
   - **Columns** (optional): 2, 3, or 4 column layout (default 3)
   - **Maximum Columns** (optional): Caps the grid to fewer columns than the layout allows
   - **Card Style** (optional): `Elevated` (default, shadow + hover lift), `Outline` (bordered), `Minimal` (no border/shadow)
   - **Text Align** (optional): `Left` (default), `Centre`, or `Right` — controls horizontal text alignment inside each card   - **Body Font Size** (optional): `Small` (default), `Medium`, or `Large` — controls the font size of the service description text   - **Services** (repeater): Click "Add Row" for each service:
     - **Title** (required): Service name
     - **Description** (required): Short description
     - **Image** (optional): Service photo
     - **URL** (optional): When set, the whole card becomes a clickable link to this URL. Leave empty for a non-clickable card.
   - **CTA Text** (optional): Button label below the grid
   - **CTA URL** (optional): Button link target
4. Save/Publish

### Tips

- You can mix clickable and non-clickable cards — only cards with a URL become links.
- Centre text alignment works well when cards have no images.
- Combine **Maximum Columns** with a higher **Columns** value to cap how wide the grid gets on large screens.

---

## File Structure

```
components/blocks/ServicesGridBlock/
  index.tsx                          ← Main component
  types.ts                           ← TypeScript interfaces
  ServicesGridBlock.module.scss      ← Styles
  README.md                          ← This file
  __mocks__/
    servicesGridBlock.json           ← Mock data for tests & Storybook
  __tests__/
    ServicesGridBlock.test.tsx       ← Unit tests
```
