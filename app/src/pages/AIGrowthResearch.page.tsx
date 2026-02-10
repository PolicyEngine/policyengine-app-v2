/**
 * Embeds the AI Inequality research app from GitHub Pages
 * Research initiative examining how policy interventions shape distributional
 * outcomes when AI drives economic transformation.
 */
export default function AIGrowthResearchPage() {
  const embedUrl = 'https://policyengine.github.io/ai-inequality';

  return (
    <iframe
      src={embedUrl}
      title="AI and inequality | PolicyEngine"
      style={{
        width: '100%',
        height: 'calc(100vh - 120px)',
        border: 'none',
      }}
    />
  );
}
