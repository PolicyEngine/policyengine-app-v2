The Autumn Budget 2026 increases the basic, higher and additional income tax rates on savings and property income by a further two percentage points from **6 April 2027**, taking them to **24%, 44% and 49%**. Savings rates apply across the UK. The property rates apply in England, Wales and Northern Ireland. Dividend rates remain unchanged. These are the changes announced in the [Budget 2026 document](https://www.gov.uk/government/publications/budget-2026-document/budget-2026-html).

In the examples below, a basic-rate saver with £2,000 of annual interest pays £20 more a year. A landlord with £10,000 of property profit and £4,000 of mortgage interest pays £120 more.

This post examines this provision on its own. The [UK Autumn Budget 2026 dashboard preview](https://ab2026-local-preview.vercel.app/uk/autumn-budget-2026) places it alongside the other announced measures. We cover the trading allowance increase in a [separate explainer](/uk/research/uk-autumn-budget-2026-trading-allowance).

## What changes in April 2027?

Budget 2025 had already set savings and property rates at 22%, 42% and 47% from April 2027. The comparison here therefore measures the additional two-point increase announced in 2026, using the existing 2027 rules as the baseline.

| Income tax band | Already scheduled for 2027–28 | Budget 2026 rate | Change |
| --- | ---: | ---: | ---: |
| Basic | 22% | 24% | +2 percentage points |
| Higher | 42% | 44% | +2 percentage points |
| Additional | 47% | 49% | +2 percentage points |

The [Budget 2025 technical note](https://www.gov.uk/government/publications/changes-to-tax-rates-for-property-savings-and-dividend-income/change-to-tax-rates-for-property-savings-and-dividend-income-technical-note) sets the ordering from April 2027: employment, pension and trading income first; property next; savings after that; and dividends last. Allowances first reduce income other than property, savings or dividends. Taxable income then fills the bands in that order, so employment and rental income can push savings interest into a higher band.

## Savers pay the higher rates on interest above their allowances

The Personal Savings Allowance remains £1,000 for basic-rate taxpayers, £500 for higher-rate taxpayers and £0 for additional-rate taxpayers. People with low other income can also qualify for a starting rate of 0% on up to £5,000 of savings interest. These allowances depend on total income, as [HMRC's savings guidance](https://www.gov.uk/apply-tax-free-interest-on-savings/how-much-is-tax-free) explains. Interest earned inside an ISA remains exempt from income tax.

These hypothetical adults live in England and receive only the wages and interest shown. Their wages use the Personal Allowance, and none qualifies for the starting rate for savings. The table isolates income tax on interest.

| Annual employment income | Annual savings interest | Personal Savings Allowance | Interest taxed above 0% | Tax before the Budget change | Tax after | Extra annual tax |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| £30,000 | £500 | £1,000 | £0 | £0 | £0 | £0 |
| £30,000 | £2,000 | £1,000 | £1,000 | £220 | £240 | £20 |
| £60,000 | £2,000 | £500 | £1,500 | £630 | £660 | £30 |

For the basic-rate example, £2,000 − £1,000 = £1,000 faces the savings basic rate: £1,000 × 22% = £220 before, against £1,000 × 24% = £240 after. The higher-rate example pays an extra £1,500 × 2% = £30.


The chart varies annual interest for the same two salaries. At these income levels, each additional £500 of interest above the allowance adds £10 to the tax increase.

```chart
{
  "type": "bar",
  "title": "Savings tax increases apply above the Personal Savings Allowance",
  "subtitle": "Annual income tax increase; England, salaries £30,000 and £60,000, 2027–28",
  "xKey": "interest",
  "yLabel": "Extra annual income tax (£)",
  "format": {
    "prefix": "£",
    "decimals": 0
  },
  "source": "PolicyEngine 6.11.1 / UK 2.151.0; synthetic adults, 2027–28; incomes held fixed.",
  "series": [
    {
      "key": "basic",
      "name": "£30,000 salary",
      "color": "negative"
    },
    {
      "key": "higher",
      "name": "£60,000 salary",
      "color": "secondary"
    }
  ],
  "data": [
    {
      "interest": "£500",
      "basic": 0.0,
      "higher": 0.0
    },
    {
      "interest": "£1,000",
      "basic": 0.0,
      "higher": 10.0
    },
    {
      "interest": "£1,500",
      "basic": 10.0,
      "higher": 20.0
    },
    {
      "interest": "£2,000",
      "basic": 20.0,
      "higher": 30.0
    },
    {
      "interest": "£2,500",
      "basic": 30.0,
      "higher": 40.0
    },
    {
      "interest": "£3,000",
      "basic": 40.0,
      "higher": 50.0
    },
    {
      "interest": "£3,500",
      "basic": 50.0,
      "higher": 60.0
    },
    {
      "interest": "£4,000",
      "basic": 60.0,
      "higher": 70.0
    },
    {
      "interest": "£4,500",
      "basic": 70.0,
      "higher": 80.0
    },
    {
      "interest": "£5,000",
      "basic": 80.0,
      "higher": 90.0
    }
  ]
}
```

## Landlords' mortgage-interest relief rises too

For individual residential landlords, mortgage interest normally produces a tax reduction rather than a deduction from rental profits. The reduction is limited by finance costs, property profits, adjusted total income and the tax liability. [HMRC's explanation of residential finance-cost relief](https://www.gov.uk/guidance/changes-to-tax-relief-for-residential-landlords-how-its-worked-out-including-case-studies) describes these limits.

From April 2027 the relief follows the property basic rate. This Budget therefore raises it from the already scheduled 22% to 24%. That offsets part of the tax increase for landlords with eligible finance costs.

Consider two adults in England, each with £12,000 of rent, £2,000 of allowable non-finance expenses and £4,000 of qualifying mortgage interest. Deducting actual non-finance expenses leaves £10,000 of property profit. Both can use the full finance-cost reduction.

| Calculation, 2027–28 | £30,000 salary: before | £30,000 salary: after | £60,000 salary: before | £60,000 salary: after |
| --- | ---: | ---: | ---: | ---: |
| Property profit | £10,000 | £10,000 | £10,000 | £10,000 |
| Rate on that profit | 22% | 24% | 42% | 44% |
| Tax before finance-cost relief | £2,200 | £2,400 | £4,200 | £4,400 |
| Finance-cost reduction | £880 | £960 | £880 | £960 |
| Tax attributable to property | £1,320 | £1,440 | £3,320 | £3,440 |
| Extra annual income tax | — | £120 | — | £120 |

Both pay £200 more before relief, while their finance-cost reduction rises by £4,000 × 2% = £80. Their net increase is £200 − £80 = £120. A mortgage-free landlord with the same profit pays £200 more. Both tax bands rise by two points, explaining the identical increases despite different starting liabilities.

The property **rate** increase excludes Scottish taxpayers, whose rental income follows Scottish rules. Finance-cost relief is a separate calculation. The [Finance Act 2026 amendment](https://www.legislation.gov.uk/ukpga/2026/11/schedule/1/paragraph/40/enacted) ties it to the UK property basic rate without a Scottish exception. Applying that rule, a Scottish landlord able to use the full reduction on £4,000 of eligible finance costs receives £80 more relief, reducing their income tax by £80 if nothing else changes. A mortgage-free Scottish landlord has no change from this measure. The savings increase still applies across the UK.

## Preliminary national estimates

The dashboard's [provisional revenue output](https://ab2026-local-preview.vercel.app/uk/autumn-budget-2026/data/artifacts/unearned_income_rates_up/8bd7d211ae66c19d/budgetary_impact.csv), generated on 28 October at 14:34 UTC, estimates that the measure raises **£664 million in 2027–28**, increasing to **£793 million in 2031–32**. These are static annual government-balance effects: savings, rental income and other household circumstances are held fixed. The results are awaiting reconciliation with Treasury costings.

The [average cash changes](https://ab2026-local-preview.vercel.app/uk/autumn-budget-2026/data/artifacts/unearned_income_rates_up/8bd7d211ae66c19d/winners_losers.csv) show an annual household income reduction of **£22.67 across all households** in 2027–28, including unaffected households. The largest average cash loss is in the highest income decile, at £107.13. Deciles are ranked by baseline equivalised household net income, which accounts for household size.

| Income decile | Average annual household income change |
| --- | ---: |
| 1 (lowest income) | −£12.90 |
| 2 | −£5.69 |
| 3 | −£6.66 |
| 4 | −£7.31 |
| 5 | −£6.00 |
| 6 | −£9.13 |
| 7 | −£10.94 |
| 8 | −£21.51 |
| 9 | −£37.04 |
| 10 (highest income) | −£107.13 |
| All households | −£22.67 |

The dashboard's [affected-population metric](https://ab2026-local-preview.vercel.app/uk/autumn-budget-2026/data/artifacts/unearned_income_rates_up/8bd7d211ae66c19d/metrics.csv) is **10.67% of people living in households whose net income changes by more than 0.01%** in 2027–28. It is not a taxpayer count or a headcount. The current exports do not provide separate shares gaining and losing, so an average loss within a decile should not be read as a loss for every household in it.

## The Treasury forecasts revenue of £1.13 billion in 2028–29

The Treasury costs the savings and property changes separately. Their sum reaches £1,130 million in 2028–29 and £1,045 million in 2031–32.

| Exchequer revenue, £ million | 2026–27 | 2027–28 | 2028–29 | 2029–30 | 2030–31 | 2031–32 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Property income rates | 0 | 35 | 575 | 435 | 445 | 455 |
| Savings income rates | 15 | 125 | 555 | 520 | 555 | 590 |
| Treasury combined | 15 | 160 | 1,130 | 955 | 1,000 | 1,045 |
| PolicyEngine, provisional static | 0 | 664 | 696 | 728 | 762 | 793 |

These government receipts forecasts differ from annual household liabilities. The [Treasury policy costings, #page 74-75](https://assets.publishing.service.gov.uk/media/6ae1883fe4367e5c8b0467df/AB26_Policy_Costing.pdf#page=74) allow for some landlords incorporating and savers moving funds into tax-advantaged products such as ISAs. The PolicyEngine run holds those choices fixed. Tax-year liabilities and fiscal-year receipts forecasts also differ in timing. Reconciliation has not yet established how much of the gap between these estimates comes from behaviour, collection timing or model coverage.

## Methodology

The examples isolate the newly announced 2027–28 changes, including finance-cost relief, holding income and expenses constant. They include no pension contributions, Gift Aid, student loans or other reliefs. They show tax attributable to each income source, rather than household net income after benefits.

The examples use `policyengine.py` 6.11.1 with PolicyEngine UK 2.151.0 and core 3.33.3, matching the pre-Budget policy baseline and parameter changes in the dashboard's [`unearned_income_rates_up` measure](https://github.com/PolicyEngine/uk-autumn-budget-dashboard-2026/blob/b50787aa75ef5aed36b822c973afa6b569464d55/src/uk_budget_data/reforms.py). The calculations check tax changes against independent arithmetic.

The national figures reuse the dashboard's [recorded execution receipt](https://ab2026-local-preview.vercel.app/uk/autumn-budget-2026/data/artifacts/unearned_income_rates_up/8bd7d211ae66c19d/receipt.json), generated at source commit `0d9dccb2`. They use certified national dataset `microcosm-uk-2024-25-national-20261025T091414Z-a6299504` and the October 2026 OBR forecast overlay on both baseline and reform. Growth series not updated by the overlay retain the model's March forecast path; the dataset retains its pre-Budget calibration. Household examples use fixed nominal incomes.

The receipt records a passed disclosure floor of at least three survey households per published cell; no thin decile cells are recorded. The affected-population calculation uses the absolute percentage income change, floors baseline household income at £1, and includes only households with a valid decile. Its percentage does not establish how many people gain or lose.

**Draft status:** the population results are provisional and marked `awaiting_source` for reconciliation in the preview manifest. Final reconciliation, absolute affected-person counts and separate winner/loser shares remain outstanding.
