# Autumn Budget 2026 savings income tax draft

This PR separates the savings article from property PR #1460. It remains a draft until the savings measure is included in the dashboard and its national data review is complete. It contains verified synthetic household calculations and separately labelled Treasury costings, with no PolicyEngine population estimates.

Shared calculation inputs, model pins, forecast helper and every-£2 chart validation are retained in [the shared analysis directory](https://github.com/PolicyEngine/policyengine-app-v2/tree/main/analysis/uk-budget-2026-income-tax), introduced by property PR #1460. The savings chart block is unchanged from `savings-interest-chart.json`; the split introduces no new tax calculation or population run. This PR can be rebased or merged with main after #1460 lands, preserving its independent article scope.

`cover-provenance.json` records the existing combined-draft illustration reused unchanged for this draft. The post metadata points at its own asset path. No new image generation or chart rendering is implied.

The updated national reconciliation is being investigated separately. Review evidence is in [dashboard PR #296, comment 6476334141](https://github.com/PolicyEngine/uk-autumn-budget-dashboard-2026/pull/296#issuecomment-6476334141); that review is not incorporated as a new scored result in this draft.
