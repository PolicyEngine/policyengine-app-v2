/**
 * Embeds the PolicyEngine Model overview from Vercel.
 * Listens for postMessage height updates from the embedded app
 * so the iframe expands to fit its content without scrollbars.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

const EMBED_BASE = 'https://policyengine-model.vercel.app';
const FALLBACK_HEIGHT = 'calc(100vh - 200px)';

export default function ModelPage() {
  const countryId = useCurrentCountry();
  const embedUrl = `${EMBED_BASE}?embed&country=${countryId}`;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<string>(FALLBACK_HEIGHT);

  const handleMessage = useCallback((event: MessageEvent) => {
    // Only accept messages from the embed origin
    try {
      if (new URL(EMBED_BASE).origin !== event.origin) {
        return;
      }
    } catch {
      return;
    }

    // Support common height message formats
    const data = event.data;
    if (typeof data === 'object' && data !== null) {
      const h = data.height ?? data.frameHeight ?? data.documentHeight;
      if (typeof h === 'number' && h > 0) {
        setHeight(`${h}px`);
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

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
