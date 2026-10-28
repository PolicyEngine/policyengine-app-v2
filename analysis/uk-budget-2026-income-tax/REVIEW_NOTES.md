# Draft review history and handoff

This file preserves the chronological review history. Earlier sections describe the combined savings/property article and the trading article while both were in PR #1460; their readiness and publication statements are historical, not current approvals.

The articles are now separate: property is [PR #1460](https://github.com/PolicyEngine/policyengine-app-v2/pull/1460), trading is [PR #1463](https://github.com/PolicyEngine/policyengine-app-v2/pull/1463), and savings is [PR #1466](https://github.com/PolicyEngine/policyengine-app-v2/pull/1466). Current readiness and publication status are tracked on each PR. The property article's approved national snapshot is documented in `property-population/README.md`; it supersedes the combined preview for that article only.

## Historical internal readiness check

An independent policy/source reviewer and code/reproducibility reviewer examined commit `7f90092fa6e6f28f68b419c4edf1bef166d851b9` on 28 October 2026. The review was complete for draft readiness, with no confirmed critical or should-address findings and one optional clarity suggestion.

- The policy reviewer checked the official Budget, legislation and HMRC guidance, and visually inspected physical pages 23, 74 and 75 of the Treasury costings. The rates, start dates, allowance rules, Scottish finance-cost relief interpretation and Treasury series were corroborated.
- The code reviewer independently reproduced all 23 hypothetical household comparisons and 20 curve points on the pinned bundle. Numeric outputs, CSVs and chart specifications matched the saved results.
- All eight public aggregate CSV hashes matched their receipts. National fiscal signs, decile averages and affected-population percentage units matched the articles. The saved summary reproduced exactly.
- The 18 chart-parser and post-metadata tests passed on the frozen snapshot using Node 26.12.1. The earlier full suite passed 6,550 tests, with 10 existing skips. CI was not monitored.

The optional suggestion was to name the Treasury's trading-allowance expense-switching response. The follow-up adds that explanation with its physical-page-23 citation. It also adds an explicit savings/property band calculation using the already reproduced `property_then_savings_order` case (£8,582 to £8,732 income tax) and uses the canonical dashboard address shared in the team channel. These are prose and citation changes; model calculations are unchanged. The band table is checked against the saved component and total taxes.

## Historical review scope

- Savings/property: income ordering, the transition between basic and higher bands, and the conditional £80 finance-relief gain for Scottish landlords with £4,000 of fully usable finance costs.
- Trading: the receipts-versus-expenses choice, the separate miscellaneous-income coverage limitation and the population approximation when gross receipts are missing.
- Population: the static-model/Treasury comparison and the interpretation of average changes. The producer's `people_affected` field is a percentage of people in households with an absolute income change above 0.01%; it is not a headcount or a separate winner/loser share.

The source preview remains revision 5, with both entries `provisional` and reconciliation `awaiting_source`. The articles retain those labels. Max's later instruction to call approved outputs “first estimates” is conditional on the checks passing; it is not an approval of this cached snapshot.

## Historical publication checklist

- Complete reconciliation and confirm or replace the provisional population snapshot.
- Obtain absolute affected-person counts and separate winner/loser shares when available; preserve disclosure controls.
- Resolve or retain explicit limits for missing trading receipts/expenses and miscellaneous income.
- Complete desktop/mobile visual preview and final editorial review. Browser preview was not verified during this work.
- Link the standalone articles from the dashboard.

## Related team work

The [Pension Tax Allowance draft, #1457](https://github.com/PolicyEngine/policyengine-app-v2/pull/1457) and [fuel-duty draft, #1459](https://github.com/PolicyEngine/policyengine-app-v2/pull/1459) informed the calculation-first presentation, explicit assumptions and separation of Treasury costings from model results. They were read as comparative examples, not formally approved by this review. The earlier drafts used native bar charts. The current alignment reuses the shared numeric line renderer from PR #1462 for the household curves.


## Historical follow-up to the editorial reviews

Max's trading review is [comment 6472758764](https://github.com/PolicyEngine/policyengine-app-v2/pull/1460#issuecomment-6472758764); savings/property is [comment 6472939282](https://github.com/PolicyEngine/policyengine-app-v2/pull/1460#issuecomment-6472939282), with calculator alignment in [comment 6473177137](https://github.com/PolicyEngine/policyengine-app-v2/pull/1460#issuecomment-6473177137).

Addressed in the next draft revision:

- Whole-pound prose/summary tables; pence retained in worked calculations and exact source records.
- National headlines; England explicitly named for the mortgaged landlord; government reach figures explained with their different denominators.
- Clearer source citations and reader-facing methods; build-status fields, identifiers and review history retained here and in provenance rather than the article text.
- The UC parent and full-time sole trader are reproduced by `generate_trading_extensions.py`: five pairs passed. The £4,000-receipts parent gains £180 after £220 of UC withdrawal; the sole trader gains £520 including £120 Class 4.
- For the specified £18,000-wage parent at £1,500 receipts, the gain is £45 (tax −£100, UC −£55). Max's £79 case needs exact inputs to resolve; it was not copied into the article.
- Missing-receipts examples demonstrate £300 instead of £100 of tax relief for the small trader, and £0 instead of £520 of tax/NI savings for the sole trader.
- The calculator salary comparison is recorded in `dashboard_salary_comparison.json`: the pinned March earnings index grows a £45,000 2026 salary to about £46,080 in 2027; taxes round to £9,014/£9,164, change £150. The article's fixed 2027 salary remains £45,000, taxes £8,582/£8,732. No finance-cost calculator input exists.
- Companion household-preset work is dashboard [PR #292](https://github.com/PolicyEngine/uk-autumn-budget-dashboard-2026/pull/292). At checked head `65ea750a`, the £45k/£6k/£2k recommendation had not yet replaced its older preset. No unsupported preset deep link is used.

Still needed before publication:

- Final population regeneration, with a component CSV/receipt binding the exact dataset bytes and updated forecast. Max's earlier ad32af7f run reproduces the saved first estimates but does not supply those component artifacts. His later correction on dashboard #290 calls for detailed October forecast tables and council tax in the final regeneration. The dataset pin has not changed automatically.
- Weighted tax/benefit totals and household counts by decile. Person-weighted deciles with household-weighted cash means do not justify dividing one mean by the sum of means to claim a 48% revenue share.
- A bottom-decile income-source breakdown explaining its higher average loss; no cause has been inferred.
- Max's internal 260,000-person income-tax count and £71m miscellaneous-income sensitivity need scripts/aggregate receipts, output definitions and unique source-household support. The latter also needs a single shared trading/miscellaneous allowance and explicit eligibility/expense assumptions; it is not treated as a proven upper bound. These numbers are not added as reproduced results.
- Replace preview artifact links when verified public artifacts exist; complete visual preview and editorial review.

At this historical revision, the articles remained drafts. Publication approval was separate from readiness for agent review. The trading article subsequently moved to its own stacked PR, reusing the shared analysis foundation.


## Historical review follow-ups and first PR split

- At this historical revision, savings/property was draft PR #1460, and trading was separate draft PR #1463, stacked on #1460 for shared analysis. Both linked to dashboard PR #292. Property and savings were split later, as recorded above.
- Max confirmed the savings/property revision at `5a70185a` in comment 6473557134 and withdrew the 48% inference. The two remaining requests were precise paragraph citations and final component exports.
- Official Budget PDF physical page 142 was checked for paragraphs 6.246/6.247 and 6.254; physical page 45 contains paragraph 2.50. These are now the rule citations.
- Max's newer trading comment on #1463, 6473574155, agrees to omit the unsupported 260,000 count and £71m sensitivity; the latter ignores the shared allowance. Those figures remain excluded.
- Per that follow-up, only the mutually reproduced £180 UC example is retained in the article. The £1,500 diagnostic pair remains in the raw analysis record, with both input sets distinguished, rather than presented as an explained cross-run comparison.
- The trading lead example is named Alex and remains first: age 35, salary £30,000, receipts £4,000, costs £500, tax reduction £400. UC and full-time self-employment are additional examples.
- A fresh complete pass covered all five Max conversation comments on #1460 and the follow-up on #1463, including edits through 15:45:19 UTC. Both PRs had no inline review threads or submitted reviews in that pass.


## Rounding correction at 16:01 UTC

Max's latest comments on PR #1460 (6473972686) and PR #1463 (6473966614) supersede the earlier permission to retain pence in worked tables. Reader-facing tables now use whole pounds throughout; pence are permitted only in prose spelling out a formula. Exact model outputs and hashed source files retain their original precision. The rounded band-crossing components still sum to £8,582/£8,732, and the rounded sole-trader totals remain £1,672/£1,152, a £520 change.

At this stage, the dashboard defined property and savings as separate measures while the article still analysed them together. The article was subsequently split. A new measure definition was not a substitute for published execution-bound component outputs. The old first-estimate snapshot remains identified by its original measure IDs until replacement data are verified.


## Historical source check at 16:04 UTC

Preview manifest revision 15 (updated 16:01:00Z) has no property_income_rates_up or savings_income_rates_up artifacts yet. The old combined result is withdrawn because the measure was split; its archived snapshot remains in the analysis records. A newer trading artifact `71f8a26e4f547021` is provisional and failed reconciliation. It uses the same certified `a6299504` dataset and detailed October forecasts, but its source still excludes the council-tax update. Neither it nor Max's rounded internal component figures has replaced the saved first-estimate data.

The drafts now explicitly flag the older national snapshot as awaiting replacement. These national sections must not be treated as current approved dashboard outputs or published until replacement execution-bound results are reconciled. Household calculations and their input/output records are unchanged.

## Historical alignment with the Pension Tax Allowance draft

The user requested the same methodology and styling as the Pension Tax Allowance analysis in PR #1457. The reference was read at head `d282ef870176c81feb87175d02584121bdc50197`, whose chart dependency is PR #1462. The main article structure follows rules, household examples and curves, population impacts, assumptions and limitations, then methodology. The shared numeric line renderer is reused rather than copied.

Both synthetic generators now apply the exact October forecast used by that PTA revision (dashboard commit `640426575270224db9b04d6c94d30e264a347be2`) to the baseline and the isolated reform. Previously the synthetic examples held incomes fixed but retained the model’s March parameter forecast. These are distinct choices: the inputs still stay fixed, while projected model parameters now use the common October overlay. The forecast’s original JSON is saved and hash-checked, and the complete eight-path parameter mapping was compared with the original source’s `with_forecast(None)` for exact equality. The archived national results are not regenerated or relabelled by this household change.

Charts now show numeric axes, £ formatting and named allowance thresholds using the PR #1462 renderer. Display points include every £100 plus exact breakpoints, including the 75%-expense choice at £1,333⅓ of trading receipts. Both tax scenarios are independently checked against arithmetic at every £2, and linear interpolation of the displayed data is compared with the model changes to a one-penny tolerance. Counts and measured maximum errors are saved in `curve-validation.json`. Max’s latest instruction to use whole pounds in all reader-facing tables remains in force.

Manifest revision 17, updated 16:09:01.451619 UTC, publishes separate property (`3537bd303ac226cf`) and savings (`af6aaaee33f616ee`) artifacts, but both are provisional and fail reconciliation, as does the newer trading artifact. No replacement is adopted. The 16:10 webinar guidance is to use available dashboard figures and say other figures are “still being checked”; the saved older estimates are not cleared for spoken or published headline results by that message.

The rerun completed at 16:18:33 UTC with all 23 main household comparisons and all 5 trading extension pairs passing. Every policy delta is unchanged. The Scottish income-tax levels change by −£2.93 in baseline and reform, while the UC parent’s total benefits and net income change by about +£20.10 in both; these level changes are retained in raw outputs. UC levels and the £180 and £520 article examples are unchanged. The generated curves contain 46 savings points and 47 trading points. At 2,251 income points per series, 18,008 liability comparisons and 9,004 chart-interpolation comparisons pass; the maximum interpolation error is £0.0033, below the one-penny tolerance. Both generated line specs are ready to insert into the separate articles. Python compilation and diff-whitespace checks also passed. No population outputs or source artifacts were changed.


### PTA presentation alignment validation

Both posts now use the shared line-chart renderer from app-v2 PR #1462, the same dependency as the Pension Tax Allowance analysis in PR #1457. The savings/property PR is stacked on `pavel/blog-line-chart`; the trading PR remains stacked on the savings/property branch. The posts share rules, household impacts, population impacts, assumptions and limitations, and methodology sections. All reader tables use whole pounds.

The line renderer, bar renderer, article-chart parser and post metadata checks passed (51 tests); website ESLint and TypeScript checks passed. No CI monitoring was performed. The 23 household cases, five extension pairs and dense curve checks passed on the pinned October forecast. Browser approval declined the public dashboard preview origin, so its rendered policy tab and the final visual layout were not verified in this pass. No alternative access to that blocked origin was attempted.

Max's 16:18:54 UTC webinar update asks authors to introduce each measure for 30–60 seconds: say what it does and who it reaches, leaving costings to the dashboard. Q&A should use displayed dashboard figures and describe missing figures as still being checked. The archived national figures in these draft articles are not webinar-approved estimates.


## Historical review comments addressed on 28 October

Historical review record: the combined article's Treasury total and mixed £120 property / £30 savings paragraph described below were superseded by the 28 October 2026 split. Property-only PR #1460 no longer contains those combined figures; savings is a separate draft in #1466. The older combined records remain here for reproducibility, and current publication status is tracked on each PR.

The savings/property article removes the withdrawn combined national snapshot, its model fiscal row, decile table and affected share. Its key figures and national table now contain Treasury costings only, separated into property and savings with the combined official total. The archived data and earlier review records remain here for reproducibility; they are not current article results. This follows the cut-or-match-final-run rule Max applied in trading commits `8751cf29` and `c78cdd60`, without substituting unverified replacement figures.

The mixed-income paragraph now confirms the dashboard's landlord-45k preset and the £120 property plus £30 savings split. It retains the salary-uprating explanation. Canonical dashboard links use www.policyengine.org/uk/autumn-budget-2026, and publication wording holds before and after the production switch. The model's hypothetical households and chart values are unchanged.

The Treasury comparison now cites HMRC's payments-on-account guidance and ONS public-finance methodology section 6.1.2: prior-year instalments, the 31 January 2029 balancing payment and first subsequent-year payment explain why same-year tax liability and early-year receipts require a collection bridge. No fitted cash share or illustrative bridge is published as an independently verified result. Property's timing issue does not establish the source of the savings shortfall. Dashboard review comment 6475368627 recommends marking property 2027–28 and 2028–29 not comparable; its final-regeneration freeze remains separate from these prose edits.

Trading inline comment 4403534071 is implemented: an excluded employer/connected-party payment removes allowance relief for the whole tax year across relevant sources, with spouse or civil partner, connected-partnership and company conditions. Inline comment 4403569478's dashboard-introduction suggestion is also implemented. Primary HMRC/ITTOIA sources were checked. Max's direct edits and all household/table/chart values are retained.

At this historical revision, both PRs remained drafts at the user's request. Implementing those review comments did not grant merge authorization; current status is tracked on each PR.

Validation after these edits and the main-branch metadata merge: make format, make lint, make typecheck and make test passed on Node 26.12.1. App: 6,042 passed / 10 existing skips; website: 529 passed; total 6,571 passed. Existing household-table rows and line-chart JSON compare identically with the previous head. Every main-branch post metadata entry is preserved. No model or generator changes were required, and no CI monitoring was performed.
