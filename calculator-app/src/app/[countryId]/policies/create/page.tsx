"use client";

import PolicyPathwayWrapper from "@/pathways/policy/PolicyPathwayWrapper";
import { CalculatorProviders } from "../../providers";

export default function PolicyCreateRoute() {
  return (
    <CalculatorProviders>
      <PolicyPathwayWrapper />
    </CalculatorProviders>
  );
}
