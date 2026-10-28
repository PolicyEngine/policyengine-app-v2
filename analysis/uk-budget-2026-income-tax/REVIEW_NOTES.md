# Draft review handoff

Both standalone posts are ready for agent review in draft PR #1460. Publication remains a separate decision.

## Internal readiness check

An independent policy/source reviewer and code/reproducibility reviewer examined commit `7f90092fa6e6f28f68b419c4edf1bef166d851b9` on 28 October 2026. The review was complete for draft readiness, with no confirmed critical or should-address findings and one optional clarity suggestion.

- The policy reviewer checked the official Budget, legislation and HMRC guidance, and visually inspected physical pages 23, 74 and 75 of the Treasury costings. The rates, start dates, allowance rules, Scottish finance-cost relief interpretation and Treasury series were corroborated.
- The code reviewer independently reproduced all 23 hypothetical household comparisons and 20 curve points on the pinned bundle. Numeric outputs, CSVs and chart specifications matched the saved results.
- All eight public aggregate CSV hashes matched their receipts. National fiscal signs, decile averages and affected-population percentage units matched the articles. The saved summary reproduced exactly.
- The 18 chart-parser and post-metadata tests passed on the frozen snapshot using Node 26.12.1. The earlier full suite passed 6,550 tests, with 10 existing skips. CI was not monitored.

The optional suggestion was to name the Treasury's trading-allowance expense-switching response. The follow-up adds that explanation with its physical-page-23 citation. It also adds an explicit savings/property band calculation using the already reproduced `property_then_savings_order` case (£8,582 to £8,732 income tax) and uses the canonical dashboard address shared in the team channel. These are prose and citation changes; model calculations are unchanged. The band table is checked against the saved component and total taxes.

## What to review

- Savings/property: income ordering, the transition between basic and higher bands, and the conditional £80 finance-relief gain for Scottish landlords with £4,000 of fully usable finance costs.
- Trading: the receipts-versus-expenses choice, the separate miscellaneous-income coverage limitation and the population approximation when gross receipts are missing.
- Population: the static-model/Treasury comparison and the interpretation of average changes. The producer's `people_affected` field is a percentage of people in households with an absolute income change above 0.01%; it is not a headcount or a separate winner/loser share.

The source preview remains revision 5, with both entries `provisional` and reconciliation `awaiting_source`. The articles retain those labels. Max's later instruction to call approved outputs “first estimates” is conditional on the checks passing; it is not an approval of this cached snapshot.

## Before publication

- Complete reconciliation and confirm or replace the provisional population snapshot.
- Obtain absolute affected-person counts and separate winner/loser shares when available; preserve disclosure controls.
- Resolve or retain explicit limits for missing trading receipts/expenses and miscellaneous income.
- Complete desktop/mobile visual preview and final editorial review. Browser preview was not verified during this work.
- Link the standalone articles from the dashboard.

## Related team work

Pavel's [Pension Tax Allowance draft, #1457](https://github.com/PolicyEngine/policyengine-app-v2/pull/1457), and [fuel-duty draft, #1459](https://github.com/PolicyEngine/policyengine-app-v2/pull/1459), informed the calculation-first presentation, explicit assumptions and separation of Treasury costings from model results. They were read as comparative examples, not formally approved by this review. Their shared line-chart work is not required by these posts' existing native bar charts.


## Follow-up to Max's reviews

Max's trading review is [comment6472758764](https://github.com/PolicyEngine/policyengine-app-v2/pull/1460#issuecomment-6472758764); savings/property is [comment6472939282](https://github.com/PolicyEngine/policyengine-app-v2/pull/1460#issuecomment-6472939282), with calculator alignment in [comment6473177137](https://github.com/PolicyEngine/policyengine-app-v2/pull/1460#issuecomment-6473177137).

Addressed in the next draft revision:

- Whole-pound prose/summary tables; pence retained in worked calculations and exact source records.
- National headlines; England explicitly named for the mortgaged landlord; government reach figures explained with their different denominators.
- Clearer source citations and reader-facing methods; build-status fields, identifiers and review history retained here and in provenance rather than the article text.
- The UC parent and full-time sole trader are reproduced by `generate_trading_extensions.py`: five pairs passed. The £4,000-receipts parent gains £180 after £220 of UC withdrawal; the sole trader gains £520 including £120 Class4.
- For the specified £18,000-wage parent at £1,500 receipts, the gain is £45 (tax−£100, UC−£55). Max's £79 case needs exact inputs to resolve; it was not copied into the article.
- Missing-receipts examples demonstrate £300 instead of £100 of tax relief for the small trader, and £0 instead of £520 of tax/NI savings for the sole trader.
- The calculator salary comparison is recorded in `dashboard_salary_comparison.json`: the pinned March earnings index grows a £45,000 2026 salary to about £46,080 in2027; taxes round to£9,014/£9,164, change£150. The article's fixed2027salary remains£45,000, taxes£8,582/£8,732. No finance-cost calculator input exists.
- Companion household-preset work is dashboard [PR292](https://github.com/PolicyEngine/uk-autumn-budget-dashboard-2026/pull/292). At checked head65ea750a, the £45k/£6k/£2k recommendation had not yet replaced its older preset. No unsupported preset deep link is used.

Still needed before publication:

- Final population regeneration, with a component CSV/receipt binding the exact dataset bytes and updated forecast. Max's earlier ad32af7f run reproduces the saved first estimates but does not supply those component artifacts. His later correction on dashboard#290 calls for detailed October forecast tables and council tax in the final regeneration. The dataset pin has not changed automatically.
- Weighted tax/benefit totals and household counts by decile. Person-weighted deciles with household-weighted cash means do not justify dividing one mean by the sum of means to claim a48% revenue share.
- A bottom-decile income-source breakdown explaining its higher average loss; no cause has been inferred.
- Max's internal260,000-person income-tax count and£71m miscellaneous-income sensitivity need scripts/aggregate receipts, output definitions and unique source-household support. The latter also needs a single shared trading/miscellaneous allowance and explicit eligibility/expense assumptions; it is not treated as a proven upper bound. These numbers are not added as reproduced results.
- Replace preview artifact links when verified public artifacts exist; complete visual preview and editorial review.

The articles remain drafts. Publication approval is separate from readiness for agent review. The trading article will have its own stacked PR, reusing this shared analysis foundation.
