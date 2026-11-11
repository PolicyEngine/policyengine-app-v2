"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

/** Library merged into Reforms; land on the Yours filter. */
export default function LibraryRoute({
  params,
}: {
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${countryId}/reforms?filter=yours`);
  }, [router, countryId]);

  return null;
}
