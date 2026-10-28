The Autumn Budget 2026 increases the basic, higher and additional income tax rates on savings income by a further two percentage points from **6 April 2027**, taking them to **24%, 44% and 49%** across the UK. Interest earned inside an ISA remains exempt from income tax. The change appears in [Budget 2026, paragraph 6.247](https://assets.publishing.service.gov.uk/media/6ae1ec57bdb574cf1c9b3f12/E03668986_HMT_Budget_2026_ELAY__2_.pdf#page=142).

Key figures for 2027–28:

- A basic-rate saver with £2,000 of annual interest outside ISAs pays £20 more a year.
- A higher-rate saver with the same interest pays £30 more, because their Personal Savings Allowance is lower.
- A basic-rate saver with £500 of interest pays no extra tax in the example below.
- The Treasury forecasts £125 million of additional revenue in 2027–28 and £590 million in 2031–32.

Our [Autumn Budget 2026 dashboard](https://www.policyengine.org/uk/autumn-budget-2026) is where we publish estimates for the Budget measures we model. Population estimates for the savings measure remain under review and are not included in this article. Separate explainers cover the [property income tax increase](/uk/research/uk-autumn-budget-2026-property-income-tax) and the [trading allowance increase](/uk/research/uk-autumn-budget-2026-trading-allowance).

## What changes in April 2027?

The [Budget 2025 technical note](https://www.gov.uk/government/publications/changes-to-tax-rates-for-property-savings-and-dividend-income/change-to-tax-rates-for-property-savings-and-dividend-income-technical-note) had already set savings rates at 22%, 42% and 47% from April 2027. The additional two-point increase is measured against those existing 2027 rules. Dividend rates remain unchanged by this measure.

| Income tax band | Already scheduled for 2027–28 | Budget 2026 rate | Change |
| --- | ---: | ---: | ---: |
| Basic | 22% | 24% | +2 percentage points |
| Higher | 42% | 44% | +2 percentage points |
| Additional | 47% | 49% | +2 percentage points |

## Household impacts

The examples isolate the announced savings measure in 2027–28. They hold the stated income fixed and show income tax rather than household income after means-tested benefits.

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

### Other income affects the tax on interest

From April 2027, employment, pension and trading income fill the tax bands first, property next, savings after that and dividends last. Allowances first reduce income other than property, savings or dividends.

Consider an adult in England with £45,000 of salary, £6,000 of property profit after allowable expenses, £2,000 of interest and no mortgage interest. The £12,570 Personal Allowance leaves £32,430 of taxable salary. That uses £32,430 of the £37,700 basic-rate band, leaving £5,270. Property income fills the remaining basic-rate band and enters the higher band.

The individual qualifies for a £500 Personal Savings Allowance. The remaining £1,500 of interest faces the higher savings rate: £1,500 × 42% = £630 before, against £1,500 × 44% = £660 after. The savings measure alone therefore increases their tax by **£30 a year**. This example holds property tax rates unchanged to isolate savings.

## Treasury costing

The Treasury's [Table 6.1, row 62](https://www.gov.uk/government/publications/supporting-documents-for-budget-2026) forecasts the following additional Exchequer revenue. These are the Treasury's figures, on a National Accounts basis.

| Exchequer revenue, £ million | 2026–27 | 2027–28 | 2028–29 | 2029–30 | 2030–31 | 2031–32 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Savings income rates | 15 | 125 | 555 | 520 | 555 | 590 |

The [Treasury policy costings, page 75](https://assets.publishing.service.gov.uk/media/6ae1883fe4367e5c8b0467df/AB26_Policy_Costing.pdf#page=75) allow for savers moving funds into tax-advantaged products such as ISAs. PolicyEngine's national estimates hold those choices fixed.

Collection timing affects comparisons. PolicyEngine scores each tax year's liabilities in that year. Self Assessment payments on account are normally based on the previous year's tax bill; the balancing payment for 2027–28 is due on 31 January 2029, alongside the first payment on account for 2028–29. [HMRC's payment guidance](https://www.gov.uk/understand-self-assessment-bill/payments-on-account) explains that schedule. The [ONS public-finance methodology, section 6.1.2](https://www.ons.gov.uk/economy/governmentpublicsectorandtaxes/publicsectorfinance/methodologies/monthlystatisticsonthepublicsectorfinancesamethodologicalguide) records Self Assessment income tax using cash receipts, without shifting them back to the year the income arose.

The dashboard comparison marks 2027–28 and 2028–29 as not comparable on this timing basis. Its 2026–27 comparison is also not comparable: the costing notes do not explain the Treasury's £15 million figure before the new rates take effect, while the model has no rate change in that year. Timing alone does not reconcile the later savings revenue gap. The national savings estimates and the underlying data remain under review; this article reports no PolicyEngine national revenue, affected-person count or distribution.

## Assumptions and limitations

- The worked examples are hypothetical single adults aged 35 in England. Their income is fixed at the stated 2027–28 amounts. They include no pension contributions, Gift Aid, student loans, property losses, carried-forward finance costs or other reliefs. Savings are outside ISAs.
- The household examples show income tax, holding behaviour fixed. They do not estimate household income after means-tested benefits or responses such as moving savings into ISAs.
- The savings rate increase applies across the UK. The English examples do not establish the effect for a Scottish taxpayer with different tax on their other income.
- These household calculations do not validate the population dataset or resolve the national revenue comparison. National results require their own analysis and disclosure checks.

## Methodology

The household calculations use the `policyengine` Python package (version 6.11.1), PolicyEngine UK (version 2.151.0) and PolicyEngine core (version 3.33.3). Each savings comparison applies only the announced savings rate change against the already scheduled 2027–28 rules. Both household scenarios use the OBR’s October 2026 forecast update at dashboard commit `64042657`. Supplied 2027–28 income stays fixed; the forecast updates the model’s projected parameters. Tax calculations are checked against independent arithmetic. The line chart plots the exact schedule breakpoints and points every £100, and its interpolation agrees with PolicyEngine UK to within one penny at every £2 of interest.

The [shared analysis files](https://github.com/PolicyEngine/policyengine-app-v2/tree/main/analysis/uk-budget-2026-income-tax) record the household inputs, model versions, forecast settings and validation. Monetary amounts in tables are rounded to whole pounds; the calculation records retain precision. The household calculations use hypothetical people and do not require population microdata.
