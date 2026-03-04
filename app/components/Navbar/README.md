# Navbar Component

Dynamic navigation bar that renders menu items from the WordPress backend, with full support for dropdown sub-menus.

---

## Overview

The Navbar fetches its structure from the WordPress **Appearance → Menus** system via the `sz-headless` mu-plugin's REST endpoint. The WordPress admin can:

- Add, remove, and reorder menu items
- Create dropdown sub-menus by nesting items (e.g. Gallery → Weddings, Portraits, Events)
- Link to any page, URL, or category

When WordPress is unavailable, the Navbar gracefully falls back to default links (Home, Gallery, About, Contact).

---

## WordPress Admin Setup

### Creating the Navigation Menu

1. Log in to the WordPress admin panel
2. Go to **Appearance → Menus**
3. Click **"Create a new Menu"**
4. Name it **"Primary Navigation"**
5. Add items from the left panel:
   - **Pages** tab → check pages and click "Add to Menu"
   - **Custom Links** tab → enter a URL and label manually
6. **To create dropdown sub-links**, drag a menu item slightly to the right under another item:

   ![Menu nesting example](https://developer.wordpress.org/files/2019/10/appearance-menus-702x336.png)

7. Under **Menu Settings** (bottom of the screen), check **"Primary Navigation"** as the Display location
8. Click **Save Menu**

### Recommended Menu Structure

```
Home              → /
Gallery           → /gallery
  ├─ Weddings     → /gallery?category=Weddings
  ├─ Portraits    → /gallery?category=Portraits
  └─ Events       → /gallery?category=Events
About             → /about
Pricing           → /pricing
Contact           → /contact
```

> **Tip:** For Gallery sub-links, use **Custom Links** and set the URL to `/gallery?category=Weddings` (etc.). The Gallery page reads the `category` parameter from the URL and auto-filters.

---

## Behaviour

### Desktop

- Top-level items render as horizontal links
- Items with children show a **dropdown flyout** on hover
- Dropdowns close when the mouse leaves or the user presses **Escape**

### Mobile (< 640px)

- Navigation collapses behind a **hamburger menu** button
- Items with children show a **caret toggle** (▾) next to the link
- Tapping the caret expands the sub-items as an accordion
- Tapping the parent link itself navigates to that page

### Accessibility

- Full keyboard navigation support
- `aria-expanded` on dropdown toggles
- `aria-label` on the hamburger menu button
- Skip-to-content link as the first focusable element
- Escape key closes open dropdowns
- All touch targets are at least 44×44px (WCAG 2.1 AA)

---

## Props

| Prop    | Type           | Required | Description                                                           |
| ------- | -------------- | -------- | --------------------------------------------------------------------- |
| `items` | `WPMenuItem[]` | Yes      | Menu items from WordPress. Pass an empty array to use fallback items. |

### `WPMenuItem` interface

```typescript
interface WPMenuItem {
  id: number
  title: string
  url: string
  children: WPMenuItem[]
}
```

---

## Data Flow

```
WordPress Admin → Appearance → Menus
       ↓
sz-headless mu-plugin (REST API)
  GET /wp-json/sz/v1/nav-menu/primary
       ↓
root.tsx loader → getNavMenu('primary')
       ↓
<Navbar items={navMenu} />
```

---

## Fallback Menu

When WordPress is unavailable or the menu is not configured, the Navbar renders these default items:

| Label   | URL      |
| ------- | -------- |
| Home    | /        |
| Gallery | /gallery |
| About   | /about   |
| Contact | /contact |

---

## File Structure

```
components/Navbar/
  index.tsx                  ← Main component
  types.ts                   ← TypeScript interfaces
  Navbar.module.scss         ← Styles (dropdown + mobile accordion)
  README.md                  ← This file
  __tests__/
    Navbar.test.tsx          ← Unit tests
  helpers/
    toRelativePath.ts        ← URL conversion utility
```
