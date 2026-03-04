# Footer Component

Dynamic site footer that renders navigation links from the WordPress backend, plus social media links and copyright info.

---

## Overview

The Footer receives the same `WPMenuItem[]` data as the Navbar (from the WordPress **Appearance → Menus** system). It renders top-level menu items as flat links. When WordPress is unavailable, it falls back to default links.

---

## WordPress Admin Setup

No separate configuration is needed — the Footer shares the same navigation menu as the Navbar.

1. Go to **Appearance → Menus** in WordPress admin
2. Configure the **Primary Navigation** menu (see [Navbar README](../Navbar/README.md) for details)
3. The Footer will automatically display the top-level items from that menu

### Social Media Links

Social media links are currently configured in code. To change them, update the `href` values in the Footer component. In a future version, these may be configurable via WordPress ACF options page.

---

## Props

| Prop    | Type           | Required | Description                                                           |
| ------- | -------------- | -------- | --------------------------------------------------------------------- |
| `items` | `WPMenuItem[]` | Yes      | Menu items from WordPress. Pass an empty array to use fallback items. |

---

## Accessibility

- `<footer>` landmark element for screen readers
- `aria-label` on the navigation region
- External links include "(opens in new tab)" in their aria-labels
- `rel="noopener noreferrer"` on external links for security

---

## File Structure

```
components/Footer/
  index.tsx                  ← Main component
  types.ts                   ← TypeScript interfaces
  Footer.module.scss         ← Styles
  README.md                  ← This file
  __tests__/
    Footer.test.tsx          ← Unit tests
```
