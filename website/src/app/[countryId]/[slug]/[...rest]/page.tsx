import { Suspense } from "react";
import appsData from "@/data/apps.json";
import { notFound } from "next/navigation";
import AppClient from "../AppClient";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const apps = appsData as any[];

/**
 * Catch-all route for embedded app deep links.
 *
 * When an iframe app (e.g. state-legislative-tracker) uses replaceState to
 * update the parent URL with sub-paths like /MN/mn-hf4621, this route
 * catches those paths and passes them into the iframe src so deep links
 * work when pasted directly.
 */
export default async function AppDeepLinkPage({
  params,
}: {
  params: Promise<{ countryId: string; slug: string; rest: string[] }>;
}) {
  const { slug, countryId, rest } = await params;
  const app =
    apps.find((a) => a.slug === slug && a.countryId === countryId) ||
    apps.find((a) => a.slug === slug);

  if (!app) {
    notFound();
  }

  const subPath = "/" + rest.join("/");

  return (
    <Suspense>
      <AppClient app={app} countryId={countryId} subPath={subPath} />
    </Suspense>
  );
}
