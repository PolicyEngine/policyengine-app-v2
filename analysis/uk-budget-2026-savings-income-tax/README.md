# Savings income tax: supporting analysis

This directory records the calculation and source provenance for the savings income tax article. The article contains hypothetical household examples and the government's costing. It contains no PolicyEngine population estimates.

## Household examples and chart

The [shared analysis directory](../uk-budget-2026-income-tax/) contains the household inputs, model pins, October 2026 forecast, outputs and every-£2 chart validation. Its `generate_households.py` raises savings and property rates together against the already scheduled 2027–28 rules, using policyengine 6.11.1, UK 2.151.0 and core 3.33.3. The `saver_*` households have no property income, so only the savings rate change affects them. The mixed `property_then_savings_order` example reports the change in savings income tax alone; it does not report the combined reform's change in total income tax.

The article's chart data, series and markers match `savings-interest-chart.json`. Its source label uses “hypothetical” consistently with the text. The chart and displayed household amounts have not been recalculated for the editorial update.

## Government costing

The primary source is the OBR's [October 2026 detailed policy table](https://obr.uk/download/october-2026-economic-and-fiscal-outlook-detailed-forecast-tables-zip-file/): `efo-october-2026-detailed-forecast-tables-policy.xlsx`, sheet `1.1`, measure 62, rows 304–306, SHA256 `cdcc2a06b100241bf3010bd159a4e5d43daef2348a3850797b1e88a308fd45fd`.

For 2026–27 through 2031–32, its income tax line is 0, 63, 483, 443, 475 and 510, and its “Onshore CT” line is 13, 63, 74, 78, 80 and 81 (£ million). The independently rounded Budget Table 6.1 totals are 15, 125, 555, 520, 555 and 590. The article labels the lines separately and shows the Budget total for context.

These official costings are separate from the household calculations. Neither the household outputs nor fixed-weight data sensitivities establish a corrected national savings estimate.

## Cover

`cover-provenance.json` records the original generated illustration, also retained under the property article's asset path. The savings copy has its own metadata/asset path and the same unchanged image checksum.
