On 18 November, the consultancy Cornwall Insight published its ["final forecast"](https://www.cornwall-insight.com/press-releases/energy-bills-set-for-steep-rise-in-january/) for the energy price cap from 1 January to 31 March 2027: £2,166 a year for a household with typical consumption paying by Direct Debit, £443 (26%) above the [current cap](https://www.ofgem.gov.uk/your-energy-supply/your-energy-bill/energy-price-cap-unit-rates-and-standing-charges) of £1,723.

Using [PolicyEngine UK](https://github.com/PolicyEngine/uk-energy-price-cap-2027), we estimate what that forecast would mean for household energy bills across the income distribution in Great Britain. Every estimate below for January to March 2027 depends on the forecast, and Ofgem's rates may differ from it.

Key results, if the cap rises as Cornwall Insight forecasts (annual rates unless stated, Great Britain):

- A household with typical consumption would pay £443 a year more at the forecast January rates (26%), or about £166 more over January to March
- The average household in Great Britain would spend £2,117 a year on electricity and gas at the forecast January rates, up £415 from £1,702 at October rates
- Households in the bottom income decile would pay an average of £367 a year more, and their energy spending would rise from 9.3% to 11.5% of their net income; in the top decile, households would pay an average of £522 more, from 1.6% to 2.0% of their income
- The number of households spending more than 10% of their net income on energy would rise from 2.2 million to 3.6 million

## The forecast

Ofgem caps the unit rate and the daily standing charge that suppliers may charge households on default tariffs. It quotes the cap as the annual bill for a household with typical consumption: 2,500 kWh of electricity and 9,500 kWh of gas a year, the [typical domestic consumption values](https://www.ofgem.gov.uk/sites/default/files/2026-05/Review%20of%20typical%20domestic%20consumption%20values%20decision.pdf) it has used since July 2026. Figure 1 shows the typical bill under each cap since January 2025, and Cornwall Insight's forecast for January to March 2027.

```chart
{
  "type": "bar",
  "title": "Figure 1: Typical dual-fuel energy bill by quarter, Direct Debit, Great Britain",
  "subtitle": "Annual rate at 2,500 kWh of electricity and 9,500 kWh of gas: Ofgem caps to October to December 2026 (January 2025 to March 2026 calculated by PolicyEngine from Ofgem's rates), then Cornwall Insight's January to March 2027 forecast",
  "xKey": "quarter",
  "series": [
    { "key": "ofgem", "name": "Ofgem cap", "color": "quinary" },
    { "key": "forecast", "name": "Forecast (Cornwall Insight)", "color": "primary" }
  ],
  "data": [
    { "quarter": "Jan–Mar 2025", "ofgem": 1562 },
    { "quarter": "Apr–Jun 2025", "ofgem": 1655 },
    { "quarter": "Jul–Sep 2025", "ofgem": 1541 },
    { "quarter": "Oct–Dec 2025", "ofgem": 1576 },
    { "quarter": "Jan–Mar 2026", "ofgem": 1584 },
    { "quarter": "Apr–Jun 2026", "ofgem": 1477 },
    { "quarter": "Jul–Sep 2026", "ofgem": 1663 },
    { "quarter": "Oct–Dec 2026", "ofgem": 1723 },
    { "quarter": "Jan–Mar 2027", "forecast": 2166 }
  ],
  "yLabel": "Typical annual bill (£)",
  "format": { "decimals": 0, "prefix": "£", "separator": true },
  "stacked": true
}
```

Until July 2026, Ofgem quoted the cap at its previous typical values of 2,700 kWh of electricity and 11,500 kWh of gas. On 1 July 2026, Ofgem [restated](https://www.ofgem.gov.uk/sites/default/files/2026-06/Summary-of-changes-to-energy-price-cap-1-July-to-30-September-2026-revised-TDCV.pdf) the April to June 2026 cap on the current values (£1,477, against £1,641 as announced) and the July to September 2026 cap (£1,663, against £1,862 as announced in May), but not earlier caps. For January 2025 to March 2026, we apply each quarter's average Direct Debit unit rates and standing charges, from Ofgem's announcement of that cap, to the current typical values. The same calculation on the previous typical values gives Ofgem's announced cap to within £1 in each quarter. Table 1 gives both figures.

**Table 1: Typical dual-fuel bill by quarter, Direct Debit, Great Britain average (£ a year)**

| Quarter                  |             Ofgem's announced cap | Typical values of the announced cap (kWh, electricity and gas) | At 2,500 kWh and 9,500 kWh |
| ------------------------ | --------------------------------: | -------------------------------------------------------------: | -------------------------: |
| January to March 2025    |                             1,738 |                                               2,700 and 11,500 |                      1,562 |
| April to June 2025       |                             1,849 |                                               2,700 and 11,500 |                      1,655 |
| July to September 2025   |                             1,720 |                                               2,700 and 11,500 |                      1,541 |
| October to December 2025 |                             1,755 |                                               2,700 and 11,500 |                      1,576 |
| January to March 2026    |                             1,758 |                                               2,700 and 11,500 |                      1,584 |
| April to June 2026       |                             1,641 |                                               2,700 and 11,500 |                      1,477 |
| July to September 2026   |                             1,862 |                                               2,700 and 11,500 |                      1,663 |
| October to December 2026 |                             1,723 |                                                2,500 and 9,500 |                      1,723 |
| January to March 2027    | 2,166 (Cornwall Insight forecast) |                                                2,500 and 9,500 |           2,166 (forecast) |

Sources: Ofgem's announcements of each cap, from [January to March 2025](https://www.ofgem.gov.uk/news/changes-energy-price-cap-between-1-january-and-31-march-2025) to [October to December 2026](https://www.ofgem.gov.uk/news/changes-energy-price-cap-between-1-october-and-31-december-2026), and its [restatement of the April to June and July to September 2026 caps](https://www.ofgem.gov.uk/sites/default/files/2026-06/Summary-of-changes-to-energy-price-cap-1-July-to-30-September-2026-revised-TDCV.pdf); Cornwall Insight's [press release](https://www.cornwall-insight.com/press-releases/energy-bills-set-for-steep-rise-in-january/) of 18 November 2026. The last column for January 2025 to March 2026 is our calculation from Ofgem's average rates for each quarter.

Table 2 and Figure 2 compare Ofgem's current rates with Cornwall Insight's forecast.

**Table 2: Price cap for a typical household paying by Direct Debit, Great Britain average**

|                                             | October to December 2026 (Ofgem) | January to March 2027 (Cornwall Insight forecast) |     Change |
| ------------------------------------------- | -------------------------------: | ------------------------------------------------: | ---------: |
| Electricity unit rate (pence per kWh)       |                            26.32 |                                             32.54 |     +23.6% |
| Electricity standing charge (pence per day) |                            54.83 |                                                56 |      +1.7% |
| Gas unit rate (pence per kWh)               |                             7.97 |                                             10.90 |     +36.8% |
| Gas standing charge (pence per day)         |                            29.68 |                                                31 |      +4.6% |
| Typical electricity bill (£ a year)         |                              858 |                                             1,017 |     +18.5% |
| Typical gas bill (£ a year)                 |                              865 |                                             1,149 |     +32.7% |
| **Typical dual-fuel bill (£ a year)**       |                        **1,723** |                                         **2,166** | **+25.7%** |

Sources: Ofgem, [energy price cap unit rates and standing charges](https://www.ofgem.gov.uk/your-energy-supply/your-energy-bill/energy-price-cap-unit-rates-and-standing-charges); Cornwall Insight, [press release](https://www.cornwall-insight.com/press-releases/energy-bills-set-for-steep-rise-in-january/), 18 November 2026. We compute the typical October bills by fuel from Ofgem's rates. Ofgem's October rates carry no VAT on electricity and 5% VAT on gas. Cornwall Insight publishes standing charges to the nearest penny a day; its fuel totals imply 55.78p for electricity and 31.04p for gas, which we use for the changes in this table and in Table 3.

```chart
{
  "type": "bar",
  "title": "Figure 2: Change in energy price cap rates by fuel",
  "subtitle": "Percentage change from Ofgem's October to December 2026 cap to Cornwall Insight's January to March 2027 forecast, Direct Debit, Great Britain average",
  "xKey": "fuel",
  "series": [
    { "key": "unit", "name": "Unit rate", "color": "primary" },
    { "key": "standing", "name": "Standing charge", "color": "quinary" }
  ],
  "data": [
    { "fuel": "Electricity", "unit": 23.6, "standing": 1.7 },
    { "fuel": "Gas", "unit": 36.8, "standing": 4.6 }
  ],
  "yLabel": "Change (%)",
  "format": { "decimals": 1, "suffix": "%", "signed": true }
}
```

Cornwall Insight attributes the rise to wholesale market prices, particularly for gas. On its forecast, the typical gas bill would rise by £283 and the typical electricity bill by £159 (£442 in total on Ofgem's rounded rates, against Cornwall Insight's £443), so gas would account for 64% of the rise.

Ofgem expresses the cap as an annual rate. A household pays the January rates for three months. UK households use on average 29.3% of a year's electricity and 42.5% of a year's gas in January to March.[^1] Applying those shares to the unit-rate part of the bill, and 90 days to the standing charges, the forecast would add about £166 to a typical household's bills over January to March.

Cornwall Insight's forecast includes the zero rate of VAT on household electricity, which the [Autumn Budget](https://www.gov.uk/government/publications/budget-2026-document/budget-2026-html) extended to July 2027. It leaves out the one-off £100 Household Energy Payment, which the Autumn Budget announced for households in council tax bands A to D in England from January 2027 and which local authorities pay outside the cap, and the Government's plan to remove standing charges from household gas bills, which the Budget asks Ofgem to deliver by the end of 2027 or as soon as possible after, with no start date set. Cornwall Insight says its current forecast for April 2027 is below its January forecast, without giving a figure, and that "the figure is likely to change several times before Ofgem announces the cap in February"; its [forecast page](https://www.cornwall-insight.com/predictions-and-insights-into-the-default-tariff-cap/) says it will publish its April forecasts on 25 November.

## Household examples

Table 3 and Figures 3 and 4 apply the rates in Table 2 to four levels of consumption, without the PolicyEngine model: half the typical values (1,250 kWh of electricity and 4,750 kWh of gas), the typical values, double the typical values (5,000 kWh and 19,000 kWh), and a home with no gas using 2,500 kWh of electricity, Ofgem's typical value for a single-rate electricity meter.

```chart
{
  "type": "bar",
  "title": "Figure 3: Annual energy bill by household type, Direct Debit",
  "subtitle": "Annual rate, at Ofgem's October to December 2026 rates and at Cornwall Insight's January to March 2027 forecast",
  "xKey": "household",
  "series": [
    { "key": "oct", "name": "October to December 2026", "color": "quinary" },
    { "key": "jan", "name": "January to March 2027 (forecast)", "color": "primary" }
  ],
  "data": [
    { "household": "Low use", "oct": 1016, "jan": 1241 },
    { "household": "Typical use", "oct": 1724, "jan": 2166 },
    { "household": "High use", "oct": 3139, "jan": 4015 },
    { "household": "Electricity only", "oct": 858, "jan": 1017 }
  ],
  "yLabel": "Annual bill (£)",
  "format": { "decimals": 0, "prefix": "£", "separator": true }
}
```

```chart
{
  "type": "bar",
  "title": "Figure 4: Annual energy bill by fuel and household type at the January to March 2027 forecast, Direct Debit",
  "subtitle": "Annual rate at Cornwall Insight's forecast rates; the label gives the total",
  "xKey": "household",
  "series": [
    { "key": "electricity", "name": "Electricity", "color": "primary" },
    { "key": "gas", "name": "Gas", "color": "quinary" }
  ],
  "data": [
    { "household": "Low use", "electricity": 610, "gas": 631 },
    { "household": "Typical use", "electricity": 1017, "gas": 1149 },
    { "household": "High use", "electricity": 1831, "gas": 2184 },
    { "household": "Electricity only", "electricity": 1017 }
  ],
  "yLabel": "Annual bill (£)",
  "format": { "decimals": 0, "prefix": "£", "separator": true },
  "stacked": true
}
```

**Table 3: Annual bill by household type, October to December 2026 against the January to March 2027 forecast, Direct Debit**

| Household                 |      Electricity |              Gas |            Total | Standing charges |       Unit rates | Change, annual rate | Change over January to March |
| ------------------------- | ---------------: | ---------------: | ---------------: | ---------------: | ---------------: | ------------------: | ---------------------------: |
| Low use (half typical)    |     £529 to £610 |     £487 to £631 | £1,016 to £1,241 |     £308 to £317 |     £708 to £925 |      +£225 (+22.2%) |                         +£84 |
| Typical use               |   £858 to £1,017 |   £865 to £1,149 | £1,724 to £2,166 |     £308 to £317 | £1,415 to £1,849 |      +£442 (+25.7%) |                        +£166 |
| High use (double typical) | £1,516 to £1,831 | £1,623 to £2,184 | £3,139 to £4,015 |     £308 to £317 | £2,830 to £3,698 |      +£876 (+27.9%) |                        +£330 |
| Electricity only, typical |   £858 to £1,017 |               £0 |   £858 to £1,017 |     £200 to £204 |     £658 to £814 |      +£159 (+18.5%) |                         +£46 |

Cells with two figures give the October bill, then the January forecast, at annual rates. The standing charge and unit-rate columns split the total bill. Figures may not sum because of rounding. The last column applies the change in unit rates to the shares of a year's electricity (29.3%) and gas (42.5%) used in January to March and the change in standing charges to 90 days, as for the £166 above. Ofgem publishes its October rates to two decimal places, so the typical bill comes to £1,724 here against Ofgem's £1,723.

On the forecast, bills would rise by more in percentage terms the more a household uses, because the standing charges would rise by 1.7% (electricity) and 4.6% (gas) and the unit rates by 23.6% and 36.8%. Standing charges would make up 25.5% of the low-use bill in January and 7.9% of the high-use bill. A home without gas using 2,500 kWh would face a rise of 18.5%, against 25.7% at typical use of both fuels, because the forecast raises electricity rates by less than gas rates. In our data, households that do not use gas spend an average of £1,149 a year on electricity at October prices, against £858 at 2,500 kWh.

## Bills across the income distribution

We apply the forecast to the electricity and gas spending of every household in Great Britain in PolicyEngine UK's data, [Microcosm UK](https://www.policyengine.org/uk/model/data). We first restate each household's spending at October to December 2026 prices, using PolicyEngine UK's energy price indices. We then raise each household's electricity spending by 18.5% and its gas spending by 32.7%, the changes in the typical bill for each fuel in Table 2. All figures are annual rates and assume that households do not change how much energy they use. At October prices, households that use both fuels spend an average of £1,805 a year in our data, and the median such household spends £1,503, against Ofgem's typical bill of £1,723.

```chart
{
  "type": "bar",
  "title": "Figure 5: Average household energy bill by income decile, Great Britain",
  "subtitle": "Annual rate, at October to December 2026 rates and at Cornwall Insight's January to March 2027 forecast",
  "xKey": "decile",
  "series": [
    { "key": "oct", "name": "October to December 2026", "color": "quinary" },
    { "key": "jan", "name": "January to March 2027 (forecast)", "color": "primary" }
  ],
  "data": [
    { "decile": "1", "oct": 1514, "jan": 1881 },
    { "decile": "2", "oct": 1581, "jan": 1963 },
    { "decile": "3", "oct": 1566, "jan": 1950 },
    { "decile": "4", "oct": 1606, "jan": 1998 },
    { "decile": "5", "oct": 1654, "jan": 2059 },
    { "decile": "6", "oct": 1653, "jan": 2056 },
    { "decile": "7", "oct": 1700, "jan": 2118 },
    { "decile": "8", "oct": 1742, "jan": 2163 },
    { "decile": "9", "oct": 1874, "jan": 2329 },
    { "decile": "10", "oct": 2140, "jan": 2662 }
  ],
  "yLabel": "Average annual bill (£)",
  "format": { "decimals": 0, "prefix": "£", "separator": true },
  "valueLabels": false
}
```

Households in the top decile spend more on energy than those in the bottom (Figure 5), so their bills would rise by more in pounds (Figure 7): £522 a year against £367. As a share of net income (Figure 6 and Table 4), spending would rise from 9.3% to 11.5% in the bottom decile and from 1.6% to 2.0% in the top.

```chart
{
  "type": "bar",
  "title": "Figure 6: Household energy spending as a share of net income by income decile, Great Britain",
  "subtitle": "Total energy spending in each decile over its total net income before housing costs, at annual rates",
  "xKey": "decile",
  "series": [
    { "key": "oct", "name": "October to December 2026", "color": "quinary" },
    { "key": "jan", "name": "January to March 2027 (forecast)", "color": "primary" }
  ],
  "data": [
    { "decile": "1", "oct": 9.274, "jan": 11.524 },
    { "decile": "2", "oct": 5.738, "jan": 7.126 },
    { "decile": "3", "oct": 4.977, "jan": 6.197 },
    { "decile": "4", "oct": 4.464, "jan": 5.553 },
    { "decile": "5", "oct": 4.010, "jan": 4.994 },
    { "decile": "6", "oct": 3.411, "jan": 4.242 },
    { "decile": "7", "oct": 3.020, "jan": 3.761 },
    { "decile": "8", "oct": 2.718, "jan": 3.376 },
    { "decile": "9", "oct": 2.420, "jan": 3.009 },
    { "decile": "10", "oct": 1.639, "jan": 2.039 }
  ],
  "yLabel": "Share of net income (%)",
  "format": { "decimals": 1, "suffix": "%" },
  "valueLabels": false
}
```

```chart
{
  "type": "bar",
  "title": "Figure 7: Change in the average household energy bill by income decile, Great Britain",
  "subtitle": "Annual rate, from October to December 2026 rates to Cornwall Insight's January to March 2027 forecast; +£415 across all households",
  "xKey": "decile",
  "series": [{ "key": "change", "name": "Change in average bill", "color": "primary" }],
  "data": [
    { "decile": "1", "change": 367 },
    { "decile": "2", "change": 382 },
    { "decile": "3", "change": 384 },
    { "decile": "4", "change": 392 },
    { "decile": "5", "change": 406 },
    { "decile": "6", "change": 403 },
    { "decile": "7", "change": 417 },
    { "decile": "8", "change": 421 },
    { "decile": "9", "change": 456 },
    { "decile": "10", "change": 522 }
  ],
  "yLabel": "Change in average annual bill (£)",
  "format": { "decimals": 0, "prefix": "£", "signed": true },
  "legend": false
}
```

**Table 4: Household energy bills by income decile, Great Britain (annual rates)**

| Income decile | Average net income | Bill, October rates | Bill, January forecast | Change | Share of income, October | Share of income, January |
| ------------- | -----------------: | ------------------: | ---------------------: | -----: | -----------------------: | -----------------------: |
| 1 (lowest)    |            £16,320 |              £1,514 |                 £1,881 |  +£367 |                     9.3% |                    11.5% |
| 2             |            £27,548 |              £1,581 |                 £1,963 |  +£382 |                     5.7% |                     7.1% |
| 3             |            £31,465 |              £1,566 |                 £1,950 |  +£384 |                     5.0% |                     6.2% |
| 4             |            £35,982 |              £1,606 |                 £1,998 |  +£392 |                     4.5% |                     5.6% |
| 5             |            £41,239 |              £1,654 |                 £2,059 |  +£406 |                     4.0% |                     5.0% |
| 6             |            £48,467 |              £1,653 |                 £2,056 |  +£403 |                     3.4% |                     4.2% |
| 7             |            £56,314 |              £1,700 |                 £2,118 |  +£417 |                     3.0% |                     3.8% |
| 8             |            £64,078 |              £1,742 |                 £2,163 |  +£421 |                     2.7% |                     3.4% |
| 9             |            £77,425 |              £1,874 |                 £2,329 |  +£456 |                     2.4% |                     3.0% |
| 10 (highest)  |           £130,569 |              £2,140 |                 £2,662 |  +£522 |                     1.6% |                     2.0% |
| All           |                    |              £1,702 |                 £2,117 |  +£415 |                     3.2% |                     4.0% |

We calculate changes from unrounded bills. Net income is household net income before housing costs, as in the Department for Work and Pensions' Households Below Average Income statistics. We rank households into deciles by that income, adjusted for household size, so that each decile holds a tenth of people in the UK.

In our data, 4.4 million households in Great Britain have no gas spending. Their bills would rise by an average of £213 a year, against £452 for the 23.9 million households that use both fuels.

We estimate that at October rates, 2.2 million households spend more than 10% of their net income before housing costs on energy, counting the 0.1 million with zero income (the Households Below Average Income statistics reset negative incomes to zero). At the forecast January rates, held for a full year, 3.6 million would. This is not an official fuel poverty measure. It also differs from the fuel-stress measure in the Autumn Budget, which compares energy spending with income after housing costs; our [analysis of the Budget's energy bill measures](https://policyengine.org/uk/research/budget-2026-energy-bills) uses that measure.

The bills in these figures leave out the support that households receive outside the cap, such as the £100 Household Energy Payment in England, the Warm Home Discount and the Winter Fuel Payment. Net income counts those payments as income, as the Households Below Average Income statistics do for the Warm Home Discount and the Winter Fuel Payment and did for the 2022 energy support.

## Methodology

We use [PolicyEngine UK 2.177.7](https://github.com/PolicyEngine/policyengine-uk/tree/2.177.7) with Microcosm UK, the pair that the `policyengine` Python package certifies in version 6.20.2. PolicyEngine UK's energy price indices, which follow the Office for Budget Responsibility's October 2026 forecast, restate each household's 2026-27 spending at October to December 2026 prices. Microcosm prices electricity with 5% VAT, which we remove to match Ofgem's rates. We leave out Northern Ireland, which the Ofgem cap does not cover.

The method has five limitations:

- **Tariffs.** We apply the cap change to every household. The cap covers default tariffs; households on fixed tariffs would see no change in January, and we overstate their rise.
- **Payment method.** We apply the Direct Debit change to every household. Ofgem sets a different cap for standard credit and prepayment, and our data do not separate Direct Debit from standard credit.
- **Standing charges.** We scale each household's spending on a fuel by one factor, the change in the typical bill. On the forecast, standing charges would rise less than unit rates, so we overstate the rise for households that use less than the typical amount and understate it for those that use more. For a household using half the typical amount, the rise would be about 3 percentage points lower for each fuel: 15.3% against 18.5% for electricity and 29.6% against 32.7% for gas.
- **Annual rates.** We hold the January rates for a full year, as Ofgem's typical bill does. Ofgem sets the cap for April to June 2027 separately, in February 2027.
- **Fixed use.** We hold each household's energy use fixed as prices change.

The code and the aggregated results behind this post are in the [uk-energy-price-cap-2027](https://github.com/PolicyEngine/uk-energy-price-cap-2027) repository. We restate spending to October to December 2026 prices in the same way as our earlier [energy price cap model](https://github.com/PolicyEngine/uk-energy-price-cap-jan-2027/blob/engine-2.177.7-microcosm-9e18f010/src/uk_energy_price_cap/model_run.py), which ran on an earlier Microcosm build; here we also remove VAT from electricity and measure income as in the Households Below Average Income statistics.

[^1]: DESNZ, Energy Trends, [electricity](https://www.gov.uk/government/statistics/electricity-section-5-energy-trends) (ET 5.2) and [gas](https://www.gov.uk/government/statistics/gas-section-4-energy-trends) (ET 4.1): the mean shares of a year's UK domestic consumption used in January to March, 2015 to 2025, which PolicyEngine UK holds as parameters (29.29% for electricity and 42.50% for gas).
