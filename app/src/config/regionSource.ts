export type RegionSurfaceSource = 'metadata' | 'api';

// The API v2 alpha region service has been retired. Regions are always
// surfaced from v1 metadata, and no v2 region shadow is loaded.
export const REGION_SURFACE_SOURCE: RegionSurfaceSource = 'metadata';
export const LOAD_API_REGION_SHADOW = false;
