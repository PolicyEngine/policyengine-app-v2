/**
 * Embeds the PolicyEngine Model overview from Vercel.
 * Inherits policyengine.org header/footer via StaticLayout.
 * Passes countryId so the model page shows US or UK content.
 */
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

export default function ModelPage() {
  const countryId = useCurrentCountry();
  const embedUrl = `https://policyengine-model.vercel.app?embed&country=${countryId}`;

  return (
    <iframe
      src={embedUrl}
      title="Model overview | PolicyEngine"
      style={{
        width: '100%',
        minHeight: 'calc(100vh - 200px)',
        border: 'none',
      }}
    />
  );
}
