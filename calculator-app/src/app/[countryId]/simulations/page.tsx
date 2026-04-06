"use client";

import { useEffect } from "react";
import StandardLayout from "@/components/StandardLayout";
import SimulationsPage from "@/pages/Simulations.page";
import { perfContentVisible } from "@/utils/perfHarness";
import { CalculatorProviders } from "../providers";

export default function SimulationsRoute() {
  // [PERF HARNESS]
  useEffect(() => { perfContentVisible('SimulationsRoute'); }, []);

  return (
    <CalculatorProviders>
      <StandardLayout>
        <SimulationsPage />
      </StandardLayout>
    </CalculatorProviders>
  );
}
