# PwaRegistrar Component

Registers the service worker for Progressive Web App (PWA) functionality.

---

## Overview

The PwaRegistrar component handles service worker registration on the client side. It is lazy-loaded in a `Suspense` boundary inside `root.tsx` so it never blocks server-side rendering.

This component requires no WordPress configuration — it is automatically included in the app layout.

---

## Behaviour

- Only runs on the client (`typeof window !== 'undefined'` guard)
- Dynamically imports `virtual:pwa-register` from `vite-plugin-pwa`
- Registers the service worker with `immediate: false` (deferred registration)
- Renders nothing (`return null`)

---

## Props

This component takes no props.

---

## File Structure

```
components/PwaRegistrar/
  index.tsx                  ← Main component
  README.md                  ← This file
```
