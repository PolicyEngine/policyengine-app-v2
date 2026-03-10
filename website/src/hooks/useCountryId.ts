"use client";

import { usePathname } from "next/navigation";

export function useCountryId(): string {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  return parts[0] || "us";
}
