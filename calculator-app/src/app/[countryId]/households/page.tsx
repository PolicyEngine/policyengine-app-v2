"use client";

import StandardLayout from "@/components/StandardLayout";
import PopulationsPage from "@/pages/Populations.page";
import { CalculatorProviders } from "../providers";

export default function HouseholdsRoute() {
  return (
    <CalculatorProviders>
      <StandardLayout>
        <PopulationsPage />
      </StandardLayout>
    </CalculatorProviders>
  );
}
