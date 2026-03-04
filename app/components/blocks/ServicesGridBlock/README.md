# ServicesGridBlock Component

Responsive grid of service cards with images, titles, descriptions, and an optional CTA.

---

## WordPress Admin Setup

1. Edit a page → scroll to **Content Blocks**
2. Click **Add Row** → select **Services Grid**
3. Fill in the fields:
   - **Heading** (optional): Section heading above the grid
   - **Services** (repeater): Click "Add Row" for each service:
     - **Title** (required): Service name
     - **Description** (required): Short description
     - **Image** (optional): Service photo
   - **CTA Text** (optional): Button label below the grid
   - **CTA URL** (optional): Button link target
4. Save/Publish

---

## File Structure

```
components/blocks/ServicesGridBlock/
  index.tsx                        ← Main component
  types.ts                         ← TypeScript interfaces
  ServicesGridBlock.module.scss    ← Styles
  README.md                        ← This file
```
