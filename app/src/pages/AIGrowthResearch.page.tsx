/**
 * Embeds the AI Growth Research app from GitHub Pages
 * Research initiative examining how policy interventions shape distributional
 * outcomes when AI drives economic transformation.
 */
export default function AIGrowthResearchPage() {
  const embedUrl = 'https://policyengine.github.io/ai-growth-research';

  return (
    <iframe
      src={embedUrl}
      title="AI Growth Research | PolicyEngine"
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
      }}
    />
  );
}
