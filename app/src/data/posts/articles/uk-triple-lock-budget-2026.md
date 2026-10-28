The [Budget](https://www.gov.uk/government/publications/budget-2026-document/budget-2026-html#box-5atriple-lock-adjustment175) on 28 October 2026 set out how the government will change the State Pension Triple Lock. The Triple Lock continues through April 2029. From April 2030, "the State Pension rises each year by the highest of 2.5%, inflation, or the amount required to maintain its value relative to earnings as reached in April 2029." The government estimates that its adjusted Triple Lock reduces State Pension spending by £15 billion a year by the late 2030s and £50 billion a year by the late 2040s, and says the savings will help build a National Care Service in England that provides older people with personal care free at the point of use.

Prime Minister Andy Burnham announced the change at Labour's conference on 29 September. Our [Triple Lock dashboard](https://www.policyengine.org/uk/triple-lock) simulates 50,000 paths of prices and earnings and runs a weighted sample of them through PolicyEngine UK under both rules. Until its next release, the dashboard calls the policy by its earlier name, the Burnham plan. Every PolicyEngine figure below comes from the dashboard's pre-Budget release, which uses the March 2026 forecast of the Office for Budget Responsibility (OBR). The figures are provisional, and we are rebuilding them on the Budget's inputs.

Key findings for 2039-40, before the Budget, in cash terms for the UK:

- The adjusted Triple Lock saves £11.1 billion on average across the paths, or £7.9 billion once income tax and benefits respond. In Great Britain, the area the government's figure covers, the gross saving is £10.8 billion.
- The saving comes from the years when inflation or 2.5% beats earnings growth. On the OBR's central path, where earnings growth leads every year after April 2031, it is £0.9 billion. The middle 80% of paths save between £3.9 billion and £18.9 billion.
- The full new State Pension is £931 a year lower on average than under the Triple Lock.
- 27% of UK households lose more than £1 a year, mostly pensioner households.

[Explore the dashboard](https://www.policyengine.org/uk/triple-lock) | [Read the code](https://github.com/PolicyEngine/uk-triple-lock)

## What changes in April 2030

Each April, the Triple Lock raises the basic and new State Pension by the highest of three figures from the year before: September's CPI inflation, earnings growth over May to July, and 2.5%. The Budget and DWP's [Triple Lock reform factsheet](https://www.gov.uk/government/publications/state-pension-uprating-analysis-2026/triple-lock-reform-factsheet), updated 6 October, set out the government's adjusted Triple Lock. It keeps inflation and 2.5% as minimum rises and replaces earnings growth with a floor on the pension's level: the pension's value relative to earnings as reached in April 2029 becomes a minimum, and each year's rise must keep the pension at or above it.

DWP's factsheet measures inflation by the consumer price index, and neither document names the CPI month or the earnings measure. We use the ones the Triple Lock uses now, September CPI and May to July growth in average weekly earnings, and we read "its value relative to earnings as reached in April 2029" as the pension's 2029-30 level.

While the pension sits at its April 2029 ratio to earnings, the two rules pay the same rise every year. They part after a year in which inflation or 2.5% beats earnings growth. That rise lifts the pension above its ratio to earnings under both rules, and the Triple Lock keeps the lift for good. When earnings growth next leads, the adjusted Triple Lock pays the higher of inflation and 2.5% while the pension stays above its floor, and in the year earnings catch up, just enough to bring the pension back to it.

On the OBR's central path, earnings growth runs below 2.5% in the inputs to the rises of April 2028 to April 2031, so both rules raise the pension by 2.5% in each of those years. The rises of April 2028 and 2029 come before the switch and set the 2029-30 level that the adjusted Triple Lock protects. The rises of April 2030 and 2031 lift the pension above it. In April 2032, earnings growth of 2.7% sets the Triple Lock's rise, while the adjusted Triple Lock pays 2.5%. In April 2033, the Triple Lock pays 3.0% and the adjusted Triple Lock pays 2.8%, the rise that takes the pension back to its earnings path. From then on the two rise together, and in 2039-40 the adjusted Triple Lock pays a full new State Pension of £18,639 a year against the Triple Lock's £18,712, £73 lower.

## The ratchet

The Budget says the change "removes the 'ratchet' effect, whereby the State Pension rises ever higher relative to earnings." Replaying the Triple Lock on the latest ONS figures for the 16 rises from April 2011 to April 2026, September CPI set the rise six times, earnings growth six times and the 2.5% floor four times. Over those 16 rises the pension grew 88%, against 66% for earnings and 60% for prices, leaving it 13% higher than an earnings link alone would have.

The same replay shows what the adjusted Triple Lock would have changed. Had it started in April 2012, the full new State Pension would be £11,758 a year in 2026-27, 6.3% below the £12,548 paid. Full PolicyEngine UK runs put the saving from that lower pension at £7.3 billion in 2026-27, or £5.2 billion net of tax and benefits. In April 2022, when Parliament suspended the earnings link, both rules use CPI.

## What it saves

Averaged across 50,000 simulated paths of prices and earnings, the adjusted Triple Lock saves £3.2 billion in 2034-35 and £11.1 billion in 2039-40, or £2.3 billion and £7.9 billion net of tax and benefits. It first pays less in 2031-32.

The Budget notes that under the Triple Lock, spending "depends on which of prices, earnings or 2.5% is highest in each year, and on how those differences compound over time." The saving depends on the same things, so we average over many paths. A monthly model of CPI and earnings, fitted to 2000 to 2026 without the furlough months, simulates 50,000 paths whose average calendar-year CPI and earnings growth match the OBR's central path in every year: its March 2026 forecast to 2030 and its long-term projections after. We run 160 of those paths through PolicyEngine UK under both rules and weight them to stand for all 50,000.

```chart
{
  "type": "bar",
  "title": "Saving from the adjusted Triple Lock against the Triple Lock, 2031-32 to 2039-40",
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

On the OBR's central path, earnings growth leads every year after April 2031, so the rules differ only through the catch-up described above, and the saving in 2039-40 is £0.9 billion. Simulated paths swap the lead more often. Each year that inflation or 2.5% beats earnings growth lifts the Triple Lock's pension for good, while the adjusted Triple Lock waits for earnings to catch up. Because the saving comes from those years, the saving on the central path is far below the average across paths: £0.9 billion against £11.1 billion.

The OBR's March 2026 long-term projections assume the Triple Lock raises the pension 0.6 points a year faster than earnings. On our paths, the Triple Lock beats May to July earnings growth by 0.55 points a year in the rises of April 2034 to April 2039, while the adjusted Triple Lock rises 0.08 points a year more slowly than earnings. Applying the OBR's assumption to the Triple Lock on the central path gives a saving of £10.3 billion in 2039-40. Shifting earnings growth half a point up or down from 2031 moves the average to £11.0 billion or £10.4 billion.

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
    { "scenario": "OBR central path", "gross": 0.9, "net": 0.6 },
    { "scenario": "OBR long-term Triple Lock assumption", "gross": 10.3, "net": 7.3 },
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

With a lower State Pension, pensioners pay less income tax and receive more means-tested benefits. Of the £11.1 billion fall in State Pension spending in 2039-40, lower income tax receipts offset £2.5 billion, higher Pension Credit £0.6 billion, and higher Housing Benefit, council tax reduction and other payments £0.2 billion, leaving a net saving of £7.9 billion (figures are rounded).

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

In the model, Housing Benefit and council tax reduction respond only for households already claiming them, so nobody the adjusted Triple Lock makes newly eligible starts claiming. That understates those offsets and so overstates the net saving.

## Against the official estimates

The government's figure comes from the Department for Work and Pensions' [State Pension uprating analysis](https://www.gov.uk/government/publications/state-pension-uprating-analysis-2026/state-pension-uprating), which costs the adjusted Triple Lock at £15 billion in 2039-40 and £50 billion in 2049-50, in cash terms. It covers direct spending in Great Britain and excludes effects on tax and debt interest, so the closest of our figures is the gross saving in Great Britain: £10.8 billion in 2039-40.

The two estimates differ in method, and DWP's published assumptions do not allow a like-for-like comparison ([HL3774](https://questions-statements.parliament.uk/written-questions/detail/2026-10-05/hl3774)):

- DWP projects the population and each person's pension with Pensim3, its dynamic microsimulation model. We reweight today's Family Resources Survey households to the ONS population projection by age and sex, holding each person's age fixed.
- Our survey counts less State Pension in payment than DWP does: £125.9 billion in Great Britain in 2026-27, against DWP's £148.3 billion, both excluding payments abroad. The adjusted Triple Lock lowers every basic and new State Pension by the same proportion and leaves the additional State Pension alone, so the saving scales with the basic and new State Pension bill. DWP publishes that bill only with payments abroad included, and its tables stop in 2030-31, so we cannot match it exactly or say how the gap looks in 2039-40.
- DWP's figure rests on one path of uprating, which it does not state. Ours is an average across simulated paths. On the two fixed paths we run, our UK saving is £0.9 billion on the OBR's central path and £10.3 billion when the Triple Lock follows the OBR's long-term assumption.

Our projections end in 2039-40, so we have no figure to set against the £50 billion.

The OBR's October 2026 [Economic and fiscal outlook](https://www.gov.uk/government/publications/october-2026-economic-and-fiscal-outlook) builds the adjusted Triple Lock into its forecast from 2030-31, but finds that it "does not currently affect state pension costs over the forecast period", because 2.5% applies under both rules in 2030-31 and 2031-32 (paragraph 3.50 and its footnote 17). Our central path, on the OBR's March forecast, also raises the pension by 2.5% under both rules in April 2030 and April 2031, and saves nothing until 2032-33. Averaged across our paths, the saving starts in 2031-32, at £0.2 billion.

The OBR gives no figure for 2039-40. It replays both rules on prices and earnings since 1990, finding State Pension payments 1.4% lower each year on average than under the Triple Lock (paragraph 3.51). That replay sets the floor at the pension's 1990 value relative to earnings and averages over every year since, so its 1.4% does not compare directly with our 6.3% for 2026-27 from a 2012 start. The OBR also estimates provisionally that if the next 50 years resembled the last 35, the change would leave debt in 2075-76 around 25% of GDP lower than keeping the Triple Lock, and notes that the overall effect on the public finances depends on the cost of the government's planned expansion of social care (paragraphs 3.52 to 3.54).

## Who has less income

In 2039-40, 27% of UK households lose more than £1 a year under the adjusted Triple Lock, mostly pensioner households, and the share barely moves across the middle 80% of paths. The size of the loss varies. On the dashboard's typical path, selected near the median of the simulated pension gap, the adjusted Triple Lock saves £10.3 billion in 2039-40 and the full new State Pension is £867 a year lower. Pensioner couples have £1,122 a year less on average, 1.5% of their income, and single pensioners £418 less, 1.1%. As a share of income, households in the second and third income deciles lose most.

```chart
{
  "type": "bar",
  "title": "Change in household income by income decile, 2039-40",
  "subtitle": "Adjusted Triple Lock against the Triple Lock, on the typical path (selected near the median pension gap). Percent of household net income.",
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

After tax and benefits, the pensioner with a private pension loses £694, 80% of the cut in their State Pension, since only income tax falls. The homeowner on the State Pension alone loses £434, half the cut: the lower pension brings them under the Pension Credit guarantee, and receiving guarantee credit brings full council tax reduction with it. For the council tenant, guarantee credit also brings full Housing Benefit, and the extra Housing Benefit, council tax reduction and Pension Credit, together with £173 less income tax, outweigh the £867. The 90-year-old on the old basic State Pension already receives guarantee credit, which rises by the full £664; their savings credit, which pays more the further their income sits above a threshold, falls by £141.

On the high-saving path, selected near the 90th percentile of the pension gap, the full new State Pension is £1,552 a year lower. The pensioner with a private pension has £1,241 less, and the council tenant £1,390 more.

## How uncertain the saving is

The middle 80% of simulated paths save between £3.9 billion and £18.9 billion in 2039-40, or £2.7 billion to £13.4 billion net. On 0.79% of paths the two rules pay the same every year and save nothing. That spread comes from one model of prices and earnings and describes variation within it; it is not a forecast probability. Tested on six past OBR forecasts, the model's range contained the outcome in 4 of 6 final years and 80% of annual checks.

Weighting the same runs to match how much the gap between earnings growth and inflation varied in past periods, and how often the lead switched, gives estimates between £8.3 billion and £12.4 billion, or £5.9 billion to £8.8 billion net. These weightings were more biased in our tests on past forecasts, so we report them as sensitivities. Six others rest on too few runs to report; all six give estimates below the average. With 160 full runs, the average carries a sampling error of about ±£0.1 billion within the model.

## These figures predate the Budget

The figures above come from the dashboard's pre-Budget release. It uses the OBR's March 2026 forecast, with August 2026 CPI standing in for September's in the April 2027 rise, and runs on policyengine.py 6.2.6 with the Enhanced Family Resources Survey 2024-25. The average is provisional and model-conditional: the model of prices and earnings passed its test on past OBR forecasts in a dry run on pre-Budget data, and the binding test uses the Budget's forecasts.

We are rebuilding the analysis on the Budget's inputs, with a newer release of PolicyEngine UK and Microcosm UK as its primary data. The rebuild takes the OBR's October 2026 forecast to 2030 and its March 2026 long-term assumptions after, labelled as such, and we will rerun the years after 2030 when the OBR updates those assumptions. The rebuilt figures may differ from these. If the model of prices and earnings fails the binding test, the rebuild drops the average across all simulated paths and reports only the scenarios: the OBR central path, the OBR's long-term Triple Lock assumption, a replay of the last ten years and the shifted earnings paths.

<details>
<summary style="font-size: clamp(1.75rem, calc((100vw - 768px) * 1000), 2rem); font-weight: 600; line-height: 1.3; margin: 28px 0 20px; padding-bottom: 6px; border-bottom: 1px solid var(--border-light, #e2e8f0); cursor: pointer;">Methodology and limitations</summary>

### The rules

Both rules follow the Triple Lock until April 2029: each April the basic and new State Pension rise by the highest of September CPI, May to July growth in average weekly earnings (total pay) and 2.5%, with each input taken to 0.1 point. From April 2030 the adjusted Triple Lock raises the pension by the higher of September CPI and 2.5%, or by more where needed to keep it at its 2029-30 level grown by earnings since; that top-up is rounded up to 0.1 point. Only the basic and new State Pension differ between the rules. Under both, the additional State Pension rises with September CPI and the Pension Credit guarantee with May to July earnings.

### Prices and earnings

The central path takes the OBR's [March 2026 Economic and fiscal outlook](https://obr.uk/efo/economic-and-fiscal-outlook-march-2026/) to 2030 and its [long-term economic determinants](https://obr.uk/docs/dlm_uploads/Long-term-economic-determinants-March-2026-EFO.xlsx) after, which the OBR describes as a projection rather than a forecast. The simulated paths come from a monthly statistical model of CPI and average weekly earnings (a vector autoregression), fitted to 2000 to 2026 without the furlough months, with shocks resampled from its past errors. Every path is shifted by the same amount so that the average across paths matches the OBR's calendar-year CPI and earnings growth. We group the 50,000 paths by their 2039-40 pension gap, run 160 in full, more from groups where the gap varies most, and weight each group by its share of paths.

### Model and data

Every fiscal and household figure is a full run of PolicyEngine UK (policyengine.py 6.2.6, policyengine-uk 2.125.1) on the Enhanced Family Resources Survey 2024-25 (policyengine-uk-data 1.58.0). Each path's CPI and earnings replace the model's own forecasts, so CPI-uprated benefits, CPI-indexed thresholds and employment income follow it. The net saving is the change in the government's balance across every tax and benefit the model covers.

### Population

The survey households are reweighted each year after 2025 so that each age and sex group grows as in the ONS 2024-based population projection. Each person keeps the age they have in the survey, with ages above the survey's top code of 80 spread using ONS shares. State Pension type follows birth cohort: basic for people who reached State Pension age before 6 April 2016, new after. The model does not simulate deaths, migration or contribution records, and later retirees' pensions come from today's records of the same age. Pensioners living abroad are outside the survey.

### Limitations

- Housing Benefit and council tax reduction respond only for households already claiming them, which overstates the net saving.
- In the survey runs, rents and council tax stay at their 2030 levels after 2030, and dividend, property, savings and self-employment income do not follow the path.
- Nobody changes how much they work, save or claim in response to the adjusted Triple Lock.
- Costs are for the UK in cash terms; comparisons with DWP use our figures for Great Britain.
- Household weights sit 0.44% below their calibrated levels in every year ([policyengine-uk-data#538](https://github.com/PolicyEngine/policyengine-uk-data/issues/538)).

</details>

---

_Analysis by PolicyEngine. The code, results and replication steps are on [GitHub](https://github.com/PolicyEngine/uk-triple-lock)._
