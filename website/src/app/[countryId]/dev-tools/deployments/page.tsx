import type { Metadata } from "next";
import HeroSection from "@/components/static/HeroSection";
import { colors, spacing } from "@/designTokens";
import DeploymentsClient from "./DeploymentsClient";

export const metadata: Metadata = {
  title: "Deployments",
  description:
    "Which policyengine.py version, country model and data build each PolicyEngine service declares and serves.",
};

export default async function DeploymentsPage({
  params,
}: {
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = await params;

  return (
    <div
      style={{
        minHeight: `calc(100vh - ${spacing.layout.header})`,
        display: "flex",
        flexDirection: "column",
        backgroundColor: colors.background.tertiary,
      }}
    >
      <HeroSection
        title="Deployments"
        description="Which policyengine.py version, country model and data build each PolicyEngine service declares in its lock file, and which ones it serves."
      />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: colors.background.tertiary,
        }}
      >
        <DeploymentsClient countryId={countryId} />
      </div>
    </div>
  );
}
