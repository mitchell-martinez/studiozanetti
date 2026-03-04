# BiographyBlock Component

Photo + biography layout for team member profiles.

---

## WordPress Admin Setup

1. Edit a page → scroll to **Content Blocks**
2. Click **Add Row** → select **Biography**
3. Fill in the fields:
   - **Image** (optional): Profile photo
   - **Name** (required): Person's name (renders as `<h2>`)
   - **Role** (optional): Job title/role
   - **Bio** (required): Rich text biography (WYSIWYG editor)
4. Save/Publish

---

## File Structure

```
components/blocks/BiographyBlock/
  index.tsx                      ← Main component
  types.ts                       ← TypeScript interfaces
  BiographyBlock.module.scss     ← Styles
  README.md                      ← This file
```
