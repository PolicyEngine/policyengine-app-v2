> **Updated 28 October 2026.** We first published this post earlier on 28 October with an estimated average saving across 50,000 simulated paths of prices and earnings, £11.1 billion in 2039-40, and a range around it. The same day, the model behind those paths failed a test we had registered before the Budget ([uk-triple-lock#45](https://github.com/PolicyEngine/uk-triple-lock/pull/45)). We have withdrawn the average and the range around it, and this version reports scenarios instead. We no longer describe any of the model's paths as typical or likely, and we are updating our dashboard to match.
>
> Every PolicyEngine figure below comes from the pre-Budget release of our [Triple Lock dashboard](https://www.policyengine.org/uk/triple-lock), finished on 15 October, before September's inflation figure (21 October) and the Budget's forecast (28 October) were published. It uses the Office for Budget Responsibility's (OBR) March 2026 forecast, PolicyEngine UK 2.125.1 and the Enhanced Family Resources Survey 2024-25. Our other Budget posts use PolicyEngine UK 2.151.0 and the OBR's October 2026 forecast. We are rebuilding the dashboard with PolicyEngine UK 2.151.0, the Microcosm UK dataset, and the OBR's October 2026 forecast to 2030 with its March 2026 long-term assumptions after that, and its figures may change.

Each April, the State Pension rises by the highest of inflation, earnings growth and 2.5%. This rule is the Triple Lock. The [Budget](https://www.gov.uk/government/publications/budget-2026-document/budget-2026-html#box-5atriple-lock-adjustment175) on 28 October 2026 keeps it until April 2029 and adjusts it from April 2030. Earnings growth stops being a minimum rise, and the pension instead keeps its April 2029 value relative to earnings. In the Budget's words, from April 2030 "the State Pension rises each year by the highest of 2.5%, inflation, or the amount required to maintain its value relative to earnings as reached in April 2029."

The Department for Work and Pensions (DWP) estimates in its [State Pension uprating analysis](https://www.gov.uk/government/publications/state-pension-uprating-analysis-2026/state-pension-uprating) that this adjusted Triple Lock cuts State Pension spending by £15 billion in 2039-40 and £50 billion in 2049-50. These are cash figures for Great Britain and cover direct spending only, before any effect on tax or debt interest. The government says the savings will help build a National Care Service in England that gives older people personal care free at the point of use. Prime Minister Andy Burnham announced the change at Labour's conference on 29 September ([BBC](https://www.bbc.co.uk/news/live/c6x2zrv774gvt?post=asset%3A6edb0175-f1b7-407f-a5b7-96e02dfa03ec#post)).[^name]

Key findings for 2039-40, the first of the two years DWP costs (pre-Budget estimates, UK, cash terms):

- The saving depends on how often inflation or 2.5% exceeds earnings growth after 2030. On the OBR's March 2026 central path, earnings growth comes out highest every year from April 2032, and the adjusted Triple Lock saves £0.9 billion. If the Triple Lock instead raises the pension 0.6 percentage points a year faster than earnings, as the OBR assumes in its long-term projections, it saves £10.3 billion.
- After the lower pension reduces income tax and raises means-tested benefits, the two savings are £0.6 billion and £7.3 billion.
- For Great Britain, the area DWP covers, our two figures are £0.8 billion and £10.0 billion, against DWP's £15 billion. Our survey counts 15% less State Pension in payment than DWP does, and DWP does not publish the path of prices and earnings behind its estimate.
- Under the OBR's long-term assumption, the full new State Pension is £865 a year lower than under the Triple Lock, and 27% of UK households have less income: nearly nine in ten of the households with someone over State Pension age.
- Had the adjusted Triple Lock started in April 2017, the full new State Pension would be £653 a year lower in 2026-27, 5.2% below the amount paid.

[Explore the dashboard](https://www.policyengine.org/uk/triple-lock) | [Read the code](https://github.com/PolicyEngine/uk-triple-lock)

## How the Triple Lock works

Each April, the Triple Lock raises the basic and new State Pension by the highest of three figures:

| Figure          | What it measures                                                                | For the April 2026 rise |
| --------------- | ------------------------------------------------------------------------------- | ----------------------- |
| Inflation       | The consumer price index (CPI) in the year to the previous September            | 3.8%                    |
| Earnings growth | Average weekly earnings over May to July, against the same months a year before | 4.8%                    |
| Floor           | A fixed minimum                                                                 | 2.5%                    |

In April 2026, earnings growth was the highest of the three, so the full new State Pension rose 4.8%, to £12,548 a year.

Because the rise always matches or exceeds earnings growth, the pension never falls behind earnings. In a year when inflation or 2.5% exceeds earnings growth, it rises faster than earnings, and every later rise builds on that higher level. The Budget calls this the "ratchet" effect, "whereby the State Pension rises ever higher relative to earnings."

## What changes in April 2030

|                              | Triple Lock (to April 2029) | Adjusted Triple Lock (from April 2030)    |
| ---------------------------- | --------------------------- | ----------------------------------------- |
| Inflation                    | Minimum rise                | Minimum rise                              |
| 2.5%                         | Minimum rise                | Minimum rise                              |
| Earnings growth              | Minimum rise                | Not a minimum rise                        |
| Floor on the pension's level | None                        | Its April 2029 value relative to earnings |

The adjusted Triple Lock keeps inflation and 2.5% as minimum rises. It replaces earnings growth with a floor: each year's rise must keep the pension at or above its April 2029 value relative to earnings.

In a year when inflation or 2.5% exceeds earnings growth, both rules pay it, and the pension rises above its floor. The rules part in the years after. When earnings growth is highest, the Triple Lock pays it, while the adjusted Triple Lock pays the higher of inflation and 2.5%. If that would leave the pension below its floor, it pays just enough to reach the floor. Once the pension is back at its floor, it rises with earnings, or as the Budget puts it, "the State Pension will track earnings over time."

The Budget and DWP's [Triple Lock reform factsheet](https://www.gov.uk/government/publications/state-pension-uprating-analysis-2026/triple-lock-reform-factsheet), updated 6 October, do not name the CPI month or the earnings measure. We assume the adjusted Triple Lock uses the ones the Triple Lock uses now: September CPI and May to July growth in average weekly earnings. We also assume that "its value relative to earnings as reached in April 2029" means the pension's level in 2029-30, the year that starts that April. The OBR reads it the same way, as the value "relative to earnings at 2029-30 levels" (paragraph 3.49 of its [October 2026 Economic and fiscal outlook](https://www.gov.uk/government/publications/october-2026-economic-and-fiscal-outlook)).

### Both rules over the last ten years

To see the two rules at work, we replay today's rules on the ONS figures published in September 2026 for April 2017 to April 2026. We assume the adjusted Triple Lock started in April 2017 and protected the pension's April 2016 value relative to earnings.

| April | Inflation | Earnings growth | Triple Lock | Adjusted Triple Lock |
| ----- | --------- | --------------- | ----------- | -------------------- |
| 2017  | 1.0%      | 2.5%            | 2.5%        | 2.5%                 |
| 2018  | 3.0%      | 2.2%            | 3.0%        | 3.0%                 |
| 2019  | 2.4%      | 2.7%            | 2.7%        | 2.5%                 |
| 2020  | 1.7%      | 4.0%            | 4.0%        | 3.4%                 |
| 2021  | 0.5%      | −0.9%           | 2.5%        | 2.5%                 |
| 2022  | 3.1%      | 8.4%\*          | 3.1%        | 3.1%                 |
| 2023  | 10.1%     | 5.5%            | 10.1%       | 10.1%                |
| 2024  | 6.7%      | 8.5%            | 8.5%        | 6.7%                 |
| 2025  | 1.7%      | 4.4%            | 4.4%        | 2.5%                 |
| 2026  | 3.8%      | 4.9%            | 4.9%        | 3.8%                 |

\*Parliament suspended the earnings link for April 2022, so the replay uses inflation in place of earnings growth that year, for both rules and for the floor. Some rises differ from those paid, because ONS has revised its earnings figures since the rises were set: on these figures April 2025's rise is 4.4% and April 2026's 4.9%, while the rises paid were 4.1% and 4.8%. The figures are in the [replay's input file](https://github.com/PolicyEngine/uk-triple-lock/blob/8838fd4/data/triple_lock_actual_inputs.csv).

In April 2018 and April 2023, inflation exceeded earnings growth, and in April 2021 earnings fell while the pension rose 2.5%. Both rules paid the same in those years, and each lifted the pension relative to earnings.

In April 2019, 2024, 2025 and 2026, earnings growth was highest. The Triple Lock paid it, on top of the earlier gains. The adjusted Triple Lock paid the higher of inflation and 2.5%, because the pension already sat above its floor.

In April 2020, earnings growth of 4.0% would have lifted the floor above a pension rising 2.5%. The adjusted Triple Lock paid 3.4%, just enough to bring the pension back to its floor.

```chart
{
  "type": "line",
  "title": "The State Pension under each rule, replayed for April 2017 to April 2026",
  "subtitle": "Index, April 2016 = 100. The floor is the pension's April 2016 value grown with earnings since.",
  "xKey": "year",
  "xLabel": "April",
  "series": [
    { "key": "triple_lock", "name": "Triple Lock", "color": "primary", "step": true },
    { "key": "adjusted", "name": "Adjusted Triple Lock", "color": "secondary", "step": true },
    { "key": "floor", "name": "Floor", "color": "quinary", "step": true }
  ],
  "data": [
    { "year": 2016, "triple_lock": 100.0, "adjusted": 100.0, "floor": 100.0 },
    { "year": 2017, "triple_lock": 102.5, "adjusted": 102.5, "floor": 102.5 },
    { "year": 2018, "triple_lock": 105.6, "adjusted": 105.6, "floor": 104.8 },
    { "year": 2019, "triple_lock": 108.4, "adjusted": 108.2, "floor": 107.6 },
    { "year": 2020, "triple_lock": 112.8, "adjusted": 111.9, "floor": 111.9 },
    { "year": 2021, "triple_lock": 115.6, "adjusted": 114.7, "floor": 110.9 },
    { "year": 2022, "triple_lock": 119.2, "adjusted": 118.2, "floor": 114.3 },
    { "year": 2023, "triple_lock": 131.2, "adjusted": 130.2, "floor": 120.6 },
    { "year": 2024, "triple_lock": 142.4, "adjusted": 138.9, "floor": 130.9 },
    { "year": 2025, "triple_lock": 148.6, "adjusted": 142.4, "floor": 136.6 },
    { "year": 2026, "triple_lock": 155.9, "adjusted": 147.8, "floor": 143.3 }
  ],
  "yIncludesZero": false,
  "yLabel": "Index",
  "format": { "decimals": 0 },
  "xFormat": { "decimals": 0 },
  "source": "Source: PolicyEngine replay of today's rules on September CPI and May to July average weekly earnings, ONS figures as published in September 2026 (PolicyEngine/uk-triple-lock, pre-Budget release). April 2022 uses inflation for earnings under both rules."
}
```

By April 2026, the full new State Pension would be £11,895 a year under the adjusted Triple Lock, against the £12,548 paid: £653, or 5.2%, lower. Running PolicyEngine UK with that lower pension puts the saving at £6.0 billion in 2026-27, or £4.3 billion after the lower pension reduces income tax and raises means-tested benefits.

## What it saves

The saving depends on how often inflation or 2.5% exceeds earnings growth after 2030, and nobody can forecast that. We report two scenarios. Neither is a forecast of the most likely outcome.

**The OBR's central path.** This takes the OBR's March 2026 forecast to 2030 and its long-term projections after:

| April | Inflation | Earnings growth | Triple Lock | Adjusted Triple Lock |
| ----- | --------- | --------------- | ----------- | -------------------- |
| 2028  | 2.0%      | 2.4%            | 2.5%        | 2.5%                 |
| 2029  | 2.0%      | 2.1%            | 2.5%        | 2.5%                 |
| 2030  | 2.0%      | 2.2%            | 2.5%        | 2.5%                 |
| 2031  | 2.0%      | 2.4%            | 2.5%        | 2.5%                 |
| 2032  | 2.0%      | 2.7%            | 2.7%        | 2.5%                 |
| 2033  | 2.0%      | 3.0%            | 3.0%        | 2.8%                 |
| 2034  | 2.0%      | 3.3%            | 3.3%        | 3.3%                 |

Earnings growth stays below 2.5% in the inputs to the rises of April 2028 to April 2031, so both rules pay 2.5% in each of those years. The rises of April 2028 and April 2029 set the 2029-30 level that the adjusted Triple Lock protects, and the rises of April 2030 and April 2031 lift the pension above its floor. In April 2032, the adjusted Triple Lock pays 2.5% against the Triple Lock's 2.7%. In April 2033, it pays 2.8%, the rise that brings the pension back to its floor, against 3.0%. From April 2034, both rules pay earnings growth. In 2039-40, the full new State Pension is £18,639 a year under the adjusted Triple Lock, £73 below the Triple Lock's £18,712, and the saving is £0.9 billion.

On the OBR's October 2026 forecast, published with the Budget, the April 2028 rise is 3.4% rather than 2.5%, because forecast inflation of 3.4% comes out highest. The rises of April 2029 to April 2031 stay at 2.5%. Our rebuild uses the October forecast to 2030 and, until the OBR publishes long-term assumptions to match it, the March 2026 ones after that.

**The OBR's long-term assumption.** In its long-term projections, the OBR assumes that the Triple Lock raises the pension 0.6 percentage points a year faster than earnings on average, a stylised allowance for the years when inflation or 2.5% comes out highest. In this scenario, the Triple Lock follows that assumption, phased in over the rises of April 2032 and April 2033, while the adjusted Triple Lock follows the central path. The saving in 2039-40 is £10.3 billion, and the full new State Pension is £865 a year lower than under the Triple Lock. The scenario gives the adjusted Triple Lock no credit for those same years: whenever inflation or 2.5% exceeds earnings growth, the adjusted Triple Lock pays it too. It compares the adjusted Triple Lock with the OBR's way of costing the Triple Lock, and is not a forecast.

```chart
{
  "type": "bar",
  "title": "Saving from the adjusted Triple Lock in two scenarios, 2032-33 to 2039-40",
  "subtitle": "Fall in State Pension spending against the Triple Lock, UK, £ billion in cash terms. Pre-Budget estimates.",
  "xKey": "year",
  "series": [
    { "key": "central", "name": "OBR central path", "color": "quinary" },
    { "key": "assumption", "name": "OBR long-term assumption", "color": "primary" }
  ],
  "data": [
    { "year": "2032-33", "central": 0.3, "assumption": 0.75 },
    { "year": "2033-34", "central": 0.63, "assumption": 1.89 },
    { "year": "2034-35", "central": 0.66, "assumption": 3.17 },
    { "year": "2035-36", "central": 0.7, "assumption": 4.24 },
    { "year": "2036-37", "central": 0.74, "assumption": 5.6 },
    { "year": "2037-38", "central": 0.78, "assumption": 7.09 },
    { "year": "2038-39", "central": 0.82, "assumption": 8.52 },
    { "year": "2039-40", "central": 0.86, "assumption": 10.29 }
  ],
  "valueLabels": false,
  "yLabel": "Saving",
  "format": { "decimals": 1, "prefix": "£", "suffix": "bn" },
  "source": "Source: PolicyEngine UK (policyengine.py 6.2.6, Enhanced FRS 2024-25), pre-Budget release of PolicyEngine/uk-triple-lock. Neither scenario saves anything before 2032-33."
}
```

### From gross to net

With a lower State Pension, pensioners pay less income tax and receive more means-tested benefits. Under the OBR's long-term assumption in 2039-40, State Pension spending falls by £10.3 billion. Lower income tax receipts offset £2.2 billion of that, higher Pension Credit £0.6 billion, and higher Housing Benefit, council tax reduction and other benefits, with lower other taxes, £0.2 billion, leaving a net saving of £7.3 billion.

```chart
{
  "type": "waterfall",
  "title": "From the gross to the net saving, 2039-40",
  "subtitle": "OBR long-term assumption, UK, £ billion in cash terms. Pre-Budget estimates.",
  "panelKey": "measure",
  "steps": [
    { "key": "gross", "name": "Pension", "kind": "level", "legend": "Saving", "color": "primary" },
    { "key": "income_tax", "name": "Income tax", "kind": "change", "legend": "Tax and benefit offset", "color": "negative" },
    { "key": "benefits", "name": "Benefits", "kind": "change", "legend": "Tax and benefit offset", "color": "negative" },
    { "key": "net", "name": "Net", "kind": "level", "legend": "Saving", "color": "primary" }
  ],
  "data": [
    { "measure": "2039-40", "gross": 10.292565051193662, "income_tax": -2.229207947842042, "benefits": -0.787262869236713, "net": 7.2760942341149075 }
  ],
  "format": { "decimals": 1, "prefix": "£", "suffix": "bn" },
  "source": "Source: PolicyEngine UK, pre-Budget release of PolicyEngine/uk-triple-lock. Pension: fall in State Pension spending. Benefits: Pension Credit (£0.6bn), and Housing Benefit, council tax reduction, Winter Fuel Payment, Universal Credit and other spending and taxes (£0.2bn). Labels rounded; steps computed from unrounded figures."
}
```

## Against the official estimates

DWP's analysis costs the adjusted Triple Lock at £15 billion in 2039-40 and £50 billion in 2049-50 in cash terms, or £11 billion and £30 billion in 2025-26 prices. It covers direct spending in Great Britain, excludes effects on tax and debt interest, and "isolates the modelled effect of uprating policy, rather than behavioural responses". Our closest figures are the gross savings in Great Britain: £0.8 billion on the OBR's central path and £10.0 billion under its long-term assumption.

The estimates differ in three ways, and DWP's published assumptions do not let us size them ([HL3774](https://questions-statements.parliament.uk/written-questions/detail/2026-10-05/hl3774)):

- DWP projects the population and each person's pension with Pensim3, its dynamic microsimulation model. We reweight today's Family Resources Survey households to the ONS population projection by age and sex, holding each person's age fixed.
- Our survey counts less State Pension in payment than DWP does: £125.9 billion in Great Britain in 2026-27, against DWP's £148.3 billion, both excluding payments abroad. The saving scales with the basic and new State Pension, which DWP publishes only with payments abroad included, and only to 2030-31, so we cannot match that part of the bill exactly.
- DWP says it applies "a path for uprating" but publishes no rates for it, and its answer to HL3774 says the analysis used no single-year assumptions for earnings or prices growth.

Our projections end in 2039-40, so we have no figure to set against the £50 billion.

The OBR's October 2026 Economic and fiscal outlook builds the adjusted Triple Lock into its forecast from 2030-31. It finds that the adjusted Triple Lock "does not currently affect state pension costs over the forecast period", because 2.5% applies under both rules in 2030-31 and 2031-32 (paragraph 3.50 and its footnote 17). Our central path, on the March forecast, also pays 2.5% under both rules in April 2030 and April 2031, and saves nothing until 2032-33.

The OBR gives no figure for 2039-40. Instead, it replays both rules on prices and earnings since 1990 and finds State Pension payments 1.4% lower each year on average than under the Triple Lock (paragraph 3.51). That replay protects the pension's 1990 value relative to earnings and averages over every year since, so its 1.4% does not compare directly with our 5.2% for 2026-27 from a 2017 start. The OBR also estimates, provisionally, that if the next 50 years resembled the last 35, the adjusted Triple Lock would leave debt in 2075-76 around 25% of GDP lower than under the Triple Lock. It notes that the overall effect of the adjusted Triple Lock and the government's planned expansion of social care on the long-term public finances depends on what that expansion costs (paragraphs 3.52 to 3.54).

## Who has less income

Under the OBR's long-term assumption in 2039-40, 27% of UK households have less income than under the Triple Lock, by £810 a year on average. Households with someone over State Pension age make up 31% of all households, so nearly nine in ten of them lose. Households with nobody over State Pension age see no change. Pensioner couples have £1,097 a year less on average, 1.4% of their income, and single pensioners £415 less, 1.1%. By income decile, households in the second and third deciles lose the largest share of their income, 0.7%. This release records how many households lose more than £1 a year, but not how many gain. On the OBR's central path, 27% of households also lose, by £69 a year on average.

```chart
{
  "type": "bar",
  "title": "Change in household income by income decile, 2039-40",
  "subtitle": "Adjusted Triple Lock against the Triple Lock, OBR long-term assumption. Percent of household net income.",
  "xKey": "decile",
  "series": [{ "key": "change", "name": "Change in household income", "color": "primary" }],
  "data": [
    { "decile": "1st", "change": -0.57 },
    { "decile": "2nd", "change": -0.7 },
    { "decile": "3rd", "change": -0.71 },
    { "decile": "4th", "change": -0.47 },
    { "decile": "5th", "change": -0.37 },
    { "decile": "6th", "change": -0.35 },
    { "decile": "7th", "change": -0.29 },
    { "decile": "8th", "change": -0.21 },
    { "decile": "9th", "change": -0.19 },
    { "decile": "10th", "change": -0.07 }
  ],
  "valueLabels": false,
  "yLabel": "Change in income",
  "format": { "decimals": 2, "suffix": "%" },
  "source": "Source: PolicyEngine UK, pre-Budget release of PolicyEngine/uk-triple-lock. The 1st decile has the lowest income."
}
```

Under the same scenario, the share of pensioners in poverty after housing costs rises from 12.9% to 13.8% on the relative measure and from 7.7% to 8.8% on the absolute measure. Across the whole population, relative poverty after housing costs rises from 21.1% to 21.3% and absolute poverty from 16.7% to 17.1%.

## How uncertain the saving is

The two scenarios differ more than tenfold because the saving comes from the years in which inflation or 2.5% exceeds earnings growth. The OBR's central path has none after April 2031. The last ten years had three, in April 2018, 2021 and 2023, leaving aside April 2022, for which Parliament suspended the earnings link.

To average over the possible years ahead, we built a statistical model of prices and earnings and simulated 50,000 paths. Before the Budget, we registered a test of that model on every March forecast of the OBR from 2016 whose four years of outcomes were complete, with a rule: if the model failed, we would report scenarios only. There were six such forecasts when we registered the test, and September's inflation figure completed a seventh, from March 2022. Scored on all seven on 28 October, the model failed one check. It expected earnings growth to come in below 2.5% in 45% of the years tested, against 18% in practice, beyond the limit we had set. Its other checks passed: its central 80% range contained the outcome in 5 of the 7 final years and 83% of the annual checks.

So we report the two scenarios, and they are not a range: the saving could fall outside them. The dashboard's next release, rebuilt on the Budget's inputs, reports scenarios only.

<details>
<summary style="font-size: clamp(1.75rem, calc((100vw - 768px) * 1000), 2rem); font-weight: 600; line-height: 1.3; margin: 28px 0 20px; padding-bottom: 6px; border-bottom: 1px solid var(--border-light, #e2e8f0); cursor: pointer;">Methodology and limitations</summary>

### The rules

Both rules follow the Triple Lock through April 2029. Each April, the basic and new State Pension rise by the highest of September CPI, May to July growth in average weekly earnings (total pay) and 2.5%, with each input taken to 0.1 percentage point. From April 2030, the adjusted Triple Lock raises them by the higher of September CPI and 2.5%, or by more where needed to keep the pension at its 2029-30 level grown by earnings since. For the forward scenarios, we round that top-up up to 0.1 percentage point, which is our assumption: the Budget and DWP do not specify a rounding rule. The replay of past years uses the exact top-up, and its table shows rates to 0.1 percentage point. Only the basic and new State Pension differ between the rules. Under both, the additional State Pension rises with September CPI and the Pension Credit guarantee with May to July earnings.

### Scenarios

The central path takes the OBR's [March 2026 Economic and fiscal outlook](https://obr.uk/efo/economic-and-fiscal-outlook-march-2026/) to 2030 and its [long-term economic determinants](https://obr.uk/docs/dlm_uploads/Long-term-economic-determinants-March-2026-EFO.xlsx) after, which the OBR describes as a projection rather than a forecast. In the long-term assumption scenario, the Triple Lock follows the "Triple lock" row of those determinants. It pays 2.5% for the rises of April 2028 to April 2031, as on the central path. From April 2034, it pays average earnings growth plus 0.6 percentage points, phased in over the two rises before. The adjusted Triple Lock follows the central path in both scenarios.

The replay of April 2017 to April 2026 uses September CPI and May to July earnings growth as published by ONS in September 2026, with April 2022's earnings figure replaced by CPI under both rules. We scale each person's actual flat-rate pension by the ratio of the two rules' pension levels, and full runs of PolicyEngine UK on the 2024-25 survey cover 2024-25 to 2026-27.

The withdrawn average came from a monthly statistical model of CPI and average weekly earnings (a vector autoregression), fitted to 2000 to 2026 without the furlough months. We resampled its shocks from its past errors and shifted every path so that the average calendar-year CPI and earnings growth across the 50,000 paths matched the OBR's central path. We estimated the average saving from full runs of PolicyEngine UK on 160 paths sampled to represent the 50,000, with one further run to check a path on which both rules pay identical rates. The test registered on 6 October scored it on the OBR's March forecasts from 2016 whose four years of outcomes were complete, seven by 28 October (March 2016 to March 2022), and set limits on coverage and bias. It failed the limit on how often earnings growth falls below 2.5%, with a bias of 0.27 against a limit of 0.25 ([results](https://github.com/PolicyEngine/uk-triple-lock/pull/45)).

### Model and data

Every fiscal and household figure is a full run of PolicyEngine UK (policyengine.py 6.2.6, policyengine-uk 2.125.1) on the Enhanced Family Resources Survey 2024-25 (policyengine-uk-data 1.58.0). Each scenario's CPI and earnings replace the model's own forecasts, so CPI-uprated benefits, CPI-indexed thresholds and employment income follow it. The net saving is the change in the government's balance across every tax and benefit the model covers.

### Population

We reweight the survey households each year after 2025 so that each age and sex group grows as in the ONS 2024-based population projection. Each person keeps the age they have in the survey, with ages above the survey's top code of 80 spread using ONS shares. State Pension type follows birth cohort: basic for people who reached State Pension age before 6 April 2016, new after. The survey excludes pensioners living abroad.

### Limitations

- The 2039-40 population is today's survey households, reweighted. The model does not simulate deaths, migration or contribution records, so a pensioner's record in 2039-40 is that of someone the same age today.
- Housing Benefit and council tax reduction respond only for households already claiming them, so nobody the adjusted Triple Lock makes newly eligible starts claiming them. That understates those offsets and so overstates the net saving. Pension Credit can go to newly eligible households, when the take-up draw stored in the survey data says they would claim it.
- The Savings Credit threshold and the pension-age Housing Benefit allowances, which the model also uses for council tax reduction, rise with CPI in the model, while the Pension Credit guarantee rises with earnings. In law, maximum Savings Credit is 60% of the gap between the guarantee and the threshold, and DWP describes protected Housing Benefit allowances as the guarantee plus maximum Savings Credit. The guarantee's link to earnings does not set these amounts' future paths. Projecting them from the guarantee instead of CPI is an alternative assumption that could change the Pension Credit, Housing Benefit and council tax reduction offsets under both rules.
- The model splits each reported State Pension into a flat-rate part, up to the full basic or new rate, and anything above it, which rises with CPI under both rules. Where a pension is below the full rate, the model scales all of it with the flat rate, including any Graduated Retirement Benefit or extra pension for deferring. In law those parts rise with prices: in April 2025, they rose 1.7% while the basic State Pension rose 4.1% ([DWP](https://www.gov.uk/government/publications/benefit-and-pension-rates-2025-to-2026/benefit-and-pension-rates-2025-to-2026)). They would rise the same under both rules, so scaling them overstates the saving.
- In the survey runs, rents and council tax stay at their 2030 levels after 2030, and dividend, property, savings and self-employment income do not follow the scenario.
- Nobody changes how much they work, save or claim in response to the adjusted Triple Lock.
- Costs are for the UK in cash terms; comparisons with DWP use our figures for Great Britain.
- Household weights sit 0.44% below their calibrated levels in every year ([policyengine-uk-data#538](https://github.com/PolicyEngine/policyengine-uk-data/issues/538)).

</details>

[^name]: Until its next release, our dashboard calls the policy by its earlier name, the Burnham plan.

---

_Analysis by PolicyEngine. The code, results and replication steps are on [GitHub](https://github.com/PolicyEngine/uk-triple-lock)._
