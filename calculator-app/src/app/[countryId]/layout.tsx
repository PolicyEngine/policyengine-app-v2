"use client";

import { use } from "react";
import { CountryProvider } from "@/contexts/CountryContext";
import type { CountryId } from "@/libs/countries";

/**
 * Layout for extracted Next.js pages under /:countryId/*.
 * Provides the country via CountryContext so useCurrentCountry()
 * works identically to the react-router catch-all.
 */
export default function CountryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = use(params);

  return (
    <CountryProvider value={countryId as CountryId}>
      {children}
    </CountryProvider>
  );
}
