On **[Ofgem: announcement date]**, Ofgem [announced](https://www.ofgem.gov.uk/energy-price-cap) the energy price cap for 1 January to 31 March 2027: **[Ofgem: typical_bill_announced]** a year for a household with typical consumption paying by Direct Debit, a change of **[Ofgem: difference]** (**[Ofgem: change]**) from the [current cap](https://www.ofgem.gov.uk/your-energy-supply/your-energy-bill/energy-price-cap-unit-rates-and-standing-charges) of £1,723. The consultancy Cornwall Insight had forecast £2,166 on 18 November; Ofgem's cap is **[Ofgem: difference]** **[Ofgem: above or below]** that forecast.

Using [PolicyEngine UK](https://policyengine.org/uk), we estimate what Ofgem's cap means for household energy bills across the income distribution in Great Britain. Our [earlier post](https://policyengine.org/uk/research/uk-energy-price-cap-january-2027-forecast) estimated the effects of Cornwall Insight's forecast; this post uses Ofgem's announced rates, and the last section compares the two.

Key results under Ofgem's cap (annual rates unless stated, Great Britain):

- A household with typical consumption sees its bill change by **[Ofgem: examples.typical_dual_fuel.change]** a year at the January rates (**[Ofgem: examples.typical_dual_fuel.change_pct]**), or about **[Ofgem: examples.typical_dual_fuel.q1_change]** over January to March
- The average household in Great Britain spends **[Ofgem: gb.mean_after]** a year on electricity and gas at the January rates, against £1,702 at October rates (a change of **[Ofgem: gb.mean_change]**)
- Bills in the bottom income decile change by an average of **[Ofgem: deciles.0.mean_change]** a year, and households' energy spending goes from 9.3% to **[Ofgem: deciles.0.share_after]** of their net income; in the top decile, bills change by an average of **[Ofgem: deciles.9.mean_change]**, and households' energy spending goes from 1.6% to **[Ofgem: deciles.9.share_after]** of their net income
- The number of households spending more than 10% of their net income on energy goes from 2.2 million to **[Ofgem: gb.spend_over_10pct_income_after_m]**
- On Cornwall Insight's forecast, the same model gives an average change of +£415 a year, against **[Ofgem: gb.mean_change]** under Ofgem's cap

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
    { "quarter": "Jan–Mar 2027" }
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
| January to March 2027 | **[Ofgem: typical_bill_announced]** (Ofgem's cap) | 2,500 and 9,500 | **[Ofgem: typical_bill_announced]** |

Sources: Ofgem's announcements of each cap, from [January to March 2025](https://www.ofgem.gov.uk/news/changes-energy-price-cap-between-1-january-and-31-march-2025) to [October to December 2026](https://www.ofgem.gov.uk/news/changes-energy-price-cap-between-1-october-and-31-december-2026) and **[Ofgem: link to the January to March 2027 announcement]**, and its [restatement of the April to June and July to September 2026 caps](https://www.ofgem.gov.uk/sites/default/files/2026-06/Summary-of-changes-to-energy-price-cap-1-July-to-30-September-2026-revised-TDCV.pdf). The last column for January 2025 to March 2026 is our calculation from Ofgem's average rates for each quarter.

Table 2 and Figure 2 compare Ofgem's January rates with its October rates and with Cornwall Insight's forecast.

**Table 2: Price cap for a typical household paying by Direct Debit, Great Britain average**

|  | October to December 2026 (Ofgem) | January to March 2027 (Ofgem) | Change | January to March 2027 (Cornwall Insight forecast) |
| - | -: | -: | -: | -: |
| Electricity unit rate (pence per kWh) | 26.32 | **[Ofgem: inputs.jan_unit_p_per_kwh.electricity]** | **[Ofgem: inputs.unit_change_pct.electricity]** | 32.54 |
| Electricity standing charge (pence per day) | 54.83 | **[Ofgem: inputs.jan_standing_p_per_day.electricity]** | **[Ofgem: inputs.standing_change_pct.electricity]** | 55.78 |
| Gas unit rate (pence per kWh) | 7.97 | **[Ofgem: inputs.jan_unit_p_per_kwh.gas]** | **[Ofgem: inputs.unit_change_pct.gas]** | 10.90 |
| Gas standing charge (pence per day) | 29.68 | **[Ofgem: inputs.jan_standing_p_per_day.gas]** | **[Ofgem: inputs.standing_change_pct.gas]** | 31.04 |
| Typical electricity bill (£ a year) | 858 | **[Ofgem: inputs.jan_typical_bill.electricity]** | **[Ofgem: inputs.typical_fuel_change_pct.electricity]** | 1,017 |
| Typical gas bill (£ a year) | 865 | **[Ofgem: inputs.jan_typical_bill.gas]** | **[Ofgem: inputs.typical_fuel_change_pct.gas]** | 1,149 |
| **Typical dual-fuel bill (£ a year)** | **1,723** | ****[Ofgem: typical_bill_announced]**** | ****[Ofgem: change]**** | **2,166** |

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
    { "fuel": "Electricity" },
    { "fuel": "Gas" }
  ],
  "yLabel": "Change (%)",
  "format": { "decimals": 1, "suffix": "%", "signed": true }
}
```

At typical consumption, the gas bill changes by **[Ofgem: inputs.typical_fuel_change.gas]** and the electricity bill by **[Ofgem: inputs.typical_fuel_change.electricity]** (**[Ofgem: difference]** in total on Ofgem's rates as published, against Ofgem's **[Ofgem: difference]**), so gas accounts for **[Ofgem: gas share]** of the change. **[Ofgem: the reasons Ofgem gives for the change, from its announcement]**

Ofgem expresses the cap as an annual rate. A household pays the January rates for three months. UK households use on average 29.3% of a year's electricity and 42.5% of a year's gas in January to March.[^1] Applying those shares to the unit-rate part of the bill, and 90 days to the standing charges, the cap changes a typical household's bills over January to March by about **[Ofgem: examples.typical_dual_fuel.q1_change]**.

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
    { "household": "Low use", "oct": 1016.0 },
    { "household": "Typical use", "oct": 1724.0 },
    { "household": "High use", "oct": 3139.0 },
    { "household": "Electricity only", "oct": 858.0 }
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
    { "household": "Low use" },
    { "household": "Typical use" },
    { "household": "High use" },
    { "household": "Electricity only" }
  ],
  "yLabel": "Annual bill (£)",
  "format": { "decimals": 0, "prefix": "£", "separator": true },
  "stacked": true
}
```

**Table 3: Annual bill by household type, October to December 2026 against January to March 2027, Direct Debit**

| Household | Electricity | Gas | Total | Standing charges | Unit rates | Change, annual rate | Change over January to March |
| --------- | ----------: | --: | ----: | ---------------: | ---------: | ------------------: | ---------------------------: |
| Low use (half typical) | £529 to **[Ofgem: examples.low_dual_fuel_half_typical.jan.electricity]** | £487 to **[Ofgem: examples.low_dual_fuel_half_typical.jan.gas]** | £1,016 to **[Ofgem: examples.low_dual_fuel_half_typical.jan.total]** | £308 to **[Ofgem: examples.low_dual_fuel_half_typical.jan.standing]** | £708 to **[Ofgem: examples.low_dual_fuel_half_typical.jan.unit]** | **[Ofgem: examples.low_dual_fuel_half_typical.change]** (**[Ofgem: examples.low_dual_fuel_half_typical.change_pct]**) | **[Ofgem: examples.low_dual_fuel_half_typical.q1_change]** |
| Typical use | £858 to **[Ofgem: examples.typical_dual_fuel.jan.electricity]** | £865 to **[Ofgem: examples.typical_dual_fuel.jan.gas]** | £1,724 to **[Ofgem: examples.typical_dual_fuel.jan.total]** | £308 to **[Ofgem: examples.typical_dual_fuel.jan.standing]** | £1,415 to **[Ofgem: examples.typical_dual_fuel.jan.unit]** | **[Ofgem: examples.typical_dual_fuel.change]** (**[Ofgem: examples.typical_dual_fuel.change_pct]**) | **[Ofgem: examples.typical_dual_fuel.q1_change]** |
| High use (double typical) | £1,516 to **[Ofgem: examples.high_dual_fuel_double_typical.jan.electricity]** | £1,623 to **[Ofgem: examples.high_dual_fuel_double_typical.jan.gas]** | £3,139 to **[Ofgem: examples.high_dual_fuel_double_typical.jan.total]** | £308 to **[Ofgem: examples.high_dual_fuel_double_typical.jan.standing]** | £2,830 to **[Ofgem: examples.high_dual_fuel_double_typical.jan.unit]** | **[Ofgem: examples.high_dual_fuel_double_typical.change]** (**[Ofgem: examples.high_dual_fuel_double_typical.change_pct]**) | **[Ofgem: examples.high_dual_fuel_double_typical.q1_change]** |
| Electricity only, typical | £858 to **[Ofgem: examples.electric_only_typical_electricity.jan.electricity]** | £0 | £858 to **[Ofgem: examples.electric_only_typical_electricity.jan.total]** | £200 to **[Ofgem: examples.electric_only_typical_electricity.jan.standing]** | £658 to **[Ofgem: examples.electric_only_typical_electricity.jan.unit]** | **[Ofgem: examples.electric_only_typical_electricity.change]** (**[Ofgem: examples.electric_only_typical_electricity.change_pct]**) | **[Ofgem: examples.electric_only_typical_electricity.q1_change]** |

Cells with two figures give the October bill, then the January bill, at annual rates. The standing charge and unit-rate columns split the total bill. Figures may not sum because of rounding. The last column applies the change in unit rates to the shares of a year's electricity (29.3%) and gas (42.5%) used in January to March and the change in standing charges to 90 days, as for the typical household above. Ofgem publishes its rates to two decimal places, so the typical bill here can differ from Ofgem's headline by £1.

Standing charges change by **[Ofgem: inputs.standing_change_pct.electricity]** (electricity) and **[Ofgem: inputs.standing_change_pct.gas]** (gas), and unit rates by **[Ofgem: inputs.unit_change_pct.electricity]** and **[Ofgem: inputs.unit_change_pct.gas]**, so the bill changes by **[Ofgem: examples.low_dual_fuel_half_typical.change_pct]** at low use, **[Ofgem: examples.typical_dual_fuel.change_pct]** at typical use and **[Ofgem: examples.high_dual_fuel_double_typical.change_pct]** at high use. Standing charges make up **[Ofgem: examples.low_dual_fuel_half_typical.standing_share_jan]** of the low-use bill in January and **[Ofgem: examples.high_dual_fuel_double_typical.standing_share_jan]** of the high-use bill. A home without gas using 2,500 kWh faces a change of **[Ofgem: examples.electric_only_typical_electricity.change_pct]**, against **[Ofgem: examples.typical_dual_fuel.change_pct]** at typical use of both fuels, because the typical electricity bill changes by **[Ofgem: inputs.typical_fuel_change_pct.electricity]** and the typical gas bill by **[Ofgem: inputs.typical_fuel_change_pct.gas]** (Table 2). In our data, households that do not use gas spend an average of £1,149 a year on electricity at October prices, against £858 at 2,500 kWh.

## Bills across the income distribution

We apply Ofgem's cap to the electricity and gas spending of every household in Great Britain in PolicyEngine UK's data, [Microcosm UK](https://www.policyengine.org/uk/model/data). We first restate each household's spending at October to December 2026 prices, using PolicyEngine UK's energy price indices. We then change each household's electricity spending by **[Ofgem: inputs.typical_fuel_change_pct.electricity]** and its gas spending by **[Ofgem: inputs.typical_fuel_change_pct.gas]**, the changes in the typical bill for each fuel in Table 2. All figures are annual rates and assume that households do not change how much energy they use. At October prices, households that use both fuels spend an average of £1,805 a year in our data, and the median such household spends £1,503, against Ofgem's typical bill of £1,723.

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
    { "decile": "1", "oct": 1514.0 },
    { "decile": "2", "oct": 1581.0 },
    { "decile": "3", "oct": 1566.0 },
    { "decile": "4", "oct": 1606.0 },
    { "decile": "5", "oct": 1654.0 },
    { "decile": "6", "oct": 1653.0 },
    { "decile": "7", "oct": 1700.0 },
    { "decile": "8", "oct": 1742.0 },
    { "decile": "9", "oct": 1874.0 },
    { "decile": "10", "oct": 2140.0 }
  ],
  "yLabel": "Average annual bill (£)",
  "format": { "decimals": 0, "prefix": "£", "separator": true },
  "valueLabels": false
}
```

Households in the top decile spend more on energy than those in the bottom (Figure 5). Their bills change by an average of **[Ofgem: deciles.9.mean_change]** a year, against **[Ofgem: deciles.0.mean_change]** in the bottom decile (Figure 7). As a share of net income (Figure 6 and Table 4), spending goes from 9.3% to **[Ofgem: deciles.0.share_after]** in the bottom decile and from 1.6% to **[Ofgem: deciles.9.share_after]** in the top.

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
    { "decile": "1", "oct": 9.274 },
    { "decile": "2", "oct": 5.738 },
    { "decile": "3", "oct": 4.977 },
    { "decile": "4", "oct": 4.464 },
    { "decile": "5", "oct": 4.01 },
    { "decile": "6", "oct": 3.411 },
    { "decile": "7", "oct": 3.02 },
    { "decile": "8", "oct": 2.718 },
    { "decile": "9", "oct": 2.42 },
    { "decile": "10", "oct": 1.639 }
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
  "subtitle": "Annual rate, from Ofgem's October to December 2026 rates to its January to March 2027 rates; **[Ofgem: gb.mean_change]** across all households",
  "xKey": "decile",
  "series": [{ "key": "change", "name": "Change in average bill", "color": "primary" }],
  "data": [
    { "decile": "1" },
    { "decile": "2" },
    { "decile": "3" },
    { "decile": "4" },
    { "decile": "5" },
    { "decile": "6" },
    { "decile": "7" },
    { "decile": "8" },
    { "decile": "9" },
    { "decile": "10" }
  ],
  "yLabel": "Change in average annual bill (£)",
  "format": { "decimals": 0, "prefix": "£", "signed": true },
  "legend": false
}
```

