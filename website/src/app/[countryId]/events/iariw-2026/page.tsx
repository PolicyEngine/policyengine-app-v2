import type { Metadata } from "next";
import WorkshopContent from "./WorkshopContent";

export const metadata: Metadata = {
  title: "Brussels workshop: new technologies for evidence-based policy making",
  description:
    "Free half-day workshop on open microsimulation, simulation-ready microdata, and executable law, co-hosted by CAPE (UCLouvain Saint-Louis) and PolicyEngine alongside the 39th IARIW General Conference. Thursday 27 August 2026, Brussels.",
};

export default function IariwWorkshopPage() {
  return <WorkshopContent />;
}
