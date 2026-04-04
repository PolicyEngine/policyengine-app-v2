"use client";

import { use, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CountryProvider } from "@/contexts/CountryContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { countryIds, type CountryId } from "@/libs/countries";
import StandardLayout from "@/components/StandardLayout";
import { CalculatorProviders } from "./providers";

/**
 * Layout for extracted Next.js pages under /:countryId/*.
 * Provides CountryContext, NavigationContext, LocationContext,
 * and CalculatorProviders (Redux, React Query, etc.) so they
 * persist across page navigations without re-mounting.
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
        <LocationProvider value={locationValue}>
          <CalculatorProviders>
            <StandardLayout>{children}</StandardLayout>
          </CalculatorProviders>
        </LocationProvider>
      </NavigationProvider>
    </CountryProvider>
  );
}
