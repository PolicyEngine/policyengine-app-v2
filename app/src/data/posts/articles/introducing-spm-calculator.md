Every SPM poverty rate starts with a threshold: the amount a family of a given size and housing situation needs, in its part of the country, in a given year. Census publishes the rates each September. BLS publishes the national thresholds a few weeks earlier, and the local adjustments arrive with the microdata. Anyone who wants a threshold for a year Census has not reached yet has had to guess.

[spm-calculator 1.0](https://pypi.org/project/spm-calculator/1.0.0/) is our answer to that. It computes a Supplemental Poverty Measure threshold for any family composition, housing tenure, and metro or nonmetro area, for 2022 through 2035. Through 2025 it uses the published BLS values. Beyond that it projects them by the method BLS and Census use, advancing the same data windows they advance. The [calculator app](https://policyengine.org/us/spm-calculator) runs the same artifact in the browser.

## What a threshold is made of

BLS sets the national threshold for a reference family of two adults and two children from five years of Consumer Expenditure Survey data. It takes families between the 47th and 53rd percentiles of spending on food, clothing, shelter, utilities, telephone and internet, multiplies that spending by 1.2, swaps the sample's average shelter and utilities for the tenure group's own, and takes 82 percent of the result. The 2025 renter threshold is $41,700.56; owners with a mortgage $41,322.71; owners without $34,326.00. Census then scales for family size with the three-parameter equivalence scale and adjusts the housing share by a local rent index built from five years of American Community Survey rents.

The calculator carries each of those pieces separately, with its own status. A 2025 national threshold is published. A 2025 local threshold combines that published base with a rent index the calculator models, because Census had not published 2025 geography by the artifact's information date of September 9, 2026. The result tells you which is which.

## Forecasting by moving the window, not the price level

The usual way to extend a threshold is to age it with the CPI. That assumes real spending near the poverty line stays flat and that the estimation window stands still. Neither holds. BLS's 2025 thresholds rose 4.4 to 6.3 percent over 2024, against 2.6 percent CPI-U inflation, because the five-year window dropped 2019 spending and picked up 2024.

spm-calculator projects a future year by projecting the observations the window would contain: each missing CE quarter borrows the latest observed quarter of the same season, scaled by a price path and a real-spending assumption. Two scenarios ship in the artifact. `ce_trend` carries forward half of the fitted real-spending trend; `zero_real` holds real spending at the anchor. Missing ACS rent years copy the 2024 cohort at zero real rent growth under both scenarios, so local factors change only as the five-year window turns over. The price path is CBO's February 2026 CPI-U forecast, pinned by hash.

We tested the method before we relied on it. On August 7 we [committed](https://spm-threshold-paper.vercel.app/) a 2025 threshold nowcast with a timestamp proof. BLS published the actual 2025 thresholds on August 24. Across the three tenures the amended nowcast's mean absolute error was 1.17 percent, and the original nowcast's 0.98 percent; CPI-U aging would have been 2.58 percent. Renters were the miss, at 2.27 percent low. The retrospective 2020 to 2024 backtest is in the [paper](https://spm-threshold-paper.vercel.app/).

## What changed from the old package

Two corrections, both ours to own. In July, BLS found errors in its own threshold code and reissued 2019 to 2024 thresholds; the calculator now uses the corrected series at full spreadsheet precision, and keeps the pre-correction series for reproducing older statistics. Benchmarking our replication against both series also surfaced errors in the package's earlier hand-entered thresholds, as large as 5.8 percent for 2019 renters, and four bugs in our replication code. The [correction record](https://policyengine-docs.vercel.app/spm-calculator/bls-2026-correction) lists each one.

The app also lost options. Earlier versions offered county and congressional-district thresholds computed from local rents. Census estimates rents only for metro areas, combined smaller-metro residuals and nonmetro residuals by state, so those finer geographies implied a precision the method does not have. The app now offers the 341 estimation areas Census uses, plus eight nonmetro residuals the calculator models where Census publishes none, and a county is a lookup into that menu.

## What it does not do

The calculator computes thresholds. It does not compute resources, so it does not produce a poverty rate; that is the job of the tax and benefit model, and our [prediction for Tuesday's 2025 rate](/us/research/2025-spm-poverty-prediction) explains how the two fit together. It validates against BLS's published cells rather than replicating BLS's code. Its forecasts are conditional on the CBO price path and on real spending following one of the two scenarios, and every projected number carries that label.

## Using it

```bash
uv add spm-calculator
```

```python
from spm_calculator import SPMUnit, load_forecast

forecast = load_forecast()
result = forecast.calculate_unit(
    SPMUnit("example", num_adults=2, num_children=2, tenure="renter",
            year=2025, geography_kind="national")
)
result["threshold"]  # 41700.555713
```

The package works offline from bundled inputs. Documentation is at [policyengine-docs.vercel.app/spm-calculator](https://policyengine-docs.vercel.app/spm-calculator/), the code at [github.com/PolicyEngine/spm-calculator](https://github.com/PolicyEngine/spm-calculator), and the artifact's content hash is printed with every result so a number can be traced to the exact inputs that produced it.
