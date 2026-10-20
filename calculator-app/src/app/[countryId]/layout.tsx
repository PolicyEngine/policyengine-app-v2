import { notFound } from "next/navigation";
import { isCountryId } from "@/libs/countries";
import { CountryShell } from "./CountryShell";

/**
 * Layout for extracted Next.js pages under /:countryId/*.
 *
 * Runs on the server so that a first path segment which is not a supported
 * country (a stray file name such as /llms.txt, or a country the calculator
 * does not serve) is an HTTP 404 rendered by app/not-found.tsx, rather than
 * a 200 calculator shell that redirects in the browser.
 */
export default async function CountryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = await params;

  if (!isCountryId(countryId)) {
    notFound();
  }

  return <CountryShell countryId={countryId}>{children}</CountryShell>;
}
