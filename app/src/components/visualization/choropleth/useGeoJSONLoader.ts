import { useEffect, useState } from 'react';
import type { GeoJSONFeatureCollection } from './types';

/** Loaded boundary files, keyed by path, so a remount or a second map does not fetch again. */
const geoJSONCache: Record<string, GeoJSONFeatureCollection> = {};

interface LoadResult {
  path: string;
  geoJSON: GeoJSONFeatureCollection | null;
  error: string | null;
}

/**
 * Fetches a GeoJSON file from the app's public directory and caches it by
 * path, as the US district maps' loader does. A change of path shows the
 * new file's load, never the previous file's boundaries.
 */
export function useGeoJSONLoader(geoDataPath: string): {
  geoJSON: GeoJSONFeatureCollection | null;
  loading: boolean;
  error: string | null;
} {
  const [result, setResult] = useState<LoadResult | null>(null);

  useEffect(() => {
    if (geoJSONCache[geoDataPath]) {
      return;
    }
    let cancelled = false;
    const loadGeoData = async () => {
      try {
        const response = await fetch(geoDataPath);
        if (!response.ok) {
          throw new Error(`Failed to load geo data: ${response.status}`);
        }
        const geoJSON: GeoJSONFeatureCollection = await response.json();
        geoJSONCache[geoDataPath] = geoJSON;
        if (!cancelled) {
          setResult({ path: geoDataPath, geoJSON, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          setResult({
            path: geoDataPath,
            geoJSON: null,
            error: err instanceof Error ? err.message : 'Failed to load map data',
          });
        }
      }
    };
    loadGeoData();
    return () => {
      cancelled = true;
    };
  }, [geoDataPath]);

  const cached = geoJSONCache[geoDataPath];
  if (cached) {
    return { geoJSON: cached, loading: false, error: null };
  }
  if (result?.path === geoDataPath) {
    return { geoJSON: result.geoJSON, loading: false, error: result.error };
  }
  return { geoJSON: null, loading: true, error: null };
}
