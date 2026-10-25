import featuredToolsData from "@/data/featuredTools.json";

/**
 * Interactive tools listed in the header's Tools menu and on the homepage.
 *
 * The list lives in app/src/data/featuredTools.json so the calculator header
 * reads the same entries. Each tool is its own zone at `/<country>/<slug>`
 * (see appZoneRoutes.ts), so links to one need a full page load rather than
 * next/link.
 */
export interface FeaturedTool {
  slug: string;
  label: string;
  description: string;
  href: string;
}

type FeaturedToolEntry = Omit<FeaturedTool, "href">;

const toolsByCountry: Record<string, FeaturedToolEntry[]> = featuredToolsData;

/** The featured tools for a country, or none for a country without any. */
export function getFeaturedTools(countryId: string): FeaturedTool[] {
  const tools = Object.hasOwn(toolsByCountry, countryId)
    ? toolsByCountry[countryId]
    : [];
  return tools.map((tool) => ({ ...tool, href: `/${countryId}/${tool.slug}` }));
}

/** The research listing filtered to interactive tools. */
export function getAllToolsHref(countryId: string): string {
  return `/${countryId}/research?types=interactive`;
}
