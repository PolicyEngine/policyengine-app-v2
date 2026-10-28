The [Autumn Budget 2026, paragraph 6.254](https://assets.publishing.service.gov.uk/media/6ae1ec57bdb574cf1c9b3f12/E03668986_HMT_Budget_2026_ELAY__2_.pdf#page=142) raises the trading allowance from £1,000 to £3,000 from 6 April 2027, covering eligible trading and miscellaneous income. This post explains the rule and its effects on example households, using PolicyEngine UK calculations.

Key figures:

- An employee paying 20% income tax on eligible side income can save £400 a year from the extra £2,000 deduction.
- A sole trader with £20,000 of receipts and £500 of expenses gains £520 through lower income tax and Class 4 National Insurance.
- A Universal Credit claimant in the example below keeps £180 of a £400 tax reduction, after UC falls by £220.
- The government's costing, certified by the OBR, puts the cost in income tax and National Insurance at nothing in 2027–28 and £221 million in 2028–29. The Budget's [Table 6.1, row 15](https://www.gov.uk/government/publications/supporting-documents-for-budget-2026) rounds the measure's total to £225 million in 2028–29.

Our [Autumn Budget 2026 dashboard](https://www.policyengine.org/uk/autumn-budget-2026) is where we publish estimates for the Budget measures we model. We cover the property income tax increase in a [separate explainer](/uk/research/uk-autumn-budget-2026-property-income-tax).

## How the allowance works

The allowance is an alternative to deducting actual business expenses. Gross receipts are the money received before expenses; profit is what remains after those expenses. A person with £4,000 of receipts and £500 of allowable expenses has £3,500 of profit before considering the allowance.

Under [HMRC's trading allowance guidance](https://www.gov.uk/guidance/tax-free-allowances-on-property-and-trading-income), an eligible person can choose the allowance or actual expenses. They cannot deduct both against the same receipts. If receipts do not exceed the allowance, full relief can make the taxable amount zero.

The allowance cannot create a tax loss. [HMRC's full-relief rules](https://www.gov.uk/hmrc-internal-manuals/business-income-manual/bim86011) treat the profits and losses of relevant trades as nil. A loss-making trader can elect out and use ordinary loss rules, as [HMRC's trading-loss example](https://www.gov.uk/hmrc-internal-manuals/business-income-manual/bim86076) illustrates.

There is one allowance per individual across their eligible trades and miscellaneous income, rather than a separate allowance for each activity. The allocation between sources follows [section 783AK of the Income Tax (Trading and Other Income) Act 2005](https://www.legislation.gov.uk/ukpga/2005/5/section/783AK). The separate property income allowance does not increase under this measure.

The allowance does not cover a trade carried on in partnership. Nobody can use it in a tax year in which their trading or miscellaneous income includes a payment from their employer or their spouse's or civil partner's employer, from a partnership in which they or someone connected to them is a partner, or from a company that they or someone connected to them owns or controls. [HMRC's exclusions](https://www.gov.uk/hmrc-internal-manuals/business-income-manual/bim86030) describe those restrictions.

## Household impacts

The examples isolate the trading allowance increase in 2027–28. They hold earnings, receipts and expenses fixed and exclude other Budget measures.

### Three people with the same receipts

Alex, Blair and Casey are hypothetical single adults aged 35 in England in 2027–28. Each earns £30,000 from employment and receives £4,000 from a side business. They have no other income, dependants, student loan repayments or benefit entitlements. Their trading profits remain in the 20% income tax band. Their costs differ.

The table isolates income tax on the side business, holding receipts and expenses fixed.

| Person | Annual side-business receipts | Actual expenses | Taxable amount under current rules | Taxable amount under new rules | Income tax before | Income tax after | Annual tax reduction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Alex | £4,000 | £500 | £3,000 | £1,000 | £600 | £200 | £400 |
| Blair | £4,000 | £2,500 | £1,500 | £1,000 | £300 | £200 | £100 |
| Casey | £4,000 | £3,500 | £500 | £500 | £100 | £100 | £0 |

For Alex, the allowance exceeds expenses under both rules. Taxable income falls from £4,000 − £1,000 = £3,000 to £4,000 − £3,000 = £1,000. The tax reduction is £2,000 × 20% = £400.

For Blair, actual expenses provide the larger deduction under current law. The £3,000 allowance then exceeds those £2,500 expenses by £500, reducing tax by £500 × 20% = £100.

For Casey, actual expenses exceed both allowances. The individual continues to deduct £3,500, so taxable income and tax do not change.

At a 40% marginal rate, the same calculations give reductions of £800, £200 and £0, assuming no tax-band changes or other interactions.

### From £500 to £5,000 of side income

The chart varies gross receipts for the same £30,000 employee. One series assumes no business expenses; the other assumes expenses equal 75% of receipts. Each calculation chooses the larger deduction in each scenario.

```chart
{
  "type": "line",
  "title": "Trading allowance: the income tax reduction depends on expenses",
  "subtitle": "Annual income tax reduction; England, £30,000 salary, 2027–28",
  "xKey": "receipts",
  "xLabel": "Annual side-business receipts",
  "yLabel": "Annual income tax reduction",
  "format": {
    "prefix": "£",
    "decimals": 0,
    "separator": true
  },
  "xFormat": {
    "prefix": "£",
    "decimals": 0,
    "separator": true
  },
  "source": "PolicyEngine 6.11.1 / UK 2.151.0; synthetic adults, 2027–28; incomes held fixed.",
  "series": [
    {
      "key": "noExpenses",
      "name": "No business expenses",
      "color": "primary"
    },
    {
      "key": "highExpenses",
      "name": "Expenses equal 75% of receipts",
      "color": "secondary"
    }
  ],
  "markers": [
    {
      "x": 1000,
      "label": "Current allowance"
    },
    {
      "x": 3000,
      "label": "New allowance"
    },
    {
      "x": 4000,
      "label": "75% expenses equal £3,000"
    }
  ],
  "data": [
    {
      "receipts": 500,
      "noExpenses": 0.0,
      "highExpenses": 0.0
    },
    {
      "receipts": 600,
      "noExpenses": 0.0,
      "highExpenses": 0.0
    },
    {
      "receipts": 700,
      "noExpenses": 0.0,
      "highExpenses": 0.0
    },
    {
      "receipts": 800,
      "noExpenses": 0.0,
      "highExpenses": 0.0
    },
    {
      "receipts": 900,
      "noExpenses": 0.0,
      "highExpenses": 0.0
    },
    {
      "receipts": 1000,
      "noExpenses": 0.0,
      "highExpenses": 0.0
    },
    {
      "receipts": 1100,
      "noExpenses": 20.0,
      "highExpenses": 20.0
    },
    {
      "receipts": 1200,
      "noExpenses": 40.0,
      "highExpenses": 40.0
    },
    {
      "receipts": 1300,
      "noExpenses": 60.0,
      "highExpenses": 60.0
    },
    {
      "receipts": 1333.3333333333333,
      "noExpenses": 66.67,
      "highExpenses": 66.67
    },
    {
      "receipts": 1400,
      "noExpenses": 80.0,
      "highExpenses": 70.0
    },
    {
      "receipts": 1500,
      "noExpenses": 100.0,
      "highExpenses": 75.0
    },
    {
      "receipts": 1600,
      "noExpenses": 120.0,
      "highExpenses": 80.0
    },
    {
      "receipts": 1700,
      "noExpenses": 140.0,
      "highExpenses": 85.0
    },
    {
      "receipts": 1800,
      "noExpenses": 160.0,
      "highExpenses": 90.0
    },
    {
      "receipts": 1900,
      "noExpenses": 180.0,
      "highExpenses": 95.0
    },
    {
      "receipts": 2000,
      "noExpenses": 200.0,
      "highExpenses": 100.0
    },
    {
      "receipts": 2100,
      "noExpenses": 220.0,
      "highExpenses": 105.0
    },
    {
      "receipts": 2200,
      "noExpenses": 240.0,
      "highExpenses": 110.0
    },
    {
      "receipts": 2300,
      "noExpenses": 260.0,
      "highExpenses": 115.0
    },
    {
      "receipts": 2400,
      "noExpenses": 280.0,
      "highExpenses": 120.0
    },
    {
      "receipts": 2500,
      "noExpenses": 300.0,
      "highExpenses": 125.0
    },
    {
      "receipts": 2600,
      "noExpenses": 320.0,
      "highExpenses": 130.0
    },
    {
      "receipts": 2700,
      "noExpenses": 340.0,
      "highExpenses": 135.0
    },
    {
      "receipts": 2800,
      "noExpenses": 360.0,
      "highExpenses": 140.0
    },
    {
      "receipts": 2900,
      "noExpenses": 380.0,
      "highExpenses": 145.0
    },
    {
      "receipts": 3000,
      "noExpenses": 400.0,
      "highExpenses": 150.0
    },
    {
      "receipts": 3100,
      "noExpenses": 400.0,
      "highExpenses": 135.0
    },
    {
      "receipts": 3200,
      "noExpenses": 400.0,
      "highExpenses": 120.0
    },
    {
      "receipts": 3300,
      "noExpenses": 400.0,
      "highExpenses": 105.0
    },
    {
      "receipts": 3400,
      "noExpenses": 400.0,
      "highExpenses": 90.0
    },
    {
      "receipts": 3500,
      "noExpenses": 400.0,
      "highExpenses": 75.0
    },
    {
      "receipts": 3600,
      "noExpenses": 400.0,
      "highExpenses": 60.0
    },
    {
      "receipts": 3700,
      "noExpenses": 400.0,
      "highExpenses": 45.0
    },
    {
      "receipts": 3800,
      "noExpenses": 400.0,
      "highExpenses": 30.0
    },
    {
      "receipts": 3900,
      "noExpenses": 400.0,
      "highExpenses": 15.0
    },
    {
      "receipts": 4000,
      "noExpenses": 400.0,
      "highExpenses": 0.0
    },
    {
      "receipts": 4100,
      "noExpenses": 400.0,
      "highExpenses": 0.0
    },
    {
      "receipts": 4200,
      "noExpenses": 400.0,
      "highExpenses": 0.0
    },
    {
      "receipts": 4300,
      "noExpenses": 400.0,
      "highExpenses": 0.0
    },
    {
      "receipts": 4400,
      "noExpenses": 400.0,
      "highExpenses": 0.0
    },
    {
      "receipts": 4500,
      "noExpenses": 400.0,
      "highExpenses": 0.0
    },
    {
      "receipts": 4600,
      "noExpenses": 400.0,
      "highExpenses": 0.0
    },
    {
      "receipts": 4700,
      "noExpenses": 400.0,
      "highExpenses": 0.0
    },
    {
      "receipts": 4800,
      "noExpenses": 400.0,
      "highExpenses": 0.0
    },
    {
      "receipts": 4900,
      "noExpenses": 400.0,
      "highExpenses": 0.0
    },
    {
      "receipts": 5000,
      "noExpenses": 400.0,
      "highExpenses": 0.0
    }
  ]
}
```

With no expenses, the tax reduction rises between £1,000 and £3,000 of receipts, then stays at £400. With expenses equal to 75% of receipts, the reduction reaches £150 at £3,000 of receipts and falls to zero at £4,000: actual expenses then equal the new £3,000 allowance.

### A full-time sole trader can gain £520

The allowance also reduces profits for Class 4 National Insurance, as [HMRC's Business Income Manual, BIM86052](https://www.gov.uk/hmrc-internal-manuals/business-income-manual/bim86052), explains. The side-business examples above remain below the [£12,570 Class 4 lower profits limit](https://www.gov.uk/government/publications/rates-and-allowances-national-insurance-contributions/rates-and-allowances-national-insurance-contributions), so their Class 4 contributions do not change.

Consider instead a 35-year-old sole trader in England working 35 hours a week, with £20,000 annual receipts and £500 expenses. They have no other income or children, own their home outright and do not claim Universal Credit. Actual profit is £19,500. Choosing the allowance gives taxable profits of £19,000 before the change and £17,000 after it.

| Annual calculation, 2027–28 | £1,000 allowance | £3,000 allowance | Reduction |
| --- | ---: | ---: | ---: |
| Taxable trading profit | £19,000 | £17,000 | £2,000 |
| Income tax | £1,286 | £886 | £400 |
| Class 4 National Insurance | £386 | £266 | £120 |
| Combined tax and Class 4 | £1,672 | £1,152 | £520 |

Both taxable profits exceed the £12,570 lower limit, so the extra £2,000 deduction saves 6% in Class 4 contributions as well as 20% income tax. With benefits unchanged, annual household net income rises by £520.

### Universal Credit can offset part of the tax saving

The trading allowance itself does not reduce the profit counted for Universal Credit. However, paying less income tax can increase the earnings UC takes into account, reducing the award.

Our example is a 35-year-old lone parent with a four-year-old child, living in Central London and paying £12,000 annual private rent. They earn £18,000 from employment for 20 hours a week and claim UC and Child Benefit. They have no assets, childcare costs, disability, pension contributions or other income. The side business has zero expenses and is not their main employment: we assume it does not meet UC's gainful self-employment definition, so the minimum income floor does not apply.

| Annual side-business receipts | Income tax reduction | UC reduction | Household net-income gain |
| --- | ---: | ---: | ---: |
| £4,000 | £400 | £220 | £180 |

Earnings already exceed the work allowance. Every £1 of tax saved increases counted earnings by £1, and UC falls by the [55% taper](https://www.gov.uk/universal-credit/how-your-wages-affect-your-payments) applied to that increase. The £400 tax reduction therefore leaves a £180 household gain.

These are annual model results. Actual UC uses monthly assessment periods and deducts relevant self-employment income tax and National Insurance when paid, under [regulation 57(2)](https://www.legislation.gov.uk/uksi/2013/376/regulation/57). Uneven receipts or a large tax payment in one month can produce a different pattern of awards and a different annual gain.

## The government's costing

The government's costing, certified by the OBR, appears line by line as measure 15 in Table 1.1 of the OBR's [detailed forecast tables](https://obr.uk/efo/economic-and-fiscal-outlook-october-2026/), "Breakdown of policy decisions since March 2026". Its “Income tax” and “NICs” (National Insurance contributions) lines cover the taxes in this post's examples, and income tax is about 93% of their sum in each year from 2028–29. The table shows that sum, with the cost to the Exchequer as a positive value.

For context, the last column gives the measure's rounded total from the Budget's [Table 6.1, row 15](https://www.gov.uk/government/publications/supporting-documents-for-budget-2026). That total also includes the “PSCE in RDEL”, “Scottish BGA (current)” and “Scottish self-financed expenditure” lines, which together add about £2 million a year from 2027–28. The Budget's policy costings show the same rounded figures.

| Year | Income tax and NICs (£ million) | Table 6.1 total (£ million) |
| --- | ---: | ---: |
| 2026–27 | 0 | 0 |
| 2027–28 | 0 | 0 |
| 2028–29 | 221 | 225 |
| 2029–30 | 165 | 165 |
| 2030–31 | 171 | 175 |
| 2031–32 | 178 | 180 |

The effective date remains 6 April 2027 even though the costing has no income tax or NICs effect in 2027–28. Tax-year liabilities and fiscal-year receipts forecasts differ. For context, an outstanding Self Assessment balancing payment for 2027–28 would normally be due on 31 January 2029. Some taxpayers also make advance instalments, as [HMRC's payments-on-account guidance](https://www.gov.uk/understand-self-assessment-bill/payments-on-account) explains.

The Budget's [policy costings](https://assets.publishing.service.gov.uk/media/6ae1883fe4367e5c8b0467df/AB26_Policy_Costing.pdf#page=23) say the costing allows for taxpayers switching from actual expenses to the larger allowance, a behavioural response. They do not give an affected-person count.

PolicyEngine's static estimates count each tax year's liability in that year, so a PolicyEngine figure for 2027–28 is not comparable with the government's costing for 2027–28.

## Assumptions and limitations

The hypothetical examples isolate the allowance increase, holding earnings, receipts and expenses fixed and choosing the larger deduction. The side-business tax table excludes benefit interactions; the lone-parent and sole-trader examples calculate the stated tax, National Insurance and benefit changes. None includes trading losses or behavioural responses.

The side-business examples have no benefit entitlements. The lone-parent example assumes full take-up of Universal Credit and Child Benefit and no minimum income floor. The sole trader claims no Universal Credit. These are annual results; monthly UC assessment periods and the timing of tax payments can change the annual gain in practice. No example includes pension contributions, Gift Aid, student loan repayments or other tax reliefs.

PolicyEngine's national estimates use population data without gross receipts. The model's [deduction calculation](https://github.com/PolicyEngine/policyengine-uk/blob/2.151.0/policyengine_uk/variables/gov/hmrc/income_tax/allowances/trading_allowance_deduction.py) therefore approximates the allowance using reported profit. Tests with the same hypothetical households show effects in both directions:

- For the lone parent above with £1,500 of receipts instead of £4,000, and no expenses, supplying receipts produces the correct £100 tax reduction. Omitting receipts makes the approximation tax the full £1,500 before the reform and none afterwards, producing a £300 reduction.
- For the sole trader with £20,000 receipts and £500 expenses, supplying receipts produces the £520 tax-and-NI gain above. With only the £19,500 profit supplied, the approximation applies no deduction under either allowance, producing no gain.

This population approximation also misses Class 4 savings: the profits it relieves are at most £3,000, below the £12,570 lower profits limit.

The model also omits allowance relief against its separate miscellaneous-income input, although qualifying miscellaneous income shares the legal allowance. This excludes a category of potential gains. The combined direction of bias in PolicyEngine's national estimate remains unknown.

## Methodology

We use the `policyengine` Python package (version 6.11.1), PolicyEngine UK (version 2.151.0) and core (version 3.33.3), matching the dashboard's adopted bundle. Household calculations use `pe.uk.calculate_household`, with the OBR's October 2026 forecast update applied to both the baseline and reform. The reform changes only the trading allowance, from £1,000 to £3,000. Earnings, receipts and expenses stay at the stated nominal amounts in 2027–28.

The household examples supply both gross receipts and profit to represent actual expenses, choose the larger deduction and check tax and benefit changes against independent arithmetic. The line chart plots the exact points where the schedule changes and regular £100 intervals. Its interpolation agrees with PolicyEngine UK to within one penny at every £2 of receipts. The baseline and reform both use the October forecast at dashboard commit `64042657`. The [analysis files](https://github.com/PolicyEngine/policyengine-app-v2/tree/main/analysis/uk-budget-2026-income-tax) record inputs, outputs, validation and the exact forecast source. Tables and chart labels round monetary values to whole pounds.
