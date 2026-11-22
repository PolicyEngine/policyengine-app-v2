<!-- TODO: replace paper links with the SSRN URL once posted -->

How much less would the government spend on the State Pension under the adjusted Triple Lock? The [Autumn Budget 2026](https://www.gov.uk/government/publications/budget-2026-document/budget-2026-html#box-5atriple-lock-adjustment175) keeps the Triple Lock until April 2029 and adjusts it from April 2030. The Budget says the cost of the State Pension depends on which of prices, earnings or 2.5% is highest each year.

In a new [PolicyEngine working paper](https://www.policyengine.org/uk/triple-lock/paper/), "Pension indexation under forecast uncertainty: the fiscal saving from reforming the UK triple lock", we estimate that saving for the UK to 2039-40 and state the uncertainty around it. Our [earlier post](https://www.policyengine.org/uk/research/uk-triple-lock-budget-2026) explains the rule and reports two scenarios built on Office for Budget Responsibility (OBR) paths. The paper adds a formula for where the saving comes from, a replay of the rule on past data, and a Bayesian forecast of prices and earnings.

Key results (UK, cash terms, 2039-40 unless stated):

- **Replay.** Had the adjusted rule started in April 2012, it would have removed 42% of the Triple Lock's rise above earnings by 2026-27 (63% against published earnings for April 2022).
- **Forecast.** The median reduction in State Pension spending, before tax and benefits respond, is about £9 billion, and 46.6% of simulated paths save more than £10 billion. These shares hold under the forecast model, its priors and forecast errors over 2027–38 as large as those of 2011–26.
- **After tax and benefits.** The median net saving is about £6.4 billion.
- **Households.** On paths near the median saving, households that lose income have £681 a year less on average.
- **OBR paths.** The rule saves £0.5 billion on the OBR's central path and £10.9 billion on its long-term path, both before tax and benefits respond.

We designed the forecast model after two earlier models failed tests we had registered in advance. The forecast has passed no test, and we report it by our own decision.

## The rule and where the saving comes from

From April 2030, the adjusted Triple Lock still raises the State Pension each year by at least inflation and 2.5%. It drops earnings growth as a minimum and instead returns the pension towards its April 2029 value relative to earnings.

The two rules pay the same rise whenever earnings growth is highest. They part only after a year in which inflation or 2.5% exceeds earnings growth. The paper's two-year example shows the arithmetic. Suppose inflation is 6% and earnings growth 2% in the first year, then inflation 2% and earnings growth 4% in the second. The Triple Lock rises 6% and then 4%, or 10.24% in all. The adjusted Triple Lock rises 6% and then the 2.5% minimum, or 8.65% in all, and ends 1.4% below the Triple Lock.

The rule therefore saves only when earnings outgrow prices after trailing them, so the order of years sets the saving, as well as average growth. The paper derives a formula for the gap between the two rules.

## The rule on past data

We replay both rules on past inflation and earnings figures. For April 2022, when the law suspended the earnings link, the replay grows the earnings benchmark by that year's inflation. Started in April 2012, the adjusted rule removes 42% of the Triple Lock's rise above earnings by 2026-27. Measured against published earnings in April 2022, the share is 63%.

## A forecast of the saving

The forecast models how far inflation and earnings growth fall from an official forecast path. The model is a Bayesian vector autoregression with fat-tailed shocks, so that a few years, like 2021–23, are several times as volatile as the rest. We fit it to the OBR's forecast errors one to four years ahead for 2011–26 and simulate 399,440 paths around the OBR central path. We apply both rules to each path.

The chart shows the forecast's gross saving by year. The rules can first differ in April 2031, so neither saves in 2030-31.

```chart
{
  "type": "line",
  "title": "Forecast saving from the adjusted Triple Lock, 2030-31 to 2039-40",
  "subtitle": "Fall in State Pension spending against the Triple Lock, UK, £ billion in cash terms, before tax and benefits respond. Median and 25th to 75th percentiles of 399,440 simulated paths.",
  "xKey": "year",
  "xLabel": "Fiscal year starting in April (2039 is 2039-40)",
  "series": [
    { "key": "p75", "name": "75th percentile", "color": "secondary" },
    { "key": "p50", "name": "Median", "color": "primary" },
    { "key": "p25", "name": "25th percentile", "color": "quinary" }
  ],
  "data": [
    { "year": 2030, "p25": 0.0, "p50": 0.0, "p75": 0.0 },
    { "year": 2031, "p25": 0.0, "p50": 0.0, "p75": 0.0 },
    { "year": 2032, "p25": 0.0, "p50": 0.0, "p75": 1.0 },
    { "year": 2033, "p25": 0.0, "p50": 0.4, "p75": 2.5 },
    { "year": 2034, "p25": 0.0, "p50": 1.5, "p75": 4.2 },
    { "year": 2035, "p25": 0.2, "p50": 2.7, "p75": 6.1 },
    { "year": 2036, "p25": 0.9, "p50": 4.1, "p75": 8.2 },
    { "year": 2037, "p25": 1.8, "p50": 5.6, "p75": 10.5 },
    { "year": 2038, "p25": 2.8, "p50": 7.3, "p75": 13.1 },
    { "year": 2039, "p25": 4.0, "p50": 9.2, "p75": 15.9 }
  ],
  "yLabel": "Saving",
  "format": { "decimals": 1, "prefix": "£", "suffix": "bn" },
  "xFormat": { "decimals": 0 },
  "source": "Source: PolicyEngine Bayesian forecast of the uprating inputs (PolicyEngine/uk-triple-lock, data/b1/forecast.json). Conditional on the model, its priors and forecast errors over 2027–38 as large as those of 2011–26."
}
```

In 2039-40 the median gross saving is £9.2 billion, and half of the paths lie between £4.0 billion and £15.9 billion. On 8.0% of paths the two rules pay the same in every year. These figures are shares of paths drawn from the fitted model and its priors, conditional on forecast errors over 2027–38 as large as those of 2011–26.

The forecast rests on that record of errors. Without the errors of 2021–23, the median is £6.8 billion and 34% of paths save more than £10 billion. With shocks the size of past outturns' variation in place of forecast errors, the median is £8.0 billion.

| Path or forecast                       | Gross saving, 2039-40 | Net saving, 2039-40 |
| -------------------------------------- | --------------------- | ------------------- |
| Forecast median                        | £9.2 billion          | £6.4 billion        |
| Forecast median without 2021–23 errors | £6.8 billion          | –                   |
| Forecast median at outturn scale       | £8.0 billion          | –                   |
| OBR central path                       | £0.5 billion          | £0.3 billion        |
| OBR long-term path                     | £10.9 billion         | £7.3 billion        |

The paths are centred on the OBR central path, so the gap between the forecast and the central path's £0.5 billion comes from year-to-year movement in which index leads.

## From gross to net, and households

With a lower pension, pensioners pay less income tax and receive more means-tested benefits. To measure this, we run PolicyEngine UK in full under both rules on a sample of 100 of the forecast's paths, weighted to represent all of them. Net saving is 0.67 to 0.71 of gross saving in every run.

Applying each group of paths' ratio to all paths gives a median net saving of about £6.4 billion. We did not register that estimator before the runs. The one we registered, the weighted median of the 100 runs, gives £6.7 billion.

The reduction in spending is lower income for households that receive a State Pension, about 30% of households. On paths near the median gross saving, households that lose income have £681 a year less on average (95% interval £648 to £713). On the OBR long-term path the figure is £801, and on the OBR central path £35.

## The forecast's status

Before scoring any model of prices and earnings, we registered a test against past OBR forecasts. Two models failed it. The first expected earnings growth below 2.5% in 44.6% of the test's years, against 17.9% in practice. The second scored 1.295 times the first on a measure of how yearly gaps move together, against a limit of 1.25. Its registration said that if it failed, the paper would report scenarios only.

We designed the Bayesian forecast after both failures and after seeing the whole record of forecast errors. It sets no pass rule and has passed no test. It departs from the registered scenarios-only fallback by our decision, and both failed verdicts stand. When we refit it on held-out data and score it as we scored the first two, it meets every limit but the one on the share of years with earnings growth below 2.5%. Our earlier post withdrew an average after the model behind its paths failed a registered test; the forecast here comes from a different model.

## Limitations

- **Earnings falls.** The model's symmetric shocks give falls in nominal earnings in 14.6% of simulated years, against one year in 37 since 1989. Bounding that tail lowers the median to between £7.0 billion and £8.3 billion.
- **Beyond four years.** The record of forecast errors stops four years ahead, so later years rest on the fitted persistence and on priors. The priors alone, with no data, give a median of £6.9 billion.
- **Static runs.** The runs hold behaviour fixed and leave out indirect taxes.

## Conclusion

The adjusted Triple Lock saves when earnings outgrow prices after trailing them, so the order of years sets the saving. On the OBR's two smooth paths the rule removes all of the Triple Lock's rise above earnings, on the replay from April 2012 42%, and on the forecast's paths about a third by 2039-40. The forecast puts the median saving in 2039-40 at about £9 billion gross and £6.4 billion net, conditional on the model, its priors and forecast errors as large as those of 2011–26. We built it after two registered models failed their tests, and it has passed none.

The full paper is available [on policyengine.org](https://www.policyengine.org/uk/triple-lock/paper/), with all code and results in the [uk-triple-lock repository](https://github.com/PolicyEngine/uk-triple-lock).
