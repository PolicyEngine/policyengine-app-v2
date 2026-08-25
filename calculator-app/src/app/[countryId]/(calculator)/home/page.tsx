"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

/** The Home launcher is gone — Ask is the landing view. */
export default function HomeRoute({
  params,
}: {
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${countryId}/ask`);
  }, [router, countryId]);

  return null;
}
