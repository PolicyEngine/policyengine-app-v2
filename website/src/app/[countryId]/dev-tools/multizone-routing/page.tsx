import type { Metadata } from "next";
import HeroSection from "@/components/static/HeroSection";
import reviewInputs from "@/data/multizoneRoutingReview.json";
import { colors, spacing } from "@policyengine/design-system/tokens";
import MultizoneRoutingClient from "./MultizoneRoutingClient";
import type { TeamInput } from "./MultizoneRoutingClient";
import { getRoutingInventoryRows } from "./routingInventory";

export const metadata: Metadata = {
  title: "Multizone routing strategy",
  description:
    "Review PolicyEngine interactive apps and decide which should remain iframe embeds, use simple rewrites, or become multi-zone surfaces.",
};

export default function MultizoneRoutingPage() {
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
        title="Multizone routing strategy"
        description="Review interactive app routes, collect team input, and decide which surfaces should remain iframe embeds, use simple rewrites, or become multi-zone apps."
      />
      <MultizoneRoutingClient
        rows={getRoutingInventoryRows()}
        reviewInputs={reviewInputs as Record<string, TeamInput>}
      />
    </div>
  );
}
