"use client";

import { useEffect } from "react";
import StandardLayout from "@/components/StandardLayout";
import ReportsPage from "@/pages/Reports.page";
import { perfContentVisible } from "@/utils/perfHarness";
import { CalculatorProviders } from "../providers";

export default function ReportsRoute() {
  // [PERF HARNESS]
  useEffect(() => { perfContentVisible('ReportsRoute'); }, []);

  return (
    <CalculatorProviders>
      <StandardLayout>
        <ReportsPage />
      </StandardLayout>
    </CalculatorProviders>
  );
}
