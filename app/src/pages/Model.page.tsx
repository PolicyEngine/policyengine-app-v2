/**
 * Embeds the PolicyEngine Model overview.
 * Listens for postMessage height updates from the embedded app
 * and falls back to a fixed height per country.
 */
import { useEffect, useRef, useState } from 'react';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

const FIXED_HEIGHTS: Record<string, string> = {
  us: '5200px',
  uk: '5200px',
};
const DEFAULT_HEIGHT = '5200px';

export default function ModelPage() {
  const countryId = useCurrentCountry();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<string>(FIXED_HEIGHTS[countryId] ?? DEFAULT_HEIGHT);

  // Listen for height messages from the embedded app's ResizeObserver
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (
        typeof e.data === 'object' &&
        e.data !== null &&
        typeof e.data.height === 'number' &&
        e.data.height > 0
      ) {
        setHeight(`${e.data.height}px`);
      }
    }
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Update fixed height if country changes
  useEffect(() => {
    setHeight(FIXED_HEIGHTS[countryId] ?? DEFAULT_HEIGHT);
  }, [countryId]);

  const embedUrl = `https://policyengine-model.vercel.app/?embed&country=${countryId}`;

  return (
    <iframe
      ref={iframeRef}
      src={embedUrl}
      title="Model overview | PolicyEngine"
      style={{
        width: '100%',
        height,
        border: 'none',
        display: 'block',
      }}
    />
  );
}
