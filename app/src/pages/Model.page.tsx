/**
 * Embeds the PolicyEngine Model overview from Vercel
 * Explains how the microsimulation model works: rules, data, and behavioral responses.
 */
export default function ModelPage() {
  const embedUrl = 'https://policyengine-model.vercel.app';

  return (
    <iframe
      src={embedUrl}
      title="Model overview | PolicyEngine"
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
      }}
    />
  );
}
