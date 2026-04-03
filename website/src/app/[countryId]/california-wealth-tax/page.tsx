import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SyncedAppIframe from "@/components/apps/SyncedAppIframe";

export const metadata: Metadata = {
  title: "California wealth tax fiscal impact calculator",
  description:
    "Estimate how California's proposed billionaire wealth tax changes revenue once avoidance, migration, return flows, and income-tax offsets are taken into account.",
};

export default async function CaliforniaWealthTaxPage({
  params,
  searchParams,
}: {
  params: Promise<{ countryId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { countryId } = await params;
  const resolvedSearchParams = await searchParams;

  if (countryId !== "us") {
    notFound();
  }

  const initialQuery = new URLSearchParams();
  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (Array.isArray(value)) {
      value.forEach((entry) => initialQuery.append(key, entry));
    } else if (value !== undefined) {
      initialQuery.set(key, value);
    }
  }

  return (
    <SyncedAppIframe
      srcPath={`/${countryId}/california-wealth-tax/embed`}
      title="California wealth tax fiscal impact calculator | PolicyEngine"
      initialQuery={initialQuery.toString()}
    />
  );
}
