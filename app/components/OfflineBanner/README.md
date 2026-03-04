# OfflineBanner Component

A banner notification that appears when the user loses internet connectivity.

---

## Overview

The OfflineBanner uses the `useOnlineStatus` hook to detect connectivity changes. When the user goes offline, a sticky banner appears below the Navbar informing them that some content may not be available. The banner automatically disappears when connectivity is restored.

This component requires no WordPress configuration — it is part of the PWA (Progressive Web App) experience.

---

## Behaviour

- **Hidden** when the user is online (renders `null`)
- **Visible** when the user is offline — shows a warning banner with a WiFi-off icon
- Uses `role="status"` and `aria-live="polite"` for screen reader announcements
- Positioned sticky below the Navbar (64px from top)

---

## Props

This component takes no props.

---

## Accessibility

- `role="status"` — screen readers announce the banner when it appears
- `aria-live="polite"` — does not interrupt the current announcement
- Icon is decorative (`aria-hidden="true"`)
- Sufficient colour contrast (amber background on white text meets WCAG AA)

---

## File Structure

```
components/OfflineBanner/
  index.tsx                    ← Main component
  OfflineBanner.module.scss    ← Styles
  README.md                    ← This file
  __tests__/
    OfflineBanner.test.tsx     ← Unit tests
```
