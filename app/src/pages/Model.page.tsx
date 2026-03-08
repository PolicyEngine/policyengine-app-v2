/**
 * Embeds the PolicyEngine Model overview via a same-origin Vercel rewrite.
 * Because the rewrite makes the iframe same-origin, we can directly read
 * its document height and resize the iframe to fit without scrollbars.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

const FALLBACK_HEIGHT = 'calc(100vh - 200px)';
const POLL_INTERVAL = 500;

export default function ModelPage() {
  const countryId = useCurrentCountry();
  // Same-origin path via Vercel rewrite — allows contentDocument access
  const embedUrl = `/_model-embed?embed&country=${countryId}`;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<string>(FALLBACK_HEIGHT);

  const measureHeight = useCallback(() => {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (doc?.body) {
        const h = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight);
        if (h > 0) {
          setHeight(`${h}px`);
        }
      }
    } catch {
      // Cross-origin fallback — ignore
    }
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) {
      return;
    }

    // Measure on load and then poll for dynamic content changes
    const handleLoad = () => {
      measureHeight();
    };
    iframe.addEventListener('load', handleLoad);

    const interval = setInterval(measureHeight, POLL_INTERVAL);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      clearInterval(interval);
    };
  }, [measureHeight]);

  return (
    <iframe
      ref={iframeRef}
      src={embedUrl}
      title="Model overview | PolicyEngine"
      style={{
        width: '100%',
        height,
        minHeight: FALLBACK_HEIGHT,
        border: 'none',
        display: 'block',
      }}
    />
  );
}
