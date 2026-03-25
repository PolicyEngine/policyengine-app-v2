"use client";

import SimulationPathwayWrapper from "@/pathways/simulation/SimulationPathwayWrapper";
import { CalculatorProviders } from "../../providers";

export default function SimulationCreateRoute() {
  return (
    <CalculatorProviders>
      <SimulationPathwayWrapper />
    </CalculatorProviders>
  );
}
