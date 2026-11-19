# Current-law baseline figures

The v3 Explore page (`/us/explore`, behind `NEXT_PUBLIC_EXPLORE`) reads one file per country and year, such as `us/2026.json`. The page starts no simulation; this file is all it reads, beside the map shapes in `../geojson/us_states.topo.json` and `../geojson/us_districts.topo.json`.

## Status

`us/2026.json` holds model output from `analysis/explore-baseline/precompute.py` (see its README for the pinned bundle, datasets and method). Its Census SPM benchmarks come from Microcosm's backtest file (Census P60-287). Set `"placeholder": true` only for a hand-made preview file; the page then shows a "Placeholder figures" badge.

## Format (schema_version 1)

- `regions`: keyed by the API's region names: `us`, `state/oh`, `congressional_district/OH-09`. There are 1 + 51 + 436 regions.
- Each region: `label`, `metrics`, and optional `benchmarks`.
- `metrics`: SPM poverty rates (`poverty`, `child_poverty`, `senior_poverty`, `deep_poverty`), medians (`median_household_net_income`, `median_household_market_income`), inequality (`gini`, `top_10_share`, `top_1_share`), `state_income_tax_rate`, program reach (`receipt_*`), totals in dollars (`total_*`) and average credits (`*_per_recipient`). Rates and shares are fractions. A missing metric shows as "No data".
- Nation and states also carry `deciles`, `state_tax_by_quintile` and `poverty_by_group`; states and districts carry `sample_households`.
- `benchmarks`: official figures to show beside the model's, keyed like `metrics`: `{ value, period, source, url }`.
- `receipt`: the bundle, model version, dataset builds and compute date that produced the figures. The page prints it under the map.

`app/src/libs/flagship/explore/baselineData.ts` holds the TypeScript types. `app/src/tests/unit/libs/flagship/explore/baselineData.test.ts` checks that the file covers every map shape.

## Producing the file

Run `analysis/explore-baseline/precompute.py` on each model or data release (bundle bump). It splits the local-area dataset into one file per state, then computes the nation and each state, with its districts, in parallel. On a 128 GB laptop with 8 processes it takes minutes, not hours.

The map shapes are rebuilt with `node scripts/build-us-map-topology.mjs` (from `app/`).
