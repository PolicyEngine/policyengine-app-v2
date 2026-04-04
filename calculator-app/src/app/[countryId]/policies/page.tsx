"use client";

import StandardLayout from "@/components/StandardLayout";
import PoliciesPage from "@/pages/Policies.page";
import { CalculatorProviders } from "../providers";

export default function PoliciesRoute() {
  return (
    <CalculatorProviders>
      <StandardLayout>
        <PoliciesPage />
      </StandardLayout>
    </CalculatorProviders>
  );
}
