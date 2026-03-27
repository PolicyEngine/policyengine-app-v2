"use client";

import PopulationPathwayWrapper from "@/pathways/population/PopulationPathwayWrapper";
import { CalculatorProviders } from "../../providers";

export default function HouseholdCreateRoute() {
  return (
    <CalculatorProviders>
      <PopulationPathwayWrapper />
    </CalculatorProviders>
  );
}
