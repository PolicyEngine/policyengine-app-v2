/**
 * Where a flagship-only route (Build, Reforms, a v3 report) goes when its
 * country's flagship flag is off. A country still on v2 redirects to its
 * v2 Reports page, so a shared v3 link never dead-ends; the US keeps the
 * not-found page it has always shown there.
 */
export function flagshipFallbackRedirect(countryId: string): string | null {
  if (countryId === "us" || !/^[a-z]{2}$/.test(countryId)) {
    return null;
  }
  return `/${countryId}/reports`;
}
