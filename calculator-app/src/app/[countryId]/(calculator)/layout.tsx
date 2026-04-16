"use client";

import StandardLayout from "@/components/StandardLayout";
import { CalculatorProviders } from "../providers";

/**
 * Shared calculator shell for extracted calculator routes.
 * Keeps the provider tree and layout mounted across calculator navigation
 * without making them the owner of every `/:countryId/*` route.
 */
export default function CalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CalculatorProviders>
      <StandardLayout>{children}</StandardLayout>
      <div id="fullscreen-portal" />
    </CalculatorProviders>
  );
}
