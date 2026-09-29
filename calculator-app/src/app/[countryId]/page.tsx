"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isFlagshipShellEnabled } from "@/libs/featureFlags";

/**
 * Country index route — redirects to /:countryId/reports, or to the
 * flagship Build page when the flagship shell flag is on (Ask is paused).
 * Mirrors the React Router <Navigate replace />.
 */
export default function CountryIndexRoute({
  params,
}: {
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = use(params);
  const router = useRouter();

  useEffect(() => {
    const landing = isFlagshipShellEnabled() ? "build" : "reports";
    router.replace(`/${countryId}/${landing}`);
  }, [router, countryId]);

  return null;
}
