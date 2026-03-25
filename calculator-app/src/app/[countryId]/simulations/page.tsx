"use client";

import StandardLayout from "@/components/StandardLayout";
import SimulationsPage from "@/pages/Simulations.page";
import { CalculatorProviders } from "../providers";

export default function SimulationsRoute() {
  return (
    <CalculatorProviders>
      <StandardLayout>
        <SimulationsPage />
      </StandardLayout>
    </CalculatorProviders>
  );
}
