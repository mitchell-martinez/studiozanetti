/**
 * PwaRegistrar — registers the service worker on the client only.
 * Rendered in a Suspense boundary inside root.tsx so it never blocks SSR.
 */
const PwaRegistrar = () => {
  if (typeof window !== 'undefined') {
    import('virtual:pwa-register').then(({ registerSW }) => {
      registerSW({ immediate: false })
    })
  }
  return null
}

export default PwaRegistrar
