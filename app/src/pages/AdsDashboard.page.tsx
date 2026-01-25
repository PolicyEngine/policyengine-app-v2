/**
 * Ads transparency dashboard - iframe embed of the standalone Vercel app
 */
export default function AdsDashboardPage() {
  return (
    <iframe
      src="https://policyengine-ads-dashboard.vercel.app"
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
      }}
      title="PolicyEngine Ads Transparency Dashboard"
    />
  );
}
