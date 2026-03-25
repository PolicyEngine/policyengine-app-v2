import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ads dashboard",
};

export default function AdsDashboardPage() {
  return (
    <iframe
      src="https://policyengine-ads-dashboard.vercel.app?embedded=true"
      style={{
        width: "100%",
        height: "calc(100vh - 64px)",
        border: "none",
        display: "block",
      }}
      title="PolicyEngine ads transparency dashboard"
    />
  );
}
