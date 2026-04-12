"use client";

import StandardLayout from "@/components/StandardLayout";
import CalculatorLaunchPage from "@/components/calculator/CalculatorLaunchPage";
import { CalculatorProviders } from "./providers";

export default function CountryIndexRoute() {
  return (
    <CalculatorProviders>
      <StandardLayout>
        <CalculatorLaunchPage />
      </StandardLayout>
    </CalculatorProviders>
  );
}
