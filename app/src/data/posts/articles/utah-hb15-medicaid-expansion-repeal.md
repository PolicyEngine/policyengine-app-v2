Utah's [House Bill 15](https://le.utah.gov/~2026/bills/static/HB0015.html), sponsored by Rep. Steve Eliason (R-Salt Lake County) and Sen. Keith Grover (R-Utah County) in the 2026 legislative session, would repeal the state's Medicaid expansion if the federal matching rate (FMAP) drops below 85%. Currently, the federal government pays 90% of expansion Medicaid costs. This analysis models the scenario where expansion is repealed.

## Background: Medicaid and the ACA expansion

Medicaid is a joint federal-state program providing health coverage to low-income individuals. Before the Affordable Care Act (ACA), Medicaid primarily covered specific groups: children, pregnant women, parents with very low incomes, and people with disabilities. Non-disabled, non-elderly adults without children generally could not qualify, regardless of income.

The ACA expanded Medicaid eligibility to all adults under 65 with household income at or below 138% of the Federal Poverty Level (FPL). The federal government initially covered 100% of expansion costs, phasing down to 90% by 2020—higher than the standard FMAP of about 70% for traditional Medicaid in Utah.

HB 15 would repeal expansion if federal matching drops below 85%, reflecting concerns that Congress could further reduce the enhanced FMAP and shift more costs to states.

### Utah's Medicaid expansion history

