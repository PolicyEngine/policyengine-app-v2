import nextConfig from "../../../next.config";
import type { Route } from "@/data/analysisRoutes";

/** The site's evaluated rewrites (all phases) and redirects. */
export async function loadRouting(): Promise<{
  rewrites: Route[];
  redirects: Route[];
}> {
  const config = nextConfig as unknown as {
    rewrites: () => Promise<
      | Route[]
      | { beforeFiles?: Route[]; afterFiles?: Route[]; fallback?: Route[] }
    >;
    redirects: () => Promise<Route[]>;
  };
  const rewrites = await config.rewrites();
  return {
    rewrites: Array.isArray(rewrites)
      ? rewrites
      : [
          ...(rewrites.beforeFiles ?? []),
          ...(rewrites.afterFiles ?? []),
          ...(rewrites.fallback ?? []),
        ],
    redirects: await config.redirects(),
  };
}
