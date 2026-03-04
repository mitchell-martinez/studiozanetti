# PillarGridBlock Component

Grid of feature/value cards, ideal for showcasing principles, approach pillars or key differentiators.

---

## WordPress Admin Setup

1. Edit a page → scroll to **Content Blocks**
2. Click **Add Row** → select **Pillar Grid**
3. Fill in the fields:
   - **Heading** (optional): Section heading above the grid
   - **Pillars** (repeater): Click "Add Row" for each pillar:
     - **Title** (required): Pillar name
     - **Description** (required): Short description
4. Save/Publish

---

## File Structure

```
components/blocks/PillarGridBlock/
  index.tsx                        ← Main component
  types.ts                         ← TypeScript interfaces
  PillarGridBlock.module.scss      ← Styles
  README.md                        ← This file
```
