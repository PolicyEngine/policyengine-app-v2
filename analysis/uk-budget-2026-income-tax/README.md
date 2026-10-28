# Autumn Budget 2026 income tax explainers

This shared directory supports three standalone posts: the property income rate increase ([PR #1460](https://github.com/PolicyEngine/policyengine-app-v2/pull/1460)), the savings income rate increase ([PR #1466](https://github.com/PolicyEngine/policyengine-app-v2/pull/1466)) and the trading allowance increase ([PR #1463](https://github.com/PolicyEngine/policyengine-app-v2/pull/1463)). Property and savings were split at the author’s request on 28 October 2026; savings remains a separate draft pending its dashboard data release. The articles compare the newly announced measures with the already legislated 2027–28 baseline. The shared `SAVINGS_PROPERTY` reform in `generate_households.py` changes savings and property rates together; it is not a separate property-only reform.

## Reproduce the household calculations

From the repository root, using Python 3.13:

```sh
uv venv --python 3.13 analysis/uk-budget-2026-income-tax/.venv
uv pip install --python analysis/uk-budget-2026-income-tax/.venv/bin/python -r analysis/uk-budget-2026-income-tax/requirements.txt
analysis/uk-budget-2026-income-tax/.venv/bin/python analysis/uk-budget-2026-income-tax/generate_households.py
```

The generator uses hypothetical adults, without population microdata. It records inputs and outputs and checks the results against independent arithmetic. The reform parameters match [dashboard PR #290](https://github.com/PolicyEngine/uk-autumn-budget-dashboard-2026/pull/290) at the immutable commit recorded in `provenance.json`. Both the baseline and reform use the same October 2026 forecast as the [Pension Tax Allowance analysis, PR #1457](https://github.com/PolicyEngine/policyengine-app-v2/pull/1457) (dashboard commit `640426575270224db9b04d6c94d30e264a347be2`). Supplied income amounts remain fixed in 2027–28; the forecast updates statutory and other model parameters. Fixed nominal incomes do not remove the need to use the agreed forecast.

The checked outputs include 23 household comparisons and 93 displayed points across the two income curves. The displayed lines use £100 intervals and the exact policy breakpoints. All four series are independently checked against the model at every £2 from £500 to £5,000, including a comparison of the plotted interpolation with the engine results; `curve-validation.json` records counts and maximum errors. The non-integer £1,333⅓ expense-choice breakpoint is also calculated with the model. To also verify the original dashboard parameter builder, pass `--dashboard-checkout /path/to/checkout` with that checkout at the recorded commit. This check is optional and performs no download.

The `landlord_*` records in `households.json` and `households.csv` support the property article. They have no savings income, so the combined reform's savings rate changes do not affect their results. The example with a £30,000 salary, £6,000 of taxable property profit and no eligible finance costs was checked separately with the property-only reform. The `saver_*` and mixed `property_then_savings_order` records, savings curves, and savings-rate and Treasury row 62 metadata in `provenance.json` remain shared records for savings draft #1466; they are not property-only results.

The savings draft (#1466) reproduces `savings-interest-chart.json`; the trading article (#1463) reproduces `trading-allowance-chart.json`. The property article's native bar chart uses the verified 2027 and 2031 decile means in `property-population/`. Reinsert each chart's contents only into its corresponding article when regenerating it.

## Current article scope

The property draft now includes national revenue and decile averages from the approved property-only snapshot in dashboard PR #290. `property-population/` retains the immutable source record, original receipt, three aggregate CSVs and the verification summary. Reach, poverty and inequality figures are omitted pending separate disclosure clearance. It is an approved branch snapshot, not independently verified as the production deployment. Recheck its identity and figures against the final released dashboard before merging, and have the new article head reviewed.

The savings and trading posts retain household calculations and Treasury costings only. No withdrawn combined national figures have been restored. The `population-preview/` files described below remain historical records; they are not the property-only source now used by the article.

## Dataset decision

Retain the dashboard's adopted `policyengine` 6.11.1 bundle, with UK 2.151.0, core 3.33.3 and national data cut `a6299504`. The certificate, full dataset ID and checksum are recorded in `provenance.json`. The newer candidate in [policyengine.py PR #725](https://github.com/PolicyEngine/policyengine.py/pull/725) is awaiting certification/adoption. A future update must change the package and dataset provenance together and regenerate the analysis.

The household generators need no population microdata. This historical snapshot was retrieved without downloading population microdata. At 14:32 UTC the checked GitHub flat files still lacked these Budget-day measures. The dashboard maintainer subsequently shared a preview with provisional outputs generated at 14:34 UTC, fetched at 14:46 UTC. The analysis records retain its digest-addressed public aggregate outputs as an earlier review snapshot, with the exact manifest, receipts and eight CSVs retained in `population-preview/`. Older candidate charts and stale GitHub flat files must not be relabelled as the announced policy. The preview has no scored combined artifact; its five-measure chart must not be described as a jointly simulated full Budget package.

The provisional national outputs use the exact dataset above with the dashboard's October 2026 OBR forecast wrapper on both baseline and reform. Each provision is scored separately. The source commit is `0d9dccb2`; its reform definitions and October forecast input file match household reference commit `b50787aa` byte for byte. Series not updated by the overlay retain the model's March forecast path; the underlying calibration remains pre-Budget.

Verify the snapshot without downloading microdata or any other files:

```sh
python3 analysis/uk-budget-2026-income-tax/verify_population_preview.py
```

The verifier checks the eight CSV hashes, certified execution identity, dataset checksum, provisional status, disclosure floor and complete decile grids. It writes `population-preview/summary.json`. Both measures are `provisional` and their reconciliation is `awaiting_source`; passing the disclosure floor does not mean final review approval. The snapshots are public aggregates only.

Treasury forecasts are labelled separately. Compare fiscal-year Treasury receipts with the model's annual government-balance effects, documenting behavioural, timing and coverage differences. Do not attribute a particular discrepancy to one of those factors before reconciliation. No separate winner/loser shares or absolute affected-person counts are exported. The field `people_affected` is a percentage, using an absolute household-income-change threshold of more than 0.01%, not millions of people or a taxpayer count.

## Checks before publication

- Recheck the property draft's `property-population/` artifact identity, figures and comparison flags against the final released dashboard. The new population section needs review at its new head. Restore national scope in the other posts only from their own reconciled sources. Add absolute affected-person counts and separate winner/loser shares only when the producer exports those quantities; do not infer them from average changes or the affected percentage.
- Confirm the treatment of Scottish landlords' finance-cost relief against the final Budget implementation. The pinned model links that relief to the UK property basic rate even for Scotland.
- Check trading allowance coverage: gross receipts and actual expenses are needed to model the deduction choice; the pinned model does not apply the allowance to its separate miscellaneous-income input.
- Verify the final public dashboard link and add links to these explainers within the dashboard. The source checkout's README supplies the current Vercel dashboard URL.
- Have the policy interpretation and calculations reviewed before merging. Draft status and publication approval are tracked on each article’s PR.

The three articles use the site's native tables, chart blocks and cover assets. Household curves use the shared numeric line renderer from [PR #1462](https://github.com/PolicyEngine/policyengine-app-v2/pull/1462); no duplicate chart implementation or country-model code is added.

## Validation on 28 October 2026

`make format`, `make lint`, `make typecheck` and `make test` passed. The tests ran on Node 26.12.1: 6,042 app tests and 508 website tests passed, with 10 app tests skipped by the existing suite. After inserting the final chart data, the chart-parser and post-metadata checks passed again (18 tests). All 23 household comparisons and 20 curve points passed independent arithmetic checks.

The earlier addition of provisional national sections passed snapshot verification and article/chart checks; those sections have since been removed pending the final run. Browser access to the local preview was declined, so visual preview remains outstanding. The SVG cover XML and native chart specs were validated, but this does not confirm page layout at desktop or mobile widths.


## Additional trading and calculator examples

```sh
analysis/uk-budget-2026-income-tax/.venv/bin/python analysis/uk-budget-2026-income-tax/generate_trading_extensions.py
```

This checks five additional synthetic pairs requested in the [trading allowance review](https://github.com/PolicyEngine/policyengine-app-v2/pull/1460#issuecomment-6472758764), including UC, Class 4 and missing-receipts fallbacks, on the same pinned October forecast as the main generator. `trading_extensions.json` records complete inputs, raw outputs and arithmetic checks. `dashboard_salary_comparison.json` records the calculator's March-index salary comparison. Household examples use no population data. Shared analysis is kept in the property base PR #1460 so the trading article can be reviewed in a separate stacked PR. The savings article is a separate draft PR based on main; its shared-analysis link resolves after #1460 lands.

## Alignment with the Pension Tax Allowance analysis

The exact forecast input is retained as `obr_october_2026.json`; `forecast.py` verifies its Git blob before use and reconstructs the source’s rounded fuel-duty path. Its complete eight-path parameter mapping was checked for exact equality with the immutable dashboard source’s `with_forecast(None).parameter_changes`. Both synthetic generators pass that mapping to `pe.uk.calculate_household`. The savings/property generator uses the combined savings and property reform; its savings changes have no effect on the landlord records because those households have no savings income. The trading generator uses the trading allowance reform. There is no population data load to precede, and no other Budget measure is activated.

The Pension Tax Allowance analysis uses £100 chart sampling plus the true breakpoints and verifies the results on a denser model grid. These drafts follow that method: numeric income axes, explicit £ formats, named threshold markers and independent validation at every £2. Reader-facing tables use whole pounds under the [rounding review](https://github.com/PolicyEngine/policyengine-app-v2/pull/1460#issuecomment-6473972686); raw analysis retains precision.

The household forecast pin and population forecast pins are recorded separately. Applying the household overlay does not regenerate or validate the historical combined national snapshot. The property article now uses a separate approved property-only source with execution-bound provenance in `property-population/`; the historical combined preview remains superseded.

The October-forecast rerun passed all 23 household comparisons and all 5 trading extension pairs. All policy deltas remain unchanged. Some absolute levels change: the three Scottish cases’ income-tax levels fall by £2.93 on both sides, and the parent’s total benefits/net income rise by about £20.10 on both sides. These do not change the article’s reported tax or household gains. The 93 displayed chart points passed 18,008 model-liability comparisons and 9,004 interpolation comparisons over 2,251 income points per series. The largest interpolation difference is £0.0033, below the £0.01 tolerance.

## Editorial cover images

The posts use original teal editorial illustrations generated with the built-in image tool. Property and savings reuse the original combined-draft cover unchanged under their own asset paths. `cover-prompts.json` records the complete prompts, output paths, encoding settings, dimensions and checksums. The WebP files retain the generated 1672 × 941 pixel dimensions and are selected by each post's `image` metadata, supplying the article hero, research card and social preview. The unused combined-draft SVG cover was removed when the article was split. Article text, charts and calculations are unchanged by the cover update.
