# Explore: current-law baseline figures

`precompute.py` writes `app/public/data/baseline/us/<year>.json`, the file that the v3 Explore page (`/us/explore`) reads. It holds current-law figures for the nation, the 50 states and DC, and the 436 congressional districts. The page starts no simulation.

## Reproduce

From the repository root, using Python 3.13:

```sh
uv venv --python 3.13 analysis/explore-baseline/.venv
uv pip install --python analysis/explore-baseline/.venv/bin/python -r analysis/explore-baseline/requirements.txt
analysis/explore-baseline/.venv/bin/python analysis/explore-baseline/precompute.py --year 2026
```

`fetch_data.py` downloads the two datasets at the revisions pinned in `datasets.json` and checks their sha256. It needs read access to `policyengine/populace-us` on Hugging Face. The local-area file is about 10 GB.

The first run splits the local-area file into one file per state (about 1 minute, cached under `~/.cache/policyengine-explore/`). Then the nation and each state, with its districts, run in parallel: with `--workers 8` the whole run took 7.3 minutes on a 128 GB laptop and peaked at 12 GB of memory per process. `--states vt,wy --out <path>` runs a few states and the nation, for a quick check.

## Pins

- `requirements.txt` pins the policyengine.py bundle 6.20.2: `policyengine-us` 2.2.2, `policyengine-core` 3.34.10, `spm-calculator` 1.1.0.
- `datasets.json` pins the bundle's US datasets: the national build `populace-us-2024-spm-20260915` and the local-area build `populace-us-2024-buildo-acs-local-766b7c7-20261017T030317Z`, with their Hugging Face revisions and sha256 values, copied from the bundle manifest (`src/policyengine/data/bundle/manifest.json`).

When the bundle changes, update both files together from the new manifest, then run the script again. The output's `receipt` records the versions it used.

## Method

- **Nation:** the national dataset.
- **States and districts:** the local-area dataset, with households grouped by `state_fips` and `congressional_district_geoid`. This is what the simulation API's `RowFilterStrategy` does for a state or district report. The national dataset has too few households per district (see #1361).
- **One run per dataset.** Current law has no effect between households, so grouping one run gives the same figures as one run per region.
- **Poverty:** `spm_unit_is_in_spm_poverty` (deep: `spm_unit_is_in_deep_spm_poverty`) for each person, with person weights, as in policyengine.py's `outputs/poverty.py`.
- **Inequality:** `household_net_income` with household weights and no equivalisation, as in the US "standard" preset of `outputs/inequality.py`. Top shares use the same ordering.
- **Benefit reach:** recipients counted in the unit that the agency counts, and their share of all such units: SNAP for households and TANF for families (both SPM units); free or reduced-price school meals for children aged 5 to 17 in a family that qualifies; the EITC and the Child Tax Credit (`ctc_value`, the credit received) for tax units; ACA premium tax credits for eligible people (`person_receives_aca`, which follows the model's take-up) in a tax unit that gets more than $0; Medicaid, SSI, WIC and Social Security for people.
- **Load path:** each run uses policyengine.py's `managed_microsimulation`, so the bundle's SPM settings and the WIC take-up input (`would_claim_wic`, policyengine.py#531) apply. The local-area build is a registered legacy SPM source, so the script also applies policyengine.py's derived SPM scope: group-quarters residents are outside the poverty measurement and count in neither the poor nor the total.
- **State income tax rate:** state income tax after credits, divided by market income (negative market income counts as zero).
- **Deciles, quintiles and poverty by group:** nation and states only, with deciles of household net income taken within each region.
- A region with fewer than 100 sample households is left out.

`admin_by_state.csv` holds the agency counts of recipients that the page shows beside the model's (SSA, CMS, IRS SOI, USDA FNS, HHS ACF), with the source, period and link of each. `ADMIN_MEASURES` in `precompute.py` picks one measure per program. SNAP households by state come from the SNAP Quality Control file (FY2023) in policyengine-scorecard (`data/externals/snap-qc-characteristics.json`). The school meals count is national only. The IRS CTC count leaves out returns that claim only the refundable part, so the page says "at least". An agency count can use a different unit or period from the model's; the page prints both units.

`census_spm_benchmarks.json` holds the Census SPM rates (P60-287) that the page shows beside the model's. They come from Microcosm's backtest file (`packages/microcosm-build/src/microcosm/build/us/state_spm_poverty_levels.json`).

## Limits

- Poverty is not a calibration target, so the model's SPM rates differ from Census's. Benefits are computed from rules, not taken from survey answers.
- District figures are synthetic: households get a district through geography assignment in Microcosm, and districts are calibrated on a few administrative targets. The page marks district values that rest on thin samples.
- The page shows no figure for the uninsured rate or for wealth. The data cannot support them.
