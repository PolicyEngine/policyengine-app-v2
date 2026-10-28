> Draft review note: the national figures below are an earlier dashboard snapshot retained for review. The combined snapshot has been withdrawn, and replacement savings and property results have not passed reconciliation. They are not final national results.

The Autumn Budget 2026 increases the basic, higher and additional income tax rates on savings and property income by a further two percentage points from **6 April 2027**, taking them to **24%, 44% and 49%**. Savings rates apply across the UK. The property rates apply in England, Wales and Northern Ireland. Dividend rates remain unchanged. These are the changes announced in the [Budget 2026, paragraphs 6.246 and 6.247](https://assets.publishing.service.gov.uk/media/6ae1ec57bdb574cf1c9b3f12/E03668986_HMT_Budget_2026_ELAY__2_.pdf#page=142 "Budget 2026 #page 142,45").

Key figures for 2027–28:

- A basic-rate saver with £2,000 of annual interest pays £20 more a year.
- A landlord in England with £10,000 of property profit and £4,000 of mortgage interest pays £120 more.
- A Scottish landlord with the same fully usable finance costs pays £80 less, because the finance-cost reduction rises while Scottish property tax rates stay unchanged.
- The Treasury forecasts £160 million of additional revenue. The earlier recorded static estimate is £664 million; replacement dashboard figures are still being checked. The national results below retain that earlier snapshot for draft review, while the Treasury costing includes behavioural responses.

A [separate explainer](/uk/research/uk-autumn-budget-2026-trading-allowance) covers the trading allowance increase.

## What changes in April 2027?

The [Budget 2025 technical note](https://www.gov.uk/government/publications/changes-to-tax-rates-for-property-savings-and-dividend-income/change-to-tax-rates-for-property-savings-and-dividend-income-technical-note) had already set savings and property rates at 22%, 42% and 47% from April 2027. The additional two-point increase is measured against those existing 2027 rules.

| Income tax band | Already scheduled for 2027–28 | Budget 2026 rate | Change |
| --- | ---: | ---: | ---: |
| Basic | 22% | 24% | +2 percentage points |
| Higher | 42% | 44% | +2 percentage points |
| Additional | 47% | 49% | +2 percentage points |

The same note sets the ordering from April 2027: employment, pension and trading income first; property next; savings after that; and dividends last. Allowances first reduce income other than property, savings or dividends. Taxable income then fills the bands in that order, so employment and rental income can push savings interest into a higher band.

## Household impacts

The examples below isolate the announced savings and property measures in 2027–28. They show income tax, holding the stated income and expenses fixed.

### Savers pay the higher rates on interest above their allowances

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
  "type": "line",
  "title": "Savings tax increases apply above the Personal Savings Allowance",
  "subtitle": "Annual income tax increase; England, salaries £30,000 and £60,000, 2027–28",
  "xKey": "interest",
  "xLabel": "Annual savings interest",
  "yLabel": "Extra annual income tax",
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
  "markers": [
    {
      "x": 500,
      "label": "£60,000 salary: savings allowance"
    },
    {
      "x": 1000,
      "label": "£30,000 salary: savings allowance"
    }
  ],
  "data": [
    {
      "interest": 500,
      "basic": 0.0,
      "higher": 0.0
    },
    {
      "interest": 600,
      "basic": 0.0,
      "higher": 2.0
    },
    {
      "interest": 700,
      "basic": 0.0,
      "higher": 4.0
    },
    {
      "interest": 800,
      "basic": 0.0,
      "higher": 6.0
    },
    {
      "interest": 900,
      "basic": 0.0,
      "higher": 8.0
    },
    {
      "interest": 1000,
      "basic": 0.0,
      "higher": 10.0
    },
    {
      "interest": 1100,
      "basic": 2.0,
      "higher": 12.0
    },
    {
      "interest": 1200,
      "basic": 4.0,
      "higher": 14.0
    },
    {
      "interest": 1300,
      "basic": 6.0,
      "higher": 16.0
    },
    {
      "interest": 1400,
      "basic": 8.0,
      "higher": 18.0
    },
    {
      "interest": 1500,
      "basic": 10.0,
      "higher": 20.0
    },
    {
      "interest": 1600,
      "basic": 12.0,
      "higher": 22.0
    },
    {
      "interest": 1700,
      "basic": 14.0,
      "higher": 24.0
    },
    {
      "interest": 1800,
      "basic": 16.0,
      "higher": 26.0
    },
    {
      "interest": 1900,
      "basic": 18.0,
      "higher": 28.0
    },
    {
      "interest": 2000,
      "basic": 20.0,
      "higher": 30.0
    },
    {
      "interest": 2100,
      "basic": 22.0,
      "higher": 32.0
    },
    {
      "interest": 2200,
      "basic": 24.0,
      "higher": 34.0
    },
    {
      "interest": 2300,
      "basic": 26.0,
      "higher": 36.0
    },
    {
      "interest": 2400,
      "basic": 28.0,
      "higher": 38.0
    },
    {
      "interest": 2500,
      "basic": 30.0,
      "higher": 40.0
    },
    {
      "interest": 2600,
      "basic": 32.0,
      "higher": 42.0
    },
    {
      "interest": 2700,
      "basic": 34.0,
      "higher": 44.0
    },
    {
      "interest": 2800,
      "basic": 36.0,
      "higher": 46.0
    },
    {
      "interest": 2900,
      "basic": 38.0,
      "higher": 48.0
    },
    {
      "interest": 3000,
      "basic": 40.0,
      "higher": 50.0
    },
    {
      "interest": 3100,
      "basic": 42.0,
      "higher": 52.0
    },
    {
      "interest": 3200,
      "basic": 44.0,
      "higher": 54.0
    },
    {
      "interest": 3300,
      "basic": 46.0,
      "higher": 56.0
    },
    {
      "interest": 3400,
      "basic": 48.0,
      "higher": 58.0
    },
    {
      "interest": 3500,
      "basic": 50.0,
      "higher": 60.0
    },
    {
      "interest": 3600,
      "basic": 52.0,
      "higher": 62.0
    },
    {
      "interest": 3700,
      "basic": 54.0,
      "higher": 64.0
    },
    {
      "interest": 3800,
      "basic": 56.0,
      "higher": 66.0
    },
    {
      "interest": 3900,
      "basic": 58.0,
      "higher": 68.0
    },
    {
      "interest": 4000,
      "basic": 60.0,
      "higher": 70.0
    },
    {
      "interest": 4100,
      "basic": 62.0,
      "higher": 72.0
    },
    {
      "interest": 4200,
      "basic": 64.0,
      "higher": 74.0
    },
    {
      "interest": 4300,
      "basic": 66.0,
      "higher": 76.0
    },
    {
      "interest": 4400,
      "basic": 68.0,
      "higher": 78.0
    },
    {
      "interest": 4500,
      "basic": 70.0,
      "higher": 80.0
    },
    {
      "interest": 4600,
      "basic": 72.0,
      "higher": 82.0
    },
    {
      "interest": 4700,
      "basic": 74.0,
      "higher": 84.0
    },
    {
      "interest": 4800,
      "basic": 76.0,
      "higher": 86.0
    },
    {
      "interest": 4900,
      "basic": 78.0,
      "higher": 88.0
    },
    {
      "interest": 5000,
      "basic": 80.0,
      "higher": 90.0
    }
  ]
}
```

### Landlords' mortgage-interest relief rises too

For individual residential landlords, mortgage interest normally produces a tax reduction rather than a deduction from rental profits. The reduction is limited by finance costs, property profits, adjusted total income and the tax liability. [HMRC's explanation of residential finance-cost relief](https://www.gov.uk/guidance/changes-to-tax-relief-for-residential-landlords-how-its-worked-out-including-case-studies) describes these limits.

From April 2027 the relief follows the property basic rate, as the [Treasury policy costings, pages 74 and 75](https://assets.publishing.service.gov.uk/media/6ae1883fe4367e5c8b0467df/AB26_Policy_Costing.pdf#page=74 "Treasury policy costings #page 74-75") confirm. This Budget therefore raises it from the already scheduled 22% to 24%. That offsets part of the tax increase for landlords with eligible finance costs. The dashboard calculator has no finance-cost input, so the mortgage examples below illustrate an effect its preset cannot show.

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

### When property income pushes savings into a higher band

Consider an adult in England with £45,000 of salary, £6,000 of property profit after allowable expenses, £2,000 of interest and no mortgage interest. The £12,570 Personal Allowance leaves £32,430 of taxable salary. That uses £32,430 of the £37,700 basic-rate band, leaving £5,270.

Property income fills that remaining £5,270, with £730 entering the higher band. The individual qualifies for a £500 Personal Savings Allowance; the remaining £1,500 of interest falls in the higher savings band.

| Income tax component, 2027–28 | Before | After |
| --- | ---: | ---: |
| Salary: £32,430 at 20% | £6,486 | £6,486 |
| Property: £5,270 at 22% / 24% | £1,159 | £1,265 |
| Property: £730 at 42% / 44% | £307 | £321 |
| Savings: £1,500 at 42% / 44% | £630 | £660 |
| Total income tax | £8,582 | £8,732 |

The extra tax is £120 on property plus £30 on savings, or **£150 a year**. The calculation shows why the order of income sources matters even when each rate rises by the same two percentage points.

[Try the Budget dashboard's calculator](https://policyengine.org/uk/budgets/autumn-2026). Its salary input is for 2026–27 and is grown into the target year, while this table fixes salary at £45,000 in 2027–28. On its current earnings path, a £45,000 salary input becomes about £46,080, giving total tax of £9,014 before and £9,164 after. The additional tax remains £150. These values can be entered manually; the existing preset may use different incomes.

## Population impacts

### Recorded national estimates

The earlier dashboard snapshot's [revenue estimate](https://ab2026-local-preview.vercel.app/uk/autumn-budget-2026/data/artifacts/unearned_income_rates_up/8bd7d211ae66c19d/budgetary_impact.csv) estimates that the measure raises **£664 million in 2027–28**, increasing to **£793 million in 2031–32**. These are static annual government-balance effects: savings, rental income and other household circumstances are held fixed. The combined snapshot has been withdrawn following the separation of savings and property into two dashboard measures. These figures remain here for draft review while the replacement results are checked.

### Household income by decile

The [average cash changes](https://ab2026-local-preview.vercel.app/uk/autumn-budget-2026/data/artifacts/unearned_income_rates_up/8bd7d211ae66c19d/winners_losers.csv) show an annual household income reduction of **£23 across all households** in 2027–28, including unaffected households. Households in the top decile lose £107 on average. Each decile contains roughly equal numbers of people, ranked by household income adjusted for household size. The cash figures are household-weighted averages within those groups.

| Income decile | Average annual household income change |
| --- | ---: |
| 1 (lowest income) | −£13 |
| 2 | −£6 |
| 3 | −£7 |
| 4 | −£7 |
| 5 | −£6 |
| 6 | −£9 |
| 7 | −£11 |
| 8 | −£22 |
| 9 | −£37 |
| 10 (highest income) | −£107 |
| All households | −£23 |

### People affected

The model's [population results](https://ab2026-local-preview.vercel.app/uk/autumn-budget-2026/data/artifacts/unearned_income_rates_up/8bd7d211ae66c19d/metrics.csv) indicate that **10.67% of people live in households whose net income changes by more than 0.01%** in 2027–28. An average loss within a decile does not mean every household in it loses. The lowest decile's £13 average loss also exceeds the £6 to £11 averages in deciles 2 to 7; an income-source breakdown is needed to establish what drives that pattern.

The government estimates that **84% of income tax payers are unaffected** in 2027–28 and that around half the revenue comes from the top 10% of households. Budget paragraph 2.50 and footnote 74 base these estimates on projected HMRC Survey of Personal Incomes data and Treasury household mapping. The model's affected-person share uses a different population and threshold from the taxpayer estimate, so the two reach figures are not directly comparable. The decile means also do not establish a share of government revenue: that comparison requires weighted tax totals by decile.

### Treasury comparison

The Treasury costs savings and property separately. Their combined forecast is £160 million in 2027–28 and £1,045 million in 2031–32.

| Exchequer revenue, £ million | 2026–27 | 2027–28 | 2028–29 | 2029–30 | 2030–31 | 2031–32 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Property income rates | 0 | 35 | 575 | 435 | 445 | 455 |
| Savings income rates | 15 | 125 | 555 | 520 | 555 | 590 |
| Treasury combined | 15 | 160 | 1,130 | 955 | 1,000 | 1,045 |
| PolicyEngine, preliminary static | 0 | 664 | 696 | 728 | 762 | 793 |

The Treasury costings allow for some landlords incorporating and savers moving funds into tax-advantaged products such as ISAs. The static model holds those choices fixed. The published costing notes do not explain the annual profile, including the £15 million savings figure in 2026–27 before the rates take effect. No particular collection-timing explanation is assumed here. A component comparison is needed to distinguish the property and savings contributions to the difference.

## Assumptions and limitations

- The worked examples are hypothetical single adults aged 35. Their income is fixed at the stated 2027–28 amounts. The examples include no pension contributions, Gift Aid, student loans, property losses, carried-forward finance costs or other reliefs. Savings are outside ISAs.
- The household tables show tax attributable to each income source. They do not estimate household income after means-tested benefits. The mortgage examples assume the full finance-cost reduction can be used.
- The Scottish mortgage example applies the existing Finance Act rule linking relief to the UK property basic rate. The Finance Bill will set the final implementation of the new rates.
- The dashboard calculator grows a 2026–27 salary input into the selected year. Its current earnings path differs from fixing the same nominal salary in 2027–28, as the mixed-income example explains.
- National estimates are static, with no behavioural response. The Treasury forecasts use different data and include behaviour. Their fiscal-year profile cannot be attributed to a particular timing effect without reconciliation.
- The national figures await replacement by checked savings and property results. The income-source explanation for the lowest-decile result, component reconciliation, absolute affected-person counts and separate shares gaining and losing remain outstanding. Average decile changes do not establish shares of government revenue.

## Methodology

The household calculations use the `policyengine` Python package (version 6.11.1), PolicyEngine UK (version 2.151.0) and PolicyEngine core (version 3.33.3). Each comparison applies only the announced savings and property changes, including finance-cost relief, against the already scheduled 2027–28 rules. Both household scenarios use the OBR’s October 2026 forecast update at dashboard commit `64042657`, matching the Pension Tax Allowance analysis. Supplied 2027–28 income stays fixed; the forecast updates the model’s projected parameters. Tax calculations are checked against independent arithmetic. The line chart plots the exact schedule breakpoints and points every £100, and its interpolation agrees with PolicyEngine UK to within one penny at every £2 of interest.

The recorded national results reuse the dashboard's certified Microcosm UK 2024–25 dataset, `microcosm-uk-2024-25-national-20261025T091414Z-a6299504`. They apply the initial October 2026 OBR forecast overlay to both baseline and reform. Series not updated by that overlay retain the March forecast path, and the dataset retains its pre-Budget calibration. These aggregate outputs were generated by the dashboard; this article does not claim a new local population run.

The deciles contain roughly equal numbers of people ranked by equivalised household income. Cash changes are household-weighted means, including unaffected households. Published decile cells meet a floor of at least three distinct survey households. The affected-person calculation uses an absolute net-income percentage change above 0.01%, floors baseline household income at £1 and includes households with a valid decile.

The [analysis files](https://github.com/PolicyEngine/policyengine-app-v2/pull/1460/files) record the calculation inputs, model versions, forecast settings, dataset checksum and source snapshots. Monetary amounts in tables are rounded to whole pounds; the calculation records retain precision.
