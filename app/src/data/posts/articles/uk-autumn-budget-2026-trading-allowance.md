The [Autumn Budget 2026](https://www.gov.uk/government/publications/budget-2026-document/budget-2026-html) raises the trading allowance from £1,000 to £3,000 from 6 April 2027, covering eligible trading and miscellaneous income. Our preliminary static estimate puts the cost at **£112 million in 2027–28**. The Treasury's [Table 6.1, row 15](https://www.gov.uk/government/publications/supporting-documents-for-budget-2026) forecasts a **£225 million receipts cost in 2028–29**. These figures cover different years and use different methods.

An employee paying 20% income tax on their side income can save £400 a year from the extra £2,000 deduction. A sole trader can also save National Insurance, while Universal Credit can offset part of a claimant's tax saving. Receipts, expenses and other household circumstances determine the gain.

Our [Budget dashboard](https://policyengine.org/uk/budgets/autumn-2026) places it alongside the other announced tax and benefit changes. We cover the savings and property income tax increases in a [separate explainer](/uk/research/uk-autumn-budget-2026-savings-property-income-tax).

## How the allowance works

The allowance is an alternative to deducting actual business expenses. Gross receipts are the money received before expenses; profit is what remains after those expenses. A person with £4,000 of receipts and £500 of allowable expenses has £3,500 of profit before considering the allowance.

Under [HMRC's trading allowance guidance](https://www.gov.uk/guidance/tax-free-allowances-on-property-and-trading-income), an eligible person can choose the allowance or actual expenses. They cannot deduct both against the same receipts. If receipts are within the allowance, full relief can make the taxable amount zero.

The allowance cannot create a tax loss. [HMRC's full-relief rules](https://www.gov.uk/hmrc-internal-manuals/business-income-manual/bim86011) treat the profits and losses of relevant trades as nil. A loss-making trader can elect out and use ordinary loss rules, as [HMRC's trading-loss example](https://www.gov.uk/hmrc-internal-manuals/business-income-manual/bim86076) illustrates.

There is one allowance per individual across their eligible trades and miscellaneous income, rather than a separate allowance for each activity. The allocation between sources follows [section 783AK of the Income Tax (Trading and Other Income) Act 2005](https://www.legislation.gov.uk/ukpga/2005/5/section/783AK). The separate property income allowance does not increase under this measure.

The allowance is unavailable for partnership income and certain connected-party receipts, including income from an individual's employer or a company they control. [HMRC's exclusions](https://www.gov.uk/hmrc-internal-manuals/business-income-manual/bim86030) describe those restrictions.

## Three people with the same receipts

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

Alex is also the household proposed for the dashboard's trading-allowance example. Its North West location and salary growth do not change this £400 result. The table fixes income in 2027–28 and isolates the allowance; select that measure alone when comparing with the calculator, whose spending inputs can also activate other Budget measures.

## From £500 to £5,000 of side income

The chart varies gross receipts for the same £30,000 employee. One series assumes no business expenses; the other assumes expenses equal 75% of receipts. Each calculation chooses the larger deduction in each scenario.

```chart
{
  "type": "bar",
  "title": "Trading allowance: the income tax reduction depends on expenses",
  "subtitle": "Annual income tax reduction; England, £30,000 salary, 2027–28",
  "xKey": "receipts",
  "yLabel": "Annual income tax reduction (£)",
  "format": {
    "prefix": "£",
    "decimals": 0
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
  "data": [
    {
      "receipts": "£500",
      "noExpenses": 0.0,
      "highExpenses": 0.0
    },
    {
      "receipts": "£1,000",
      "noExpenses": 0.0,
      "highExpenses": 0.0
    },
    {
      "receipts": "£1,500",
      "noExpenses": 100.0,
      "highExpenses": 75.0
    },
    {
      "receipts": "£2,000",
      "noExpenses": 200.0,
      "highExpenses": 100.0
    },
    {
      "receipts": "£2,500",
      "noExpenses": 300.0,
      "highExpenses": 125.0
    },
    {
      "receipts": "£3,000",
      "noExpenses": 400.0,
      "highExpenses": 150.0
    },
    {
      "receipts": "£3,500",
      "noExpenses": 400.0,
      "highExpenses": 75.0
    },
    {
      "receipts": "£4,000",
      "noExpenses": 400.0,
      "highExpenses": 0.0
    },
    {
      "receipts": "£4,500",
      "noExpenses": 400.0,
      "highExpenses": 0.0
    },
    {
      "receipts": "£5,000",
      "noExpenses": 400.0,
      "highExpenses": 0.0
    }
  ]
}
```

With no expenses, the tax reduction rises between £1,000 and £3,000 of receipts, then stays at £400. With expenses equal to 75% of receipts, the reduction reaches £150 at £3,000 of receipts and falls to zero at £4,000: actual expenses then equal the new £3,000 allowance.

## A full-time sole trader can gain £520

The allowance also reduces profits for Class 4 National Insurance, as [HMRC's Business Income Manual, BIM86052](https://www.gov.uk/hmrc-internal-manuals/business-income-manual/bim86052), explains. The side-business examples above remain below the [£12,570 Class 4 lower profits limit](https://www.gov.uk/government/publications/rates-and-allowances-national-insurance-contributions/rates-and-allowances-national-insurance-contributions), so their Class 4 contributions do not change.

Consider instead a 35-year-old sole trader in England working 35 hours a week, with £20,000 annual receipts and £500 expenses. They have no other income or children, own their home outright and do not claim Universal Credit. Actual profit is £19,500. Choosing the allowance gives taxable profits of £19,000 before the change and £17,000 after it.

| Annual calculation, 2027–28 | £1,000 allowance | £3,000 allowance | Reduction |
| --- | ---: | ---: | ---: |
| Taxable trading profit | £19,000 | £17,000 | £2,000 |
| Income tax | £1,286 | £886 | £400 |
| Class 4 National Insurance | £385.80 | £265.80 | £120 |
| Combined tax and Class 4 | £1,671.80 | £1,151.80 | £520 |

Both taxable profits exceed the £12,570 lower limit, so the extra £2,000 deduction saves 6% in Class 4 contributions as well as 20% income tax. With benefits unchanged, annual household net income rises by £520.

## Universal Credit can offset part of the tax saving

The trading allowance itself does not reduce the profit counted for Universal Credit. However, paying less income tax can increase the earnings UC takes into account, reducing the award.

Our example is a 35-year-old lone parent with a four-year-old child, living in Central London and paying £12,000 annual private rent. They earn £18,000 from employment for 20 hours a week and claim UC and Child Benefit. They have no assets, childcare costs, disability, pension contributions or other income. The side business has zero expenses and is not their main employment: it is assumed not to meet UC's gainful self-employment definition, so the minimum income floor does not apply.

| Annual side-business receipts | Income tax reduction | UC reduction | Household net-income gain |
| --- | ---: | ---: | ---: |
| £4,000 | £400 | £220 | £180 |
| £1,500 | £100 | £55 | £45 |

In both cases, earnings already exceed the work allowance. Every £1 of tax saved increases counted earnings by £1, and UC falls by the [55% taper](https://www.gov.uk/universal-credit/how-your-wages-affect-your-payments) applied to that increase. At £1,500 of receipts, the £100 tax saving therefore reduces UC by £55, leaving a £45 net gain.

These are annual model results. Actual UC uses monthly assessment periods and deducts relevant self-employment income tax and National Insurance when paid, under [regulation 57(2)](https://www.legislation.gov.uk/uksi/2013/376/regulation/57). Uneven receipts or a large tax payment in one month can produce a different pattern of awards and a different annual gain.

## Preliminary national estimates

The dashboard's [preliminary cost estimates](https://ab2026-local-preview.vercel.app/uk/autumn-budget-2026/data/artifacts/trading_allowance_raise/230c4665427e0bb1/budgetary_impact.csv) put the cost at **£112 million in 2027–28** and **£131 million in 2031–32**. These are static annual government-balance effects, holding incomes and behaviour fixed. Missing gross receipts and incomplete miscellaneous-income coverage limit the estimates, which remain provisional pending reconciliation with Treasury costings.

The [average cash changes](https://ab2026-local-preview.vercel.app/uk/autumn-budget-2026/data/artifacts/trading_allowance_raise/230c4665427e0bb1/winners_losers.csv) show a **£4 annual household income gain across all households** in 2027–28, including unaffected households. Households in decile 8 gain £9 on average. These averages include households with no eligible trading income. Each decile contains roughly equal numbers of people ranked by household income adjusted for household size; the cash figures are household-weighted means within those groups. Figures below are rounded to the nearest pound.

| Income decile | Average annual household income change |
| --- | ---: |
| 1 (lowest income) | +£1 |
| 2 | +£3 |
| 3 | +£1 |
| 4 | +£0 |
| 5 | +£2 |
| 6 | +£3 |
| 7 | +£6 |
| 8 | +£9 |
| 9 | +£6 |
| 10 (highest income) | +£7 |
| All households | +£4 |

The dashboard's [affected-population metric](https://ab2026-local-preview.vercel.app/uk/autumn-budget-2026/data/artifacts/trading_allowance_raise/230c4665427e0bb1/metrics.csv) is **0.93% of people living in households whose net income changes by more than 0.01%** in 2027–28. It is not a count of eligible traders. The current exports do not provide separate shares gaining and losing or an absolute affected-person count.

## Treasury costing

The Treasury column reproduces Table 6.1, row 15. The PolicyEngine column reports the provisional static estimates. Both columns express costs to the Exchequer as positive values.

| Year | Treasury cost (£ million) | PolicyEngine provisional static cost (£ million) |
| --- | ---: | ---: |
| 2026–27 | 0 | 0 |
| 2027–28 | 0 | 112 |
| 2028–29 | 225 | 120 |
| 2029–30 | 165 | 113 |
| 2030–31 | 175 | 123 |
| 2031–32 | 180 | 131 |

The effective date remains 6 April 2027 even though the Treasury records no receipts effect in 2027–28. Tax-year liabilities and fiscal-year receipts forecasts differ. For context, an outstanding Self Assessment balancing payment for 2027–28 would normally be due on 31 January 2029. Some taxpayers also make advance instalments, as [HMRC's payments-on-account guidance](https://www.gov.uk/understand-self-assessment-bill/payments-on-account) explains.

The [Treasury policy costing](https://assets.publishing.service.gov.uk/media/6ae1883fe4367e5c8b0467df/AB26_Policy_Costing.pdf#page=23) allows for taxpayers switching from actual expenses to the larger allowance, a behavioural response. It does not give an affected-person count. The static model holds circumstances fixed and faces the coverage limits below. Reconciliation has not yet attributed the gap between the estimates to timing, behaviour or coverage.

## Methodology and coverage

The hypothetical examples isolate the allowance increase, holding earnings, receipts and expenses fixed and choosing the larger deduction. The side-business tax table excludes benefit interactions; the lone-parent and sole-trader examples calculate the stated tax, National Insurance and benefit changes. None includes trading losses or behavioural responses.

The household calculations use PolicyEngine 6.11.1 with PolicyEngine UK 2.151.0 and core 3.33.3, matching the dashboard. They supply both gross receipts and profit to represent actual expenses, and check the resulting tax and benefit changes against independent arithmetic.

Gross receipts are unavailable in the population data. The model's [deduction calculation](https://github.com/PolicyEngine/policyengine-uk/blob/2.151.0/policyengine_uk/variables/gov/hmrc/income_tax/allowances/trading_allowance_deduction.py) therefore approximates the allowance using reported profit. Tests with the same hypothetical households show effects in both directions:

- For the parent with £1,500 of receipts and no expenses, supplying receipts produces the correct £100 tax reduction. Omitting receipts makes the approximation tax the full £1,500 before the reform and none afterwards, producing a £300 reduction.
- For the sole trader with £20,000 receipts and £500 expenses, supplying receipts produces the £520 tax-and-NI gain above. With only the £19,500 profit supplied, the approximation applies no deduction under either allowance, producing no gain.

This population approximation also misses Class 4 savings: the profits it relieves are at most £3,000, below the £12,570 lower profits limit.

The model also omits allowance relief against its separate miscellaneous-income input, although qualifying miscellaneous income shares the legal allowance. This excludes a category of potential gains. The combined direction of bias in the national estimate remains unknown.

The national figures use the dashboard's [documented calculations](https://ab2026-local-preview.vercel.app/uk/autumn-budget-2026/data/artifacts/trading_allowance_raise/230c4665427e0bb1/receipt.json), based on certified 2024–25 UK population data released in October 2026. Both baseline and reform use the October 2026 OBR forecast update. Growth series not updated retain the model's March forecast path, and the population data retain their pre-Budget calibration. Household examples use fixed nominal incomes.

**Preliminary estimates:** reconciliation, absolute affected-person counts and separate shares gaining and losing remain outstanding. The population figures should be read with the coverage limits above.
