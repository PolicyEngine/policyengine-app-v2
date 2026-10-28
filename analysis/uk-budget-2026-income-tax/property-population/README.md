# Property-only population results

This folder supports the property article in PR #1460. It retains the approved property-only national results from dashboard PR #290 at immutable commit `637bb26c34264e0491ed182c363df751466458ed`.

These are approved **branch-snapshot** results. The snapshot has not been independently verified as the production deployment. Before merging the article, compare the final released dashboard's property artifact identity and figures with this record, and update the article if they differ. The article's new population section also requires review at its new head.

## Source and verification

- Manifest revision: 14.
- Measure and artifact: `property_income_rates_up/7bf77b35e33233e0`.
- Generation commit: `4de166f05eebbc7e501fcf39206cdc82fd199213`; the later snapshot commit does not mean that the simulation was regenerated.
- Runtime: `policyengine` 6.11.1, PolicyEngine UK 2.151.0, core 3.33.3.
- Certified national dataset: `microcosm-uk-2024-25-national-20261025T091414Z-a6299504`, SHA256 `b96a8cd625b645a409c063b1de5158532708a2f0d3c3897a794a8fb0bbd5064e`.
- Baseline and reform use the detailed October 2026 forecast. The reform changes only the property-income measure, including finance-cost relief.

The canonical receipt validator returned no document or dashboard problems. The artifact, receipt, outputs, execution identity and approval digests match the manifest; all eight source CSV hashes match the receipt. Reconciliation is `pass`, responsiveness is `responsive`, and disclosure checking records a three-survey-household floor with no thin or withheld cells. `summary.json` retains the exact checks, source URLs, values and definitions. The retained receipt and four CSVs are public national aggregates; no household records or population H5 are stored here.

## Files and definitions

- `budgetary_impact.csv`: annual reform-minus-baseline government balance, in £ billion. This includes tax and spending interactions and is not income tax alone.
- `winners_losers.csv`: despite its name, it contains household-weighted **mean income changes**, not winner/loser counts or shares. The article's chart uses the 2027 and 2031 decile means, retaining raw precision and rendering whole pounds.
- `distributional_impact.csv`: change in aggregate household net income divided by aggregate baseline household net income within each decile, as a percentage. It is not the mean of household percentage changes.
- `metrics.csv`: includes the affected-population measure. For 2027–28, 5.9436116% of people live in households whose absolute relative household-income change exceeds 0.01%. The calculation uses at least £1 of baseline household income and restricts the population to valid baseline deciles. It counts either direction, not only tax increases or losses. No taxpayer count, affected-household count, or separate winner/loser shares are available in these exports.

Decile ranks are recomputed for each year from baseline, person-weighted equivalised HBAI household net income before housing costs. Negative ranking income is reset to zero, and equal-income households share a rank. The displayed averages are annual, unequivalised household-net-income changes over **all households** in each decile, including those unaffected. No top-decile revenue share is inferred from these means.

The official comparison marks 2027–28 and 2028–29 as not comparable; its comparison values are null. The source Treasury table separately reports £35 million and £575 million, which the article shows with those flags. Later-year Treasury values are £435 million, £445 million and £455 million. All article values round only for presentation.

## Immutable sources

- [Approved manifest](https://github.com/PolicyEngine/uk-autumn-budget-dashboard-2026/blob/637bb26c34264e0491ed182c363df751466458ed/public/data/manifest.json).
- [Property receipt and aggregate CSVs](https://github.com/PolicyEngine/uk-autumn-budget-dashboard-2026/tree/637bb26c34264e0491ed182c363df751466458ed/public/data/artifacts/property_income_rates_up/7bf77b35e33233e0).
- [Official comparison flags](https://github.com/PolicyEngine/uk-autumn-budget-dashboard-2026/blob/637bb26c34264e0491ed182c363df751466458ed/public/data/official_costings.json).
- [Treasury row 61 source values](https://github.com/PolicyEngine/uk-autumn-budget-dashboard-2026/blob/637bb26c34264e0491ed182c363df751466458ed/data_inputs/treasury/sources/AB2026-T6.1.csv).
- [National calculator definitions](https://github.com/PolicyEngine/uk-autumn-budget-dashboard-2026/blob/637bb26c34264e0491ed182c363df751466458ed/src/uk_budget_data/calculators.py).

The other four source CSVs are not copied because the article does not use them; their hashes remain in the original receipt and verification summary. This folder supersedes the old combined preview for the property article only. The historical `population-preview/` folder remains unchanged and must not be relabelled as this property-only result.
