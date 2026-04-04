"use client";

import StandardLayout from "@/components/StandardLayout";
import ReportsPage from "@/pages/Reports.page";
import { CalculatorProviders } from "../providers";

export default function ReportsRoute() {
  return (
    <CalculatorProviders>
      <StandardLayout>
        <ReportsPage />
      </StandardLayout>
    </CalculatorProviders>
  );
}
