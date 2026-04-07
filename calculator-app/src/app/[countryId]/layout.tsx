"use client";
// Force Vercel rebuild for calculator-next (simulated 500 test)

import { use, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CountryProvider } from "@/contexts/CountryContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { countryIds, type CountryId } from "@/libs/countries";

/**
 * Layout for extracted Next.js pages under /:countryId/*.
 * Provides CountryContext, NavigationContext, and LocationContext
 * so shared components work identically in both router contexts.
 * This comment exists to force calculator-next redeploys when needed.
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
  const isValid = countryIds.includes(countryId as CountryId);

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

  useEffect(() => {
    if (!isValid) {
      router.replace("/");
    }
  }, [isValid, router]);

  if (!isValid) {
    return null;
  }

  return (
    <CountryProvider value={countryId as CountryId}>
      <NavigationProvider value={navValue}>
        <LocationProvider value={locationValue}>{children}</LocationProvider>
      </NavigationProvider>
    </CountryProvider>
  );
}
