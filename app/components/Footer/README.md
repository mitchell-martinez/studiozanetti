# Footer Component

Compact site footer that renders navigation links from WordPress, site details, social media links, copyright information, and a fixed creator credit.

---

## Overview

The Footer receives the same `WPMenuItem[]` data as the Navbar (from the WordPress **Appearance → Menus** system). It renders top-level menu and social links in wrapping rows so larger menus remain compact. When WordPress is unavailable, it falls back to default links.

The site name, tagline, social links, and optional copyright text come from WordPress Site Settings. The creator credit is fixed site content and links to the creator's professional portfolio.

---

## WordPress Admin Setup

The Footer shares the same navigation menu as the Navbar.

1. Go to **Appearance → Menus** in WordPress admin
2. Configure the **Primary Navigation** menu (see [Navbar README](../Navbar/README.md) for details)
3. The Footer will automatically display the top-level items from that menu

### Social Media Links

Manage social media links in the WordPress **Site Settings** options page. Each entry needs a platform name and a complete URL. The Footer hides the social section when no links are provided.

### Site Details and Copyright

Use the WordPress **Site Settings** options page to update the site name, tagline, and copyright text. Leave the copyright field blank to automatically display the current year and site name.

### Creator Credit

The creator credit is fixed in the Footer component and is not editable in WordPress. Both **Mitchell Martinez** and **Get in touch with Mitchell today** link to [mitchellmartinez.tech](https://mitchellmartinez.tech/).

---

## Props

| Prop           | Type             | Required | Description                                                                       |
| -------------- | ---------------- | -------- | --------------------------------------------------------------------------------- |
| `items`        | `WPMenuItem[]`   | Yes      | Menu items from WordPress. Pass an empty array to use fallback items.             |
| `siteSettings` | `WPSiteSettings` | Yes      | Site name, tagline, copyright text, and social links from WordPress Site Settings. |

---

## Accessibility

- `<footer>` landmark element for screen readers
- `aria-label` on the navigation region
- External links include "(opens in new tab)" in their aria-labels
- `rel="noopener noreferrer"` on external links for security
- Navigation and social links retain a minimum 44px touch target
- Creator links have visible hover and keyboard-focus states

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
