"use client";

import { useEffect } from "react";
import PopulationPathwayWrapper from "@/pathways/population/PopulationPathwayWrapper";
import { perfContentVisible } from "@/utils/perfHarness";
import { CalculatorProviders } from "../../providers";

export default function HouseholdCreateRoute() {
  // [PERF HARNESS]
  useEffect(() => { perfContentVisible('HouseholdCreateRoute'); }, []);

  return (
    <CalculatorProviders>
      <PopulationPathwayWrapper />
    </CalculatorProviders>
  );
}
