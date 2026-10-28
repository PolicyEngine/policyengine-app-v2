In the Autumn Budget on 28 October 2026, the Chancellor announced a Pension Tax Allowance (PTA): an income tax reduction for people over State Pension age whose total income is at or just above the full new State Pension. The PTA applies for three tax years, from 6 April 2027 to 5 April 2030. This post explains how the PTA works and shows its effect on example pensioners, using PolicyEngine UK household calculations.

Key figures for 2027-28:

- The full new State Pension is £13,036.40 a year, £466.40 above the £12,570 Personal Allowance.
- The full PTA is £94: 20% of £466.40 is £93.28, which HM Treasury rounds up.
- A pensioner with total income up to £13,036.40 pays no income tax.
- The PTA falls by £1 for each £3 of income above £13,036.40 and reaches zero at £13,318.40.
- Across that £282 withdrawal range, the marginal income tax rate is 53.3%, against 20% without the PTA.

## What the PTA does

The [Budget 2026 document](https://www.gov.uk/government/publications/budget-2026-document/budget-2026-html) describes the PTA in its list of tax measures, and HM Treasury's [Pension Tax Allowance explainer](https://www.gov.uk/government/publications/pension-tax-allowance-explainer/pension-tax-allowance-explainer) gives the rules in full. The PTA has four parts:

1. **Eligibility.** People over State Pension age, or who reach it during the tax year, qualify. A person does not need to receive the State Pension.
2. **Value.** The full PTA applies the 20% basic rate to the gap between the full new State Pension and the Personal Allowance. It is a reduction in the tax bill, not a change to the Personal Allowance, and it cannot produce a refund. The rate is 20% for all UK taxpayers, including Scottish taxpayers.
3. **Income test.** The test uses total income from all sources: pensions, earnings, self-employment, property, savings and dividends. ISA income does not count. A person with total income at or below the full new State Pension gets the full PTA.
4. **Taper.** In the explainer's words, "For every £3 of income above the full level of the new State Pension, your Pension Tax Allowance will reduce by £1."

The PTA rises with the full new State Pension in 2028-29 and 2029-30. HMRC applies it automatically, with no claim.

| Tax year | Full new State Pension | Full PTA | PTA reaches zero at |
| -------- | ---------------------- | -------- | ------------------- |
| 2027-28  | £13,036.40             | £94      | £13,318.40          |
| 2028-29  | £13,361.40             | £159     | £13,838.40          |
| 2029-30  | £13,696.80             | £226     | £14,374.80          |

The 2027-28 values come from the explainer. The 2028-29 and 2029-30 State Pension values are PolicyEngine UK's projections under the triple lock, rounded down to 5p a week, because the government has not yet set those rates. The explainer says the PTA is "uprated in line with" the full new State Pension. We read this as the same formula each year, 20% of the full new State Pension above the Personal Allowance, rounded up to the pound. This reading keeps income tax at zero for a pensioner on the full new State Pension, which the Budget states as the aim.

The Treasury estimates that the PTA reduces receipts by £45 million in 2027-28, £90 million in 2028-29 and £150 million in 2029-30. The same costing shows +£50 million in 2030-31 and −£15 million in 2031-32, after the PTA ends (Budget 2026, Table 6.1, row 52). The explainer states that about 290,000 pensioners will pay no income tax in 2027-28 because of the PTA, and about 500,000 will pay less. By the end of this Parliament, about 1 million pensioners will receive the PTA.

## Worked examples

The explainer gives five example pensioners for 2027-28. PolicyEngine UK reproduces each result.

| Person   | Income                                          | Total income | Income tax without the PTA | PTA used | Income tax with the PTA |
| -------- | ----------------------------------------------- | ------------ | -------------------------- | -------- | ----------------------- |
| Tom      | Basic and additional State Pension              | £10,300.00   | £0.00                      | £0.00    | £0.00                   |
| Anne     | Partial new State Pension and a private pension | £12,970.00   | £80.00                     | £80.00   | £0.00                   |
| Steph    | Full new State Pension only                     | £13,036.40   | £93.28                     | £93.28   | £0.00                   |
| Jonathan | Part-time salary, State Pension deferred        | £13,186.40   | £123.28                    | £44.00   | £79.28                  |
| Nadia    | Private pension                                 | £13,400.00   | £166.00                    | £0.00    | £166.00                 |

Steph's tax of £93.28 is below the £94 PTA, so the PTA removes her full tax bill. Jonathan's income is £150 above the full new State Pension, so his PTA is £94 − £150 ÷ 3 = £44. Nadia's income is above £13,318.40, so she gets no PTA.

## Income tax by total income

The charts below follow a single pensioner aged 70 with a partial new State Pension of £11,000 and a private pension. Total income changes with the private pension.

```chart
{
  "type": "line",
  "title": "Income tax for a single pensioner, 2027-28",
  "subtitle": "Income tax by total income, with and without the Pension Tax Allowance",
  "xKey": "income",
  "xLabel": "Total income",
  "series": [
    {
      "key": "without",
      "name": "Without the PTA",
      "color": "quinary"
    },
    {
      "key": "with",
      "name": "With the PTA",
      "color": "primary"
    }
  ],
  "data": [
    {
      "income": 12500,
      "without": 0.0,
      "with": 0.0
    },
    {
      "income": 12570,
      "without": 0.0,
      "with": 0.0
    },
    {
      "income": 13036.4,
      "without": 93.28,
      "with": 0.0
    },
    {
      "income": 13037.75,
      "without": 93.55,
      "with": 0.0
    },
    {
      "income": 13318.4,
      "without": 149.68,
      "with": 149.68
    },
    {
      "income": 13500,
      "without": 186.0,
      "with": 186.0
    }
  ],
  "markers": [
    {
      "x": 12570,
      "label": "Personal Allowance"
    },
    {
      "x": 13036.4,
      "label": "Full new State Pension"
    },
    {
      "x": 13318.4,
      "label": "PTA withdrawn"
    }
  ],
  "yLabel": "Income tax",
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
  "source": "Source: PolicyEngine UK household calculation; HM Treasury, Pension Tax Allowance explainer (28 October 2026)."
}
```

Without the PTA, income tax starts at the £12,570 Personal Allowance. With the PTA, income tax starts at £13,037.75, just above the full new State Pension, and reaches the level without the PTA at £13,318.40. Above £13,318.40, the PTA has no effect.

## The PTA in each tax year

```chart
{
  "type": "line",
  "title": "Pension Tax Allowance by total income and tax year",
  "subtitle": "Income tax reduction for a single pensioner",
  "xKey": "income",
  "xLabel": "Total income",
  "series": [
    {
      "key": "y2027",
      "name": "2027-28",
      "color": "primary"
    },
    {
      "key": "y2028",
      "name": "2028-29",
      "color": "secondary"
    },
    {
      "key": "y2029",
      "name": "2029-30",
      "color": "tertiary"
    }
  ],
  "data": [
    {
      "income": 12400,
      "y2027": 0.0,
      "y2028": 0.0,
      "y2029": 0.0
    },
    {
      "income": 12570,
      "y2027": 0.0,
      "y2028": 0.0,
      "y2029": 0.0
    },
    {
      "income": 13036.4,
      "y2027": 93.28,
      "y2028": 93.28,
      "y2029": 93.28
    },
    {
      "income": 13037.75,
      "y2027": 93.55,
      "y2028": 93.55,
      "y2029": 93.55
    },
    {
      "income": 13318.4,
      "y2027": 0.0,
      "y2028": 149.68,
      "y2029": 149.68
    },
    {
      "income": 13361.4,
      "y2027": 0.0,
      "y2028": 158.28,
      "y2029": 158.28
    },
    {
      "income": 13362.75,
      "y2027": 0.0,
      "y2028": 158.55,
      "y2029": 158.55
    },
    {
      "income": 13696.8,
      "y2027": 0.0,
      "y2028": 47.2,
      "y2029": 225.36
    },
    {
      "income": 13698.0,
      "y2027": 0.0,
      "y2028": 46.8,
      "y2029": 225.6
    },
    {
      "income": 13838.4,
      "y2027": 0.0,
      "y2028": 0.0,
      "y2029": 178.8
    },
    {
      "income": 14374.8,
      "y2027": 0.0,
      "y2028": 0.0,
      "y2029": 0.0
    },
    {
      "income": 14500,
      "y2027": 0.0,
      "y2028": 0.0,
      "y2029": 0.0
    }
  ],
  "yLabel": "Income tax reduction",
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
  "source": "Source: PolicyEngine UK household calculation; HM Treasury, Pension Tax Allowance explainer (28 October 2026). 2028-29 and 2029-30 use PolicyEngine UK's State Pension projections."
}
```

The PTA equals the tax due up to the full new State Pension, then falls by £1 for each £3 of extra income. Because the full new State Pension rises each year while the Personal Allowance stays at £12,570, the maximum PTA rises from £94 in 2027-28 to £226 in 2029-30, and the withdrawal range widens from £282 to £678.

## Marginal tax rates

```chart
{
  "type": "line",
  "title": "Marginal income tax rate for a single pensioner, 2027-28",
  "subtitle": "Income tax on each extra £1 of total income",
  "xKey": "income",
  "xLabel": "Total income",
  "series": [
    {
      "key": "without",
      "name": "Without the PTA",
      "color": "quinary",
      "step": true
    },
    {
      "key": "with",
      "name": "With the PTA",
      "color": "primary",
      "step": true
    }
  ],
  "data": [
    {
      "income": 12500,
      "without": 0.0,
      "with": 0.0
    },
    {
      "income": 12570,
      "without": 20.0,
      "with": 0.0
    },
    {
      "income": 13037.75,
      "without": 20.0,
      "with": 53.3
    },
    {
      "income": 13318.4,
      "without": 20.0,
      "with": 20.0
    },
    {
      "income": 13500,
      "without": 20.0,
      "with": 20.0
    }
  ],
  "markers": [
    {
      "x": 12570,
      "label": "Personal Allowance"
    },
    {
      "x": 13036.4,
      "label": "Full new State Pension"
    },
    {
      "x": 13318.4,
      "label": "PTA withdrawn"
    }
  ],
  "yLabel": "Marginal income tax rate",
  "format": {
    "suffix": "%",
    "decimals": 1
  },
  "xFormat": {
    "prefix": "£",
    "decimals": 0,
    "separator": true
  },
  "source": "Source: PolicyEngine UK household calculation; HM Treasury, Pension Tax Allowance explainer (28 October 2026)."
}
```

The PTA changes the marginal income tax rate in two income ranges. Between £12,570 and £13,037.75 it falls from 20% to 0%. Between £13,037.75 and £13,318.40 it rises from 20% to 53.3%: the 20% basic rate plus 33.3% from the taper. A pensioner in that range keeps 47p of each extra £1 of taxable income, against 80p without the PTA.

## Interaction with Pension Credit

Pension Credit tops up income to a minimum guarantee, and it counts income after income tax. For a Pension Credit claimant, a lower income tax bill therefore reduces Pension Credit by the same amount, and household net income does not change.

In PolicyEngine UK, the single-person minimum guarantee is £12,661 a year in 2027-28. A single claimant with total income between £12,570 and about £12,680 receives the PTA but no net income gain. The projected minimum guarantee rises faster than the Personal Allowance, so this range extends to about £13,000 in 2028-29 and £13,320 in 2029-30. People who do not claim Pension Credit keep the full PTA.

## Assumptions and limitations

- The analysis covers single pensioners in a household calculation. It is not a microsimulation, and it makes no population-wide estimates of its own; the costs and counts above come from HM Treasury.
- The 2028-29 and 2029-30 State Pension, PTA and Pension Credit values use PolicyEngine UK projections. The published rates may differ.
- The explainer does not state how HMRC rounds the PTA in later years. We round up to the pound, as for 2027-28.
- We apply the PTA to the final income tax liability. The PTA reduces the tax bill after other allowances; for people with tax charges, such as the High Income Child Benefit Charge, the order of steps may differ from the legislation, which the Finance Bill 2026-27 will set out.
- The Pension Credit results assume that the person claims Pension Credit when eligible.
- For Nadia, the explainer's £166 treats all her income as taxable at 20%. We model her income as a private pension. If part of it were savings interest, the starting rate for savings would reduce her tax.

The Budget also adjusts the triple lock from April 2030: the State Pension then rises by the highest of 2.5%, inflation, or the increase that keeps its value relative to earnings at the April 2029 level. This post does not cover that change.

## Methodology

We used the `policyengine` Python package (version 6.11.1) with PolicyEngine UK (version 2.151.0). PolicyEngine UK does not yet include the PTA, so we added it as a structural reform that reduces the `income_tax` variable. The rules and values match the PTA modifier in the draft update to PolicyEngine's Autumn Budget 2026 dashboard. Income tax and the PTA are piecewise linear in total income, so the charts plot their breakpoints; these agree with PolicyEngine UK to within £0.01 at every £2 step of total income.
