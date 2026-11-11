import type { Metadata } from "next";
import WorkshopContent from "./WorkshopContent";

export const metadata: Metadata = {
  title: "Brussels workshop: new technologies for evidence-based policy making",
  description:
    "Free half-day workshop on open microsimulation, simulation-ready microdata, and executable law, co-organized by PolicyEngine, the Axiom Foundation, CAPE, and BEAMM at UCLouvain Saint-Louis, alongside the 39th IARIW General Conference. Thursday 27 August 2026, Brussels.",
  openGraph: {
    images: [
      {
        url: "/assets/events/iariw-2026/social-card.png",
        width: 2400,
        height: 1350,
      },
    ],
  },
  twitter: { card: "summary_large_image" },
};

export default function IariwWorkshopPage() {
  return <WorkshopContent />;
}
