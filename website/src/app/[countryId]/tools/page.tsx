import type { Metadata } from "next";
import ToolsShowcase from "@/components/tools/ToolsShowcase";
import { getToolsForCountry } from "@/data/tools";

export const metadata: Metadata = {
  title: "Tools",
  description:
    "Interactive PolicyEngine tools, calculators, and developer tooling.",
};

export default async function ToolsPage({
  params,
}: {
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = await params;

  return (
    <ToolsShowcase
      countryId={countryId}
      tools={getToolsForCountry(countryId)}
    />
  );
}
