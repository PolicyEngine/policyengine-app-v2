On 25 November 2026, Ofgem [announced](https://www.ofgem.gov.uk/news/changes-energy-price-cap-between-1-january-and-31-march-2027) the energy price cap for 1 January to 31 March 2027: £2,166 a year for a household with typical consumption paying by Direct Debit, a change of +£443 (+25.7%) from the [current cap](https://www.ofgem.gov.uk/your-energy-supply/your-energy-bill/energy-price-cap-unit-rates-and-standing-charges) of £1,723. The consultancy Cornwall Insight had forecast £2,166 on 18 November; Ofgem's cap equals that forecast.

Using [PolicyEngine UK](https://policyengine.org/uk), we estimate what Ofgem's cap means for household energy bills across the income distribution in Great Britain. Our [earlier post](https://policyengine.org/uk/research/uk-energy-price-cap-january-2027-forecast) estimated the effects of Cornwall Insight's forecast; this post uses Ofgem's announced rates, and the last section compares the two.

Key results under Ofgem's cap (annual rates unless stated, Great Britain):

- A household with typical consumption sees its bill change by +£443 a year at the January rates (+25.7%), or about +£167 over January to March
- The average household in Great Britain spends £2,116 a year on electricity and gas at the January rates, against £1,701 at October rates (a change of +£415)
- Bills in the bottom income decile change by an average of +£374 a year, and households' energy spending goes from 9.4% to 11.6% of their net income; in the top decile, bills change by an average of +£523, and households' energy spending goes from 1.6% to 2.0% of their net income
- The number of households spending more than 10% of their net income on energy goes from 2.3 million to 3.6 million
- On Cornwall Insight's forecast, the same model gives an average change of +£414 a year, against +£415 under Ofgem's cap

## The cap

Ofgem caps the unit rate and the daily standing charge that suppliers may charge households on default tariffs. It quotes the cap as the annual bill for a household with typical consumption: 2,500 kWh of electricity and 9,500 kWh of gas a year, the [typical domestic consumption values](https://www.ofgem.gov.uk/sites/default/files/2026-05/Review%20of%20typical%20domestic%20consumption%20values%20decision.pdf) it has used since July 2026. Figure 1 shows the typical bill under each cap since January 2025.

```chart
{
  "type": "bar",
  "title": "Figure 1: Typical dual-fuel energy bill by quarter, Direct Debit, Great Britain",
  "subtitle": "Annual rate at 2,500 kWh of electricity and 9,500 kWh of gas under Ofgem's caps (January 2025 to March 2026 calculated by PolicyEngine from Ofgem's rates)",
  "xKey": "quarter",
  "series": [{ "key": "ofgem", "name": "Ofgem cap", "color": "primary" }],
  "data": [
    { "quarter": "Jan–Mar 2025", "ofgem": 1562 },
    { "quarter": "Apr–Jun 2025", "ofgem": 1655 },
    { "quarter": "Jul–Sep 2025", "ofgem": 1541 },
    { "quarter": "Oct–Dec 2025", "ofgem": 1576 },
    { "quarter": "Jan–Mar 2026", "ofgem": 1584 },
    { "quarter": "Apr–Jun 2026", "ofgem": 1477 },
    { "quarter": "Jul–Sep 2026", "ofgem": 1663 },
    { "quarter": "Oct–Dec 2026", "ofgem": 1723 },
    { "quarter": "Jan–Mar 2027", "ofgem": 2166.0 }
  ],
  "yLabel": "Typical annual bill (£)",
  "format": { "decimals": 0, "prefix": "£", "separator": true },
  "legend": false
}
```

Until July 2026, Ofgem quoted the cap at its previous typical values of 2,700 kWh of electricity and 11,500 kWh of gas. On 1 July 2026, Ofgem [restated](https://www.ofgem.gov.uk/sites/default/files/2026-06/Summary-of-changes-to-energy-price-cap-1-July-to-30-September-2026-revised-TDCV.pdf) the April to June 2026 cap on the current values (£1,477, against £1,641 as announced) and the July to September 2026 cap (£1,663, against £1,862 as announced in May), but not earlier caps. For January 2025 to March 2026, we apply each quarter's average Direct Debit unit rates and standing charges, from Ofgem's announcement of that cap, to the current typical values. Table 1 gives both figures.

**Table 1: Typical dual-fuel bill by quarter, Direct Debit, Great Britain average (£ a year)**

| Quarter | Ofgem's announced cap | Typical values of the announced cap (kWh, electricity and gas) | At 2,500 kWh and 9,500 kWh |
| ------- | --------------------: | -------------------------------------------------------------: | -------------------------: |
| January to March 2025 | 1,738 | 2,700 and 11,500 | 1,562 |
| April to June 2025 | 1,849 | 2,700 and 11,500 | 1,655 |
| July to September 2025 | 1,720 | 2,700 and 11,500 | 1,541 |
| October to December 2025 | 1,755 | 2,700 and 11,500 | 1,576 |
| January to March 2026 | 1,758 | 2,700 and 11,500 | 1,584 |
| April to June 2026 | 1,641 | 2,700 and 11,500 | 1,477 |
| July to September 2026 | 1,862 | 2,700 and 11,500 | 1,663 |
| October to December 2026 | 1,723 | 2,500 and 9,500 | 1,723 |
| January to March 2027 | 2,166 (Ofgem's cap) | 2,500 and 9,500 | 2,166 |

Sources: Ofgem's announcements of each cap, from [January to March 2025](https://www.ofgem.gov.uk/news/changes-energy-price-cap-between-1-january-and-31-march-2025) to [October to December 2026](https://www.ofgem.gov.uk/news/changes-energy-price-cap-between-1-october-and-31-december-2026) and [January to March 2027](https://www.ofgem.gov.uk/news/changes-energy-price-cap-between-1-january-and-31-march-2027), and its [restatement of the April to June and July to September 2026 caps](https://www.ofgem.gov.uk/sites/default/files/2026-06/Summary-of-changes-to-energy-price-cap-1-July-to-30-September-2026-revised-TDCV.pdf). The last column for January 2025 to March 2026 is our calculation from Ofgem's average rates for each quarter. Caps before October 2026 include 5% VAT on electricity; from October 2026 electricity carries no VAT, so, as Ofgem notes, the caps on either side of that change are not directly comparable.

Table 2 and Figure 2 compare Ofgem's January rates with its October rates and with Cornwall Insight's forecast.

**Table 2: Price cap for a typical household paying by Direct Debit, Great Britain average**

|  | October to December 2026 (Ofgem) | January to March 2027 (Ofgem) | Change | January to March 2027 (Cornwall Insight forecast) |
| - | -: | -: | -: | -: |
| Electricity unit rate (pence per kWh) | 26.32 | 32.69 | +24.2% | 32.54 |
| Electricity standing charge (pence per day) | 54.83 | 54.77 | −0.1% | 55.78 |
| Gas unit rate (pence per kWh) | 7.97 | 10.96 | +37.5% | 10.90 |
| Gas standing charge (pence per day) | 29.68 | 29.65 | −0.1% | 31.04 |
| Typical electricity bill (£ a year) | 858 | 1,017 | +18.5% | 1,017 |
| Typical gas bill (£ a year) | 865 | 1,149 | +32.8% | 1,149 |
| **Typical dual-fuel bill (£ a year)** | **1,723** | **2,166** | **+25.7%** | **2,166** |

Sources: Ofgem, [energy price cap unit rates and standing charges](https://www.ofgem.gov.uk/your-energy-supply/your-energy-bill/energy-price-cap-unit-rates-and-standing-charges); Cornwall Insight, [press release](https://www.cornwall-insight.com/press-releases/energy-bills-set-for-steep-rise-in-january/), 18 November 2026. We compute the typical bills by fuel from Ofgem's rates. Ofgem's rates carry no VAT on electricity and 5% VAT on gas. Cornwall Insight publishes standing charges to the nearest penny a day; the forecast column gives the standing charges its fuel totals imply.

```chart
{
  "type": "bar",
  "title": "Figure 2: Change in energy price cap rates by fuel",
  "subtitle": "Percentage change from Ofgem's October to December 2026 cap to its January to March 2027 cap, Direct Debit, Great Britain average",
  "xKey": "fuel",
  "series": [
    { "key": "unit", "name": "Unit rate", "color": "primary" },
    { "key": "standing", "name": "Standing charge", "color": "quinary" }
  ],
  "data": [
    { "fuel": "Electricity", "unit": 24.2, "standing": -0.1 },
    { "fuel": "Gas", "unit": 37.5, "standing": -0.1 }
  ],
  "yLabel": "Change (%)",
  "format": { "decimals": 1, "suffix": "%", "signed": true }
}
```

At typical consumption, the gas bill changes by +£284 and the electricity bill by +£159 (+£443 in total on Ofgem's rates as published, against Ofgem's +£443), so gas accounts for 64% of the change.

### Why the cap changed

Ofgem's [letter on the January update](https://www.ofgem.gov.uk/sites/default/files/2026-11/summary-of-changes-to-energy-price-cap-1-January-to-31-March-2027.pdf) attributes the change mainly to wholesale costs. Its wholesale cost allowance rises by 50%, to 56% of the typical bill from 47% in October to December: by 59% for gas and 39% for electricity. Ofgem calls conflict and geopolitical instability in the Middle East "the primary driver" of wholesale prices, compounded by historically low European gas storage at the start of winter; prices reached multiyear highs at the end of October before falling back in early November. It attributes the rise in electricity costs to the role gas plays in setting power prices, together with greater reliance on gas-fired power during periods of low wind. Allowances that move with the cap level, including suppliers' earnings allowance, headroom, debt costs and VAT on gas, rise with it.

Ofgem expresses the cap as an annual rate. A household pays the January rates for three months. UK households use on average 29.3% of a year's electricity and 42.5% of a year's gas in January to March.[^1] Applying those shares to the unit-rate part of the bill, and 90 days to the standing charges, the cap changes a typical household's bills over January to March by about +£167.

Ofgem's cap includes the zero rate of VAT on household electricity, which the [Autumn Budget](https://www.gov.uk/government/publications/budget-2026-document/budget-2026-html) extended to July 2027. It leaves out the one-off £100 Household Energy Payment, which the Autumn Budget announced for households in council tax bands A to D in England from January 2027 and which local authorities pay outside the cap, and the Government's plan to remove standing charges from household gas bills, which the Budget asks Ofgem to deliver by the end of 2027 or as soon as possible after, with no start date set. Ofgem sets the cap for April to June 2027 separately, in February 2027.

## Household examples

Table 3 and Figures 3 and 4 apply the rates in Table 2 to four levels of consumption, without the PolicyEngine model: half the typical values (1,250 kWh of electricity and 4,750 kWh of gas), the typical values, double the typical values (5,000 kWh and 19,000 kWh), and a home with no gas using 2,500 kWh of electricity, Ofgem's typical value for a single-rate electricity meter.

```chart
{
  "type": "bar",
  "title": "Figure 3: Annual energy bill by household type, Direct Debit",
  "subtitle": "Annual rate, at Ofgem's October to December 2026 rates and its January to March 2027 rates",
  "xKey": "household",
  "series": [
    { "key": "oct", "name": "October to December 2026", "color": "quinary" },
    { "key": "jan", "name": "January to March 2027", "color": "primary" }
  ],
  "data": [
    { "household": "Low use", "oct": 1016.0, "jan": 1237.0 },
    { "household": "Typical use", "oct": 1724.0, "jan": 2167.0 },
    { "household": "High use", "oct": 3139.0, "jan": 4025.0 },
    { "household": "Electricity only", "oct": 858.0, "jan": 1017.0 }
  ],
  "yLabel": "Annual bill (£)",
  "format": { "decimals": 0, "prefix": "£", "separator": true }
}
```

```chart
{
  "type": "bar",
  "title": "Figure 4: Annual energy bill by fuel and household type under the January to March 2027 cap, Direct Debit",
  "subtitle": "Annual rate at Ofgem's January to March 2027 rates; the label gives the total",
  "xKey": "household",
  "series": [
    { "key": "electricity", "name": "Electricity", "color": "primary" },
    { "key": "gas", "name": "Gas", "color": "quinary" }
  ],
  "data": [
    { "household": "Low use", "electricity": 609.0, "gas": 629.0 },
    { "household": "Typical use", "electricity": 1017.0, "gas": 1149.0 },
    { "household": "High use", "electricity": 1834.0, "gas": 2191.0 },
    { "household": "Electricity only", "electricity": 1017.0 }
  ],
  "yLabel": "Annual bill (£)",
  "format": { "decimals": 0, "prefix": "£", "separator": true },
  "stacked": true
}
```

**Table 3: Annual bill by household type, October to December 2026 against January to March 2027, Direct Debit**

| Household | Electricity | Gas | Total | Standing charges | Unit rates | Change, annual rate | Change over January to March |
| --------- | ----------: | --: | ----: | ---------------: | ---------: | ------------------: | ---------------------------: |
| Low use (half typical) | £529 to £609 | £487 to £629 | £1,016 to £1,237 | £308 to £308 | £708 to £929 | +£221 (+21.8%) | +£84 |
| Typical use | £858 to £1,017 | £865 to £1,149 | £1,724 to £2,167 | £308 to £308 | £1,415 to £1,858 | +£443 (+25.7%) | +£167 |
| High use (double typical) | £1,516 to £1,834 | £1,623 to £2,191 | £3,139 to £4,025 | £308 to £308 | £2,830 to £3,717 | +£886 (+28.2%) | +£335 |
| Electricity only, typical | £858 to £1,017 | £0 | £858 to £1,017 | £200 to £200 | £658 to £817 | +£159 (+18.5%) | +£47 |

Cells with two figures give the October bill, then the January bill, at annual rates. The standing charge and unit-rate columns split the total bill. Figures may not sum because of rounding. The last column applies the change in unit rates to the shares of a year's electricity (29.3%) and gas (42.5%) used in January to March and the change in standing charges to 90 days, as for the typical household above. Ofgem publishes its rates to two decimal places, so the typical bill here can differ from Ofgem's headline by £1.

Standing charges change by −0.1% (electricity) and −0.1% (gas), and unit rates by +24.2% and +37.5%, so the bill changes by +21.8% at low use, +25.7% at typical use and +28.2% at high use. Standing charges make up 24.9% of the low-use bill in January and 7.7% of the high-use bill. A home without gas using 2,500 kWh faces a change of +18.5%, against +25.7% at typical use of both fuels, because the typical electricity bill changes by +18.5% and the typical gas bill by +32.8% (Table 2). In our data, households that do not use gas spend an average of £1,141 a year on electricity at October prices, against £858 at 2,500 kWh.

## Bills across the income distribution

We apply Ofgem's cap to the electricity and gas spending of every household in Great Britain in PolicyEngine UK's data, [Microcosm UK](https://www.policyengine.org/uk/model/data). We first restate each household's spending at October to December 2026 prices, using PolicyEngine UK's energy price indices. We then change each household's electricity spending by +18.5% and its gas spending by +32.8%, the changes in the typical bill for each fuel in Table 2. All figures are annual rates and assume that households do not change how much energy they use. At October prices, households that use both fuels spend an average of £1,806 a year in our data, and the median such household spends £1,508, against Ofgem's typical bill of £1,723.

```chart
{
  "type": "bar",
  "title": "Figure 5: Average household energy bill by income decile, Great Britain",
  "subtitle": "Annual rate, at Ofgem's October to December 2026 rates and its January to March 2027 rates",
  "xKey": "decile",
  "series": [
    { "key": "oct", "name": "October to December 2026", "color": "quinary" },
    { "key": "jan", "name": "January to March 2027", "color": "primary" }
  ],
  "data": [
    { "decile": "1", "oct": 1535.0, "jan": 1909.0 },
    { "decile": "2", "oct": 1583.0, "jan": 1968.0 },
    { "decile": "3", "oct": 1541.0, "jan": 1918.0 },
    { "decile": "4", "oct": 1632.0, "jan": 2030.0 },
    { "decile": "5", "oct": 1638.0, "jan": 2041.0 },
    { "decile": "6", "oct": 1630.0, "jan": 2027.0 },
    { "decile": "7", "oct": 1718.0, "jan": 2139.0 },
    { "decile": "8", "oct": 1715.0, "jan": 2130.0 },
    { "decile": "9", "oct": 1881.0, "jan": 2340.0 },
    { "decile": "10", "oct": 2143.0, "jan": 2666.0 }
  ],
  "yLabel": "Average annual bill (£)",
  "format": { "decimals": 0, "prefix": "£", "separator": true },
  "valueLabels": false
}
```

Households in the top decile spend more on energy than those in the bottom (Figure 5). Their bills change by an average of +£523 a year, against +£374 in the bottom decile (Figure 7). As a share of net income (Figure 6 and Table 4), spending goes from 9.4% to 11.6% in the bottom decile and from 1.6% to 2.0% in the top.

```chart
{
  "type": "bar",
  "title": "Figure 6: Household energy spending as a share of net income by income decile, Great Britain",
  "subtitle": "Total energy spending in each decile over its total net income before housing costs, at annual rates",
  "xKey": "decile",
  "series": [
    { "key": "oct", "name": "October to December 2026", "color": "quinary" },
    { "key": "jan", "name": "January to March 2027", "color": "primary" }
  ],
  "data": [
    { "decile": "1", "oct": 9.355, "jan": 11.632 },
    { "decile": "2", "oct": 5.772, "jan": 7.177 },
    { "decile": "3", "oct": 4.877, "jan": 6.068 },
    { "decile": "4", "oct": 4.506, "jan": 5.604 },
    { "decile": "5", "oct": 3.975, "jan": 4.954 },
    { "decile": "6", "oct": 3.398, "jan": 4.225 },
    { "decile": "7", "oct": 3.015, "jan": 3.755 },
    { "decile": "8", "oct": 2.661, "jan": 3.305 },
    { "decile": "9", "oct": 2.432, "jan": 3.024 },
    { "decile": "10", "oct": 1.629, "jan": 2.027 }
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
  "subtitle": "Annual rate, from Ofgem's October to December 2026 rates to its January to March 2027 rates; +£415 across all households",
  "xKey": "decile",
  "series": [{ "key": "change", "name": "Change in average bill", "color": "primary" }],
  "data": [
    { "decile": "1", "change": 374.0 },
    { "decile": "2", "change": 385.0 },
    { "decile": "3", "change": 377.0 },
    { "decile": "4", "change": 398.0 },
    { "decile": "5", "change": 403.0 },
    { "decile": "6", "change": 397.0 },
    { "decile": "7", "change": 421.0 },
    { "decile": "8", "change": 415.0 },
    { "decile": "9", "change": 458.0 },
    { "decile": "10", "change": 523.0 }
  ],
  "yLabel": "Change in average annual bill (£)",
  "format": { "decimals": 0, "prefix": "£", "signed": true },
  "legend": false
}
```

**Table 4: Household energy bills by income decile, Great Britain (annual rates)**

| Income decile | Average net income | Bill, October rates | Bill, January rates | Change | Share of income, October | Share of income, January |
| ------------- | -----------------: | ------------------: | ------------------: | -----: | -----------------------: | -----------------------: |
| 1 (lowest) | £16,412 | £1,535 | £1,909 | +£374 | 9.4% | 11.6% |
| 2 | £27,421 | £1,583 | £1,968 | +£385 | 5.8% | 7.2% |
| 3 | £31,600 | £1,541 | £1,918 | +£377 | 4.9% | 6.1% |
| 4 | £36,225 | £1,632 | £2,030 | +£398 | 4.5% | 5.6% |
| 5 | £41,201 | £1,638 | £2,041 | +£403 | 4.0% | 5.0% |
| 6 | £47,984 | £1,630 | £2,027 | +£397 | 3.4% | 4.2% |
| 7 | £56,963 | £1,718 | £2,139 | +£421 | 3.0% | 3.8% |
| 8 | £64,442 | £1,715 | £2,130 | +£415 | 2.7% | 3.3% |
| 9 | £77,353 | £1,881 | £2,340 | +£458 | 2.4% | 3.0% |
| 10 (highest) | £131,524 | £2,143 | £2,666 | +£523 | 1.6% | 2.0% |
| All | | £1,701 | £2,116 | +£415 | 3.2% | 4.0% |

We calculate changes from unrounded bills. Net income is household net income before housing costs, as in the Department for Work and Pensions' Households Below Average Income statistics. We rank households into deciles by that income, adjusted for household size, so that each decile holds a tenth of people in the UK.

In our data, 4.5 million households in Great Britain have no gas spending. Their bills change by an average of +£211 a year, against +£453 for the 23.9 million households that use both fuels.

We estimate that at October rates, 2.3 million households spend more than 10% of their net income before housing costs on energy, counting the 0.1 million with zero income (the Households Below Average Income statistics reset negative incomes to zero). At the January rates, held for a full year, 3.6 million would. This is not an official fuel poverty measure. It also differs from the fuel-stress measure in the Autumn Budget, which compares energy spending with income after housing costs; our [analysis of the Budget's energy bill measures](https://policyengine.org/uk/research/budget-2026-energy-bills) uses that measure.

The bills in these figures leave out the support that households receive outside the cap, such as the £100 Household Energy Payment in England, the Warm Home Discount and the Winter Fuel Payment. Net income counts those payments as income, as the Households Below Average Income statistics do for the Warm Home Discount and the Winter Fuel Payment and did for the 2022 energy support.

## Support set against the change

Two measures bear on bills this winter. The Autumn Budget announced the £100 Household Energy Payment, a one-off payment from January 2027 to households in council tax bands A to D in England, which local authorities pay outside the cap. The zero rate of VAT on household electricity has applied since 1 October 2026, is in both the October and the January caps, and the [Budget](https://www.gov.uk/government/publications/budget-2026-document/budget-2026-html) extended it to July 2027; the Department for Energy Security and Net Zero [says](https://www.gov.uk/government/news/what-the-autumn-budget-2026-means-for-your-energy-bills) it saves households an average of £45 a year. In our data, 5% VAT would add £50 a year to the average household's electricity bill at October rates and £59 at January rates. Because both caps carry no VAT on electricity, the zero rate lowers the October-to-January change itself by only £9 a year for the average household (£8 at typical use), and the figures in this post already include it.

The payment is made once, while the changes above are annual rates. Table 5 and Figure 8 therefore set the payment against the change over January to March, the three months the January cap covers. We approximate that change by multiplying each household's annual change for each fuel by the share of a year's use in January to March (29.3% for electricity and 42.5% for gas); this applies the same share to standing charges, which accrue evenly through the year. For the average household in Great Britain, bills change by +£152 over January to March and the payment averages £69, 46% of that change. For a typical household in England that receives it, £100 is 60% of the +£167 change over January to March, against 23% of the +£443 annual-rate change.

**Table 5: Change in the average household energy bill by income decile, and the Household Energy Payment, Great Britain (£)**

| Income decile | Change in bill, annual rate | Change over January to March | Household Energy Payment | Change over January to March less the payment |
| ------------- | --------------------------: | ---------------------------: | -----------------------: | --------------------------------------------: |
| 1 (lowest) | +£374 | +£136 | £71 | +£65 |
| 2 | +£385 | +£141 | £78 | +£63 |
| 3 | +£377 | +£138 | £75 | +£63 |
| 4 | +£398 | +£145 | £78 | +£67 |
| 5 | +£403 | +£148 | £73 | +£76 |
| 6 | +£397 | +£145 | £75 | +£70 |
| 7 | +£421 | +£155 | £67 | +£88 |
| 8 | +£415 | +£151 | £66 | +£85 |
| 9 | +£458 | +£167 | £62 | +£106 |
| 10 (highest) | +£523 | +£191 | £49 | +£142 |
| All | +£415 | +£152 | £69 | +£82 |

The payment column averages the £100 over all households in each decile, including those in Scotland, Wales and households in England in bands E and above, which do not receive it.

```chart
{
  "type": "bar",
  "title": "Figure 8: Change in the average household energy bill over January to March 2027 by income decile, before and after the Household Energy Payment, Great Britain",
  "subtitle": "From Ofgem's October to December 2026 rates to its January to March 2027 rates, over the three months; less the one-off £100 Household Energy Payment (England, council tax bands A to D), averaged over all households",
  "xKey": "decile",
  "series": [
    { "key": "q1", "name": "Change over January to March", "color": "quinary" },
    { "key": "q1_net_hep", "name": "Less the payment", "color": "primary" }
  ],
  "data": [
    { "decile": "1", "q1": 136.0, "q1_net_hep": 65.0 },
    { "decile": "2", "q1": 141.0, "q1_net_hep": 63.0 },
    { "decile": "3", "q1": 138.0, "q1_net_hep": 63.0 },
    { "decile": "4", "q1": 145.0, "q1_net_hep": 67.0 },
    { "decile": "5", "q1": 148.0, "q1_net_hep": 76.0 },
    { "decile": "6", "q1": 145.0, "q1_net_hep": 70.0 },
    { "decile": "7", "q1": 155.0, "q1_net_hep": 88.0 },
    { "decile": "8", "q1": 151.0, "q1_net_hep": 85.0 },
    { "decile": "9", "q1": 167.0, "q1_net_hep": 106.0 },
    { "decile": "10", "q1": 191.0, "q1_net_hep": 142.0 }
  ],
  "yLabel": "Change in average bill over January to March (£)",
  "format": { "decimals": 0, "prefix": "£", "signed": true },
  "valueLabels": false
}
```

## Who the Household Energy Payment reaches

We estimate that 19.7 million households receive the payment, 81% of households in England, at a cost of £1.97 billion. The Budget gives £2.6 billion, "supporting up to 20 million households"; that sum also funds £100 million for local authorities and the share that Scotland, Wales and Northern Ireland receive through the Barnett formula. Our [analysis of the Budget's energy bill measures](https://policyengine.org/uk/research/budget-2026-energy-bills) puts the payments in England at £2.10 billion, of which our estimate is 94%.

The Welsh Government [has said](https://www.gov.wales/written-statement-welsh-government-response-uk-autumn-budget-2026) it will make a £100 cost-of-living payment to households in council tax bands A to D, and the Scottish Government [has said](https://www.gov.scot/news/uk-budget-delivers-real-cut-to-scotlands-funding/) that households in Scotland will benefit from a one-time £100 payment, without saying which households. We model neither, so the figures below cover England only.

Figure 9 shows the share of households in each income decile that receive the payment. In the lowest income decile, 86% of households in England receive it and 14% (0.4 million) do not, because they live in a home in council tax band E or above. In the highest decile, 54% of households in England receive it.

```chart
{
  "type": "bar",
  "title": "Figure 9: Share of households receiving the Household Energy Payment by income decile",
  "subtitle": "Households in council tax bands A to D in England receive £100; share of households in England in each income decile",
  "xKey": "decile",
  "series": [
    { "key": "england", "name": "England", "color": "primary" }
  ],
  "data": [
    { "decile": "1", "england": 85.9 },
    { "decile": "2", "england": 91.3 },
    { "decile": "3", "england": 89.5 },
    { "decile": "4", "england": 91.2 },
    { "decile": "5", "england": 84.0 },
    { "decile": "6", "england": 87.3 },
    { "decile": "7", "england": 76.6 },
    { "decile": "8", "england": 78.4 },
    { "decile": "9", "england": 70.3 },
    { "decile": "10", "england": 54.2 }
  ],
  "yLabel": "Households receiving the payment (%)",
  "format": { "decimals": 0, "suffix": "%" },
  "valueLabels": false
}
```

The model pays every household in a home in bands A to D in England. The Government [says](https://www.gov.uk/government/news/what-the-autumn-budget-2026-means-for-your-energy-bills) that households where the householder is not responsible for paying council tax are not eligible; our data cannot identify them, so we overstate recipients slightly. We also leave out the £100 million the Budget gives local authorities for further targeted support to households hit hard by rising energy bills, some of them in bands above A to D.

## Ofgem's cap against the forecast

Cornwall Insight forecast a typical bill of £2,166; Ofgem's cap is £2,166. Table 6 and Figure 10 run both through the same model and data, so the differences come from the rates alone. Ofgem's unit rates are above the forecast and its standing charges below, so the two give much the same typical bill: £2,166.58 on Ofgem's rates against £2,165.89 on Cornwall Insight's figures for each fuel, both of which round to £2,166. That small gap is why our estimates differ by about £1. At other levels of use the mix matters more: Ofgem's rates give a bill £4 a year lower than the forecast at half typical use and £10 a year higher at double typical use. Our method, which scales each household's spending by the change in the typical bill, does not capture this.

**Table 6: Cornwall Insight's forecast and Ofgem's cap for January to March 2027, Great Britain (annual rates)**

|  | Cornwall Insight forecast (18 November) | Ofgem cap (25 November 2026) | Difference |
| - | -: | -: | -: |
| Typical dual-fuel bill (£ a year) | 2,166 | 2,166 | £0 |
| Electricity unit rate (pence per kWh) | 32.54 | 32.69 | 0.15 |
| Electricity standing charge (pence per day) | 55.78 | 54.77 | −1.01 |
| Gas unit rate (pence per kWh) | 10.90 | 10.96 | 0.06 |
| Gas standing charge (pence per day) | 31.04 | 29.65 | −1.39 |
| Change in the average household bill (£ a year) | +£414 | +£415 | +£1 |
| Change, lowest income decile (£ a year) | +£373 | +£374 | +£1 |
| Change, highest income decile (£ a year) | +£522 | +£523 | +£1 |

The forecast's standing charges are those its fuel totals imply, as in Table 2.

```chart
{
  "type": "bar",
  "title": "Figure 10: Change in the average household energy bill by income decile, forecast and actual cap, Great Britain",
  "subtitle": "Annual rate, from Ofgem's October to December 2026 rates to Cornwall Insight's January to March 2027 forecast and to Ofgem's January to March 2027 cap",
  "xKey": "decile",
  "series": [
    { "key": "forecast", "name": "Cornwall Insight forecast", "color": "quinary" },
    { "key": "ofgem", "name": "Ofgem cap", "color": "primary" }
  ],
  "data": [
    { "decile": "1", "forecast": 373.0, "ofgem": 374.0 },
    { "decile": "2", "forecast": 385.0, "ofgem": 385.0 },
    { "decile": "3", "forecast": 376.0, "ofgem": 377.0 },
    { "decile": "4", "forecast": 397.0, "ofgem": 398.0 },
    { "decile": "5", "forecast": 402.0, "ofgem": 403.0 },
    { "decile": "6", "forecast": 396.0, "ofgem": 397.0 },
    { "decile": "7", "forecast": 421.0, "ofgem": 421.0 },
    { "decile": "8", "forecast": 414.0, "ofgem": 415.0 },
    { "decile": "9", "forecast": 457.0, "ofgem": 458.0 },
    { "decile": "10", "forecast": 522.0, "ofgem": 523.0 }
  ],
  "yLabel": "Change in average annual bill (£)",
  "format": { "decimals": 0, "prefix": "£", "signed": true },
  "valueLabels": false
}
```

Our earlier post estimated an average change of +£415 on Cornwall Insight's forecast with `policyengine` 6.20.2 (PolicyEngine UK 2.177.7, Microcosm build fcfac709). This post uses `policyengine` 6.20.3 (PolicyEngine UK 2.179.2, Microcosm build b891aa69), a newer model and dataset; with them, the same forecast gives +£414, and the October figures move too: the bottom decile's energy spending is 9.4% of its net income, against 9.3% in the earlier post, and 2.3 million households spend more than 10% of their net income on energy, against 2.2 million.

## Methodology

We use [PolicyEngine UK 2.179.2](https://github.com/PolicyEngine/policyengine-uk/tree/2.179.2) with Microcosm UK build b891aa69, the pair that the `policyengine` Python package certifies in version 6.20.3. PolicyEngine UK's energy price indices, which follow the Office for Budget Responsibility's October 2026 forecast, restate each household's 2026-27 spending at October to December 2026 prices. Microcosm prices electricity with 5% VAT, which we remove to match Ofgem's rates. We leave out Northern Ireland, which the Ofgem cap does not cover.

The method has five limitations:

- **Tariffs.** We apply the cap change to every household. The cap covers default tariffs; households on fixed tariffs see no change in January.
- **Payment method.** We apply the Direct Debit change to every household. Ofgem sets a different cap for standard credit and prepayment, and our data do not separate Direct Debit from standard credit.
- **Standing charges.** We scale each household's spending on a fuel by one factor, the change in the typical bill, so households that use less or more than the typical amount get the typical household's percentage change. For a household using half the typical amount, the cap gives +15.0% against +18.5% for electricity and +29.1% against +32.8% for gas.
- **Annual rates.** We hold the January rates for a full year, as Ofgem's typical bill does. Ofgem sets the cap for April to June 2027 separately, in February 2027.
- **Fixed use.** We hold each household's energy use fixed as prices change.

The code, the cap inputs and the aggregated results behind this post are in the [post folder](https://github.com/PolicyEngine/uk-energy-price-cap-jan-2027/tree/main/post) of the uk-energy-price-cap-jan-2027 repository.

[^1]: DESNZ, Energy Trends, [electricity](https://www.gov.uk/government/statistics/electricity-section-5-energy-trends) (ET 5.2) and [gas](https://www.gov.uk/government/statistics/gas-section-4-energy-trends) (ET 4.1): the mean shares of a year's UK domestic consumption used in January to March, 2015 to 2025, which PolicyEngine UK holds as parameters (29.29% for electricity and 42.50% for gas).
