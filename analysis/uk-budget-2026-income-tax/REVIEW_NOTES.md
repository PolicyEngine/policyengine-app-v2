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

Pavel's [Pension Tax Allowance draft, #1457](https://github.com/PolicyEngine/policyengine-app-v2/pull/1457), and [fuel-duty draft, #1459](https://github.com/PolicyEngine/policyengine-app-v2/pull/1459), informed the calculation-first presentation, explicit assumptions and separation of Treasury costings from model results. They were read as comparative examples, not formally approved by this review. The earlier drafts used native bar charts. The current alignment reuses their shared numeric line renderer from PR1462 for the household curves.


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


## Latest review follow-ups and PR split

- Savings/property remains draft PR1460. Trading is separate draft PR1463, stacked on1460 for shared analysis. Both link to dashboard292, and the dashboard cross-reference links both articles.
- Max confirmed the savings/property revision at5a70185a in comment6473557134 and withdrew the48% inference. The two remaining requests were precise paragraph citations and final component exports.
- Official Budget PDF physical page142 was checked for paragraphs6.246/6.247 and6.254; physical45 contains paragraph2.50. These are now the rule citations.
- Max's newer trading comment on1463,6473574155, agrees to omit the unsupported260,000 count and£71m sensitivity; the latter ignores the shared allowance. Those figures remain excluded.
- Per that follow-up, only the mutually reproduced£180 UC example is retained in the article. The£1,500 diagnostic pair remains in the raw analysis record, with both input sets distinguished, rather than presented as an explained cross-run comparison.
- The trading lead example is named Alex and remains first: age35, salary30k, receipts4k, costs500, tax reduction400. UC and full-time self-employment are additional examples.
- A fresh complete pass covered all five Max conversation comments on1460 and the follow-up on1463, including edits through15:45:19UTC. Both PRs had no inline review threads or submitted reviews in that pass.


## Rounding correction at 16:01 UTC

Max's latest comments on PR1460 (6473972686) and PR1463 (6473966614) supersede the earlier permission to retain pence in worked tables. Reader-facing tables now use whole pounds throughout; pence are permitted only in prose spelling out a formula. Exact model outputs and hashed source files retain their original precision. The rounded band-crossing components still sum to£8,582/£8,732, and the rounded sole-trader totals remain£1,672/£1,152, a£520 change.

The dashboard now defines property and savings as separate measures. The article can continue to analyse them together, but a new measure definition is not a substitute for published execution-bound component outputs. The old first-estimate snapshot remains identified by its original measure IDs until replacement data are verified.


## Live-source check at16:04UTC

Preview manifest revision15 (updated16:01:00Z) has no property_income_rates_up or savings_income_rates_up artifacts yet. The old combined result is withdrawn because the measure was split; its archived snapshot remains in the analysis records. A newer trading artifact71f8a26e4f547021 is provisional and failed reconciliation. It uses the same certifieda6299504 dataset and detailed October forecasts, but its source still excludes the council-tax update. Neither it nor Max's rounded internal component figures has replaced the saved first-estimate data.

The drafts now explicitly flag the older national snapshot as awaiting replacement. These national sections must not be treated as current approved dashboard outputs or published until replacement execution-bound results are reconciled. Household calculations and their input/output records are unchanged.

## Alignment with Pavel’s current PTA draft

The user requested the same methodology and styling as Pavel’s PTA PR1457. The reference was read at head `d282ef870176c81feb87175d02584121bdc50197`, whose chart dependency is PR1462. The main article structure follows rules, household examples and curves, population impacts, assumptions and limitations, then methodology. The shared numeric line renderer is reused rather than copied.

Both synthetic generators now apply the exact October forecast used by that PTA revision (dashboard commit `640426575270224db9b04d6c94d30e264a347be2`) to the baseline and the isolated reform. Previously the synthetic examples held incomes fixed but retained the model’s March parameter forecast. These are distinct choices: the inputs still stay fixed, while projected model parameters now use the common October overlay. The forecast’s original JSON is saved and hash-checked, and the complete eight-path parameter mapping was compared with the original source’s `with_forecast(None)` for exact equality. The archived national results are not regenerated or relabelled by this household change.

Charts now show numeric axes, £ formatting and named allowance thresholds using Pavel’s PR1462 renderer. Display points include every £100 plus exact breakpoints, including the 75%-expense choice at £1,333⅓ of trading receipts. Both tax scenarios are independently checked against arithmetic at every £2, and linear interpolation of the displayed data is compared with the model changes to a one-penny tolerance. Counts and measured maximum errors are saved in `curve-validation.json`. Max’s latest instruction to use whole pounds in all reader-facing tables remains in force.

Manifest revision17, updated16:09:01.451619UTC, publishes separate property (`3537bd303ac226cf`) and savings (`af6aaaee33f616ee`) artifacts, but both are provisional and fail reconciliation, as does the newer trading artifact. No replacement is adopted. Max’s16:10 webinar guidance is to use available dashboard figures and say other figures are “still being checked”; the saved older estimates are not cleared for spoken or published headline results by that message.

The rerun completed at16:18:33UTC with all23 main household comparisons and all5 trading extension pairs passing. Every policy delta is unchanged. The Scottish income-tax levels change by−£2.93 in baseline and reform, while the UC parent’s total benefits and net income change by about+£20.10 in both; these level changes are retained in raw outputs. UC levels and the£180 and£520 article examples are unchanged. The generated curves contain46 savings points and47 trading points. At2,251 income points per series,18,008 liability comparisons and9,004 chart-interpolation comparisons pass; the maximum interpolation error is£0.0033, below the one-penny tolerance. Both generated line specs are ready to insert into the separate articles. Python compilation and diff-whitespace checks also passed. No population outputs or source artifacts were changed.


### PTA presentation alignment validation

Both posts now use the shared line-chart renderer from app-v2 PR1462, the same dependency as Pavel's PTA PR1457. The savings/property PR is stacked on `pavel/blog-line-chart`; the trading PR remains stacked on the savings/property branch. The posts share rules, household impacts, population impacts, assumptions and limitations, and methodology sections. All reader tables use whole pounds.

The line renderer, bar renderer, article-chart parser and post metadata checks passed (51 tests); website ESLint and TypeScript checks passed. No CI monitoring was performed. The 23 household cases, five extension pairs and dense curve checks passed on the pinned October forecast. Browser approval declined the public dashboard preview origin, so its rendered policy tab and the final visual layout were not verified in this pass. No alternative access to that blocked origin was attempted.

Max's 16:18:54 UTC webinar update asks authors to introduce each measure for 30–60 seconds: say what it does and who it reaches, leaving costings to the dashboard. Q&A should use displayed dashboard figures and describe missing figures as still being checked. The archived national figures in these draft articles are not webinar-approved estimates.
