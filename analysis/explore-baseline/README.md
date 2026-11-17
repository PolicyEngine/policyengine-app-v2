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

A full run takes about an hour on a 128 GB laptop and peaks at roughly 40 GB of memory. `--nation-only --out <path>` runs the national file alone in about 4 minutes, for a quick check.

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
- **Benefit reach:** the share of people with a positive value of the program's variable, mapped to the person. SNAP, TANF and school meals are counted for the person's SPM unit; the EITC, CTC and ACA credits for the person's tax unit; Medicaid, SSI, WIC and Social Security for the person.
- **State income tax rate:** state income tax after credits, divided by market income (negative market income counts as zero).
- **Deciles, quintiles and poverty by group:** nation and states only, with deciles of household net income taken within each region.
- A region with fewer than 100 sample households is left out.

`census_spm_benchmarks.json` holds the Census SPM rates (P60-287) that the page shows beside the model's. They come from Microcosm's backtest file (`packages/microcosm-build/src/microcosm/build/us/state_spm_poverty_levels.json`).

## Limits

- Poverty is not a calibration target, so the model's SPM rates differ from Census's. Benefits are computed from rules, not taken from survey answers.
- District figures are synthetic: households get a district through geography assignment in Microcosm, and districts are calibrated on a few administrative targets. The page marks district values that rest on thin samples.
- The page shows no figure for the uninsured rate or for wealth. The data cannot support them.
