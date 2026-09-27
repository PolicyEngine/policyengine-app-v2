"use client";

import StandardLayout from "@/components/StandardLayout";

/**
 * Shared calculator shell for extracted calculator routes.
 * Keeps the calculator visual shell mounted across calculator navigation.
 */
export default function CalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StandardLayout>{children}</StandardLayout>
      <div id="fullscreen-portal" />
    </>
  );
}
