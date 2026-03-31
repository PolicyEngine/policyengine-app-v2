import type { Metadata } from "next";
import HeroSection from "@/components/static/HeroSection";
import { spacing } from "@policyengine/design-system/tokens";
import ApiStatusClient from "./ApiStatusClient";

export const metadata: Metadata = {
  title: "API status",
  description: "Monitor the current status and availability of PolicyEngine API services.",
};

export default function ApiStatusPage() {
  return (
    <div
      style={{
        minHeight: `calc(100vh - ${spacing.layout.header})`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <HeroSection
        title="API status"
        description="Monitor the current status and availability of PolicyEngine API services."
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <ApiStatusClient />
      </div>
    </div>
  );
}
