"use client";

import { useEffect } from "react";
import StandardLayout from "@/components/StandardLayout";
import PoliciesPage from "@/pages/Policies.page";
import { perfContentVisible } from "@/utils/perfHarness";
import { CalculatorProviders } from "../providers";

export default function PoliciesRoute() {
  // [PERF HARNESS]
  useEffect(() => { perfContentVisible('PoliciesRoute'); }, []);

  return (
    <CalculatorProviders>
      <StandardLayout>
        <PoliciesPage />
      </StandardLayout>
    </CalculatorProviders>
  );
}