Utah voters approved Medicaid expansion via [Proposition 3](https://ballotpedia.org/Utah_Proposition_3,_Medicaid_Expansion_Initiative_(2018)) in November 2018, and full expansion took effect in 2020. Today, approximately 72,000 Utahns are enrolled in expansion Medicaid.[^1]

[^1]: HB 15 would also repeal the 0.15% state sales tax that funds Utah's share of expansion costs. This analysis does not model the sales tax repeal.

Utah also maintains separate Medicaid categories for specific populations:
- **Parents/caretaker relatives**: Income limit of 46% FPL (~$10,200 for family of two)
- **Children**: Covered through Medicaid up to 136% FPL, then CHIP up to 205% FPL
- **Pregnant women**: Higher income limits with comprehensive coverage

### 2027 Federal Poverty Levels

This analysis uses projected 2027 FPL values, estimated by applying historical inflation trends to the 2024 FPL guidelines:

| Household Size | 100% FPL | 138% FPL (Expansion Limit) |
|----------------|----------|---------------------------|
| 1 person | $16,334 | $22,541 |
| 2 people | $22,138 | $30,550 |
| 3 people | $27,942 | $38,560 |
| 4 people | $33,746 | $46,569 |

## Key findings

Key results for 2027:

- ~121,000 people would lose Medicaid enrollment
- ~94,000 (78%) would fall into the "coverage gap" (not eligible for ACA subsidies)
- ~27,000 (22%) would gain ACA Premium Tax Credit eligibility
- Utah would save ~$99 million/year
- Federal government would save ~$729 million/year (net of increased ACA costs)

_[Use PolicyEngine](https://www.policyengine.org/us) to calculate the effect on your household._

## Understanding the coverage gap

The "coverage gap" refers to individuals whose earnings exceed traditional Medicaid limits but do not reach the ACA marketplace subsidy threshold. ACA subsidies begin at 100% of the Federal Poverty Level (FPL), while Medicaid expansion covers adults up to 138% FPL. If expansion is repealed, adults below 100% FPL would no longer qualify for either program.

## Single adult household

Consider a single adult in Utah. Under current law, adults earning up to 138% FPL (~$22,500/year) qualify for Medicaid expansion, receiving approximately $8,000 in annual benefits.

At $12,000/year (75% FPL), this adult currently receives Medicaid coverage. Under HB 15, they would lose this coverage and fall into the coverage gap—earning too little for ACA subsidies but no longer qualifying for Medicaid.

At $18,000/year (110% FPL), that same adult could transition to ACA coverage, receiving premium tax credits.

**Table 1: Health Benefits for Single Adult in Utah (2027)**

| Income | % FPL | Medicaid (Baseline) | Medicaid (Reform) | ACA PTC (Baseline) | ACA PTC (Reform) | Notes |
|--------|-------|---------------------|-------------------|-------------------|------------------|-------|
| $12,000 | 75% | $8,000 | $0 | $0 | $0 | Coverage gap |
| $16,334 | 100% | $8,000 | $0 | $0 | $11,579 | FPL threshold |
| $18,000 | 110% | $8,000 | $0 | $0 | $11,544 | ACA eligible |
| $22,541 | 138% | $8,000 | $0 | $0 | $11,103 | Expansion limit |
| $25,000 | 153% | $0 | $0 | $10,802 | $10,802 | Above expansion |

The chart below shows how health benefits change across income levels for a single adult. Solid lines represent current law, while dotted lines show the reform scenario.

**Figure 1: Health benefits for a single adult in Utah by income**
<iframe src="https://policyengine.github.io/utah-hb15-charts/single-adult.html" width="100%" height="550" frameborder="0"></iframe>

## Single parent with child

For a single parent with one child, the FPL threshold is higher (~$22,100 for a family of two), meaning the coverage gap extends to higher income levels.

Utah has a separate parent/caretaker Medicaid category with an income limit of 46% FPL (~$10,200 for a family of two). Under HB 15, very low-income parents would retain Medicaid through this category, though at a lower benefit level ($6,043 vs $8,000).

A parent earning $12,000/year (54% FPL) would fall into the coverage gap under HB 15—above the parent Medicaid limit but below the ACA threshold. Their child remains covered through Medicaid at lower incomes, transitioning to CHIP at higher incomes.

At higher incomes (above 100% FPL), parents can transition to ACA subsidies. Children remain on Medicaid up to about 136% FPL, then CHIP up to 205% FPL (about $46,000 for a family of two), after which they lose coverage.

**Table 2: Health Benefits for Single Parent + Child in Utah (2027)**

| Income | % FPL | Parent Medicaid (Baseline) | Parent Medicaid (Reform) | Child Medicaid/CHIP | ACA PTC (Baseline) | ACA PTC (Reform) | Notes |
|--------|-------|---------------------------|-------------------------|---------------------|-------------------|------------------|-------|
| $8,000 | 36% | $8,000 | $6,043 | $3,495 | $0 | $0 | Parent Medicaid (below 46% FPL) |
| $12,000 | 54% | $8,000 | $0 | $3,495 | $0 | $0 | Coverage gap (above 46% FPL) |
| $22,138 | 100% | $8,000 | $0 | $3,495 | $0 | $11,457 | FPL threshold |
| $30,550 | 138% | $8,000 | $0 | $3,495 | $0 | $10,812 | Expansion limit |
| $35,000 | 158% | $0 | $0 | $2,827 | $10,270 | $10,270 | Above expansion (CHIP) |

The chart below shows how health benefits change across income levels for a single parent with one child. Very low-income parents retain some Medicaid coverage under the reform. The child transitions from Medicaid ($3,495) to CHIP ($2,827) at higher incomes, losing coverage entirely above 205% FPL (~$46,000).

**Figure 2: Health benefits for a single parent with child in Utah by income**
<iframe src="https://policyengine.github.io/utah-hb15-charts/parent-child.html" width="100%" height="550" frameborder="0"></iframe>

## Statewide fiscal impact

For tax year 2027, HB 15 would generate the following fiscal impacts (all figures represent spending changes, not revenue):

| Category | Amount |
|----------|--------|
| Total Medicaid spending reduction | $988 million |
| Federal share (90%) | $889 million |
| State share (10%) | $99 million |
| Increased federal ACA spending | $160 million |
| **Net federal spending reduction** | **$729 million** |
| **Net state spending reduction** | **$99 million** |

## Who is affected?

Of the ~121,000 people losing Medicaid enrollment:

- **78% fall into the coverage gap**: These individuals earn below 100% FPL and would not qualify for ACA subsidies.

- **22% can transition to ACA**: These individuals earn between 100-138% FPL and can obtain marketplace coverage with premium subsidies.

Children's coverage is unaffected by HB 15—they remain eligible for Medicaid up to 136% FPL and CHIP up to 205% FPL regardless of the expansion repeal. Only adult coverage under the expansion category is affected.

### Demographics of affected population

The table below summarizes the demographic profile of those who would lose Medicaid coverage under HB 15.

| Characteristic | All Affected | Coverage Gap | ACA Transition |
|----------------|--------------|--------------|----------------|
| Number of people | 121,000 | 94,000 | 27,000 |
| Average age | 34 years | 33 years | 35 years |
| Average household income | $62,500 | $64,200 | $56,300 |
| Average FPL | 81% | 70% | 116% |

The chart below shows the distribution of affected individuals by household income decile. Those in lower deciles are more likely to fall into the coverage gap, while those in higher deciles can transition to ACA coverage.

**Figure 3: Affected population by household income decile**
<iframe src="https://policyengine.github.io/utah-hb15-charts/income-distribution.html" width="100%" height="500" frameborder="0"></iframe>

**Age distribution**: The affected population skews young—36% are young adults (18-25), and 24% are ages 26-34. The average age is 34 years.

**Figure 4: Affected population by age group**
<iframe src="https://policyengine.github.io/utah-hb15-charts/age-distribution.html" width="100%" height="500" frameborder="0"></iframe>

## Conclusion

Utah HB 15 creates a contingent repeal of Medicaid expansion that would take effect if federal matching drops below 85%. If enacted, the policy would reduce state Medicaid spending by ~$99 million annually. Approximately 94,000 adults earning below 100% FPL would lose coverage and would not qualify for ACA subsidies, while ~27,000 adults at 100-138% FPL could transition to ACA marketplace plans.

Analytical tools like PolicyEngine can help evaluate the impacts of reforms like this on diverse household compositions and state budgets.

We invite you to explore our [additional analyses](https://www.policyengine.org/us/research) and use [PolicyEngine](https://www.policyengine.org/us) to calculate your own benefits or design custom policy reforms.
