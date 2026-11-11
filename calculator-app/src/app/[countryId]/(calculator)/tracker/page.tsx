"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

/** Tracker merged into Reforms; preserve deep-link queries (?bill=…). */
export default function TrackerRoute({
  params,
}: {
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${countryId}/reforms${window.location.search}`);
  }, [router, countryId]);

  return null;
}
