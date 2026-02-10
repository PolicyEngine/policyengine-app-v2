/**
 * Embeds the PolicyEngine Model overview from Vercel.
 * Inherits policyengine.org header/footer via StaticLayout.
 */
export default function ModelPage() {
  const embedUrl = 'https://policyengine-model.vercel.app?embed';

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
