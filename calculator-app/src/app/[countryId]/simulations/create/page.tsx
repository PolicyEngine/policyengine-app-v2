"use client";

import { useEffect } from "react";
import SimulationPathwayWrapper from "@/pathways/simulation/SimulationPathwayWrapper";
import { perfContentVisible } from "@/utils/perfHarness";
import { CalculatorProviders } from "../../providers";

export default function SimulationCreateRoute() {
  // [PERF HARNESS]
  useEffect(() => { perfContentVisible('SimulationCreateRoute'); }, []);

  return (
    <CalculatorProviders>
      <SimulationPathwayWrapper />
    </CalculatorProviders>
  );
}
