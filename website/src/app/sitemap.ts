import type { MetadataRoute } from "next";
import { getPostsSorted } from "@/data/posts/postTransformers";

const BASE_URL = "https://policyengine.org";

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
    "claude-plugin",
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
    const countries = post.tags.filter((t: string) =>
      ["us", "uk"].includes(t),
    );
    const targetCountries = countries.length > 0 ? countries : ["us"];

    for (const country of targetCountries) {
      entries.push({
        url: `${BASE_URL}/${country}/research/${slug}`,
        lastModified: new Date(post.date),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  return entries;
}
