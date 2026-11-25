<!-- TODO: replace paper links with the SSRN URL once posted -->

How much less would the government spend on the State Pension under the adjusted Triple Lock? The [Autumn Budget 2026](https://www.gov.uk/government/publications/budget-2026-document/budget-2026-html#box-5atriple-lock-adjustment175) keeps the Triple Lock until April 2029 and adjusts it from April 2030. The Budget says the cost of the State Pension depends on which of prices, earnings or 2.5% is highest each year.

In a new [PolicyEngine working paper](https://www.policyengine.org/uk/triple-lock/paper/), "Pension indexation under forecast uncertainty: the fiscal saving from reforming the UK triple lock", we estimate that saving for the UK to 2039-40 with PolicyEngine UK ([Ahmadi et al., 2026](https://doi.org/10.21105/joss.11115)) and state the uncertainty around it. Our [earlier post](https://www.policyengine.org/uk/research/uk-triple-lock-budget-2026) explains the rule and reports two scenarios built on Office for Budget Responsibility (OBR) paths. The paper adds a replay of the rule on past data and a Bayesian forecast of prices and earnings, which starts from prior assumptions (priors) about its parameters and updates them with data.

Key results (UK, cash terms, 2039-40 unless stated; gross means before tax and benefits respond, net means after):

- **Replay.** Had the adjusted rule started in April 2012, the State Pension in 2026-27 would be 6.2% lower than under the Triple Lock.
- **Forecast.** The median gross saving is about £9 billion, and 46.6% of simulated paths save more than £10 billion.
- **After tax and benefits.** The median net saving is about £6.4 billion, and 29.4% of paths save more than £10 billion net.
- **Households.** On paths near the median saving, households that lose income have £681 a year less on average.
- **OBR paths.** The rule saves £0.5 billion gross on the OBR's central path and £10.9 billion gross on a path we build from the OBR's long-term assumption.

The forecast's shares hold under the forecast model, its priors and forecast errors over 2027–38 as large as those of 2011–26. We designed the model after two earlier models failed tests we had registered in advance, and it has passed no test.

## The rule and where the saving comes from

From April 2030, the adjusted Triple Lock still raises the State Pension each year by at least inflation and 2.5%. It drops earnings growth as a minimum and instead returns the pension towards its April 2029 value relative to earnings.

The two rules pay the same rise whenever earnings growth is highest. They part only after a year in which inflation or 2.5% exceeds earnings growth. Suppose inflation is 6% and earnings growth 2% in one year, then 2% and 4% in the next. The Triple Lock rises 6% and then 4%. The adjusted Triple Lock rises 6% and then the 2.5% minimum, and ends 1.4% below the Triple Lock.

The rule therefore saves only when earnings outgrow prices after trailing them, so the order of years sets the saving, as well as average growth.

## The rule on past data

We replay both rules on past inflation and earnings figures as published today. For April 2022, when the law suspended the earnings link, the replay grows the earnings benchmark by that year's inflation.

Had the adjusted rule started in any April from 2012 to 2015, the State Pension in 2026-27 would be 6.2% lower than under the Triple Lock. The full new State Pension would be £11,769 a year, against the £12,548 paid. From April 2012, the rule removes 42% of the Triple Lock's rise above earnings, or 63% measured against published earnings in April 2022.

Most of the difference follows April 2023, when inflation of 10.1% set a rise 4.6 percentage points above earnings growth of 5.5%. Started in April 2024 or later, the rule would have paid the same as the Triple Lock, because earnings growth has been highest in every April since.

![The adjusted Triple Lock replayed on past figures. Left: each April's rise under the two rules, for a start in April 2012 to 2015. Right: the adjusted rule's pension level against the Triple Lock's, by start year.](/assets/posts/uk-triple-lock-paper/replay.png)

Source: PolicyEngine working paper, Figure 2 and Table 1. We apply both rules to Office for National Statistics (ONS) inflation and earnings figures as revised to date, without running the tax-benefit model.

## A forecast of the saving

The forecast models how far inflation and earnings growth fall from an official forecast path. In the model, each year's deviation depends on the previous year's, and a few years, like 2021–23, are several times as volatile as the rest. We fit it to the OBR's forecast errors one to four years ahead for 2011–26 and simulate 399,440 paths around the OBR central path. We apply both rules to each path.

![Forecast gross saving from the adjusted Triple Lock, 2030-31 to 2039-40, UK, cash terms, before tax and benefits respond. The solid line is the median of 399,440 simulated paths and the shaded bands cover the 25th to 75th and 5th to 95th percentiles.](/assets/posts/uk-triple-lock-paper/forecast-fan.png)

Source: PolicyEngine working paper, Figure 3 (PolicyEngine/uk-triple-lock, data/b1/forecast.json). Conditional on the model, its priors and forecast errors over 2027–38 as large as those of 2011–26.

In 2034-35 the median gross saving is £1.5 billion, and 95% of paths save £9.4 billion or less. In 2039-40 the median is £9.2 billion, half of the paths lie between £4.0 billion and £15.9 billion, and 95% save £28.2 billion or less. The spread widens each year because a gap between the rules never closes once it opens.

The dashed line is the OBR central path, on which the rule saves £0.5 billion in 2039-40. The paths are centred on that path, so the forecast's saving comes from year-to-year movement in which index leads. A path on which the Triple Lock rises faster also has a larger pension to save on. The dotted line removes that effect, and its median is £8.2 billion.
![Share of simulated paths in each £1 billion band of gross saving in 2039-40, with the median and the 25th and 75th percentiles. The diamond marks the share of paths with no saving.](/assets/posts/uk-triple-lock-paper/forecast-distribution.png)

Source: PolicyEngine working paper, Figure 4. Conditional on the model, its priors and forecast errors over 2027–38 as large as those of 2011–26.

| Saving in 2039-40             | Median       | Paths above £5 billion | Paths above £10 billion |
| ----------------------------- | ------------ | ---------------------- | ----------------------- |
| Gross                         | £9.2 billion | 70.2%                  | 46.6%                   |
| Net, after tax and benefits   | £6.4 billion | 59.4%                  | 29.4%                   |

On 8.0% of paths the two rules pay the same in every year.

## What the forecast rests on

The paper changes one feature of the forecast at a time. Every such run puts the median gross saving in 2039-40 between £6.7 billion and £10.6 billion.

- **The record of errors.** Without the errors of 2021–23, the median is £6.8 billion and 34% of paths save more than £10 billion. With shocks the size of the year-to-year variation in past inflation and earnings growth, in place of forecast errors, the median is £8.0 billion.
- **Priors.** The record of forecast errors stops four years ahead, so later years rest on priors and on how long the model estimates that deviations last. Most single changes to the priors put the median between £8.6 billion and £9.9 billion, and a much wider prior on long-run growth gives £7.2 billion. The priors alone, with no data, give £6.9 billion.
- **Measures of growth.** The OBR forecasts calendar-year growth, while the rules use September inflation and May to July earnings growth. Fitting the model to errors on a calendar-year basis lowers the median by £2.5 billion, though another way of modelling the difference gives a median of £10.6 billion.
- **Earnings falls.** The model treats shortfalls and overshoots as equally likely, which gives falls in nominal earnings in 14.6% of simulated years, against one year in 37 since 1989. Bounding that tail lowers the median to between £7.0 billion and £8.3 billion.

Dropping 2021–23, using calendar-year errors and bounding earnings falls each lower the median. We have not run them together.

## OBR paths and official estimates

The OBR central path follows the OBR's October 2026 forecast and its long-term projections. The OBR long-term path is our construction: it keeps those inputs and raises the Triple Lock by the OBR's long-term assumption, earnings growth plus 0.6 percentage points, phased in from April 2032.

| Path or forecast                       | Gross saving, 2039-40 | Net saving, 2039-40 |
| -------------------------------------- | --------------------- | ------------------- |
| Forecast median                        | £9.2 billion          | £6.4 billion        |
| OBR central path                       | £0.5 billion          | £0.3 billion        |
| OBR long-term path                     | £10.9 billion         | £7.3 billion        |

The Budget cites the Department for Work and Pensions (DWP) estimate of £15 billion in 2039-40. That figure is direct spending in cash terms for Great Britain, rounded to the nearest billion, and leaves out tax and debt interest. Of the forecast's paths, which cover the UK, 28% save more than £15 billion gross. The comparison is not like-for-like: a UK figure is larger than a Great Britain one, which raises the share, and our data count less State Pension spending than DWP's, which lowers it.

In method, DWP's costing is closest to the OBR long-term path. Scaled to DWP's spending in Great Britain, that path saves £10.8 billion to £11.3 billion gross, so it does not reproduce £3.2 billion to £4.7 billion of DWP's figure. We do not know DWP's uprating path and have not tested possible sources of the difference.

## From gross to net, and households

With a lower pension, pensioners pay less income tax and receive more means-tested benefits. On the OBR long-term path, lower income tax offsets £2.4 billion of the £10.9 billion gross saving in 2039-40, extra Pension Credit £0.8 billion and other benefits and taxes £0.3 billion, leaving £7.3 billion net.

For the forecast, we run PolicyEngine UK in full under both rules on a sample of 100 of its paths. Net saving is 0.67 to 0.71 of gross saving in every run. Applying those ratios to all paths gives a median net saving of about £6.4 billion. We did not register that estimator before the runs. The one we registered, the weighted median of the 100 runs, gives £6.7 billion.

The reduction in spending is lower income for households that receive a State Pension, about 30% of households. On paths near the median gross saving, households that lose income have £681 a year less on average (95% interval £648 to £713). On the OBR long-term path the figure is £801, and on the OBR central path £35.

The remaining household results come from single runs, not from the forecast. On the OBR long-term path in 2039-40, the fall in income is largest in the third income decile, at 0.56% of income.

```chart
{
  "type": "bar",
  "title": "Change in household income under the adjusted Triple Lock by income decile, 2039-40",
  "subtitle": "OBR long-term path, UK. Total change in each decile's net income against the Triple Lock, as a share of its income. Deciles rank people by household income before housing costs, adjusted for household size.",
  "xKey": "decile",
  "series": [{ "key": "change", "name": "Change in income", "color": "primary" }],
  "data": [
    { "decile": "1", "change": -0.35 },
    { "decile": "2", "change": -0.46 },
    { "decile": "3", "change": -0.56 },
    { "decile": "4", "change": -0.52 },
    { "decile": "5", "change": -0.48 },
    { "decile": "6", "change": -0.36 },
    { "decile": "7", "change": -0.33 },
    { "decile": "8", "change": -0.22 },
    { "decile": "9", "change": -0.15 },
    { "decile": "10", "change": -0.06 }
  ],
  "legend": false,
  "yLabel": "Change in income",
  "format": { "decimals": 2, "suffix": "%" },
  "source": "Source: PolicyEngine UK 2.151.0 on Microcosm UK 2024-25 (PolicyEngine/uk-triple-lock, data/results.json; working paper, Figure 8). A single run, with the Pension Credit guarantee rising with earnings under both rules."
}
```

Pension Credit makes up a lower pension for those who claim its guarantee, and the State Pension is a smaller share of higher incomes.

On the same path, pensioner poverty after housing costs is 0.70 percentage points higher against a fixed poverty line and 0.75 points higher against a relative one. Relative poverty among everyone is 0.16 points lower, because the lower pension lowers the median income that sets the line. On the OBR central path, no poverty measure changes by more than 0.03 points.

These poverty changes carry no sampling margin, and we have not benchmarked the model's poverty levels. All household results assume the Pension Credit guarantee rises with earnings under both rules. If it instead rose with the State Pension under each rule, the losses of Pension Credit recipients and the poverty changes would be larger, and we do not estimate them.

## The forecast's status

Before scoring any model of prices and earnings, we registered a test against past OBR forecasts. Two models failed it. The first expected earnings growth below 2.5% in 44.6% of the test's years, against 17.9% in practice. The second scored 1.295 times the first on a measure of how yearly gaps move together, against a limit of 1.25. Its registration said that if it failed, the paper would report scenarios only.

We designed the Bayesian forecast after both failures and after seeing the whole record of forecast errors. It sets no pass rule and has passed no test. It departs from the registered scenarios-only fallback by our decision, and both failed verdicts stand. When we refit it without the years it is scored on and score it as we scored the first two, it meets every limit but the one on the share of years with earnings growth below 2.5%.

## Limitations

The runs hold behaviour fixed, leave out indirect taxes and carry forward today's pensioners' entitlements.

## Conclusion

On the two OBR paths the rule removes all of the Triple Lock's rise above earnings, on the replay from April 2012 42%, and on the forecast's paths about a third by 2039-40. The forecast puts the median saving in 2039-40 at about £9 billion gross and £6.4 billion net, conditional on the model, its priors and forecast errors as large as those of 2011–26.

The full paper is available [on policyengine.org](https://www.policyengine.org/uk/triple-lock/paper/), with all code and results in the [uk-triple-lock repository](https://github.com/PolicyEngine/uk-triple-lock).
