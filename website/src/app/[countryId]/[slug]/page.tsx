import { Suspense } from "react";
import type { Metadata } from "next";
import appsData from "@/data/apps.json";
import { VALID_COUNTRIES } from "@/lib/countries";
import { notFound } from "next/navigation";
import AppClient from "./AppClient";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const apps = appsData as any[];

export function generateStaticParams() {
  const params: { countryId: string; slug: string }[] = [];
  for (const countryId of VALID_COUNTRIES) {
    for (const app of apps) {
      if (app.countryId === countryId || !app.countryId) {
        params.push({ countryId, slug: app.slug });
      }
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ countryId: string; slug: string }>;
}): Promise<Metadata> {
  const { slug, countryId } = await params;
  const app =
    apps.find((a) => a.slug === slug && a.countryId === countryId) ||
    apps.find((a) => a.slug === slug);
  return { title: app?.title || slug };
}

export default async function AppPage({
  params,
}: {
  params: Promise<{ countryId: string; slug: string }>;
}) {
  const { slug, countryId } = await params;
  const app =
    apps.find((a) => a.slug === slug && a.countryId === countryId) ||
    apps.find((a) => a.slug === slug);

  if (!app) {
    notFound();
  }

  return (
    <Suspense>
      <AppClient app={app} countryId={countryId} />
    </Suspense>
  );
}
