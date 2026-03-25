"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Country index route — redirects to /:countryId/reports.
 * Mirrors the React Router <Navigate to="reports" replace />.
 */
export default function CountryIndexRoute({
  params,
}: {
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${countryId}/reports`);
  }, [router, countryId]);

  return null;
}
