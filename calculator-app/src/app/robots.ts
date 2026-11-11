import type { MetadataRoute } from "next";

/**
 * robots.txt for app.policyengine.org. The calculator has no sitemap of its
 * own; crawlers are pointed at the website's.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://www.policyengine.org/sitemap.xml",
  };
}
