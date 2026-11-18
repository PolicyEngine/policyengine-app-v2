On 18 November, the consultancy Cornwall Insight published its ["final forecast"](https://www.cornwall-insight.com/press-releases/energy-bills-set-for-steep-rise-in-january/) for the energy price cap from 1 January to 31 March 2027: £2,166 a year for a household with typical consumption paying by Direct Debit, £443 (26%) above the [current cap](https://www.ofgem.gov.uk/your-energy-supply/your-energy-bill/energy-price-cap-unit-rates-and-standing-charges) of £1,723.

Using [PolicyEngine UK](https://github.com/PolicyEngine/uk-energy-price-cap-2027), we estimate what that forecast would mean for household energy bills across the income distribution in Great Britain. Every figure below depends on the forecast, and Ofgem's rates may differ from it.

Key results, if the cap rises as Cornwall Insight forecasts (annual rates unless stated, Great Britain):

- A household with typical consumption would pay £443 a year more at the forecast January rates (26%), or about £166 more over January to March
- The average household in Great Britain would spend £2,117 a year on electricity and gas at the forecast January rates, up £415 from £1,702 at October rates
- Households in the bottom income decile would pay an average of £367 a year more, and their energy spending would rise from 9.3% to 11.5% of their net income; in the top decile, households would pay an average of £522 more, from 1.6% to 2.0% of their income
- The number of households spending more than 10% of their net income on energy would rise from 2.2 million to 3.6 million

## The forecast

Ofgem caps the unit rate and the daily standing charge that suppliers may charge households on default tariffs. It quotes the cap as the annual bill for a household with typical consumption: 2,500 kWh of electricity and 9,500 kWh of gas a year, the [typical domestic consumption values](https://www.ofgem.gov.uk/sites/default/files/2026-05/Review%20of%20typical%20domestic%20consumption%20values%20decision.pdf) it has used since July 2026. Table 1 compares Ofgem's current rates with Cornwall Insight's forecast.

**Table 1: Price cap for a typical household paying by Direct Debit, Great Britain average**

|                                             | October to December 2026 (Ofgem) | January to March 2027 (Cornwall Insight forecast) |     Change |
| ------------------------------------------- | -------------------------------: | ------------------------------------------------: | ---------: |
| Electricity unit rate (pence per kWh)       |                            26.32 |                                             32.54 |     +23.6% |
| Electricity standing charge (pence per day) |                            54.83 |                                            56[^2] |      +1.7% |
| Gas unit rate (pence per kWh)               |                             7.97 |                                             10.90 |     +36.8% |
| Gas standing charge (pence per day)         |                            29.68 |                                            31[^2] |      +4.6% |
| Typical electricity bill (£ a year)         |                              858 |                                             1,017 |     +18.5% |
| Typical gas bill (£ a year)                 |                              865 |                                             1,149 |     +32.7% |
| **Typical dual-fuel bill (£ a year)**       |                        **1,723** |                                         **2,166** | **+25.7%** |

Sources: Ofgem, [energy price cap unit rates and standing charges](https://www.ofgem.gov.uk/your-energy-supply/your-energy-bill/energy-price-cap-unit-rates-and-standing-charges); Cornwall Insight, ["Energy Bills Set for Steep Rise in January"](https://www.cornwall-insight.com/press-releases/energy-bills-set-for-steep-rise-in-january/), 18 November 2026. We compute the typical October bills by fuel from Ofgem's rates. Ofgem's October rates carry no VAT on electricity and 5% VAT on gas.

Cornwall Insight attributes the rise to "high and volatile wholesale market prices, particularly for gas". On its forecast, the typical gas bill would rise by £283 and the typical electricity bill by £159 (£442 in total on Ofgem's rounded rates, against Cornwall Insight's £443), so gas would account for 64% of the rise.

Ofgem expresses the cap as an annual rate. A household pays the January rates for three months. UK households use on average 29.3% of a year's electricity and 42.5% of a year's gas in January to March.[^1] Applying those shares to the unit-rate part of the bill, and 90 days to the standing charges, the forecast would add about £166 to a typical household's bills over January to March.

Cornwall Insight's forecast includes the zero rate of VAT on household electricity, which the [Autumn Budget](https://www.gov.uk/government/publications/budget-2026-document/budget-2026-html) extended to 1 July 2027. It leaves out the one-off £100 Household Energy Payment, which the Autumn Budget announced for households in council tax bands A to D in England from January 2027 and which local authorities pay outside the cap, and the Government's plan to remove standing charges from household gas bills, which the Budget asks Ofgem to deliver by the end of 2027 or as soon as possible after, with no start date set. Cornwall Insight says its current forecast for April 2027 "points to a small fall" and that "the figure is likely to change several times before Ofgem announces the cap in February"; its [forecast page](https://www.cornwall-insight.com/predictions-and-insights-into-the-default-tariff-cap/) says it will publish its April forecasts on 25 November.

## Household examples

Table 2 applies the rates in Table 1 to four levels of consumption, without the PolicyEngine model.

**Table 2: Annual bill at each set of rates, Direct Debit**

| Household                         | Electricity (kWh) | Gas (kWh) | October to December 2026 | January to March 2027 (forecast) |         Change |
| --------------------------------- | ----------------: | --------: | -----------------------: | -------------------------------: | -------------: |
| Low use (half typical)            |             1,250 |     4,750 |                   £1,016 |                           £1,241 | +£225 (+22.2%) |
| Typical use                       |             2,500 |     9,500 |                   £1,724 |                           £2,166 | +£442 (+25.7%) |
| High use (double typical)         |             5,000 |    19,000 |                   £3,139 |                           £4,015 | +£876 (+27.9%) |
| Electricity only, typical use[^3] |             2,500 |         0 |                     £858 |                           £1,017 | +£159 (+18.5%) |

Ofgem publishes its October rates to two decimal places, so the typical bill comes to £1,724 here against Ofgem's £1,723.

On the forecast, bills would rise by more in percentage terms the more a household uses, because the standing charges would rise by 1.7% (electricity) and 4.6% (gas) and the unit rates by 23.6% and 36.8%. A home without gas using 2,500 kWh would face a smaller rise, 18.5%, because the forecast raises electricity rates less than gas rates.

## Bills across the income distribution

We apply the forecast to the electricity and gas spending of every household in Great Britain in PolicyEngine UK's data, Microcosm UK. We first restate each household's spending at October to December 2026 prices, using PolicyEngine UK's energy price indices. We then raise each household's electricity spending by 18.5% and its gas spending by 32.7%, the changes in the typical bill for each fuel in Table 1. All figures are annual rates and assume that households do not change how much energy they use. At October prices, households that use both fuels spend an average of £1,805 a year in our data, and the median such household spends £1,503, against Ofgem's typical bill of £1,723.

```chart
{
  "type": "bar",
  "title": "Average household energy bill by income decile, Great Britain",
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

Households in the top decile spend more on energy than those in the bottom, so their bills would rise by more in pounds: £522 a year against £367. As a share of net income, spending would rise from 9.3% to 11.5% in the bottom decile and from 1.6% to 2.0% in the top.

```chart
{
  "type": "bar",
  "title": "Household energy spending as a share of net income by income decile, Great Britain",
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

**Table 3: Household energy bills by income decile, Great Britain (annual rates)**

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

We use PolicyEngine UK 2.177.7 with Microcosm UK build fcfac709, the pair that the `policyengine` Python package certifies in version 6.20.2. PolicyEngine UK's energy price indices, which follow the Office for Budget Responsibility's October 2026 forecast, restate each household's 2026-27 spending at October to December 2026 prices. Microcosm prices electricity with 5% VAT, which we remove to match Ofgem's rates. We leave out Northern Ireland, which the Ofgem cap does not cover.

The method has five limitations:

- **Tariffs.** We apply the cap change to every household. The cap covers default tariffs; households on fixed tariffs would see no change in January, and we overstate their rise.
- **Payment method.** We apply the Direct Debit change to every household. Ofgem sets a different cap for standard credit and prepayment, and our data do not separate Direct Debit from standard credit.
- **Standing charges.** We scale each household's spending on a fuel by one factor, the change in the typical bill. On the forecast, standing charges would rise less than unit rates, so we overstate the rise for households that use less than the typical amount and understate it for those that use more. For a household using half the typical amount, the rise would be about 3 percentage points smaller for each fuel: 15.3% against 18.5% for electricity and 29.6% against 32.7% for gas.
- **Annual rates.** We hold the January rates for a full year, as Ofgem's typical bill does. Ofgem sets the cap for April to June 2027 separately, in February 2027.
- **Fixed use.** We hold each household's energy use fixed as prices change.

The code and the aggregated results behind this post are in the [uk-energy-price-cap-2027](https://github.com/PolicyEngine/uk-energy-price-cap-2027) repository. We restate spending to October to December 2026 prices in the same way as our earlier [energy price cap model](https://github.com/PolicyEngine/uk-energy-price-cap-jan-2027/blob/engine-2.177.7-microcosm-9e18f010/src/uk_energy_price_cap/model_run.py), which ran on an earlier Microcosm build; here we also remove VAT from electricity and measure income as in the Households Below Average Income statistics.

[^1]: DESNZ, Energy Trends, [electricity](https://www.gov.uk/government/statistics/electricity-section-5-energy-trends) (ET 5.2) and [gas](https://www.gov.uk/government/statistics/gas-section-4-energy-trends) (ET 4.1): the mean shares of a year's UK domestic consumption used in January to March, 2015 to 2025, which PolicyEngine UK holds as parameters (29.29% for electricity and 42.50% for gas).

[^2]: Cornwall Insight publishes standing charges to the nearest penny a day. Its fuel totals imply 55.78p for electricity and 31.04p for gas, which we use for the change and in Table 2.

[^3]: 2,500 kWh is Ofgem's typical value for a home on a single-rate electricity meter. In our data, households with no gas spending spend an average of £1,149 a year on electricity at October prices, against £858 at 2,500 kWh.
