"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * The Ask page is paused while the AI assistant's scope is decided; old
 * links land on Build, which has the same parameter search.
 */
export default function AskRoute({
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
