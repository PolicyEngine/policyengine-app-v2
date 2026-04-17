"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui";
import { countryIds } from "@/libs/countries";
import { geolocationService } from "@/routing/geolocation/GeolocationService";

/**
 * Root page — redirects to /:countryId/reports based on IP geolocation.
 * Mirrors app/src/routing/RedirectToCountry.tsx for the Next.js app.
 */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    async function detect() {
      const cached = getCachedCountry();
      if (cached) {
        router.replace(`/${cached}/reports`);
        return;
      }

      try {
        const detected = await geolocationService.detectCountry();
        // Validate against the supported country list before caching so a
        // bad provider response (or an unsupported country) cannot poison
        // the cache or drive the router into an unknown route. We widen
        // `countryIds` to `readonly string[]` here so `.includes()` narrows
        // the arbitrary detected value for us.
        const allowedCountryIds: readonly string[] = countryIds;
        const country = allowedCountryIds.includes(detected) ? detected : "us";
        cacheCountry(country);
        router.replace(`/${country}/reports`);
      } catch (error) {
        console.warn("[RootPage] Geolocation failed, falling back to US:", error);
        router.replace("/us/reports");
      }
    }

    detect();
  }, [router]);

  return (
    <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:h-screen tw:gap-4">
      <Spinner size="lg" />
      <div>Loading PolicyEngine...</div>
    </div>
  );
}

function getCachedCountry(): string | null {
  const cachedData = localStorage.getItem("detectedCountry");
  if (!cachedData) return null;

  try {
    const { country, timestamp } = JSON.parse(cachedData);
    const fourHoursInMs = 4 * 60 * 60 * 1000;
    if (Date.now() - timestamp < fourHoursInMs) {
      // Validate cached country is still a supported country ID
      if (countryIds.includes(country)) {
        return country;
      }
      console.warn("[RootPage] Cached country is not a valid country ID:", country);
    }
    localStorage.removeItem("detectedCountry");
  } catch (error) {
    console.warn("[RootPage] Invalid cached country data:", error);
    localStorage.removeItem("detectedCountry");
  }
  return null;
}

function cacheCountry(country: string): void {
  localStorage.setItem(
    "detectedCountry",
    JSON.stringify({ country, timestamp: Date.now() }),
  );
}
