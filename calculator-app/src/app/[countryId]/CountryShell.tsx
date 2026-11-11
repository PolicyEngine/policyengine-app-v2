"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalculatorProviders } from "./providers";
import { CountryProvider } from "@/contexts/CountryContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import type { CountryId } from "@/libs/countries";

/**
 * Provides CountryContext, NavigationContext, and LocationContext to the
 * shared components in app/src. The server layout has already rejected
 * unsupported countries, so `countryId` is always a supported one.
 */
export function CountryShell({
  countryId,
  children,
}: {
  countryId: CountryId;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navValue = useMemo(
    () => ({
      push: (path: string) => router.push(path),
      replace: (path: string) => router.replace(path),
      back: () => router.back(),
      prefetch: (path: string) => router.prefetch(path),
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
    <CountryProvider value={countryId}>
      <NavigationProvider value={navValue}>
        <LocationProvider value={locationValue}>
          <CalculatorProviders>{children}</CalculatorProviders>
        </LocationProvider>
      </NavigationProvider>
    </CountryProvider>
  );
}
