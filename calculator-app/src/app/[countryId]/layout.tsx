"use client";

import { use, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CountryProvider } from "@/contexts/CountryContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import type { CountryId } from "@/libs/countries";

/**
 * Layout for extracted Next.js pages under /:countryId/*.
 * Provides CountryContext, NavigationContext, and LocationContext
 * so shared components work identically in both router contexts.
 */
export default function CountryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navValue = useMemo(
    () => ({
      push: (path: string) => router.push(path),
      replace: (path: string) => router.replace(path),
      back: () => router.back(),
    }),
    [router],
  );

  const locationValue = useMemo(
    () => ({
      pathname,
      search: searchParams.toString() ? `?${searchParams.toString()}` : "",
    }),
    [pathname, searchParams],
  );

  return (
    <CountryProvider value={countryId as CountryId}>
      <NavigationProvider value={navValue}>
        <LocationProvider value={locationValue}>
          {children}
        </LocationProvider>
      </NavigationProvider>
    </CountryProvider>
  );
}
