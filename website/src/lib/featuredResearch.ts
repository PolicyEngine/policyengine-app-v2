import appsData from "@/data/apps.json";

/**
 * Interactive research the homepage features: apps.json entries about one
 * policy, bill or event, so not tools (see toolsMenu.ts). Each is its own zone
 * at `/<country>/<slug>`, so links to one need a full page load.
 */
export interface FeaturedResearchItem {
  slug: string;
  title: string;
  description: string;
  image: string;
  href: string;
}

interface AppEntry {
  slug: string;
  countryId: string;
  title: string;
  description: string;
  image?: string;
}

export const FEATURED_RESEARCH_SLUGS: Readonly<
  Record<string, readonly string[]>
> = {
  us: ["bill-tracker", "obbba-households"],
};

/** The research a country's homepage features, in order. */
export function getFeaturedResearch(countryId: string): FeaturedResearchItem[] {
  const slugs = Object.hasOwn(FEATURED_RESEARCH_SLUGS, countryId)
    ? FEATURED_RESEARCH_SLUGS[countryId]
    : [];
  const apps = appsData as AppEntry[];
  return slugs.flatMap((slug) => {
    const app = apps.find(
      (entry) => entry.countryId === countryId && entry.slug === slug,
    );
    return app
      ? [
          {
            slug,
            title: app.title,
            description: app.description,
            image: `/assets/posts/${app.image}`,
            href: `/${countryId}/${slug}`,
          },
        ]
      : [];
  });
}
