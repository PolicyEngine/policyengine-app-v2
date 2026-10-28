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

No population microdata were downloaded locally. At 14:32 UTC the checked GitHub flat files still lacked these Budget-day measures. Vahid subsequently shared a preview with provisional outputs generated at 14:34 UTC, fetched at 14:46 UTC. The drafts now reuse its digest-addressed public aggregate outputs, with the exact manifest, receipts and eight CSVs retained in `population-preview/`. Older candidate charts and stale GitHub flat files must not be relabelled as the announced policy. The preview has no scored combined artifact; its five-measure chart must not be described as a jointly simulated full Budget package.

The provisional national outputs use the exact dataset above with the dashboard's October 2026 OBR forecast wrapper on both baseline and reform. Each provision is scored separately. The source commit is `0d9dccb2`; its reform definitions and October forecast input file match household reference commit `b50787aa` byte for byte. Series not updated by the overlay retain the model's March forecast path; the underlying calibration remains pre-Budget.

Verify the snapshot without downloading microdata or any other files:

```sh
python3 analysis/uk-budget-2026-income-tax/verify_population_preview.py
```

The verifier checks the eight CSV hashes, certified execution identity, dataset checksum, provisional status, disclosure floor and complete decile grids. It writes `population-preview/summary.json`. Both measures are `provisional` and their reconciliation is `awaiting_source`; passing the disclosure floor does not mean final review approval. The snapshots are public aggregates only.

Treasury forecasts are labelled separately. Compare fiscal-year Treasury receipts with the model's annual government-balance effects, documenting behavioural, timing and coverage differences. Do not attribute a particular discrepancy to one of those factors before reconciliation. No separate winner/loser shares or absolute affected-person counts are exported. The field `people_affected` is a percentage, using an absolute household-income-change threshold of more than 0.01%, not millions of people or a taxpayer count.

## Checks before publication

- Replace or confirm the provisional national revenue and decile results after final reconciliation. Add absolute affected-person counts and separate winner/loser shares when the producer exports those quantities; do not infer them from average changes or the affected percentage.
- Confirm the treatment of Scottish landlords' finance-cost relief against the final Budget implementation. The pinned model links that relief to the UK property basic rate even for Scotland.
- Check trading allowance coverage: gross receipts and actual expenses are needed to model the deduction choice; the pinned model does not apply the allowance to its separate miscellaneous-income input.
- Verify the final public dashboard link and add links to these explainers within the dashboard. The source checkout's README supplies the current Vercel dashboard URL.
- Have the policy interpretation and calculations reviewed before merging. This branch is a draft and is not publication approval.

The two articles use the site's native chart blocks and cover assets. No runtime application or country-model code is changed.

See `REVIEW_NOTES.md` for the independent draft-readiness check, the comparison with Pavel's posts and the remaining publication work.

## Validation on 28 October 2026

`make format`, `make lint`, `make typecheck` and `make test` passed. The tests ran on Node 26.12.1: 6,042 app tests and 508 website tests passed, with 10 app tests skipped by the existing suite. After inserting the final chart data, the chart-parser and post-metadata checks passed again (18 tests). All 23 household comparisons and 20 curve points passed independent arithmetic checks.

After adding the provisional national sections, snapshot verification and the article/chart checks passed again. Browser access to the local preview was declined, so visual preview remains outstanding. The SVG cover XML and native chart specs were validated, but this does not confirm page layout at desktop or mobile widths.
