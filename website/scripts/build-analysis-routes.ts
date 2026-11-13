/**
 * Writes src/data/analysisRoutes.json, the map of every path and deployment
 * host that leads to a research app (src/data/analysisRoutes.ts), which
 * PolicyEngine/newsletters reads. posts-and-apps-data.test.ts fails while the
 * committed file differs from what this builds.
 *
 *   bun run scripts/build-analysis-routes.ts
 */
import { writeFileSync } from "node:fs";
import appsData from "../src/data/apps.json";
import postsData from "../src/data/posts/posts.json";
import {
  buildAnalysisRoutes,
  unlistedPagePaths,
} from "../src/data/analysisRoutes";
import { entryKey, researchEntries } from "../src/data/comparables";
import { loadRouting } from "../src/__tests__/content/routing";

const { rewrites, redirects } = await loadRouting();
const entries = researchEntries(
  appsData as Parameters<typeof researchEntries>[0],
  postsData as Parameters<typeof researchEntries>[1],
);
const appKeys = new Set(entries.filter((e) => e.kind === "app").map(entryKey));
const routes = buildAnalysisRoutes(
  rewrites,
  redirects,
  appsData as never,
  appKeys,
);
writeFileSync(
  new URL("../src/data/analysisRoutes.json", import.meta.url),
  `${JSON.stringify(routes, null, 2)}\n`,
);
const unlisted = unlistedPagePaths(rewrites, appKeys);
console.log(`${routes.paths.length} paths, ${routes.hosts.length} hosts`);
console.log(
  "proxied pages that are no research app's:",
  JSON.stringify(unlisted),
);
