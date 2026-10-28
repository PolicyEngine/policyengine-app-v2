The [Autumn Budget 2026](https://www.gov.uk/government/publications/budget-2026-document/budget-2026-html) announces an increase in the trading allowance from £1,000 to £3,000 from 6 April 2027. The allowance covers eligible trading and miscellaneous income. For an employee paying 20% income tax on their side income, the extra £2,000 deduction can reduce annual income tax by £400. The reduction depends on receipts, expenses and how much tax the individual would otherwise pay.

This post examines that measure on its own. Our [Budget dashboard](https://policyengine.org/uk/budgets/autumn-2026) places it alongside the other announced tax and benefit changes. We cover the savings and property income tax increases in a [separate explainer](/uk/research/uk-autumn-budget-2026-savings-property-income-tax).

## How the allowance works

The allowance is an alternative to deducting actual business expenses. Gross receipts are the money received before expenses; profit is what remains after those expenses. A person with £4,000 of receipts and £500 of allowable expenses has £3,500 of profit before considering the allowance.

Under [HMRC's trading allowance guidance](https://www.gov.uk/guidance/tax-free-allowances-on-property-and-trading-income), an eligible person can choose the allowance or actual expenses. They cannot deduct both against the same receipts. If receipts are within the allowance, full relief can make the taxable amount zero. The allowance cannot create a tax loss.

There is one allowance per individual across their eligible trades and miscellaneous income, rather than a separate allowance for each activity. The allocation between sources follows [section 783AK of the Income Tax (Trading and Other Income) Act 2005](https://www.legislation.gov.uk/ukpga/2005/5/section/783AK). The separate property income allowance does not increase under this measure.

## Three people with the same receipts

Consider three hypothetical single adults in England in 2027–28. Each earns £30,000 from employment and receives £4,000 from a side business. They have no other income, dependants, student loan repayments or benefit entitlements. Their trading profits remain in the 20% income tax band. Their costs differ.

The table isolates income tax on the side business, holding receipts and expenses fixed.

| Annual side-business receipts | Actual expenses | Taxable amount under current rules | Taxable amount under new rules | Income tax before | Income tax after | Annual tax reduction |
| --- | --- | --- | --- | --- | --- | --- |
| £4,000 | £500 | £3,000 | £1,000 | £600 | £200 | £400 |
| £4,000 | £2,500 | £1,500 | £1,000 | £300 | £200 | £100 |
| £4,000 | £3,500 | £500 | £500 | £100 | £100 | £0 |

In the first case, the allowance exceeds expenses under both rules. Taxable income falls from £4,000 − £1,000 = £3,000 to £4,000 − £3,000 = £1,000. The tax reduction is £2,000 × 20% = £400.

In the second case, actual expenses provide the larger deduction under current law. The £3,000 allowance then exceeds those £2,500 expenses by £500, reducing tax by £500 × 20% = £100.

In the third case, actual expenses exceed both allowances. The individual continues to deduct £3,500, so taxable income and tax do not change.

At a 40% marginal rate, the same calculations give reductions of £800, £200 and £0, assuming no tax-band changes or other interactions.

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

## National Insurance and benefit interactions

[HMRC's National Insurance guidance](https://www.gov.uk/hmrc-internal-manuals/business-income-manual/bim86052) confirms that the trading allowance also reduces the profits used to calculate Class 4 contributions. However, all the side-business examples above remain below the [£12,570 Class 4 lower profits limit](https://www.gov.uk/government/publications/rates-and-allowances-national-insurance-contributions/rates-and-allowances-national-insurance-contributions). They have no Class 4 reduction; employment National Insurance is unchanged.

Universal Credit uses separate self-employment income rules. The allowance itself does not reduce income for Universal Credit purposes, as HMRC's allowance guidance explains. A full household calculation must also account for any change in tax paid and the benefit rules that apply to that household.

The allowance is unavailable for partnership income and certain connected-party receipts, including income from an individual's employer or a company they control. [HMRC's exclusions](https://www.gov.uk/hmrc-internal-manuals/business-income-manual/bim86030) describe those restrictions.

## Preliminary national estimates

The dashboard's [provisional cost output](https://ab2026-local-preview.vercel.app/uk/autumn-budget-2026/data/artifacts/trading_allowance_raise/230c4665427e0bb1/budgetary_impact.csv), generated on 28 October at 14:34 UTC, estimates a **£112 million cost in 2027–28** and **£131 million in 2031–32**. These are static annual government-balance effects. The receipt warns that missing gross receipts in the population data can overstate the cost, and the results are awaiting reconciliation with Treasury costings.

The [average cash changes](https://ab2026-local-preview.vercel.app/uk/autumn-budget-2026/data/artifacts/trading_allowance_raise/230c4665427e0bb1/winners_losers.csv) show a **£3.83 annual household income gain across all households** in 2027–28, including unaffected households. The highest average gain is in decile 8, at £8.57. These population averages include people with no eligible trading income; the worked examples above describe particular eligible individuals. Deciles are ranked by baseline equivalised household net income, which accounts for household size.

| Income decile | Average annual household income change |
| --- | ---: |
| 1 (lowest income) | +£0.83 |
| 2 | +£3.39 |
| 3 | +£1.04 |
| 4 | +£0.45 |
| 5 | +£2.11 |
| 6 | +£3.43 |
| 7 | +£5.73 |
| 8 | +£8.57 |
| 9 | +£6.18 |
| 10 (highest income) | +£7.03 |
| All households | +£3.83 |

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

The effective date remains 6 April 2027 even though the Treasury records no receipts effect in 2027–28. Tax-year liabilities and the government's fiscal-year receipts forecasts are different quantities. The [Treasury policy costing](https://assets.publishing.service.gov.uk/media/6ae1883fe4367e5c8b0467df/AB26_Policy_Costing.pdf#page=23) also allows for taxpayers switching from actual expenses to the larger allowance, a behavioural response. The static model holds circumstances fixed and also faces the gross-receipts coverage limit. Reconciliation has not yet attributed the gap between the estimates.

## Methodology and coverage

The worked examples isolate the allowance increase and use hypothetical households. They hold earnings, receipts and expenses fixed, assume the individual selects the larger deduction, and exclude losses, behavioural responses and other tax or benefit interactions.

The household calculations use `policyengine.py` 6.11.1 with PolicyEngine UK 2.151.0 and core 3.33.3, matching the dashboard's `trading_allowance_raise` measure. They supply both gross receipts and profit so the model can represent actual expenses, and check the resulting tax changes against independent arithmetic.

In the population data, gross receipts are unavailable. The pinned model's [deduction calculation](https://github.com/PolicyEngine/policyengine-uk/blob/2.151.0/policyengine_uk/variables/gov/hmrc/income_tax/allowances/trading_allowance_deduction.py) uses an approximation that can overstate or understate the reform's effect for individual records. It also does not apply this allowance to its separate miscellaneous-income input, although eligible miscellaneous income is within the announced policy. These coverage limits matter when interpreting national results.

The national figures reuse the dashboard's [recorded execution receipt](https://ab2026-local-preview.vercel.app/uk/autumn-budget-2026/data/artifacts/trading_allowance_raise/230c4665427e0bb1/receipt.json), generated at source commit `0d9dccb2`. They use certified national dataset `microcosm-uk-2024-25-national-20261025T091414Z-a6299504` and the October 2026 OBR forecast overlay on both baseline and reform. Growth series not updated by the overlay retain the model's March forecast path; the dataset retains its pre-Budget calibration. Household examples use fixed nominal incomes.

The receipt records a passed disclosure floor of at least three survey households per published cell; no thin decile cells are recorded. The affected-population calculation uses the absolute percentage income change, floors baseline household income at £1, and includes only households with a valid decile. Its percentage does not establish how many people gain or lose.

**Draft status:** the population results are provisional and marked `awaiting_source` for reconciliation in the preview manifest. Final reconciliation, absolute affected-person counts and separate winner/loser shares remain outstanding.
