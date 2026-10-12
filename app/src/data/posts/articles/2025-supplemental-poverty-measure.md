On September 15 the Census Bureau published [_Poverty in the United States: 2025_](https://www.census.gov/library/publications/2026/demo/p60-290.html). The Supplemental Poverty Measure rate for 2025 is 13.1 percent, 44.4 million people, up 0.1 point from 2024, a change Census [describes](https://www.census.gov/newsroom/press-releases/2026/income-poverty-health-insurance-coverage.html) as not statistically different from zero. Children's SPM poverty is 13.4 percent, down 0.1, and people 65 and over are at 15.4 percent, up 0.2 ([Table 4](https://www2.census.gov/programs-surveys/demo/tables/p60/290/table_4_spm_person.xlsx)). The official poverty rate fell 0.5 points to 10.2 percent ([Table 1](https://www2.census.gov/programs-surveys/demo/tables/p60/290/table_1_opm_person.xlsx)).

The thresholds that define SPM poverty rose [4.4 to 6.3 percent](https://www.bls.gov/pir/spm/spm_thresholds_2025.htm) in 2025, while CPI-U rose 2.6 percent. Resources near the poverty line grew fast enough to offset most of that increase. At 2024 thresholds grown by CPI-U, the 2025 SPM rate is 12.3 percent, down 0.7 points.

## What an SPM threshold is

The SPM counts a person as poor when their SPM unit's resources fall below its threshold. Census [builds resources](https://www2.census.gov/programs-surveys/supplemental-poverty-measure/datasets/spm/spm_techdoc.pdf) from cash income plus in-kind benefits such as SNAP, school meals, housing assistance and energy assistance, then subtracts taxes, work and child care expenses, child support paid and medical out-of-pocket spending. The threshold represents the cost of food, clothing, shelter, utilities, telephone and internet.

BLS [produces the thresholds](https://www.bls.gov/pir/spmhome.htm) from the Consumer Expenditure Survey. It takes five years of spending data, lagged one year, from families with children, converts each family's spending to that of a reference family of two adults and two children, and brings every quarter to threshold-year dollars with a price index built from the threshold's own components. It then averages spending on those items among families between the 47th and 53rd percentiles, adds 20 percent for other basic goods and services such as household supplies, personal care and non-work transportation, substitutes each tenure group's own shelter and utility spending, and takes 82 percent of the result. The 82 percent replaced 83 percent when BLS [corrected the 2019 to 2024 series](https://www.bls.gov/pir/spm/spm_thresholds_2024_correction.htm) in July 2026.

Shelter costs differ by housing situation, so BLS publishes three thresholds. For 2025 they are $41,701 for renters, $41,323 for owners with a mortgage and $34,326 for owners without one, up 6.3, 5.3 and 4.4 percent from 2024.[^1] BLS [attributes](https://www.bls.gov/pir/spm/spm_thresholds_2025.htm) part of the growth to prices: the index for the threshold's components rose 3.4 percent in 2025, against 2.6 percent for CPI-U. The remainder reflects the spending data, as the five-year window moved forward a year.

Census adapts the national threshold to each family. A three-parameter equivalence scale adjusts it for the number of adults and children, and a geographic adjustment moves the housing share with local rents, using five-year American Community Survey median rents for two-bedroom units in 341 metropolitan and nonmetropolitan areas ([technical documentation](https://www2.census.gov/programs-surveys/supplemental-poverty-measure/datasets/spm/spm_techdoc.pdf), section 4.2). Our [SPM threshold calculator](/us/spm-calculator) applies the same steps to any family and area.

The base moves with what families spend in real terms, so the threshold rises when middle-income families spend more on necessities even if prices hold still. Census updates the official poverty thresholds by CPI-U alone: the 2025 official threshold for two adults and two children is $32,649, up 2.6 percent from $31,812 ([Table 11](https://www2.census.gov/programs-surveys/demo/tables/p60/290/table_11_spm_thresh.xlsx)).

## By age

Census prints rates for children, adults 18 to 64 and people 65 and over. The table adds finer age groups from the public-use microdata.[^2]

| SPM poverty rate, percent |       2024[^2] |          2025 | Change, points |
| ------------------------- | -------------: | ------------: | -------------: |
| All people                |   13.0 (±0.18) | 13.11 (±0.19) |           +0.1 |
| Under 4                   | 14.95 (±0.58)† | 14.13 (±0.57) |          −0.8† |
| Under 6                   | 14.50 (±0.50)† | 14.15 (±0.52) |          −0.4† |
| Under 18                  |   13.5 (±0.30) | 13.39 (±0.34) |           −0.1 |
| 6 to 17                   | 12.84 (±0.34)† | 13.06 (±0.39) |          +0.2† |
| 18 to 64                  |   12.2 (±0.18) | 12.28 (±0.20) |           +0.1 |
| 65 and over               |   15.1 (±0.30) | 15.38 (±0.32) |           +0.2 |
| 75 and over               | 16.49 (±0.48)† | 16.57 (±0.47) |          +0.1† |

Children under 6 have higher rates than older children, and people 75 and over have the highest rate of any group. The point estimate for children under 4 fell 0.8 points, with standard errors of 0.6 points on each year's figure, and the rate for children 6 to 17 rose 0.2. Census restated 2024 on Vintage 2025 population controls in this report, which moves the 2024 child rate to 13.5 from the 13.4 in its [August working paper](https://www.census.gov/library/working-papers/2026/demo/sehsd-wp2026-17.html).

## By housing tenure

A family's tenure selects which of the three thresholds applies to it, and the renter threshold grew fastest this year. Census reports renters at 24.0 percent in 2025, up 0.8 points; owners with a mortgage at 6.0 percent, down 0.2; and owners without a mortgage at 11.9 percent, unchanged ([Table 4](https://www2.census.gov/programs-surveys/demo/tables/p60/290/table_4_spm_person.xlsx)).

## By state

Census publishes state rates as three-year averages, because a single year of the Current Population Survey is too small a sample for most states. The 2023 to 2025 average for all people ranges from 6.4 percent in Maine to 19.0 percent in Louisiana, with California at 17.8, Mississippi at 16.8 and Florida at 16.4 ([Table 17](https://www2.census.gov/programs-surveys/demo/tables/p60/290/table_17_spm_opm_state.xlsx)).

```chart
{
  "type": "stateMap",
  "title": "SPM poverty by state, 2023 to 2025 average",
  "subtitle": "Percent of all people below the SPM threshold, three-year average",
  "stateKey": "state",
  "valueKey": "spm_pct",
  "summary": {"label": "United States", "value": 13.0},
  "bins": [
    {"below": 9, "label": "under 9%"},
    {"below": 12, "label": "9 to 12%"},
    {"below": 15, "label": "12 to 15%"},
    {"below": 18, "label": "15 to 18%"},
    {"label": "18% and up"}
  ],
  "data": [
    {"state": "AL", "spm_pct": 14.4},
    {"state": "AK", "spm_pct": 10.4},
    {"state": "AZ", "spm_pct": 13.7},
    {"state": "AR", "spm_pct": 12.8},
    {"state": "CA", "spm_pct": 17.8},
    {"state": "CO", "spm_pct": 10.8},
    {"state": "CT", "spm_pct": 10.4},
    {"state": "DE", "spm_pct": 8.9},
    {"state": "DC", "spm_pct": 15.7},
    {"state": "FL", "spm_pct": 16.4},
    {"state": "GA", "spm_pct": 14},
    {"state": "HI", "spm_pct": 11.7},
    {"state": "ID", "spm_pct": 9.4},
    {"state": "IL", "spm_pct": 11.6},
    {"state": "IN", "spm_pct": 10.3},
    {"state": "IA", "spm_pct": 8.3},
    {"state": "KS", "spm_pct": 8.1},
    {"state": "KY", "spm_pct": 13.2},
    {"state": "LA", "spm_pct": 19},
    {"state": "ME", "spm_pct": 6.4},
    {"state": "MD", "spm_pct": 10.9},
    {"state": "MA", "spm_pct": 12.5},
    {"state": "MI", "spm_pct": 10.6},
    {"state": "MN", "spm_pct": 7.9},
    {"state": "MS", "spm_pct": 16.8},
    {"state": "MO", "spm_pct": 9.4},
    {"state": "MT", "spm_pct": 9.5},
    {"state": "NE", "spm_pct": 7.5},
    {"state": "NV", "spm_pct": 15.3},
    {"state": "NH", "spm_pct": 8},
    {"state": "NJ", "spm_pct": 12.1},
    {"state": "NM", "spm_pct": 13.2},
    {"state": "NY", "spm_pct": 15.1},
    {"state": "NC", "spm_pct": 13.5},
    {"state": "ND", "spm_pct": 8.9},
    {"state": "OH", "spm_pct": 9.9},
    {"state": "OK", "spm_pct": 11.1},
    {"state": "OR", "spm_pct": 11},
    {"state": "PA", "spm_pct": 10.7},
    {"state": "RI", "spm_pct": 10.6},
    {"state": "SC", "spm_pct": 11.1},
    {"state": "SD", "spm_pct": 8},
    {"state": "TN", "spm_pct": 11.1},
    {"state": "TX", "spm_pct": 14.4},
    {"state": "UT", "spm_pct": 9.9},
    {"state": "VT", "spm_pct": 8.9},
    {"state": "VA", "spm_pct": 10.6},
    {"state": "WA", "spm_pct": 10.5},
    {"state": "WV", "spm_pct": 12.1},
    {"state": "WI", "spm_pct": 7.9},
    {"state": "WY", "spm_pct": 8.7}
  ],
  "format": {"decimals": 1, "suffix": "%"},
  "note": "Three-year averages, so states are comparable at CPS sample sizes; margins of error run about 1 to 2 points for most states. Tiles are equal in size, so the layout is about position, not area.",
  "source": "Source: U.S. Census Bureau, Poverty in the United States: 2025, Table 17. Percent of people below the SPM threshold."
}
```

## At 2024 thresholds

We recomputed the 2025 rates with the national thresholds held at their 2024 values grown by CPI-U, tenure group by tenure group, leaving the equivalence scale, the geographic adjustment and every unit's resources at their published 2025 values.[^3] A unit is poor when its resources fall below the anchored threshold.

| SPM poverty rate, percent | 2024 (P60-290) | 2025 published | 2025 at 2024 thresholds × CPI-U | 2025 at 2024 thresholds × C-CPI-U |
| ------------------------- | -------------: | -------------: | ------------------------------: | --------------------------------: |
| All people                |           13.0 |          13.11 |                           12.31 |                             12.29 |
| Under 18                  |           13.5 |          13.39 |                           12.31 |                             12.30 |
| 18 to 64                  |           12.2 |          12.28 |                           11.55 |                             11.53 |
| 65 and over               |           15.1 |          15.38 |                           14.66 |                             14.62 |

```chart
{
  "type": "waterfall",
  "title": "SPM poverty, 2024 to 2025: what resources did, and what thresholds did",
  "subtitle": "Percent of people below the SPM threshold. Resources: the change from 2024 to the 2025 rate at 2024 thresholds grown by CPI-U, so resources measured against prices. Thresholds: the further change to the published 2025 rate, from threshold growth beyond CPI-U.",
  "panelKey": "group",
  "steps": [
    {"key": "y2024_census", "name": "2024", "kind": "level", "legend": "Published rate", "color": "primary"},
    {"key": "resources_step", "name": "Resources", "kind": "change", "legend": "Resources, at 2024 thresholds × CPI-U", "color": "quinary"},
    {"key": "threshold_step", "name": "Thresholds", "kind": "change", "legend": "Threshold growth beyond CPI-U", "color": "tertiary"},
    {"key": "published_2025", "name": "2025", "kind": "level", "legend": "Published rate", "color": "primary"}
  ],
  "data": [
    {"group": "All people", "y2024_census": 13.0, "resources_step": -0.6911, "threshold_step": 0.8028, "published_2025": 13.1117},
    {"group": "Under 18", "y2024_census": 13.5, "resources_step": -1.194, "threshold_step": 1.0853, "published_2025": 13.3913},
    {"group": "18 to 64", "y2024_census": 12.2, "resources_step": -0.6518, "threshold_step": 0.7291, "published_2025": 12.2773},
    {"group": "65 and over", "y2024_census": 15.1, "resources_step": -0.4399, "threshold_step": 0.7178, "published_2025": 15.3779}
  ],
  "format": {"decimals": 1},
  "source": "Source: U.S. Census Bureau, P60-290 (2024 rates, restated on Vintage 2025 controls); PolicyEngine recomputation from the 2026 CPS ASEC public-use file for the 2025 rates. Labels rounded to one decimal; steps computed from unrounded rates."
}
```

Threshold growth beyond CPI-U accounts for 0.80 points of the 2025 rate for all people, 1.08 points for children, 0.73 for people 18 to 64 and 0.72 for people 65 and over. On the anchored basis, SPM poverty fell from 13.0 percent in 2024 to 12.3 in 2025, and child poverty fell from 13.5 to 12.3. The youngest children carry the largest effect: 1.23 points (±0.20) for children under 4 and 1.20 (±0.17) for children under 6, against 1.03 (±0.12) for ages 6 to 17 and 0.75 (±0.10) for people 75 and over.

The renter threshold rose 6.3 percent, the most of the three tenure groups, and the renter poverty rate is 23.96 percent as published against 22.13 anchored. Owners without a mortgage, whose threshold rose 4.4 percent, go from 11.89 to 11.49. Owners with a mortgage go from 6.00 to 5.67.

The chained variant grows the 2024 thresholds by [C-CPI-U](https://data.bls.gov/timeseries/SUUR0000SA0), 2.48 percent, and lands within 0.04 points of the CPI-U figures.[^4]

By state, the threshold effect ranges from zero in Nebraska to 1.7 points in Alabama, and it exceeds twice its standard error in 28 of the 51 states. New York (1.5 points), Montana (1.5), Indiana (1.4), Delaware (1.4) and Arizona (1.4) follow Alabama; Maine, Kansas, Washington, Minnesota and Wisconsin sit at 0.2 points or less. The effect counts the people whose resources fall between the anchored threshold and the published one, so it depends on how many of a state's residents sit in that band. These are single-year estimates, with standard errors of 0.1 to 0.7 points.[^3]

```chart
{
  "type": "stateMap",
  "title": "Points added to 2025 SPM poverty by threshold growth beyond CPI-U, by state",
  "subtitle": "Published 2025 rate minus the rate at 2024 thresholds grown by CPI-U, in percentage points",
  "stateKey": "state",
  "valueKey": "effect_pp",
  "summary": {"label": "United States", "value": 0.8},
  "bins": [
    {"below": 0.4, "label": "under 0.4"},
    {"below": 0.8, "label": "0.4 to 0.8"},
    {"below": 1.2, "label": "0.8 to 1.2"},
    {"below": 1.6, "label": "1.2 to 1.6"},
    {"label": "1.6 and up"}
  ],
  "data": [
    {"state": "AL", "effect_pp": 1.71},
    {"state": "AK", "effect_pp": 0.35},
    {"state": "AZ", "effect_pp": 1.36},
    {"state": "AR", "effect_pp": 0.8},
    {"state": "CA", "effect_pp": 1.08},
    {"state": "CO", "effect_pp": 0.46},
    {"state": "CT", "effect_pp": 0.81},
    {"state": "DE", "effect_pp": 1.37},
    {"state": "DC", "effect_pp": 1.12},
    {"state": "FL", "effect_pp": 1.01},
    {"state": "GA", "effect_pp": 0.74},
    {"state": "HI", "effect_pp": 1.14},
    {"state": "ID", "effect_pp": 0.58},
    {"state": "IL", "effect_pp": 0.61},
    {"state": "IN", "effect_pp": 1.38},
    {"state": "IA", "effect_pp": 1.07},
    {"state": "KS", "effect_pp": 0.08},
    {"state": "KY", "effect_pp": 0.63},
    {"state": "LA", "effect_pp": 1.13},
    {"state": "ME", "effect_pp": 0.07},
    {"state": "MD", "effect_pp": 0.55},
    {"state": "MA", "effect_pp": 0.83},
    {"state": "MI", "effect_pp": 0.44},
    {"state": "MN", "effect_pp": 0.15},
    {"state": "MS", "effect_pp": 0.7},
    {"state": "MO", "effect_pp": 0.97},
    {"state": "MT", "effect_pp": 1.47},
    {"state": "NE", "effect_pp": 0.0},
    {"state": "NV", "effect_pp": 1.21},
    {"state": "NH", "effect_pp": 1.0},
    {"state": "NJ", "effect_pp": 0.58},
    {"state": "NM", "effect_pp": 0.7},
    {"state": "NY", "effect_pp": 1.5},
    {"state": "NC", "effect_pp": 0.46},
    {"state": "ND", "effect_pp": 0.29},
    {"state": "OH", "effect_pp": 0.48},
    {"state": "OK", "effect_pp": 0.6},
    {"state": "OR", "effect_pp": 0.41},
    {"state": "PA", "effect_pp": 0.31},
    {"state": "RI", "effect_pp": 0.87},
    {"state": "SC", "effect_pp": 0.8},
    {"state": "SD", "effect_pp": 0.39},
    {"state": "TN", "effect_pp": 0.75},
    {"state": "TX", "effect_pp": 1.02},
    {"state": "UT", "effect_pp": 0.31},
    {"state": "VT", "effect_pp": 0.32},
    {"state": "VA", "effect_pp": 0.24},
    {"state": "WA", "effect_pp": 0.14},
    {"state": "WV", "effect_pp": 1.08},
    {"state": "WI", "effect_pp": 0.21},
    {"state": "WY", "effect_pp": 0.43}
  ],
  "format": {"decimals": 1, "suffix": " points"},
  "note": "Single-year state estimates; replicate-weight standard errors run 0.1 to 0.7 points. Tiles are equal in size, so the layout is about position, not area.",
  "source": "Source: PolicyEngine recomputation from the 2026 CPS ASEC public-use file; 2024 thresholds from BLS's corrected series, grown by CPI-U (32,649 / 31,812)."
}
```

The published and anchored series answer different questions. BLS designs the SPM thresholds to move with what families near the middle spend on necessities, so the published series asks whether resources kept pace with that standard. The anchored series holds the standard fixed in real terms and asks whether resources kept pace with prices. In 2025 the two answers differ by 0.8 points, one year's threshold growth beyond inflation. The anchoring scales the national base only; the 2025 rent indices Census used for each area stay in place.

The [SPM threshold calculator](/us/spm-calculator) computes the 2025 threshold for any family and area and projects it forward; its [methods paper](/us/spm-calculator/paper) documents how.

<div style="text-align: center; margin: 24px 0;"><a class="cta-button" href="/us/spm-calculator">Compute your SPM threshold →</a></div>

[^2]: The 2025 column is our estimate for every row from the [2026 CPS ASEC public-use file](https://www2.census.gov/programs-surveys/cps/datasets/2026/march/asecpub26csv.zip), with standard errors from its 160 [replicate weights](https://cps.ipums.org/cps/repwt.shtml); Census's published 2025 rates for the four groups it prints are 13.1, 13.4, 12.3 and 15.4. For 2024, Census publishes rates for all people, children, adults 18 to 64 and people 65 and over, restated on Vintage 2025 population controls; for those rows the ± figure converts the 90 percent margin of error in Table 4 to a standard error, dividing by 1.645. For the finer age groups, marked †, we computed 2024 from the [2025 file](https://www2.census.gov/programs-surveys/cps/datasets/2025/march/asecpub25csv.zip), which carries the earlier weights, the same way. On that file the four published groups come to 12.93, 13.35, 12.16 and 14.95 percent, 0.1 to 0.2 points below the restated figures, so the † changes sit on a slightly different basis from the others.

[^3]: Each SPM unit in the public-use file carries its threshold, its resources, its housing tenure and the geographic adjustment Census applied. We scaled each unit's threshold by tenure so that the national two-adult, two-child base equals its 2024 value from the [corrected BLS series](https://www.bls.gov/pir/spm/spm_threshold_200524_corrected.xlsx) (owners with a mortgage $39,231, owners without $32,879, renters $39,220) times the ratio Census used to move the official thresholds, 32,649 to 31,812, or 2.63 percent. Before anchoring, the same code reproduces the published rates: 13.11 percent for all people, 13.39 for children, 12.28 for people 18 to 64 and 15.38 for people 65 and over. Inputs are the 2026 file's person, household and replicate-weight tables (`pppub26.csv`, `hhpub26.csv`, `asec_csv_repwgt_2026.csv`), BLS's [2025 thresholds](https://www.bls.gov/pir/spm/spm_thresholds_2025.htm) and [CPI-U](https://data.bls.gov/timeseries/CUUR0000SA0). Code and outputs, including the per-state figures with standard errors, are in the [spm-threshold-paper repository](https://github.com/PolicyEngine/spm-threshold-paper/pull/8): `replicate_and_anchor.py`, `state_age_anchored.py`, `state_tile_map.py`, `waterfall.py` and the JSON and CSV results they produce.

[^4]: Its 2025 mean uses eleven months, because BLS had not published October 2025 when we ran it, and recent chained values are interim.

[^1]: Table 11 of P60-290 prints the 2024 renter threshold as $37,231, which is BLS's corrected 2023 value; the corrected 2024 renter threshold is $39,220, the base for the 6.3 percent growth BLS reports for 2025. We use the BLS value, and the 2025 thresholds in the public-use microdata match BLS. We reported the discrepancy to Census.
