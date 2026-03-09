/**
 * Embeds the PolicyEngine Model overview in an iframe that auto-sizes
 * to match the child content height via postMessage.
 */
import { useCallback, useEffect, useState } from 'react';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

const MIN_HEIGHT = 4000;

export default function ModelPage() {
  const countryId = useCurrentCountry();
  const embedUrl = `https://policyengine-model.vercel.app/?embed&country=${countryId}`;
  const [height, setHeight] = useState(MIN_HEIGHT);

  const onMessage = useCallback((e: MessageEvent) => {
    if (e.data?.type === 'policyengine-model-height' && typeof e.data.height === 'number') {
      setHeight(Math.max(e.data.height, MIN_HEIGHT));
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onMessage]);

  return (
    <iframe
      src={embedUrl}
      title="Model overview | PolicyEngine"
      style={{
        width: '100%',
        height: `${height}px`,
        border: 'none',
        display: 'block',
      }}
    />
  );
}
