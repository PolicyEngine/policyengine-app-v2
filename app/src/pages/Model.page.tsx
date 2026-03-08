/**
 * Embeds the PolicyEngine Model overview in a simple iframe
 * with a fixed height. The postMessage-based auto-sizing from the
 * child app is intentionally not used to avoid resize loops.
 */
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

const HEIGHT = '4000px';

export default function ModelPage() {
  const countryId = useCurrentCountry();
  const embedUrl = `https://policyengine-model.vercel.app/?embed&country=${countryId}`;

  return (
    <iframe
      src={embedUrl}
      title="Model overview | PolicyEngine"
      style={{
        width: '100%',
        height: HEIGHT,
        border: 'none',
        display: 'block',
      }}
    />
  );
}
