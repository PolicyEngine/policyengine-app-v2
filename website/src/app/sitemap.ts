import type { MetadataRoute } from "next";
import appsData from "@/data/apps.json";
import { appZoneRewrites } from "@/data/appZoneRoutes";
import { getPostsSorted } from "@/data/posts/postTransformers";
import { toPostIsoDate } from "@/lib/postDate";

const BASE_URL = "https://www.policyengine.org";

interface AppEntry {
  slug: string;
  countryId: string;
  date?: string;
}

// Interactives that change every day, such as the bill tracker, which follows
// bills as they move. The sitemap gives them a daily change frequency and no
// date: their apps.json date is the day they launched.
const DAILY_PAGES = new Set(["/us/bill-tracker"]);

/**
 * The interactives this site serves from app zones (appZoneRoutes.ts): each
 * zone's page, and each apps.json app at a path a zone serves for every
 * country, such as /us/bill-tracker. An apps.json slug that now redirects to
 * another (next.config.ts) has no zone of its own, so the sitemap leaves it
 * out. Each carries its apps.json date, where apps.json lists it.
 */
function getAppZonePages(): { path: string; date?: string }[] {
  const sources = new Set(appZoneRewrites.map((route) => route.source));
  const served = (path: string) =>
    sources.has(path) ||
    sources.has(`/:countryId/${path.split("/").slice(2).join("/")}`);
  const dates = new Map<string, string | undefined>();
  for (const app of appsData as AppEntry[]) {
    dates.set(`/${app.countryId}/${app.slug}`, app.date);
  }
  const paths = new Set([
    ...[...sources].filter((source) => !source.includes(":")),
    ...[...dates.keys()].filter(served),
  ]);
  return [...paths].map((path) => ({ path, date: dates.get(path) }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // Homepage
  entries.push({
    url: BASE_URL,
    changeFrequency: "weekly",
    priority: 1.0,
  });

  // Country homepages
  for (const country of ["us", "uk"]) {
    entries.push({
      url: `${BASE_URL}/${country}`,
      changeFrequency: "weekly",
      priority: 0.9,
    });
  }

  // Static pages
  const staticPages = [
    "research",
    "team",
    "donate",
    "supporters",
    "ai-agents",
    "ai",
  ];
  for (const country of ["us", "uk"]) {
    for (const page of staticPages) {
      entries.push({
        url: `${BASE_URL}/${country}/${page}`,
        changeFrequency: page === "research" ? "daily" : "monthly",
        priority: page === "research" ? 0.8 : 0.5,
      });
    }
  }

  // Research articles
  const posts = getPostsSorted();
  for (const post of posts) {
    const slug = post.slug;
    const countries = post.tags.filter((t: string) => ["us", "uk"].includes(t));
    const targetCountries = countries.length > 0 ? countries : ["us"];

    for (const country of targetCountries) {
      entries.push({
        url: `${BASE_URL}/${country}/research/${slug}`,
        lastModified: toPostIsoDate(post.date, "date"),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  // Interactives
  for (const { path, date } of getAppZonePages()) {
    const daily = DAILY_PAGES.has(path);
    entries.push({
      url: `${BASE_URL}${path}`,
      ...(date && !daily && { lastModified: toPostIsoDate(date, "date") }),
      changeFrequency: daily ? "daily" : "weekly",
      priority: 0.8,
    });
  }

  // TAXSIM emulator, served here from its own deployment (next.config.ts)
  entries.push({
    url: `${BASE_URL}/us/taxsim`,
    changeFrequency: "weekly",
    priority: 0.7,
  });

  return entries;
}
