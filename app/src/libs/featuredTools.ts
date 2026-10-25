import { WEBSITE_URL } from '@/constants';
import featuredToolsData from '@/data/featuredTools.json';

interface FeaturedToolEntry {
  slug: string;
  label: string;
}

export interface FeaturedToolLink {
  label: string;
  href: string;
}

const featuredToolsByCountry: Record<string, FeaturedToolEntry[]> = featuredToolsData;

/**
 * The calculator's links to a country's featured interactive tools, from the
 * list the website header also reads (website/src/lib/featuredTools.ts),
 * then the research listing's interactive filter. A country without featured
 * tools gets no links. Each tool is a separate app on the website's domain,
 * so the links are absolute.
 */
export function getFeaturedToolLinks(countryId: string): FeaturedToolLink[] {
  const tools = Object.hasOwn(featuredToolsByCountry, countryId)
    ? featuredToolsByCountry[countryId]
    : [];
  if (tools.length === 0) {
    return [];
  }
  return [
    ...tools.map((tool) => ({
      label: tool.label,
      href: `${WEBSITE_URL}/${countryId}/${tool.slug}`,
    })),
    {
      label: 'All interactive tools',
      href: `${WEBSITE_URL}/${countryId}/research?types=interactive`,
    },
  ];
}
