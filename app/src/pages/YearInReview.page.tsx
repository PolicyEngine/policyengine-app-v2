import { useParams } from 'react-router-dom';

/**
 * Embeds the 2025 Year in Review app from GitHub Pages
 */
export default function YearInReviewPage() {
  const { countryId } = useParams<{ countryId: string }>();

  // Build the embed URL with country and embed flag
  const embedUrl = `https://policyengine.github.io/2025-year-in-review/${countryId}?embed=true`;

  return (
    <iframe
      src={embedUrl}
      title="PolicyEngine 2025 Year in Review"
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
      }}
    />
  );
}