**Table 4: Household energy bills by income decile, Great Britain (annual rates)**

| Income decile | Average net income | Bill, October rates | Bill, January rates | Change | Share of income, October | Share of income, January |
| ------------- | -----------------: | ------------------: | ------------------: | -----: | -----------------------: | -----------------------: |
| 1 (lowest) | £16,320 | £1,514 | **[Ofgem: decile 1]** | **[Ofgem: decile 1]** | 9.3% | **[Ofgem: decile 1]** |
| 2 | £27,548 | £1,581 | **[Ofgem: decile 2]** | **[Ofgem: decile 2]** | 5.7% | **[Ofgem: decile 2]** |
| 3 | £31,465 | £1,566 | **[Ofgem: decile 3]** | **[Ofgem: decile 3]** | 5.0% | **[Ofgem: decile 3]** |
| 4 | £35,982 | £1,606 | **[Ofgem: decile 4]** | **[Ofgem: decile 4]** | 4.5% | **[Ofgem: decile 4]** |
| 5 | £41,239 | £1,654 | **[Ofgem: decile 5]** | **[Ofgem: decile 5]** | 4.0% | **[Ofgem: decile 5]** |
| 6 | £48,467 | £1,653 | **[Ofgem: decile 6]** | **[Ofgem: decile 6]** | 3.4% | **[Ofgem: decile 6]** |
| 7 | £56,314 | £1,700 | **[Ofgem: decile 7]** | **[Ofgem: decile 7]** | 3.0% | **[Ofgem: decile 7]** |
| 8 | £64,078 | £1,742 | **[Ofgem: decile 8]** | **[Ofgem: decile 8]** | 2.7% | **[Ofgem: decile 8]** |
| 9 | £77,425 | £1,874 | **[Ofgem: decile 9]** | **[Ofgem: decile 9]** | 2.4% | **[Ofgem: decile 9]** |
| 10 (highest) | £130,569 | £2,140 | **[Ofgem: decile 10]** | **[Ofgem: decile 10]** | 1.6% | **[Ofgem: decile 10]** |
| All | | £1,702 | **[Ofgem: gb.mean_after]** | **[Ofgem: gb.mean_change]** | 3.2% | **[Ofgem: gb.share_of_income_after]** |

