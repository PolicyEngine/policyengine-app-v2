"use client";

import dynamic from "next/dynamic";

/**
 * Dynamically import the entire Vite calculator app with SSR disabled.
 * This ensures all react-router-dom routing, browser APIs, and
 * client-side state work identically to the Vite build.
 *
 * The ssr:false flag means this component only renders in the browser —
 * Next.js serves a minimal HTML shell, then React hydrates on the client.
 */
const CalculatorApp = dynamic(
  () => import("@/CalculatorApp").then((mod) => ({ default: mod.default })),
  { ssr: false },
);

export function ClientOnly() {
  return <CalculatorApp />;
}
