# Autumn Budget 2026 income tax explainers

This directory supports two standalone posts: the combined savings/property rate increase and the trading allowance increase. The articles compare the newly announced measures with the already legislated 2027–28 baseline, one measure at a time.

## Reproduce the household calculations

From the repository root, using Python 3.13:

```sh
uv venv --python 3.13 analysis/uk-budget-2026-income-tax/.venv
uv pip install --python analysis/uk-budget-2026-income-tax/.venv/bin/python -r analysis/uk-budget-2026-income-tax/requirements.txt
analysis/uk-budget-2026-income-tax/.venv/bin/python analysis/uk-budget-2026-income-tax/generate_households.py
```

The generator uses hypothetical adults, without population microdata. It records inputs and outputs and checks the results against independent arithmetic. The reform parameters match dashboard PR290 at the immutable commit recorded in `provenance.json`. Fixed nominal household incomes do not require population forecast uprating.

The checked outputs include 23 household comparisons and 20 points across the two income curves. To also verify the original dashboard parameter builder, pass `--dashboard-checkout /path/to/checkout` with that checkout at the recorded commit. This check is optional and performs no download.

The article chart blocks reproduce `savings-interest-chart.json` and `trading-allowance-chart.json`. Reinsert their contents when regenerating them.

## Dataset decision

Retain the dashboard's adopted `policyengine` 6.11.1 bundle, with UK 2.151.0, core 3.33.3 and national data cut `a6299504`. The certificate, full dataset ID and checksum are recorded in `provenance.json`. The newer candidate in policyengine.py PR725 is awaiting certification/adoption. A future update must change the package and dataset provenance together and regenerate the analysis.

No population microdata were available for this draft. It contains no PolicyEngine national estimates, decile results or affected-person counts. Treasury forecasts are labelled separately and are not a substitute for those calculations. The publicly committed dashboard results checked on 28 October did not yet include these two Budget-day measures; older candidate savings/property charts must not be relabelled as the announced policy.

When access and certified Budget-day outputs are available, use the national dataset above and the dashboard's October 2026 OBR forecast wrapper on both baseline and reform. Score each provision separately. Reconcile fiscal-year Treasury receipts with modelled tax-year liabilities, documenting behavioural and timing differences. Retain survey confidentiality; publish aggregates only.

## Checks before publication

- Add the outstanding national revenue, affected-person and decile results requested in the team brief, with provenance and model-coverage limits.
- Confirm the treatment of Scottish landlords' finance-cost relief against the final Budget implementation. The pinned model links that relief to the UK property basic rate even for Scotland.
- Check trading allowance coverage: gross receipts and actual expenses are needed to model the deduction choice; the pinned model does not apply the allowance to its separate miscellaneous-income input.
- Verify the final public dashboard link and add links to these explainers within the dashboard. The source checkout's README supplies the current Vercel dashboard URL.
- Have the policy interpretation and calculations reviewed before merging. This branch is a draft and is not publication approval.

The two articles use the site's native chart blocks and cover assets. No runtime application or country-model code is changed.

## Validation on 28 October 2026

`make format`, `make lint`, `make typecheck` and `make test` passed. The tests ran on Node 26.12.1: 6,042 app tests and 508 website tests passed, with 10 app tests skipped by the existing suite. After inserting the final chart data, the chart-parser and post-metadata checks passed again (18 tests). All 23 household comparisons and 20 curve points passed independent arithmetic checks.

Browser access to the local preview was declined, so visual preview remains outstanding. The SVG cover XML and native chart specs were validated, but this does not confirm page layout at desktop or mobile widths.
