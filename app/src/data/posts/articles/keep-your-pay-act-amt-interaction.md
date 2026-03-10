Senator Cory Booker's [Keep Your Pay Act](https://www.booker.senate.gov/news/press/booker-announces-keep-your-pay-act) would more than double the standard deduction: from $32,200 to $75,000 for married couples filing jointly, from $16,100 to $37,500 for single filers, and from $24,150 to $56,250 for heads of household. For some high earners, the Alternative Minimum Tax (AMT) claws back over half of the tax savings that a simple bracket calculation predicts.

Senator Booker's [tax calculator](https://www.booker.senate.gov/tax-calculator) does not model this interaction, so it overstates the savings for affected filers. [PolicyEngine's Keep Your Pay Act calculator](/us/keep-your-pay-act) accounts for it.

## How the AMT offsets part of the tax savings

The regular income tax and the AMT run two parallel calculations.[^1] You pay whichever produces the higher amount.

**Regular income tax** uses the standard deduction:

$$
\text{Taxable income} = \text{AGI} - \text{Standard deduction}
$$

$$
\text{Tax} = \text{Bracket rates applied to taxable income}
$$

**AMT** computes its own taxable base. It starts from taxable income, adds back the standard deduction and other preference items, then subtracts its own exemption and applies a flatter rate:

$$
\text{AMTI} = \text{Taxable income} + \text{Standard deduction} + \text{Other AMT preference items}
$$

$$
\text{AMT taxable income} = \text{AMTI} - \text{AMT exemption}
$$

$$
\text{Tentative minimum tax} = 26\%\ \text{on first}\ {\sim}\$250{,}000 + 28\%\ \text{above}
$$

$$
\text{AMT owed} = \max(0,\ \text{Tentative minimum tax} - \text{Regular tax})
$$

Because AMTI adds back the standard deduction, raising the standard deduction does not change the AMT calculation. It only lowers the regular tax. When the regular tax drops below the tentative minimum tax, the AMT fills the gap.

## Worked example

Consider a married couple in Texas (no state income tax) earning $500,000 in 2026.

### What Booker's calculator shows

Senator Booker's calculator reports $13,696 in tax savings for this household:

![Senator Booker's Keep Your Pay Act calculator showing $13,696 in estimated savings for a married couple filing jointly with $500,000 income](/assets/posts/keep-your-pay-act-amt-interaction/booker-calculator-500k.png)

This calculation does not include the AMT.

### The AMT clawback

The AMT adds back the standard deduction, so raising it does not change the tentative minimum tax — the threshold that triggers AMT when regular tax falls below it:

| Line item             |   Amount |
| :-------------------- | -------: |
| AMTI                  | $500,000 |
| AMT exemption         | $140,200 |
| AMT taxable income    | $359,800 |
| Tentative minimum tax |  $95,864 |

### The bottom line

Under current law, the regular tax ($102,608) exceeds the tentative minimum tax ($95,864), so the filer owes no AMT. Under KYPA, the regular tax drops to $88,912 — now _below_ the tentative minimum tax. The AMT fills the gap: $95,864 − $88,912 = $6,952.

| Line item             |  Current law |        KYPA |  Difference |
| :-------------------- | -----------: | ----------: | ----------: |
| Regular tax           |     $102,608 |     $88,912 |    −$13,696 |
| Tentative minimum tax |      $95,864 |     $95,864 |          $0 |
| AMT                   |           $0 |      $6,952 |     +$6,952 |
| **Total income tax**  | **$102,608** | **$95,864** | **−$6,744** |

Bracket savings alone suggest $13,696 in tax relief, but the AMT claws back $6,952 of that. The actual tax cut totals $6,744 — 51% less than the headline figure.

[PolicyEngine's Keep Your Pay Act calculator](/us/keep-your-pay-act) accounts for the AMT and confirms the $6,744 net savings:

![PolicyEngine's Keep Your Pay Act calculator showing +$6,744/year for a married couple filing jointly with $500,000 income in Texas](/assets/posts/keep-your-pay-act-amt-interaction/policyengine-calculator-500k.png)

## Who is affected

The chart below shows how the AMT clawback varies for a non-itemizer couple filing jointly based on their employment income in Texas in 2026.

<iframe src="/us/keep-your-pay-act/amt-chart" width="100%" height="550" style="border: none; overflow: hidden;" title="KYPA AMT savings by income"></iframe>

The AMT reduces KYPA savings for filers in roughly the $250,000–$625,000 range (married filing jointly). Below that range, the standard deduction increase does not push the regular tax below the AMT floor. Above that range, higher bracket rates keep the regular tax above the AMT.


## Methodology

All calculations use the [PolicyEngine US microsimulation model](https://policyengine.org), which models AMT alongside regular income tax. AMT exemptions in 2026 under the One Big Beautiful Bill Act are $140,200 for married filing jointly, $90,100 for single and head of household, and $70,100 for married filing separately.

[^1]: These are simplified calculations. The PolicyEngine model includes more complex interactions such as capital gains taxes.