We calculate changes from unrounded bills. Net income is household net income before housing costs, as in the Department for Work and Pensions' Households Below Average Income statistics. We rank households into deciles by that income, adjusted for household size, so that each decile holds a tenth of people in the UK.

In our data, 4.4 million households in Great Britain have no gas spending. Their bills change by an average of **[Ofgem: gb.elec_only_mean_change]** a year, against **[Ofgem: gb.dual_mean_change]** for the 23.9 million households that use both fuels.

We estimate that at October rates, 2.2 million households spend more than 10% of their net income before housing costs on energy, counting the 0.1 million with zero income (the Households Below Average Income statistics reset negative incomes to zero). At the January rates, held for a full year, **[Ofgem: gb.spend_over_10pct_income_after_m]** would. This is not an official fuel poverty measure. It also differs from the fuel-stress measure in the Autumn Budget, which compares energy spending with income after housing costs; our [analysis of the Budget's energy bill measures](https://policyengine.org/uk/research/budget-2026-energy-bills) uses that measure.

The bills in these figures leave out the support that households receive outside the cap, such as the £100 Household Energy Payment in England, the Warm Home Discount and the Winter Fuel Payment. Net income counts those payments as income, as the Households Below Average Income statistics do for the Warm Home Discount and the Winter Fuel Payment and did for the 2022 energy support.

## Ofgem's cap against the forecast

Cornwall Insight forecast a typical bill of £2,166; Ofgem's cap is **[Ofgem: typical_bill_announced]**. Table 5 and Figure 8 run both through the same model and data, so the differences come from the rates alone.

**Table 5: Cornwall Insight's forecast and Ofgem's cap for January to March 2027, Great Britain (annual rates)**

|  | Cornwall Insight forecast (18 November) | Ofgem cap (**[Ofgem: announcement date]**) | Difference |
| - | -: | -: | -: |
| Typical dual-fuel bill (£ a year) | 2,166 | **[Ofgem: typical_bill_announced]** | **[Ofgem: difference]** |
| Electricity unit rate (pence per kWh) | 32.54 | **[Ofgem: inputs.jan_unit_p_per_kwh.electricity]** | **[Ofgem: difference]** |
| Gas unit rate (pence per kWh) | 10.90 | **[Ofgem: inputs.jan_unit_p_per_kwh.gas]** | **[Ofgem: difference]** |
| Change in the average household bill (£ a year) | +£415 | **[Ofgem: gb.mean_change]** | **[Ofgem: difference]** |
| Change, lowest income decile (£ a year) | +£367 | **[Ofgem: deciles.0.mean_change]** | **[Ofgem: difference]** |
| Change, highest income decile (£ a year) | +£522 | **[Ofgem: deciles.9.mean_change]** | **[Ofgem: difference]** |
| Households spending over 10% of net income on energy (million) | 3.6 | **[Ofgem]** | **[Ofgem]** |

```chart
{
  "type": "bar",
  "title": "Figure 8: Change in the average household energy bill by income decile, forecast and actual cap, Great Britain",
  "subtitle": "Annual rate, from Ofgem's October to December 2026 rates to Cornwall Insight's January to March 2027 forecast and to Ofgem's January to March 2027 cap",
  "xKey": "decile",
  "series": [
    { "key": "forecast", "name": "Cornwall Insight forecast", "color": "quinary" },
    { "key": "ofgem", "name": "Ofgem cap", "color": "primary" }
  ],
  "data": [
    { "decile": "1", "forecast": 367.0 },
    { "decile": "2", "forecast": 382.0 },
    { "decile": "3", "forecast": 384.0 },
    { "decile": "4", "forecast": 392.0 },
    { "decile": "5", "forecast": 406.0 },
    { "decile": "6", "forecast": 403.0 },
    { "decile": "7", "forecast": 417.0 },
    { "decile": "8", "forecast": 421.0 },
    { "decile": "9", "forecast": 456.0 },
    { "decile": "10", "forecast": 522.0 }
  ],
  "yLabel": "Change in average annual bill (£)",
  "format": { "decimals": 0, "prefix": "£", "signed": true },
  "valueLabels": false
}
```

Our earlier post estimated an average change of +£415 on Cornwall Insight's forecast with `policyengine` 6.20.2 (PolicyEngine UK 2.177.7, Microcosm build fcfac709). This post uses `policyengine` 6.20.2 (PolicyEngine UK 2.177.7, Microcosm build fcfac709), a newer model and dataset; with them, the same forecast gives +£415, and the October figures move too: the bottom decile's energy spending is 9.3% of its net income, against 9.3% in the earlier post, and 2.2 million households spend more than 10% of their net income on energy, against 2.2 million.

## Methodology

We use [PolicyEngine UK 2.177.7](https://github.com/PolicyEngine/policyengine-uk/tree/2.177.7) with Microcosm UK build fcfac709, the pair that the `policyengine` Python package certifies in version 6.20.2. PolicyEngine UK's energy price indices, which follow the Office for Budget Responsibility's October 2026 forecast, restate each household's 2026-27 spending at October to December 2026 prices. Microcosm prices electricity with 5% VAT, which we remove to match Ofgem's rates. We leave out Northern Ireland, which the Ofgem cap does not cover.

The method has five limitations:

- **Tariffs.** We apply the cap change to every household. The cap covers default tariffs; households on fixed tariffs see no change in January.
- **Payment method.** We apply the Direct Debit change to every household. Ofgem sets a different cap for standard credit and prepayment, and our data do not separate Direct Debit from standard credit.
- **Standing charges.** We scale each household's spending on a fuel by one factor, the change in the typical bill, so households that use less or more than the typical amount get the typical household's percentage change. For a household using half the typical amount, the cap gives **[Ofgem: examples.low_dual_fuel_half_typical.jan.fuel_change_pct.electricity]** against **[Ofgem: examples.typical_dual_fuel.jan.fuel_change_pct.electricity]** for electricity and **[Ofgem: examples.low_dual_fuel_half_typical.jan.fuel_change_pct.gas]** against **[Ofgem: examples.typical_dual_fuel.jan.fuel_change_pct.gas]** for gas.
- **Annual rates.** We hold the January rates for a full year, as Ofgem's typical bill does. Ofgem sets the cap for April to June 2027 separately, in February 2027.
- **Fixed use.** We hold each household's energy use fixed as prices change.

The code, the cap inputs and the aggregated results behind this post are in the [post folder](https://github.com/PolicyEngine/uk-energy-price-cap-jan-2027/tree/main/post) of the uk-energy-price-cap-jan-2027 repository.

[^1]: DESNZ, Energy Trends, [electricity](https://www.gov.uk/government/statistics/electricity-section-5-energy-trends) (ET 5.2) and [gas](https://www.gov.uk/government/statistics/gas-section-4-energy-trends) (ET 4.1): the mean shares of a year's UK domestic consumption used in January to March, 2015 to 2025, which PolicyEngine UK holds as parameters (29.29% for electricity and 42.50% for gas).
