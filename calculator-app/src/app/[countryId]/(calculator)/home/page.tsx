"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

/** The Home launcher is gone — Build is the landing view while Ask is paused. */
export default function HomeRoute({
  params,
}: {
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${countryId}/build`);
  }, [router, countryId]);

  return null;
}
