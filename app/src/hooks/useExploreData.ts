import { useQuery } from '@tanstack/react-query';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import { fetchBaselineFile } from '@/libs/flagship/explore/baselineData';

/** The state shapes, merged from districts by `scripts/build-us-map-topology.mjs`. */
export const US_STATES_TOPOLOGY_URL = '/data/geojson/us_states.topo.json';

/** A state's shape; `id` is its two-letter code ("OH"). */
export type MapShape = Feature<Geometry, { id: string }>;

async function fetchShapes(url: string, object: string): Promise<MapShape[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`The map could not be loaded (${response.status}).`);
  }
  const topology = (await response.json()) as Topology;
  const shapes = feature(topology, topology.objects[object]) as FeatureCollection<
    Geometry,
    MapShape['properties']
  >;
  return shapes.features;
}

/**
 * Everything the Explore page draws: the current-law figures and the
 * state shapes. Both are static files, cached for the session; neither
 * starts a simulation.
 */
export function useExploreData(countryId: string, year: number) {
  const baseline = useQuery({
    queryKey: ['explore-baseline', countryId, year],
    queryFn: () => fetchBaselineFile(countryId, year),
    staleTime: Infinity,
  });
  const states = useQuery({
    queryKey: ['explore-shapes', US_STATES_TOPOLOGY_URL],
    queryFn: () => fetchShapes(US_STATES_TOPOLOGY_URL, 'states'),
    staleTime: Infinity,
  });
  return { baseline, states };
}
