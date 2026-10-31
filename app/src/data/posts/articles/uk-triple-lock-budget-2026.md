> **Updated 30 October 2026.** We now calculate every PolicyEngine figure below from the Budget's inputs: September's inflation figure, the Office for Budget Responsibility's (OBR) October 2026 forecast to 2030, PolicyEngine UK 2.151.0 and the Microcosm UK dataset. The OBR published no long-term assumptions with its October forecast, so after 2030 we use its March 2026 ones. We publish the figures in [this results file](https://github.com/PolicyEngine/uk-triple-lock/blob/9d99213d44f4c6b88870e2599f5e8c7e349fa569/data/results.json), which our [Triple Lock dashboard](https://www.policyengine.org/uk/triple-lock) also draws on.
>
> We first published this post on 28 October with an estimated average saving across 50,000 simulated paths of prices and earnings, £11.1 billion in 2039-40, and a range around it. The same day, the model behind those paths failed a test we had registered before the Budget ([uk-triple-lock#45](https://github.com/PolicyEngine/uk-triple-lock/pull/45)). We withdrew the average and the range around it and now report scenarios. We do not describe any of the model's paths as typical or likely.

Each April, the government raises the State Pension by the highest of inflation, earnings growth and 2.5%, under a commitment it calls the Triple Lock. In the [Budget](https://www.gov.uk/government/publications/budget-2026-document/budget-2026-html#box-5atriple-lock-adjustment175) on 28 October 2026, the government kept that commitment until April 2029 and said it would adjust it from April 2030. It would drop earnings growth as a minimum rise and instead hold the pension at its April 2029 value relative to earnings. In the Budget's words, from April 2030 "the State Pension rises each year by the highest of 2.5%, inflation, or the amount required to maintain its value relative to earnings as reached in April 2029."

The Department for Work and Pensions (DWP) estimates in its [State Pension uprating analysis](https://www.gov.uk/government/publications/state-pension-uprating-analysis-2026/state-pension-uprating) that the government would spend £15 billion less on the State Pension in 2039-40 and £50 billion less in 2049-50. These cash figures for Great Britain cover direct spending only, before any effect on tax or debt interest. The government says it will use the savings to help build a National Care Service in England that gives older people personal care free at the point of use. Prime Minister Andy Burnham announced the change at Labour's conference on 29 September ([BBC](https://www.bbc.co.uk/news/live/c6x2zrv774gvt?post=asset%3A6edb0175-f1b7-407f-a5b7-96e02dfa03ec#post)).

Key findings for 2039-40, the first of the two years DWP costs (UK, cash terms):

- The saving depends on how often inflation or 2.5% exceeds earnings growth after 2030. On the OBR's central path, earnings growth comes out highest every year from April 2032, and the government spends £0.5 billion less on the State Pension under the adjusted Triple Lock. If the pension would otherwise rise 0.6 percentage points a year faster than earnings under the Triple Lock, as the OBR assumes in its long-term projections, the cut reaches £10.9 billion.
- With a lower pension, pensioners pay less income tax and receive more means-tested benefits, reducing the government's savings to £0.3 billion and £7.3 billion.
- For Great Britain, the area DWP covers, we estimate £0.5 billion and £10.6 billion, against DWP's £15 billion. In our data, we count 2% less State Pension in payment than DWP does, and DWP does not publish the path of prices and earnings behind its estimate.
- Under the OBR's long-term assumption, the full new State Pension falls £836 a year short of the Triple Lock's, and 30% of UK households have less income.
- Had the adjusted Triple Lock started in April 2017, the full new State Pension would fall £642 a year short of what the government pays in 2026-27, a gap of 5.1%.

[Explore the dashboard](https://www.policyengine.org/uk/triple-lock) | [Read the code](https://github.com/PolicyEngine/uk-triple-lock)

## How the Triple Lock works

Each April, the government raises the basic and new State Pension by the highest of three figures:

| Figure          | What it measures                                                                | For the April 2026 rise |
| --------------- | ------------------------------------------------------------------------------- | ----------------------- |
| Inflation       | The consumer price index (CPI) in the year to the previous September            | 3.8%                    |
| Earnings growth | Average weekly earnings over May to July, against the same months a year before | 4.8%                    |
| Floor           | A fixed minimum                                                                 | 2.5%                    |

In April 2026, earnings growth exceeded the other two, so the government raised the full new State Pension 4.8%, to £12,548 a year.

Parliament requires less in law. Under [section 150A of the Social Security Administration Act 1992](https://www.legislation.gov.uk/ukpga/1992/5/section/150A), the Work and Pensions Secretary must review the pension against earnings each year. If earnings have grown, the Secretary must lay a draft order before Parliament to raise the pension by at least as much. The government has [committed](https://www.gov.uk/government/publications/state-pension-uprating-analysis-2026/state-pension-uprating) to add the inflation and 2.5% minimums for this Parliament. Once both Houses approve the draft order, the Secretary makes it, and the new rates start in April. In Northern Ireland, the Department for Communities makes a [corresponding order](https://www.legislation.gov.uk/nisr/2026/59/contents/made).

Because the rise always matches or exceeds earnings growth, the pension never falls behind earnings. In a year when inflation or 2.5% exceeds earnings growth, the government raises the pension faster than earnings and applies every later rise to that higher level. The Budget calls this the "ratchet" effect, "whereby the State Pension rises ever higher relative to earnings."

## What changes in April 2030

|                              | Triple Lock (to April 2029) | Adjusted Triple Lock (from April 2030)    |
| ---------------------------- | --------------------------- | ----------------------------------------- |
| Inflation                    | Minimum rise                | Minimum rise                              |
| 2.5%                         | Minimum rise                | Minimum rise                              |
| Earnings growth              | Minimum rise                | Not a minimum rise                        |
| Floor on the pension's level | None                        | Its April 2029 value relative to earnings |

Under the adjusted Triple Lock, the government would keep inflation and 2.5% as minimum rises and replace earnings growth with a floor: each year's rise must keep the pension at or above its April 2029 value relative to earnings.

In a year when inflation or 2.5% exceeds earnings growth, the government raises the pension by that figure under both rules, and the pension moves above its floor. The rules part in the years after. When earnings growth comes out highest, the government raises the pension by that figure under the Triple Lock, but only by the higher of inflation and 2.5% under the adjusted Triple Lock. If that rise would leave the pension below its floor, the government adds just enough to reach the floor. Once the pension returns to its floor, it rises with earnings, or as the Budget puts it, "the State Pension will track earnings over time."

Parliament would have to change the law first. In a year when earnings growth comes out highest and the pension sits above its floor, the government would raise the pension by less than section 150A requires. The government has [said it will legislate](https://www.gov.uk/government/news/prime-minister-andy-burnham-sets-out-plans-for-a-new-national-care-service) during this Parliament, but by 31 October it had not introduced a Bill. The government plans the first adjusted rise for April 2030, after the [deadline for the next general election](https://fullfact.org/government-tracker/adjusted-triple-lock/).

The government does not specify the CPI month or the earnings measure in the Budget or DWP's [Triple Lock reform factsheet](https://www.gov.uk/government/publications/state-pension-uprating-analysis-2026/triple-lock-reform-factsheet), which DWP updated on 6 October. We assume the government would use the ones it uses now: September CPI and May to July growth in average weekly earnings. We also assume that "its value relative to earnings as reached in April 2029" means the pension's level in 2029-30, the year that starts that April. The OBR reads it the same way, as the value "relative to earnings at 2029-30 levels" (paragraph 3.49 of its [October 2026 Economic and fiscal outlook](https://www.gov.uk/government/publications/october-2026-economic-and-fiscal-outlook)).

### Both rules over the last ten years

We replay today's rules on the figures the Office for National Statistics (ONS) published in October 2026 for April 2017 to April 2026. We assume the government used the adjusted Triple Lock from April 2017 and protected the pension's April 2016 value relative to earnings.

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
| 2026  | 3.8%      | 4.8%            | 4.8%        | 3.8%                 |

\*Parliament suspended the earnings link for April 2022, so we use inflation in place of earnings growth that year, for both rules and for the floor. ONS has revised its earnings figures since the government set the rises, so we calculate some different rates in the replay. For example, April 2025's rise comes to 4.4%, against the 4.1% the government paid. We publish the figures in the [replay's input file](https://github.com/PolicyEngine/uk-triple-lock/blob/9d99213d44f4c6b88870e2599f5e8c7e349fa569/data/triple_lock_actual_inputs.csv).

In April 2018 and April 2023, inflation exceeds earnings growth in our replay, and in April 2021 earnings fall while we raise the pension 2.5%. The two rules give the same rise in those years, and each rise lifts the pension relative to earnings.

In April 2019, 2024, 2025 and 2026, earnings growth comes out highest. Under the Triple Lock, we raise the pension by that figure, on top of the earlier gains. Under the adjusted Triple Lock, we raise it by the higher of inflation and 2.5%, because the pension already sits above its floor.

In April 2020, earnings growth of 4.0% would lift the floor above a pension rising 2.5%. Under the adjusted Triple Lock, we raise the pension 3.4%, just enough to bring it back to its floor.

```chart
{
  "type": "line",
  "title": "The State Pension under each rule, April 2017 to April 2026",
  "subtitle": "Index, April 2016 = 100. We grow the pension's April 2016 value with earnings to set the floor.",
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
    { "year": 2026, "triple_lock": 155.7, "adjusted": 147.8, "floor": 143.2 }
  ],
  "yIncludesZero": false,
  "yLabel": "Index",
  "format": { "decimals": 0 },
  "xFormat": { "decimals": 0 },
  "source": "Source: PolicyEngine replay of today's rules on September CPI and May to July average weekly earnings, figures ONS published in October 2026 (PolicyEngine/uk-triple-lock). For April 2022, we use inflation for earnings under both rules."
}
```

By April 2026, the full new State Pension would reach £11,906 a year under the adjusted Triple Lock, against the £12,548 the government paid: £642, or 5.1%, less. We run PolicyEngine UK with that lower pension and estimate a saving of £6.5 billion in 2026-27, or £4.6 billion after pensioners pay less income tax and receive more means-tested benefits.

## What it saves

The saving depends on how often inflation or 2.5% exceeds earnings growth after 2030, and nobody can forecast that. We calculate savings under two scenarios without forecasting which outcome is most likely.

We build the **OBR's central path** from its October 2026 forecast to 2030 and its March 2026 long-term projections for later years:

| April | Inflation | Earnings growth | Triple Lock | Adjusted Triple Lock |
| ----- | --------- | --------------- | ----------- | -------------------- |
| 2028  | 3.4%      | 3.3%            | 3.4%        | 3.4%                 |
| 2029  | 2.0%      | 2.1%            | 2.5%        | 2.5%                 |
| 2030  | 2.1%      | 2.3%            | 2.5%        | 2.5%                 |
| 2031  | 2.0%      | 2.5%            | 2.5%        | 2.5%                 |
| 2032  | 2.0%      | 2.7%            | 2.7%        | 2.5%                 |
| 2033  | 2.0%      | 3.0%            | 3.0%        | 3.0%                 |
| 2034  | 2.0%      | 3.3%            | 3.3%        | 3.3%                 |

In April 2028, inflation of 3.4% comes out highest, so the government applies that rise under both rules. Neither inflation nor earnings growth exceeds 2.5% in the inputs for April 2029 to April 2031, so the government raises the pension 2.5% each year under both rules. With the rises of April 2028 and April 2029, the government sets the 2029-30 level it would protect under the adjusted Triple Lock. In April 2030, the government applies a rise of 2.5% against earnings growth of 2.3%, taking the pension above its floor. In April 2032, the government increases the pension 2.5% under the adjusted Triple Lock, against 2.7% under the Triple Lock. In April 2033, the rise comes to 3.0% under both rules. We round the rise needed to reach the floor upwards in steps of 0.1 percentage point. From April 2034, the rise matches earnings growth under both rules. In 2039-40, the full new State Pension reaches £18,840 a year under the adjusted Triple Lock, against £18,876 under the Triple Lock, and the government spends £0.5 billion less on the State Pension.

The OBR's **long-term assumption** has the government raising the pension 0.6 percentage points a year faster than earnings on average under the Triple Lock. The OBR makes that stylised allowance for years when inflation or 2.5% comes out highest. We use that assumption for the Triple Lock, with the OBR's phase-in over the rises of April 2032 and April 2033, and the central path for the adjusted Triple Lock. In 2039-40, the government spends £10.9 billion less on the State Pension, and the full new State Pension falls £836 a year short of the Triple Lock's. We add no allowance under the adjusted Triple Lock for years when inflation or 2.5% exceeds earnings growth, although the government would raise the pension by that figure under the adjusted Triple Lock too. We compare the adjusted Triple Lock with the OBR's way of costing the Triple Lock, and make no forecast.

```chart
{
  "type": "bar",
  "title": "Saving from the adjusted Triple Lock in two scenarios, 2032-33 to 2039-40",
  "subtitle": "Fall in State Pension spending against the Triple Lock, UK, £ billion in cash terms. OBR October 2026 forecast to 2030, March 2026 long-term projections after.",
  "xKey": "year",
  "series": [
    { "key": "central", "name": "OBR central path", "color": "quinary" },
    { "key": "assumption", "name": "OBR long-term assumption", "color": "primary" }
  ],
  "data": [
    { "year": "2032-33", "central": 0.33, "assumption": 0.82 },
    { "year": "2033-34", "central": 0.35, "assumption": 1.73 },
    { "year": "2034-35", "central": 0.37, "assumption": 3.12 },
    { "year": "2035-36", "central": 0.39, "assumption": 4.28 },
    { "year": "2036-37", "central": 0.41, "assumption": 5.76 },
    { "year": "2037-38", "central": 0.43, "assumption": 7.38 },
    { "year": "2038-39", "central": 0.45, "assumption": 8.95 },
    { "year": "2039-40", "central": 0.48, "assumption": 10.87 }
  ],
  "valueLabels": false,
  "yLabel": "Saving",
  "format": { "decimals": 1, "prefix": "£", "suffix": "bn" },
  "source": "Source: PolicyEngine UK 2.151.0 (policyengine.py 6.11.1) on Microcosm UK 2024-25, PolicyEngine/uk-triple-lock. We estimate no saving under either scenario before 2032-33."
}
```

### From gross to net

With a lower State Pension, pensioners pay less income tax and receive more means-tested benefits. Under the OBR's long-term assumption in 2039-40, the government spends £10.9 billion less on the State Pension, collects £2.4 billion less income tax and spends £0.8 billion more on Pension Credit. The government also pays more Housing Benefit, council tax reduction and other benefits and collects less in other taxes, reducing its saving by another £0.3 billion to a net £7.3 billion. We round each figure, so the steps do not sum exactly.

```chart
{
  "type": "waterfall",
  "title": "From the gross to the net saving, 2039-40",
  "subtitle": "OBR long-term assumption, UK, £ billion in cash terms.",
  "panelKey": "measure",
  "steps": [
    { "key": "gross", "name": "Pension", "kind": "level", "legend": "Saving", "color": "primary" },
    { "key": "income_tax", "name": "Income tax", "kind": "change", "legend": "Tax and benefit offset", "color": "negative" },
    { "key": "benefits", "name": "Benefits", "kind": "change", "legend": "Tax and benefit offset", "color": "negative" },
    { "key": "net", "name": "Net", "kind": "level", "legend": "Saving", "color": "primary" }
  ],
  "data": [
    { "measure": "2039-40", "gross": 10.870795836943188, "income_tax": -2.3877533883894557, "benefits": -1.1437914913336442, "net": 7.339250957220088 }
  ],
  "format": { "decimals": 1, "prefix": "£", "suffix": "bn" },
  "source": "Source: PolicyEngine UK 2.151.0 on Microcosm UK 2024-25, PolicyEngine/uk-triple-lock. Pension: fall in State Pension spending. Benefits: Pension Credit (£0.8bn), and Housing Benefit, council tax reduction, Winter Fuel Payment, Universal Credit and other spending and taxes (£0.3bn). We round the labels and calculate the steps from unrounded figures."
}
```

## Against the official estimates

DWP estimates savings from the adjusted Triple Lock of £15 billion in 2039-40 and £50 billion in 2049-50 in cash terms, or £11 billion and £30 billion in 2025-26 prices. DWP covers direct spending in Great Britain and excludes effects on tax and debt interest. It says its analysis "isolates the modelled effect of uprating policy, rather than behavioural responses". Our gross savings in Great Britain come closest: £0.5 billion on the OBR's central path and £10.6 billion under its long-term assumption.

The estimates differ in three ways, and DWP's published assumptions do not let us size them ([HL3774](https://questions-statements.parliament.uk/written-questions/detail/2026-10-05/hl3774)):

- DWP projects the population and each person's pension with Pensim3, its dynamic microsimulation model. We reweight the households in Microcosm UK, our dataset of UK households, which starts from the Family Resources Survey, to the ONS population projection by age and sex, holding each person's age fixed.
- In our data, we count slightly less State Pension in payment than DWP does: £144.8 billion in Great Britain in 2026-27, against DWP's £148.3 billion, both excluding payments abroad. The saving scales with the basic and new State Pension, but DWP includes payments abroad in its figures and publishes them only to 2030-31, so we cannot match that part of the bill exactly.
- DWP says it applies "a path for uprating" but publishes no rates for it, and says in its answer to HL3774 that it used no single-year assumptions for earnings or prices growth.

Our projections end in 2039-40, so we have no figure to set against the £50 billion.

In its October 2026 Economic and fiscal outlook, the OBR includes the adjusted Triple Lock in its forecast from 2030-31. The OBR finds that the adjusted Triple Lock "does not currently affect state pension costs over the forecast period", because 2.5% applies under both rules in 2030-31 and 2031-32 (paragraph 3.50 and its footnote 17). On our central path, we apply 2.5% under both rules in April 2030 and April 2031 and estimate no saving until 2032-33.

The OBR gives no figure for 2039-40. Instead, it replays both rules on prices and earnings since 1990 and finds State Pension payments 1.4% lower each year on average than under the Triple Lock (paragraph 3.51). The OBR protects the pension's 1990 value relative to earnings in that replay and averages over every year since, so its 1.4% does not compare directly with our 5.1% for 2026-27 from a 2017 start. The OBR also estimates, provisionally, that if the next 50 years resembled the last 35, the adjusted Triple Lock would leave debt in 2075-76 around 25% of GDP lower than under the Triple Lock. It notes that the overall effect of the adjusted Triple Lock and the government's planned expansion of social care on the long-term public finances depends on what that expansion costs (paragraphs 3.52 to 3.54).

## Who has less income

Under the OBR's long-term assumption in 2039-40, 30% of UK households have less income than under the Triple Lock, by £801 a year on average. Households with someone over State Pension age make up 34% of all households, and those with nobody over State Pension age see no change on average. Pensioner couples have £1,072 a year less on average, 1.3% of their income, and single pensioners £389 less, 0.8%. By income decile, households in the third decile lose the largest share of their income, 0.6%. Fewer than 1 in 300 households have more income. On the OBR's central path, 30% of households also lose, by £35 a year on average.

```chart
{
  "type": "bar",
  "title": "Change in household income by income decile, 2039-40",
  "subtitle": "Adjusted Triple Lock against the Triple Lock, OBR long-term assumption. Percent of household net income.",
  "xKey": "decile",
  "series": [{ "key": "change", "name": "Change in household income", "color": "primary" }],
  "data": [
    { "decile": "1st", "change": -0.35 },
    { "decile": "2nd", "change": -0.46 },
    { "decile": "3rd", "change": -0.56 },
    { "decile": "4th", "change": -0.52 },
    { "decile": "5th", "change": -0.48 },
    { "decile": "6th", "change": -0.36 },
    { "decile": "7th", "change": -0.33 },
    { "decile": "8th", "change": -0.22 },
    { "decile": "9th", "change": -0.15 },
    { "decile": "10th", "change": -0.06 }
  ],
  "valueLabels": false,
  "yLabel": "Change in income",
  "format": { "decimals": 2, "suffix": "%" },
  "source": "Source: PolicyEngine UK 2.151.0 on Microcosm UK 2024-25, PolicyEngine/uk-triple-lock. The 1st decile has the lowest income."
}
```

Under the same scenario, the share of pensioners in poverty after housing costs rises from 10.6% to 11.4% on the relative measure and from 6.7% to 7.4% on the absolute measure. Across the whole population, absolute poverty after housing costs rises from 15.9% to 16.1%, while relative poverty falls from 19.3% to 19.1%. We deduct housing costs from household income and adjust for household size, then set the relative poverty line at 60% of the median person's household income. Lower pensions pull that median down.

## How uncertain the saving is

The two scenarios differ more than twentyfold because the saving comes from the years in which inflation or 2.5% exceeds earnings growth. The OBR's central path has none after April 2031. The last ten years had three, in April 2018, 2021 and 2023, leaving aside April 2022, for which Parliament suspended the earnings link.

To average over the possible years ahead, we drew 50,000 paths from a statistical model of prices and earnings. Before the Budget, we registered a test of that model on every March forecast of the OBR from 2016 whose four years of outcomes were complete. We committed in advance to reporting only scenarios if the model failed. We had six such forecasts when we registered the test, and September's inflation figure completed a seventh, from March 2022. We scored the model on all seven on 28 October, and it failed one check. It expected earnings growth to come in below 2.5% in 45% of the years we tested, against 18% in practice, beyond the limit we had set. Its other checks passed: its central 80% range contained the outcome in 5 of the 7 final years and 83% of the annual checks. It also passed every check on the test's second set: 13 OBR forecasts, one a year, from June 2010 to March 2022.

Because the model failed, we report the two scenarios. They set no range, and the saving could fall outside them.

Our dashboard also shows two scenarios from the model's paths, with calendar-year earnings growth targets 0.5 percentage points lower or higher from 2031. We estimate that State Pension spending falls by an average of £11.4 billion in 2039-40 with lower earnings growth and £11.9 billion with higher, each with a 95% Monte Carlo margin of about £0.5 billion. Both averages come from the model that failed the test, like the average we withdrew. We estimate each from full runs on 160 draws and weight the results to stand for all 50,000 paths. The failed test does not show whether these averages overstate or understate the saving, and we do not use either average as a forecast. The dashboard also shows three illustrative paths under which the government spends between £11.3 billion and £19.8 billion less on the State Pension in 2039-40.

<details>
<summary style="font-size: clamp(1.75rem, calc((100vw - 768px) * 1000), 2rem); font-weight: 600; line-height: 1.3; margin: 28px 0 20px; padding-bottom: 6px; border-bottom: 1px solid var(--border-light, #e2e8f0); cursor: pointer;">Methodology and limitations</summary>

### The rules

Both rules follow the Triple Lock through April 2029. Each April, the government raises the basic and new State Pension by the highest of September CPI, May to July growth in average weekly earnings (total pay) and 2.5%, and we round each input to 0.1 percentage point. From April 2030, under the adjusted Triple Lock, the government would raise them by the higher of September CPI and 2.5% and add any top-up needed to preserve the pension's 2029-30 value relative to earnings. For the forward scenarios, we round that top-up upwards in steps of 0.1 percentage point; the government specifies no rounding rule. For the replay of past years, we use the exact top-up and report rates to 0.1 percentage point. Only the basic and new State Pension differ between the rules. Under both, the government raises the additional State Pension with September CPI and the Pension Credit guarantee with May to July earnings.

### Scenarios

For the central path, we use the OBR's [October 2026 Economic and fiscal outlook](https://www.gov.uk/government/publications/october-2026-economic-and-fiscal-outlook) for 2026 to 2030 and for the inputs to every rise to April 2031. The OBR publishes no forecast of May to July earnings, so for the rises of April 2028 to April 2031 we use its April to June figure, and its September-quarter CPI. After 2030, we use the OBR's [March 2026 long-term economic determinants](https://obr.uk/docs/dlm_uploads/Long-term-economic-determinants-March-2026-EFO.xlsx), because the OBR published no new set with its October forecast; the OBR describes them as a projection rather than a forecast. In the long-term assumption scenario, we take Triple Lock rises from the "Triple lock" row of those determinants from April 2032. From April 2034, the OBR describes that row as average earnings growth plus 0.6 percentage points, and it phases in the addition over the two rises before. We use the central path for the adjusted Triple Lock in both scenarios.

For the replay of April 2017 to April 2026, we use the September CPI and May to July earnings growth figures ONS published in October 2026 and substitute CPI for April 2022's earnings figure under both rules. We scale each person's actual flat-rate pension by the ratio of the two rules' pension levels, and full runs of PolicyEngine UK on Microcosm UK 2024-25 cover 2024-25 to 2026-27.

The withdrawn average came from a monthly statistical model of CPI and average weekly earnings (a vector autoregression), which we fitted to 2000 to 2026 without the furlough months. We resampled its shocks from its past errors and shifted every path so that the average calendar-year CPI and earnings growth across the 50,000 paths matched the OBR's March 2026 central path. We estimated the average saving from full runs of PolicyEngine UK on 160 paths we sampled to represent the 50,000. The test we registered on 6 October scored the model on the OBR's March forecasts from 2016 whose four years of outcomes were complete, seven by 28 October (March 2016 to March 2022). The test set limits on coverage and bias, and the model failed the limit on how often earnings growth falls below 2.5%, with a bias of 0.27 against a limit of 0.25 ([results](https://github.com/PolicyEngine/uk-triple-lock/pull/45)). We use the same monthly model specification for the two earnings scenarios on our dashboard. We centre its paths on the central path above, then lower or raise the calendar-year earnings targets by 0.5 percentage points a year from 2031.

### Model and data

We calculate every fiscal and household figure with a full run of PolicyEngine UK (policyengine.py 6.11.1, policyengine-uk 2.151.0) on Microcosm UK 2024-25 (microcosm-data 0.1.0). We replace the model's own forecasts with each scenario's CPI and earnings, and the model then moves CPI-uprated benefits, CPI-indexed thresholds and employment income with the scenario. We calculate the net saving as the change in the government's balance across every tax and benefit the model covers.

### Population

We reweight the households each year after 2025-26 so that each age and sex group grows as in the ONS 2024-based population projection. We hold each person's age fixed at the value in the data. State Pension type follows birth cohort: basic for people who reached State Pension age before 6 April 2016, new after. The data exclude pensioners living abroad.

### Limitations

- We reweight today's households to the 2039-40 population. The model does not simulate deaths, migration or contribution records, so a pensioner in 2039-40 carries the record of someone the same age today.
- The model adjusts Housing Benefit and council tax reduction only for households that already claim them, so it assigns no new claims when a lower State Pension makes a household eligible. That understates those offsets and so overstates the net saving. The model calculates Pension Credit for newly eligible households when their take-up draw in the data indicates they would claim it.
- The Savings Credit threshold and the pension-age Housing Benefit allowances, which the model also uses for council tax reduction, rise with CPI in the model, while the Pension Credit guarantee rises with earnings. In law, maximum Savings Credit is 60% of the gap between the guarantee and the threshold, and DWP describes protected Housing Benefit allowances as the guarantee plus maximum Savings Credit. The guarantee's link to earnings does not set these amounts' future paths. Projecting these amounts from the guarantee instead of CPI could change the Pension Credit, Housing Benefit and council tax reduction offsets under both rules.
- The OBR publishes no May to July earnings forecast, so the Pension Credit guarantee's rises from April 2028 to April 2031 follow its April to June figure, as the Triple Lock's earnings input does.
- The model splits each reported State Pension into a flat-rate part, up to the full basic or new rate, and anything above it, which rises with CPI under both rules. Where a pension falls short of the full rate, the model scales all of it with the flat rate, including any Graduated Retirement Benefit or extra pension for deferring. In law those parts rise with prices: in April 2025, they rose 1.7% while the basic State Pension rose 4.1% ([DWP](https://www.gov.uk/government/publications/benefit-and-pension-rates-2025-to-2026/benefit-and-pension-rates-2025-to-2026)). They would rise the same under both rules, so scaling them overstates the saving.
- We hold rents and council tax at their 2030 levels after 2030 and do not adjust dividend, property, savings or self-employment income to the scenario.
- Nobody changes how much they work, save or claim in response to the adjusted Triple Lock.
- We calculate costs for the UK in cash terms and use our figures for Great Britain to compare with DWP.

</details>

---

_Analysis by PolicyEngine. We publish the code, results and replication steps on [GitHub](https://github.com/PolicyEngine/uk-triple-lock)._
