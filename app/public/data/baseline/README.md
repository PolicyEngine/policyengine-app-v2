# Current-law baseline figures

The v3 Explore page (`/us/explore`, behind `NEXT_PUBLIC_EXPLORE`) reads one file per country and year, such as `us/2026.json`. The page starts no simulation; this file is all it reads, beside the map shapes in `../geojson/us_states.topo.json` and `../geojson/us_districts.topo.json`.

## Status

`us/2026.json` is a **placeholder** (`"placeholder": true`). Its model figures are made up, and the page says so. Its Census SPM benchmarks are real: they come from Microcosm's backtest file (`packages/microcosm-build/src/microcosm/build/us/state_spm_poverty_levels.json`), Census P60-287.

## Format (schema_version 1)

- `regions`: keyed by the API's region names: `us`, `state/oh`, `congressional_district/OH-09`. There are 1 + 51 + 436 regions.
- Each region: `label`, `metrics`, and optional `benchmarks`.
- `metrics`: `poverty`, `child_poverty`, `deep_poverty` (SPM rates as fractions), `median_household_net_income` (dollars), `gini`. A missing metric shows as "No data".
- `benchmarks`: official figures to show beside the model's, keyed like `metrics`: `{ value, period, source, url }`.
- `receipt`: the bundle, model version, dataset builds and compute date that produced the figures. The page prints it under the map.

`app/src/libs/flagship/explore/baselineData.ts` holds the TypeScript types. `app/src/tests/unit/libs/flagship/explore/baselineData.test.ts` checks that the file covers every map shape.

## Producing the real file

A precompute job, run on each model or data release, should write this file:

1. Nation: the national dataset.
2. States and districts: the local-area dataset (`acs_local`), filtered by state and by congressional district. Do not use the national dataset for districts; it has too few households per district (#1361).
3. Use the same poverty, inequality and income outputs as the simulation API, so the page and the reports agree.
4. Fill `receipt` from the policyengine.py bundle manifest.

The map shapes are rebuilt with `node scripts/build-us-map-topology.mjs` (from `app/`).
