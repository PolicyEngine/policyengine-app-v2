/**
 * Builds the two TopoJSON files that the v3 Explore map draws, from the
 * congressional district GeoJSON the report maps already use:
 *
 * - public/data/geojson/us_districts.topo.json: the 436 districts, with
 *   `id` ("OH-09") and `state` ("OH") properties.
 * - public/data/geojson/us_states.topo.json: the 50 states and DC, each
 *   made by merging its districts, with `id` ("OH") properties.
 *
 * TopoJSON stores each shared border once and quantizes coordinates, so
 * the two files are about a fifth of the GeoJSON's size.
 *
 * Usage (from app/): node scripts/build-us-map-topology.mjs
 */
import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { feature, merge } from 'topojson-client';
import { topology } from 'topojson-server';

const SOURCE = resolve('public/data/geojson/congressional_districts.geojson');
const DISTRICTS_OUT = resolve('public/data/geojson/us_districts.topo.json');
const STATES_OUT = resolve('public/data/geojson/us_states.topo.json');
/** Grid size for coordinate quantization: about 250 m across the country. */
const QUANTIZATION = 2e4;
const EXCLUDED_STATES = new Set(['PR']);

const source = JSON.parse(await readFile(SOURCE, 'utf8'));
const districts = {
  type: 'FeatureCollection',
  features: source.features
    .map((f) => {
      const id = f.properties.DISTRICT_ID;
      return { type: 'Feature', geometry: f.geometry, properties: { id, state: id.split('-')[0] } };
    })
    // Puerto Rico's delegate seat is in the source but not in the model's regions.
    .filter((f) => !EXCLUDED_STATES.has(f.properties.state)),
};

const districtTopology = topology({ districts }, QUANTIZATION);
const geometries = districtTopology.objects.districts.geometries;
const codes = [...new Set(geometries.map((g) => g.properties.state))].sort();
const states = {
  type: 'FeatureCollection',
  features: codes.map((code) => ({
    type: 'Feature',
    geometry: merge(
      districtTopology,
      geometries.filter((g) => g.properties.state === code)
    ),
    properties: { id: code },
  })),
};
// Round trip through GeoJSON so each file holds only the arcs it uses.
const districtFeatures = feature(districtTopology, districtTopology.objects.districts);

await writeFile(
  DISTRICTS_OUT,
  JSON.stringify(topology({ districts: districtFeatures }, QUANTIZATION))
);
await writeFile(STATES_OUT, JSON.stringify(topology({ states }, QUANTIZATION)));
console.log(`${districts.features.length} districts and ${codes.length} states written.`);
