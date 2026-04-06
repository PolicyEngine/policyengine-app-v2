"use client";
// Force Vercel rebuild for calculator-next
import { use, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import StandardLayout from "@/components/StandardLayout";
import { CountryProvider } from "@/contexts/CountryContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { countryIds, type CountryId } from "@/libs/countries";
import { perfNavChange } from "@/utils/perfHarness";
import { CalculatorProviders } from "./providers";

/**
 * Layout for extracted Next.js pages under /:countryId/*.
 * Provides CountryContext, NavigationContext, LocationContext,
 * CalculatorProviders, and StandardLayout so they persist
 * across page navigations without re-mounting.
 *
 * Approach 4: Portal target for full-screen takeover views.
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

  // [PERF HARNESS] Track navigation timing
  useEffect(() => {
    perfNavChange(pathname);
  }, [pathname]);

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
            <div id="fullscreen-portal" />
          </CalculatorProviders>
        </LocationProvider>
      </NavigationProvider>
    </CountryProvider>
  );
}
