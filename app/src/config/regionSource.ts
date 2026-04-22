export type RegionSurfaceSource = 'metadata' | 'api';

// Central control for which region source the shared facade should surface.
// This is intentionally not wired into `useRegions(...)` until the next commit.
export const REGION_SURFACE_SOURCE: RegionSurfaceSource = 'metadata';

// Separate from surfaced source: keep v2 region loading available for
// canonicalization, shadow resolution, and later migration work.
export const LOAD_API_REGION_SHADOW = true;
