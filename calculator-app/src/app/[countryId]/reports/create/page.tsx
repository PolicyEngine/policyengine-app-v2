"use client";

import StandardLayout from "@/components/StandardLayout";
import ReportBuilderPage from "@/pages/reportBuilder/ReportBuilderPage";
import { CalculatorProviders } from "../../providers";

export default function ReportBuilderRoute() {
  return (
    <CalculatorProviders>
      <StandardLayout>
        <ReportBuilderPage />
      </StandardLayout>
    </CalculatorProviders>
  );
}
