"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui";
import { geolocationService } from "@/routing/geolocation/GeolocationService";

/**
 * Root page — redirects to /:countryId/reports based on IP geolocation.
 * Mirrors app/src/routing/RedirectToCountry.tsx for the Next.js app.
 */
export default function RootPage() {
  const router = useRouter();
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    async function detect() {
      // Check localStorage cache first (4-hour TTL)
      const cached = getCachedCountry();
      if (cached) {
        router.replace(`/${cached}/reports`);
        return;
      }

      // Detect via geolocation service
      try {
        const country = await geolocationService.detectCountry();
        cacheCountry(country);
        router.replace(`/${country}/reports`);
      } catch {
        router.replace("/us/reports");
      } finally {
        setIsDetecting(false);
      }
    }

    detect();
  }, [router]);

  if (!isDetecting) return null;

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
      return country;
    }
    localStorage.removeItem("detectedCountry");
  } catch {
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
