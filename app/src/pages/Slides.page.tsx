import { useParams } from 'react-router-dom';

/**
 * Embeds the PolicyEngine slides app from Vercel.
 * Handles both the slide index (/slides) and individual decks (/slides/:deckId).
 */
export default function SlidesPage() {
  const { '*': deckPath } = useParams();
  const baseSlidesUrl = 'https://policyengine-slides.vercel.app/slides';
  const embedUrl = deckPath ? `${baseSlidesUrl}/${deckPath}` : baseSlidesUrl;

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
