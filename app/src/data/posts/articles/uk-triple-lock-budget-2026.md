The [Budget](https://www.gov.uk/government/publications/budget-2026-document/budget-2026-html#box-5atriple-lock-adjustment175) on 28 October 2026 set out how the government will change the State Pension triple lock. The triple lock continues through April 2029. From April 2030, "the State Pension rises each year by the highest of 2.5%, inflation, or the amount required to maintain its value relative to earnings as reached in April 2029." The government estimates that this adjusted triple lock reduces State Pension spending by £15 billion a year by the late 2030s and £50 billion a year by the late 2040s, and says the savings will help build a National Care Service in England that provides older people with personal care free at the point of use.

Prime Minister Andy Burnham announced the change at Labour's conference on 29 September. Our [triple lock dashboard](https://www.policyengine.org/uk/triple-lock), which calls the policy the Burnham plan, simulates 50,000 paths of prices and earnings and runs a weighted sample of them through PolicyEngine UK under both rules. Every PolicyEngine figure below comes from the dashboard's pre-Budget release, which uses the OBR's March 2026 forecast. The figures are provisional, and we are rebuilding them on the Budget's inputs.

Key findings for 2039-40, before the Budget, in cash terms for the UK:

- The adjusted triple lock saves £11.1 billion on average across the paths, or £7.9 billion once income tax and benefits respond. In Great Britain, the area the government's figure covers, the gross saving is £10.8 billion.
- The saving comes from the years when inflation or 2.5% beats earnings growth. On the OBR's central forecast, where earnings growth comes out on top almost every year, it is £0.9 billion. The middle 80% of paths save between £3.9 billion and £18.9 billion.
- The full new State Pension is £931 a year lower on average than under the triple lock.
- 27% of UK households have less income, mostly pensioner households.

[Explore the dashboard](https://www.policyengine.org/uk/triple-lock) | [Read the code](https://github.com/PolicyEngine/uk-triple-lock)

## What changes in April 2030

Each April, the triple lock raises the basic and new State Pension by the highest of three figures from the year before: September's CPI inflation, earnings growth over May to July, and 2.5%. The adjusted triple lock keeps inflation and 2.5% as minimum rises. It replaces earnings growth with a floor on the pension's level: the pension's value relative to earnings in April 2029 becomes a minimum, and each year's rise must keep the pension at or above it.

The Budget does not name the measures of inflation and earnings. We use the ones the triple lock uses now, September CPI and May to July growth in average weekly earnings, and we read "its value relative to earnings as reached in April 2029" as the pension's 2029-30 level.

While the pension sits at its April 2029 ratio to earnings, the two rules pay the same rise every year. They part after a year in which inflation or 2.5% beats earnings growth. That rise lifts the pension above its ratio to earnings under both rules, and the triple lock keeps the lift for good. When earnings growth next leads, the adjusted triple lock pays only the higher of inflation and 2.5% until earnings have caught up with the pension.

On the OBR's central forecast, earnings growth runs below 2.5% in the inputs to the rises of April 2028 to April 2031, so both rules raise the pension by 2.5% in each of those years. The rises of April 2028 and 2029 come before the switch and set the 2029-30 level that the adjusted triple lock protects. The rises of April 2030 and 2031 lift the pension above it. In April 2032, earnings growth of 2.7% sets the triple lock's rise, while the adjusted triple lock pays 2.5%. In April 2033, the triple lock pays 3.0% and the adjusted triple lock pays 2.8%, the rise that takes the pension back to its earnings path. From then on the two rise together, and in 2039-40 the adjusted triple lock pays a full new State Pension of £18,639 a year against the triple lock's £18,712, £73 lower.

## The ratchet

The Budget says the change "removes the 'ratchet' effect, whereby the State Pension rises ever higher relative to earnings." Replaying the triple lock on the latest ONS figures for the 16 rises from April 2011 to April 2026, September CPI set the rise six times, earnings growth six times and the 2.5% floor four times. Over those 16 rises the pension grew 88%, against 66% for earnings and 60% for prices, leaving it 13% higher than an earnings link alone would have.

The same replay shows what the adjusted triple lock would have changed. Had it started in April 2012, the full new State Pension would be £11,758 a year in 2026-27, 6.3% below the £12,548 paid. Full PolicyEngine UK runs put the saving from that lower pension at £7.3 billion in 2026-27, or £5.2 billion net of tax and benefits. In April 2022, when Parliament suspended the earnings link, both rules use CPI.

## What it saves

The Budget notes that under the triple lock, spending "depends on which of prices, earnings or 2.5% is highest in each year, and on how those differences compound over time." So does the saving. A monthly model of CPI and earnings, fitted to 2000 to 2026 without the furlough months, simulates 50,000 paths whose average matches the OBR's central path in every year: its March 2026 forecast to 2030 and its long-term projections after. We run 160 of those paths through PolicyEngine UK under both rules and weight them to stand for all 50,000.

The adjusted triple lock first pays less in 2031-32. Averaged across the paths, it saves £3.2 billion in 2034-35 and £11.1 billion in 2039-40, or £2.3 billion and £7.9 billion net of tax and benefits.

```chart
{
  "type": "bar",
  "title": "Saving from the adjusted triple lock against the triple lock, 2031-32 to 2039-40",
  "subtitle": "Average across 50,000 paths of prices and earnings, UK, £ billion in cash terms. Pre-Budget and provisional.",
  "xKey": "year",
  "series": [
    { "key": "gross", "name": "State Pension spending", "color": "primary" },
    { "key": "net", "name": "Net of tax and benefits", "color": "quinary" }
  ],
  "data": [
    { "year": "2031-32", "gross": 0.2, "net": 0.2 },
    { "year": "2032-33", "gross": 0.9, "net": 0.6 },
    { "year": "2033-34", "gross": 2.0, "net": 1.4 },
    { "year": "2034-35", "gross": 3.2, "net": 2.3 },
    { "year": "2035-36", "gross": 4.4, "net": 3.2 },
    { "year": "2036-37", "gross": 5.9, "net": 4.2 },
    { "year": "2037-38", "gross": 7.5, "net": 5.3 },
    { "year": "2038-39", "gross": 9.3, "net": 6.6 },
    { "year": "2039-40", "gross": 11.1, "net": 7.9 }
  ],
  "yLabel": "Saving",
  "format": { "decimals": 1, "prefix": "£", "suffix": "bn" },
  "source": "Source: PolicyEngine UK (policyengine.py 6.2.6, Enhanced FRS 2024-25), pre-Budget release of PolicyEngine/uk-triple-lock."
}
```

The OBR's central forecast is a smooth path. After April 2031 earnings growth leads in every year, so the rules differ only through the catch-up described above, and the saving in 2039-40 is £0.9 billion. Simulated paths swap the lead more often. Each year that inflation or 2.5% beats earnings growth lifts the triple lock's pension for good, while the adjusted triple lock waits for earnings to catch up. The saving never falls below zero, so bumpier paths save more, and the average across paths lies far above the saving on the average path.

The OBR's long-term projections assume the triple lock raises the pension 0.6 points a year faster than earnings. On our paths, the triple lock beats May to July earnings growth by 0.55 points a year in the rises of April 2034 to April 2039, while the adjusted triple lock rises 0.08 points a year more slowly than earnings. Applying the OBR's assumption to the triple lock on the central path gives a saving of £10.3 billion in 2039-40. Shifting earnings growth half a point up or down from 2031 moves the average to £11.0 billion or £10.4 billion.

```chart
{
  "type": "bar",
  "title": "Saving in 2039-40 by path of prices and earnings",
  "subtitle": "UK, £ billion in cash terms. Pre-Budget and provisional.",
  "xKey": "scenario",
  "series": [
    { "key": "gross", "name": "State Pension spending", "color": "primary" },
    { "key": "net", "name": "Net of tax and benefits", "color": "quinary" }
  ],
  "data": [
    { "scenario": "OBR central forecast", "gross": 0.9, "net": 0.6 },
    { "scenario": "OBR long-term triple lock assumption", "gross": 10.3, "net": 7.3 },
    { "scenario": "Average across paths", "gross": 11.1, "net": 7.9 },
    { "scenario": "Earnings 0.5 points lower from 2031", "gross": 10.4, "net": 7.4 },
    { "scenario": "Earnings 0.5 points higher from 2031", "gross": 11.0, "net": 7.7 }
  ],
  "yLabel": "Saving in 2039-40",
  "format": { "decimals": 1, "prefix": "£", "suffix": "bn" },
  "source": "Source: PolicyEngine UK, pre-Budget release of PolicyEngine/uk-triple-lock. The OBR rows are single runs; the others average the simulated paths."
}
```

### From gross to net

With a lower State Pension, pensioners pay less income tax and receive more means-tested benefits. Of the £11.1 billion fall in State Pension spending in 2039-40, lower income tax takes back £2.5 billion, more Pension Credit £0.6 billion, and more Housing Benefit, council tax reduction and other payments £0.2 billion, leaving a net saving of £7.9 billion (figures are rounded).

```chart
{
  "type": "waterfall",
  "title": "From the gross to the net saving, 2039-40",
  "subtitle": "Average across 50,000 paths, UK, £ billion in cash terms. Pre-Budget and provisional.",
  "panelKey": "measure",
  "steps": [
    { "key": "gross", "name": "State Pension spending", "kind": "level", "legend": "Saving", "color": "primary" },
    { "key": "income_tax", "name": "Income tax", "kind": "change", "legend": "Tax and benefits respond", "color": "negative" },
    { "key": "pension_credit", "name": "Pension Credit", "kind": "change", "legend": "Tax and benefits respond", "color": "negative" },
    { "key": "other", "name": "Housing Benefit and other", "kind": "change", "legend": "Tax and benefits respond", "color": "negative" },
    { "key": "net", "name": "Net saving", "kind": "level", "legend": "Saving", "color": "primary" }
  ],
  "data": [
    { "measure": "2039-40", "gross": 11.1369, "income_tax": -2.4591, "pension_credit": -0.6135, "other": -0.2033, "net": 7.861 }
  ],
  "format": { "decimals": 1, "prefix": "£", "suffix": "bn" },
  "source": "Source: PolicyEngine UK, pre-Budget release of PolicyEngine/uk-triple-lock. Housing Benefit and other: Housing Benefit, council tax reduction, Winter Fuel Payment, Universal Credit and other taxes and spending. Labels rounded; steps computed from unrounded figures."
}
```

In the model, Housing Benefit and council tax reduction respond only for households already claiming them, so nobody the adjusted triple lock makes newly eligible starts claiming. That understates those offsets and so overstates the net saving.

## Against the government's £15 billion

The government's figure comes from the Department for Work and Pensions' [State Pension uprating analysis](https://www.gov.uk/government/publications/state-pension-uprating-analysis-2026/state-pension-uprating), which costs the adjusted triple lock at £15 billion in 2039-40 and £50 billion in 2049-50, in cash terms. It covers direct spending in Great Britain and excludes effects on tax and debt interest, so the closest of our figures is the gross saving in Great Britain: £10.8 billion in 2039-40.

The two estimates differ in method, and DWP's published assumptions do not allow a like-for-like comparison ([HL3774](https://questions-statements.parliament.uk/written-questions/detail/2026-10-05/hl3774)):

- DWP projects the population and each person's pension with Pensim3, its dynamic microsimulation model. We reweight today's Family Resources Survey households to the ONS population projection by age and sex, holding each person's age fixed.
- Our survey counts less State Pension in payment than DWP: £125.9 billion in Great Britain in 2026-27, against DWP's £148.3 billion. The adjusted triple lock lowers every flat-rate pension by the same proportion, so a smaller bill gives a smaller saving in pounds.
- Our figure is an average across simulated paths of prices and earnings. On the OBR's central path alone, our UK saving is £0.9 billion.

Our projections end in 2039-40, so we have no figure to set against the £50 billion.

## Who has less income

In 2039-40, 27% of UK households have less income under the adjusted triple lock than under the triple lock, mostly pensioner households, and the share barely changes from path to path. The size of the loss does change. On the dashboard's typical path, the one at the median of the simulated pension gap, the adjusted triple lock saves £10.3 billion in 2039-40 and the full new State Pension is £867 a year lower. Pensioner couples have £1,122 a year less on average, 1.5% of their income, and single pensioners £418 less, 1.1%. As a share of income, households in the second and third income deciles lose most.

```chart
{
  "type": "bar",
  "title": "Change in household income by income decile, 2039-40",
  "subtitle": "Adjusted triple lock against the triple lock, on the typical path (median pension gap). Percent of household net income.",
  "xKey": "decile",
  "series": [{ "key": "change", "name": "Change in household income", "color": "primary" }],
  "data": [
    { "decile": "1", "change": -0.61 },
    { "decile": "2", "change": -0.77 },
    { "decile": "3", "change": -0.7 },
    { "decile": "4", "change": -0.48 },
    { "decile": "5", "change": -0.35 },
    { "decile": "6", "change": -0.35 },
    { "decile": "7", "change": -0.31 },
    { "decile": "8", "change": -0.23 },
    { "decile": "9", "change": -0.2 },
    { "decile": "10", "change": -0.07 }
  ],
  "yLabel": "Change in income",
  "format": { "decimals": 2, "suffix": "%" },
  "source": "Source: PolicyEngine UK, pre-Budget release of PolicyEngine/uk-triple-lock. Decile 1 has the lowest income."
}
```

On the same path, the share of pensioners in poverty after housing costs rises 0.6 percentage points on the absolute measure and 0.8 points on the relative measure.

### Four example pensioners

The dashboard also runs four hypothetical single pensioners through PolicyEngine UK, each claiming everything they are entitled to. Their private pensions, rents and council tax are set in 2026-27 terms and rise with prices. On the typical path in 2039-40:

| Pensioner                                                              | State Pension | Tax and benefits | Change in income |
| ---------------------------------------------------------------------- | ------------- | ---------------- | ---------------- |
| Aged 70, full new State Pension only, owns their home                  | −£867         | +£433            | −£434            |
| Aged 70, full new State Pension and £15,000 private pension, owns home | −£867         | +£173            | −£694            |
| Aged 70, full new State Pension only, council tenant at £120 a week    | −£867         | +£908            | +£41             |
| Aged 90, old basic State Pension only, council tenant at £120 a week   | −£664         | +£523            | −£141            |

The pensioner with a private pension keeps 80% of the loss, since only income tax falls. The homeowner on the State Pension alone keeps half: the lower pension brings them under the Pension Credit guarantee, and receiving guarantee credit brings full council tax reduction with it. For the council tenant, guarantee credit also brings full Housing Benefit, and the extra Housing Benefit, council tax reduction and Pension Credit, together with £173 less income tax, outweigh the £867. The 90-year-old on the old basic State Pension already receives guarantee credit, which rises by the full £664; their savings credit, which pays more the further their income sits above a threshold, falls by £141.

On the high-saving path at the 90th percentile, the full new State Pension is £1,552 a year lower. The pensioner with a private pension has £1,241 less, and the council tenant £1,390 more.

## How uncertain the saving is

The middle 80% of simulated paths save between £3.9 billion and £18.9 billion in 2039-40, or £2.7 billion to £13.4 billion net. On 0.79% of paths the two rules pay the same every year and save nothing. That spread comes from one model of prices and earnings and describes variation within it; it is not a forecast probability. Tested on six past OBR forecasts, the model's range contained the outcome in 4 of 6 final years and 80% of annual checks.

Weighting the same runs to match how much the gap between earnings growth and inflation varied in past periods, and how often the lead switched, gives estimates between £8.3 billion and £12.4 billion, or £5.9 billion to £8.8 billion net, counting the weightings that rest on at least 100 effective runs. Those weightings were more biased in our tests on past forecasts, so we report them as sensitivities. With 160 full runs, the average carries a Monte Carlo error of about ±£0.1 billion.

## These figures predate the Budget

The figures above come from the dashboard's pre-Budget release. It uses the OBR's March 2026 forecast, with August 2026 CPI standing in for September's in the April 2027 rise, and runs on policyengine.py 6.2.6 with the Enhanced Family Resources Survey 2024-25. The average is provisional and model-conditional: the model of prices and earnings passed its test on past OBR forecasts in a dry run on pre-Budget data, and the binding test uses the Budget's forecasts.

We are rebuilding the analysis on the Budget's inputs, with a newer release of PolicyEngine UK and Microcosm UK as its primary data, so the figures will move. If the model of prices and earnings fails the binding test, the rebuild reports only fixed scenarios, with no average across paths: the OBR central path, the OBR's long-term assumptions, a replay of the last ten years and the shifted earnings paths.

<details>
<summary style="font-size: clamp(1.75rem, calc((100vw - 768px) * 1000), 2rem); font-weight: 600; line-height: 1.3; margin: 28px 0 20px; padding-bottom: 6px; border-bottom: 1px solid var(--border-light, #e2e8f0); cursor: pointer;">Methodology and limitations</summary>

### The rules

Both rules follow the triple lock until April 2029: each April the basic and new State Pension rise by the highest of September CPI, May to July growth in average weekly earnings (total pay) and 2.5%, with each input taken to 0.1 point. From April 2030 the adjusted triple lock raises the pension by the higher of September CPI and 2.5%, or by more where needed to keep it at its 2029-30 level grown by earnings since; that top-up is rounded up to 0.1 point. Only the basic and new State Pension differ between the rules. Under both, the additional State Pension rises with September CPI and the Pension Credit guarantee with May to July earnings.

### Prices and earnings

The central path takes the OBR's [March 2026 Economic and fiscal outlook](https://obr.uk/efo/economic-and-fiscal-outlook-march-2026/) to 2030 and its [long-term economic determinants](https://obr.uk/docs/dlm_uploads/Long-term-economic-determinants-March-2026-EFO.xlsx) after, which the OBR describes as a projection rather than a forecast. The simulated paths come from a monthly vector autoregression on CPI and average weekly earnings, fitted to 2000 to 2026 without the furlough months, with bootstrapped shocks. Every path is shifted by the same amount so that the average across paths matches the OBR's calendar-year CPI and earnings growth. We group the 50,000 paths into strata by their 2039-40 pension gap, run 160 in full, more where the gap varies most, and weight each stratum by its share of paths.

### Model and data

Every fiscal and household figure is a full run of PolicyEngine UK (policyengine.py 6.2.6, policyengine-uk 2.125.1) on the Enhanced Family Resources Survey 2024-25 (policyengine-uk-data 1.58.0). Each path's CPI and earnings replace the model's own forecasts, so benefit rates, tax thresholds and earnings follow it. The net saving is the change in the government's balance across every tax and benefit the model covers.

### Population

The survey households are reweighted each year after 2025 so that each age and sex group grows as in the ONS 2024-based population projection. Each person keeps the age they have in the survey, with ages above the survey's top code of 80 spread using ONS shares. State Pension type follows birth cohort: basic for people who reached State Pension age before 6 April 2016, new after. The model does not simulate deaths, migration or contribution records, and later retirees' pensions come from today's records of the same age. Pensioners living abroad are outside the survey.

### Limitations

- Housing Benefit and council tax reduction respond only for households already claiming them, which overstates the net saving.
- In the survey runs, rents and council tax stay at their 2030 levels after 2030, and dividend, property, savings and self-employment income do not follow the path.
- Nobody changes how much they work, save or claim in response to the adjusted triple lock.
- Costs are for the UK in cash terms; comparisons with DWP use our figures for Great Britain.
- Household weights sit 0.44% below their calibrated levels in every year ([policyengine-uk-data#538](https://github.com/PolicyEngine/policyengine-uk-data/issues/538)).

</details>

---

_Analysis by PolicyEngine. The code, results and replication steps are on [GitHub](https://github.com/PolicyEngine/uk-triple-lock)._
