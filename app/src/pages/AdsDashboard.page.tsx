/**
 * Ads transparency dashboard - iframe embed of the standalone Vercel app
 */
export default function AdsDashboardPage() {
  return (
    <iframe
      src="https://policyengine-ads-dashboard.vercel.app?embedded=true"
      style={{
        width: '100%',
        height: 'calc(100vh - 64px)', // Account for PE header
        border: 'none',
        display: 'block',
      }}
      title="PolicyEngine Ads Transparency Dashboard"
    />
  );
}
