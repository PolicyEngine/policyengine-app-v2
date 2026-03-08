import { useEffect, useRef, useState } from 'react';

/**
 * Returns a ref and a boolean indicating whether the element has entered
 * the viewport. Uses IntersectionObserver — no scroll listener overhead.
 *
 * @param threshold - Fraction of the element visible before triggering (0–1)
 * @param rootMargin - Margin around the root (e.g. "-80px 0px")
 */
export function useScrollReveal<T extends Element>(
  threshold = 0.15,
  rootMargin = '0px'
): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect(); // fire once only
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return [ref, visible];
}
