import { useQuery } from '@tanstack/react-query';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import { fetchBaselineFile } from '@/libs/flagship/explore/baselineData';

/** The map shapes: states merged from districts, built by `scripts/build-us-map-topology.mjs`. */
export const US_STATES_TOPOLOGY_URL = '/data/geojson/us_states.topo.json';
export const US_DISTRICTS_TOPOLOGY_URL = '/data/geojson/us_districts.topo.json';

/** A map shape: a state ("OH") or a district ("OH-09", in state "OH"). */
export type MapShape = Feature<Geometry, { id: string; state?: string }>;

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
 * Everything the Explore page draws: the current-law figures and the two
 * map files. All three are static files, cached for the session; none
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
  const districts = useQuery({
    queryKey: ['explore-shapes', US_DISTRICTS_TOPOLOGY_URL],
    queryFn: () => fetchShapes(US_DISTRICTS_TOPOLOGY_URL, 'districts'),
    staleTime: Infinity,
  });
  return { baseline, states, districts };
}
