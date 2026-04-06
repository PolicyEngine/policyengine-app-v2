"use client";

import { useEffect } from "react";
import StandardLayout from "@/components/StandardLayout";
import PopulationsPage from "@/pages/Populations.page";
import { perfContentVisible } from "@/utils/perfHarness";
import { CalculatorProviders } from "../providers";

export default function HouseholdsRoute() {
  // [PERF HARNESS]
  useEffect(() => { perfContentVisible('HouseholdsRoute'); }, []);

  return (
    <CalculatorProviders>
      <StandardLayout>
        <PopulationsPage />
      </StandardLayout>
    </CalculatorProviders>
  );
}
