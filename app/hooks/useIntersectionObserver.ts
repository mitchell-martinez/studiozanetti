import { useEffect, useRef, useState } from 'react'

interface Options extends IntersectionObserverInit {
  /** Once the element has been seen, keep it visible (default: true) */
  triggerOnce?: boolean
}

/**
 * Returns a ref and a boolean indicating whether the element is (or has been)
 * intersecting the viewport.  Attach the ref to any HTML element.
 */
const useIntersectionObserver = <T extends HTMLElement = HTMLElement>(
  options: Options = {},
): [React.RefObject<T | null>, boolean] => {
  const { triggerOnce = true, ...observerOptions } = options
  const ref = useRef<T | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
        if (triggerOnce) observer.disconnect()
      } else if (!triggerOnce) {
        setIsVisible(false)
      }
    }, observerOptions)

    observer.observe(el)
    return () => observer.disconnect()
    // Primitive (or stringified) values keep the dep array stable across renders.
    // Callers should pass a stable `options` object (e.g. a module-level constant)
    // to avoid unnecessary observer recreation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerOnce, observerOptions.root, observerOptions.rootMargin, JSON.stringify(observerOptions.threshold)])

  return [ref, isVisible]
}

export default useIntersectionObserver
