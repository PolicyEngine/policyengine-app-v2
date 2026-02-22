/**
 * Embeds the PolicyEngine slides app from Vercel
 * Presentations and slide decks from PolicyEngine.
 */
export default function SlidesPage() {
  const embedUrl = 'https://policyengine-slides-iota.vercel.app';

  return (
    <iframe
      src={embedUrl}
      title="Presentations | PolicyEngine"
      style={{
        width: '100%',
        height: 'calc(100vh - 120px)',
        border: 'none',
      }}
    />
  );
}
