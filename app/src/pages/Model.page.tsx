/**
 * Embeds the PolicyEngine Model overview from Vercel.
 * Inherits policyengine.org header/footer via StaticLayout.
 *
 * The embedded app posts its content height via postMessage so the
 * iframe can grow to fit, letting the parent page scroll naturally
 * with the footer only visible at the very bottom.
 */
import { useCallback, useEffect, useState } from 'react';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

export default function ModelPage() {
  const countryId = useCurrentCountry();
  const embedUrl = `https://policyengine-model.vercel.app?embed&country=${countryId}`;
  const [height, setHeight] = useState<number | null>(null);

  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.data?.type === 'policyengine-model-height') {
      setHeight(event.data.height);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  return (
    <iframe
      src={embedUrl}
      title="Model overview | PolicyEngine"
      style={{
        width: '100%',
        height: height ? `${height}px` : 'calc(100vh - 200px)',
        border: 'none',
      }}
    />
  );
}
