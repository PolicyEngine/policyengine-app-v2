"use client";

import { useEffect } from "react";
import StandardLayout from "@/components/StandardLayout";
import ReportBuilderPage from "@/pages/reportBuilder/ReportBuilderPage";
import { perfContentVisible } from "@/utils/perfHarness";
import { CalculatorProviders } from "../../providers";

export default function ReportBuilderRoute() {
  // [PERF HARNESS]
  useEffect(() => { perfContentVisible('ReportBuilderRoute'); }, []);

  return (
    <CalculatorProviders>
      <StandardLayout>
        <ReportBuilderPage />
      </StandardLayout>
    </CalculatorProviders>
  );
}
