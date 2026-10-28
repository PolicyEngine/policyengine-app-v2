In the Autumn Budget on 28 October 2026, the Chancellor extended the temporary 5p-per-litre cut in fuel duty to 1 July 2027 and deferred the planned Retail Prices Index (RPI) increase to the same date. This post explains how the change moves the duty on each litre of petrol and diesel, and what it means for example households, using PolicyEngine UK household calculations.

Key figures:

- The main rate of fuel duty stays at 52.95p a litre to 30 June 2027. Before the Budget, the rate was due to rise to 55.95p on 1 January 2027 and 57.95p on 1 March 2027, with an RPI increase planned for April 2027.
- On 1 July 2027, the rate rises to 60.59p. From that date, it follows the same path as before the Budget.
- With the VAT on the duty, a litre costs 3.6p less in January and February 2027, 6.0p less in March 2027 and 9.2p less from April to June 2027.
- A household that uses 1,000 litres of fuel a year, about 19 litres a week, pays £34 less in total: £12 in 2026-27 and £22 in 2027-28.
- HM Treasury estimates that the measure reduces receipts by £575 million in 2026-27 and £780 million in 2027-28, with no effect in later years ([Budget 2026, Table 6.1](https://www.gov.uk/government/publications/supporting-documents-for-budget-2026), row 3). PolicyEngine's estimate for household fuel is £301 million and £521 million.
- In 2027-28, household net income rises by £18 a year on average, from £12 in the lowest income decile to £24 in the ninth.

## What the Budget changes

Fuel duty on petrol and diesel has been 52.95p a litre since the 5p cut of March 2022. Before the Budget, the cut was due to end in two steps: the rate was to rise to 55.95p on 1 January 2027 ([SI 2026/164](https://www.legislation.gov.uk/uksi/2026/164), as amended by [SI 2026/555](https://www.legislation.gov.uk/uksi/2026/555/made)), and to return to 57.95p on 1 March 2027, the rate in [section 6 of the Hydrocarbon Oil Duties Act 1979](https://www.legislation.gov.uk/ukpga/1979/5/section/6). Government policy since Budget 2025 was to uprate the rate by RPI from April 2027.

The [Budget 2026 document](https://www.gov.uk/government/publications/budget-2026-document/budget-2026-html) keeps the 5p cut for six more months, to 1 July 2027, and moves the planned RPI increase to the same date. HM Treasury's [policy costings](https://www.gov.uk/government/publications/supporting-documents-for-budget-2026) set out what follows: on 1 July 2027, the rates rise by 5p a litre and by RPI, and from 1 April 2028 they rise by RPI each year. The Office for Budget Responsibility (OBR) puts the main rate after the July 2027 rise at 60.59p ([Economic and fiscal outlook](https://obr.uk/download/economic-and-fiscal-outlook-october-2026/), October 2026, paragraph 3.19).

No source gives the pre-Budget rate from 1 April 2027, because the government had not set it. We assume that the RPI increase that the Budget moves to July was due in April at the same size, so the rate before the Budget is 60.59p from 1 April 2027. PolicyEngine's Autumn Budget 2026 dashboard uses the same assumption. With PolicyEngine UK's own projection for April 2027, 59.75p, the April to June saving is 6.80p a litre instead of 7.64p, and the 2027-28 saving for 1,000 litres is £19 instead of £22.

| Period                        | Days | Rate before the Budget | Rate after the Budget | Duty saved a litre | Duty and VAT saved a litre |
| ----------------------------- | ---- | ---------------------- | --------------------- | ------------------ | -------------------------- |
| To 31 December 2026           | –    | 52.95p                 | 52.95p                | 0p                 | 0p                         |
| 1 January to 28 February 2027 | 59   | 55.95p                 | 52.95p                | 3.00p              | 3.60p                      |
| 1 to 31 March 2027            | 31   | 57.95p                 | 52.95p                | 5.00p              | 6.00p                      |
| 1 April to 30 June 2027       | 91   | 60.59p                 | 52.95p                | 7.64p              | 9.17p                      |
| From 1 July 2027              | –    | 60.59p                 | 60.59p                | 0p                 | 0p                         |

VAT at 20% applies to the pump price, which includes the duty. If retailers pass the change on in full, a 50-litre tank costs about £2 less in January or February 2027, £3 less in March 2027 and £5 less from April to June 2027.

The same main rate applies to petrol and diesel across the UK. Retailers in [Rural Fuel Duty Relief](https://www.gov.uk/guidance/rural-duty-relief-scheme-notice-2001) areas claim 5p a litre back both before and after the Budget, so the saving is the same if they pass the relief on. The costing also applies a proportionate cut to the rates for other fuels; this post covers petrol and diesel only.

```chart
{
  "type": "bar",
  "title": "Main fuel duty rate before and after the Budget",
  "subtitle": "Pence per litre of petrol or diesel, before VAT",
  "xKey": "period",
  "series": [
    {
      "key": "before",
      "name": "Before the Budget",
      "color": "quinary"
    },
    {
      "key": "after",
      "name": "After the Budget",
      "color": "primary"
    }
  ],
  "data": [
    {
      "period": "Oct to Dec 2026",
      "before": 52.95,
      "after": 52.95
    },
    {
      "period": "Jan to Feb 2027",
      "before": 55.95,
      "after": 52.95
    },
    {
      "period": "Mar 2027",
      "before": 57.95,
      "after": 52.95
    },
    {
      "period": "Apr to Jun 2027",
      "before": 60.59,
      "after": 52.95
    },
    {
      "period": "Jul 2027 to Mar 2028",
      "before": 60.59,
      "after": 60.59
    }
  ],
  "yLabel": "Pence per litre",
  "format": {
    "decimals": 2,
    "suffix": "p"
  },
  "source": "Source: SI 2026/164 as amended by SI 2026/555; HM Treasury, Budget 2026 policy costings; OBR, Economic and fiscal outlook, October 2026, paragraph 3.19."
}
```

## Worked examples

The examples are households that use 500, 1,000 and 2,000 litres of petrol or diesel a year, spread evenly over each tax year. 1,000 litres is about 19 litres a week. PolicyEngine UK's tax years run from 6 April to 5 April, so 2026-27 covers 1 January to 5 April 2027 and 2027-28 covers 6 April to 30 June 2027. HM Treasury's figures use fiscal years from 1 April to 31 March, so the first five days of April 2027 fall in a different year.

| Fuel use a year | Fuel duty saved | VAT saved | Total saved, 2026-27 | Total saved, 2027-28 | Total saved |
| --------------- | --------------- | --------- | -------------------- | -------------------- | ----------- |
| 500 litres      | £14             | £3        | £6                   | £11                  | £17         |
| 1,000 litres    | £28             | £6        | £12                  | £22                  | £34         |
| 2,000 litres    | £56             | £11       | £24                  | £43                  | £67         |

Totals may not add because of rounding.

The same saving by litres bought a week, with the duty and VAT saved each week in each period:

| Litres a week | A year             | Saved a week, January and February 2027 | Saved a week, March 2027 | Saved a week, April to June 2027 | Total, 1 January to 30 June 2027 | 2026-27 | 2027-28 |
| ------------- | ------------------ | --------------------------------------- | ------------------------ | -------------------------------- | -------------------------------- | ------- | ------- |
| 10 litres     | about 520 litres   | 36p                                     | 60p                      | 92p                              | £18                              | £6      | £11     |
| 20 litres     | about 1,040 litres | 72p                                     | £1.20                    | £1.83                            | £35                              | £13     | £23     |
| 40 litres     | about 2,080 litres | £1.44                                   | £2.40                    | £3.67                            | £70                              | £25     | £45     |
| 60 litres     | about 3,120 litres | £2.16                                   | £3.60                    | £5.50                            | £106                             | £38     | £68     |

The household calculator on PolicyEngine's [Autumn Budget 2026 dashboard](https://policyengine.org/uk/autumn-budget-2026) includes a driver with a long commute, who spends £2,600 a year on petrol and diesel. At PolicyEngine UK's pump prices, 150.8p a litre for petrol and 170.6p for diesel, that buys about 1,620 litres a year. The measure saves this driver £20 in 2026-27 and £35 in 2027-28, the same per litre as the examples above. The model's pump prices are fixed and below October 2026 prices, when diesel was above £2 a litre, so the same spending buys fewer litres today; the examples in this post are set in litres for that reason.

The saving rises in proportion to the fuel that a household uses. A household with no car, or with an electric car only, pays no fuel duty and sees no change.

```chart
{
  "type": "line",
  "title": "Saving from the fuel duty measure by fuel use",
  "subtitle": "Lower fuel duty and VAT for a petrol or diesel car, by tax year",
  "xKey": "litres",
  "xLabel": "Litres of fuel a year",
  "series": [
    {
      "key": "total",
      "name": "Both years",
      "color": "primary"
    },
    {
      "key": "y2027",
      "name": "2027-28",
      "color": "secondary"
    },
    {
      "key": "y2026",
      "name": "2026-27",
      "color": "tertiary"
    }
  ],
  "data": [
    {
      "litres": 0,
      "total": 0.0,
      "y2027": 0.0,
      "y2026": 0.0
    },
    {
      "litres": 100,
      "total": 3.37,
      "y2027": 2.15,
      "y2026": 1.22
    },
    {
      "litres": 200,
      "total": 6.74,
      "y2027": 4.31,
      "y2026": 2.43
    },
    {
      "litres": 300,
      "total": 10.11,
      "y2027": 6.46,
      "y2026": 3.65
    },
    {
      "litres": 400,
      "total": 13.49,
      "y2027": 8.62,
      "y2026": 4.87
    },
    {
      "litres": 500,
      "total": 16.86,
      "y2027": 10.77,
      "y2026": 6.09
    },
    {
      "litres": 600,
      "total": 20.23,
      "y2027": 12.93,
      "y2026": 7.3
    },
    {
      "litres": 700,
      "total": 23.6,
      "y2027": 15.08,
      "y2026": 8.52
    },
    {
      "litres": 800,
      "total": 26.97,
      "y2027": 17.23,
      "y2026": 9.74
    },
    {
      "litres": 900,
      "total": 30.34,
      "y2027": 19.39,
      "y2026": 10.95
    },
    {
      "litres": 1000,
      "total": 33.71,
      "y2027": 21.54,
      "y2026": 12.17
    },
    {
      "litres": 1100,
      "total": 37.08,
      "y2027": 23.7,
      "y2026": 13.39
    },
    {
      "litres": 1200,
      "total": 40.46,
      "y2027": 25.85,
      "y2026": 14.61
    },
    {
      "litres": 1300,
      "total": 43.83,
      "y2027": 28.0,
      "y2026": 15.82
    },
    {
      "litres": 1400,
      "total": 47.2,
      "y2027": 30.16,
      "y2026": 17.04
    },
    {
      "litres": 1500,
      "total": 50.57,
      "y2027": 32.31,
      "y2026": 18.26
    },
    {
      "litres": 1600,
      "total": 53.94,
      "y2027": 34.47,
      "y2026": 19.47
    },
    {
      "litres": 1700,
      "total": 57.31,
      "y2027": 36.62,
      "y2026": 20.69
    },
    {
      "litres": 1800,
      "total": 60.68,
      "y2027": 38.78,
      "y2026": 21.91
    },
    {
      "litres": 1900,
      "total": 64.06,
      "y2027": 40.93,
      "y2026": 23.12
    },
    {
      "litres": 2000,
      "total": 67.43,
      "y2027": 43.08,
      "y2026": 24.34
    },
    {
      "litres": 2100,
      "total": 70.8,
      "y2027": 45.24,
      "y2026": 25.56
    },
    {
      "litres": 2200,
      "total": 74.17,
      "y2027": 47.39,
      "y2026": 26.78
    },
    {
      "litres": 2300,
      "total": 77.54,
      "y2027": 49.55,
      "y2026": 27.99
    },
    {
      "litres": 2400,
      "total": 80.91,
      "y2027": 51.7,
      "y2026": 29.21
    },
    {
      "litres": 2500,
      "total": 84.28,
      "y2027": 53.86,
      "y2026": 30.43
    }
  ],
  "markers": [
    {
      "x": 1000,
      "label": "1,000 litres"
    }
  ],
  "yLabel": "Saving",
  "format": {
    "prefix": "£",
    "decimals": 0,
    "separator": true
  },
  "xFormat": {
    "decimals": 0,
    "separator": true
  },
  "source": "Source: PolicyEngine UK household calculation; HM Treasury, Budget 2026 policy costings; OBR, Economic and fiscal outlook, October 2026."
}
```

## Net income and other benefits

The measure lowers a tax on spending, so it does not change any income that taxes or benefits depend on. The table shows household net income in 2027-28 for three households that each use 1,000 litres a year. Net income is PolicyEngine UK's household net income: income from all sources and benefits, less direct taxes, council tax, the TV licence and the modelled duties, with the VAT change on fuel included. The couple pay £9,600 a year in rent and £1,800 in council tax; the pensioner pays £7,800 in rent and £1,600 in council tax. The pensioner gets the full new State Pension, £13,036.40 in 2027-28. The 2027-28 benefit amounts are PolicyEngine UK projections on the OBR's October 2026 forecast, the forecast that PolicyEngine's Autumn Budget 2026 dashboard uses. They are the same on the March 2026 forecast in PolicyEngine UK 2.151.0.

| Household                                                                | Benefits in 2027-28                                  | Net income before the Budget | Net income after the Budget | Change |
| ------------------------------------------------------------------------ | ---------------------------------------------------- | ---------------------------- | --------------------------- | ------ |
| Single adult, £30,000 salary                                             | None                                                 | £24,334                      | £24,355                     | £22    |
| Couple with two children, one earner on £25,000, renting privately       | Universal Credit £16,441, Child Benefit £2,419       | £38,046                      | £38,067                     | £22    |
| Single pensioner on the full new State Pension, renting from the council | Housing Benefit £7,616, Council Tax Reduction £1,544 | £19,917                      | £19,939                     | £22    |

In each household, net income rises by the £22 saving on duty and VAT, and no benefit, income tax or National Insurance amount changes. In 2026-27, each household gains £12 in the same way.

The measure does not interact with other programmes in PolicyEngine UK, for three reasons:

- **Means tests use income, not spending.** Universal Credit, Pension Credit, Housing Benefit and Council Tax Reduction depend on income and capital. Fuel duty enters only the household's taxes, so the lower pump price does not reduce any award.
- **Benefit uprating does not change.** April 2027 uprating uses September 2026 inflation, before the measure applies. April 2028 uprating uses September 2027 inflation. The duty rate is the same with and without the Budget in both September 2026 (52.95p) and September 2027 (60.59p), so the measure does not change the September 2027 annual inflation rate through pump prices.
- **Marginal tax rates do not change.** PolicyEngine UK gives each household the same effective marginal rate before and after the Budget: 28% for the single adult, 68% for the couple on Universal Credit and 66% for the pensioner on Housing Benefit in 2027-28.

Outside the model, fuel bought for business use is a cost for the self-employed and for employers. A lower duty raises the profits of self-employed drivers by the amount they save, which can raise their income tax and lower their Universal Credit. This post covers household fuel only.

## Population results

PolicyEngine's Autumn Budget 2026 dashboard runs the same measure on its representative sample of UK households, with PolicyEngine UK 2.151.0 on the OBR October 2026 forecast. The results below come from its run of 28 October 2026.

| Tax year        | PolicyEngine: static, household fuel | HM Treasury: Table 6.1, with behavioural response |
| --------------- | ------------------------------------ | ------------------------------------------------- |
| 2026-27         | −£301 million                        | −£575 million                                     |
| 2027-28         | −£521 million                        | −£780 million                                     |
| 2028-29 onwards | £0                                   | £0                                                |

PolicyEngine's figures are 52% of the Treasury's in 2026-27 and 67% in 2027-28. Most of the difference is scope. PolicyEngine covers the petrol and diesel that households buy. The Treasury's base is every litre of taxable fuel used in the UK, including vans, lorries and business use of cars; the OBR expects £24 billion of fuel duty receipts in 2026-27. The other differences work the other way: the Treasury's demand response lowers its cost, and PolicyEngine's tax years, which start on 6 April, put 1 to 5 April 2027 into 2026-27. PolicyEngine's figures include the VAT on the lower pump price, about a sixth of the total.

The Budget states that the measure supports 35 million motorists and businesses across the UK. In PolicyEngine's data, 21.7 million of the 29.2 million households in 2026-27, or 74%, buy petrol or diesel.

Household net income rises by an average of £10 in 2026-27 and £18 in 2027-28, across all households. 61% of people in 2026-27 and 73% in 2027-28 live in a household whose net income rises by more than 0.01%. The others live in households that buy no petrol or diesel, or very little.

In cash terms, the average gain in 2027-28 rises from £12 in the lowest income decile to £24 in the ninth, because higher-income households buy more fuel. As a share of income, it falls from 0.047% in the lowest decile to 0.014% in the highest. Deciles rank households by equivalised household net income before housing costs.

```chart
{
  "type": "bar",
  "title": "Average gain by income decile",
  "subtitle": "Change in household net income, £ a year, by tax year",
  "xKey": "decile",
  "series": [
    {
      "key": "y2026",
      "name": "2026-27",
      "color": "tertiary"
    },
    {
      "key": "y2027",
      "name": "2027-28",
      "color": "primary"
    }
  ],
  "data": [
    {
      "decile": "1st",
      "y2026": 6.93,
      "y2027": 12.07
    },
    {
      "decile": "2nd",
      "y2026": 7.49,
      "y2027": 12.77
    },
    {
      "decile": "3rd",
      "y2026": 8.09,
      "y2027": 13.91
    },
    {
      "decile": "4th",
      "y2026": 9.08,
      "y2027": 15.43
    },
    {
      "decile": "5th",
      "y2026": 9.56,
      "y2027": 16.76
    },
    {
      "decile": "6th",
      "y2026": 11.12,
      "y2027": 18.89
    },
    {
      "decile": "7th",
      "y2026": 11.3,
      "y2027": 19.55
    },
    {
      "decile": "8th",
      "y2026": 12.9,
      "y2027": 22.3
    },
    {
      "decile": "9th",
      "y2026": 13.86,
      "y2027": 23.9
    },
    {
      "decile": "10th",
      "y2026": 13.35,
      "y2027": 22.95
    }
  ],
  "yLabel": "Average gain",
  "format": {
    "prefix": "£",
    "decimals": 0
  },
  "source": "Source: PolicyEngine Autumn Budget 2026 dashboard, run of 28 October 2026 (PolicyEngine UK 2.151.0, OBR October 2026 forecast)."
}
```

```chart
{
  "type": "bar",
  "title": "Gain as a share of income by income decile",
  "subtitle": "Change in household net income, % of baseline income, by tax year",
  "xKey": "decile",
  "series": [
    {
      "key": "y2026",
      "name": "2026-27",
      "color": "tertiary"
    },
    {
      "key": "y2027",
      "name": "2027-28",
      "color": "primary"
    }
  ],
  "data": [
    {
      "decile": "1st",
      "y2026": 0.0271,
      "y2027": 0.0466
    },
    {
      "decile": "2nd",
      "y2026": 0.0189,
      "y2027": 0.032
    },
    {
      "decile": "3rd",
      "y2026": 0.0184,
      "y2027": 0.0312
    },
    {
      "decile": "4th",
      "y2026": 0.0192,
      "y2027": 0.0319
    },
    {
      "decile": "5th",
      "y2026": 0.018,
      "y2027": 0.0309
    },
    {
      "decile": "6th",
      "y2026": 0.0192,
      "y2027": 0.032
    },
    {
      "decile": "7th",
      "y2026": 0.0178,
      "y2027": 0.03
    },
    {
      "decile": "8th",
      "y2026": 0.0178,
      "y2027": 0.0303
    },
    {
      "decile": "9th",
      "y2026": 0.0162,
      "y2027": 0.0274
    },
    {
      "decile": "10th",
      "y2026": 0.0086,
      "y2027": 0.0145
    }
  ],
  "yLabel": "% of income",
  "format": {
    "decimals": 3,
    "suffix": "%"
  },
  "source": "Source: PolicyEngine Autumn Budget 2026 dashboard, run of 28 October 2026 (PolicyEngine UK 2.151.0, OBR October 2026 forecast)."
}
```

The poverty rate does not change. Official poverty measures, and PolicyEngine's, use household income after direct taxes, which does not deduct taxes on spending such as fuel duty and VAT. The Gini index of household net income falls by 0.0001 in 2026-27 and 0.0002 in 2027-28.

## Assumptions and limitations

- The household examples are household calculations. The population results come from the dashboard's microsimulation, which is static and covers household fuel only.
- The examples hold the litres that each household buys fixed. HM Treasury's costing includes a response in which people buy more fuel when prices are lower; we do not model it.
- We assume that retailers pass the full duty change, and the VAT on it, into pump prices. Pump prices also depend on oil prices and retail margins, which we hold fixed.
- The pre-Budget rate from 1 April 2027, 60.59p, is our assumption, as set out above. After 1 July 2027, the rate path is the same with and without the Budget measure, so later RPI forecasts do not change the results.
- The examples cover cars that run on petrol or diesel. The Budget also extends the 3.7p cut to red diesel to 1 July 2027 (Table 6.1, row 18) and keeps the HGV road tax holiday to 1 July 2027. This post does not cover those measures, or the increase in tax-free mileage rates.

The Budget estimates that the government's fuel duty decisions in this Parliament save the average car driver £230, compared with the previous government's plans. That figure covers all fuel duty decisions since 2024 against a different baseline, so it does not compare with the figures in this post, which cover only the Budget 2026 measure.

## Methodology

We used the `policyengine` Python package (version 6.11.1) with PolicyEngine UK (version 2.151.0). We ran `calculate_household` for each household with two parameter reforms to the fuel duty rate on petrol and diesel: one with the pre-Budget rates and one with the Budget rates, each keyed to the dates above. PolicyEngine UK keys its April 2027 rate at 59.75p, uprated by the March 2026 RPI forecast, so both scenarios replace it with 60.59p. PolicyEngine UK weights each rate by the days it applies in the tax year. The net income table and the marginal rates run on the OBR October 2026 forecast, which we apply as PolicyEngine's Autumn Budget 2026 dashboard does (a scenario applied before data load). The duty and VAT savings do not depend on the forecast.

PolicyEngine UK holds spending on fuel fixed and does not pass a duty change into VAT, so we add 20% of the duty change for the VAT on the pump price. For the net income table, we lower the household's `vat` by that amount in the Budget scenario, so the change flows through `vat_change` into `household_net_income`. The rates, dates and VAT treatment match the fuel duty measure in PolicyEngine's [Autumn Budget 2026 dashboard](https://policyengine.org/uk/autumn-budget-2026). The saving is linear in litres, so the chart plots its value every 100 litres; these agree with PolicyEngine UK to within £0.01 at every point.
