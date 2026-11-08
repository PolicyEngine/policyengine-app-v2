On November 5th, 2026, the Internal Revenue Service (IRS) released its annual inflation adjustments for federal tax parameters for tax year 2027 in [Revenue Procedure 2026-35](https://www.irs.gov/pub/irs-drop/rp-26-35.pdf). Over sixty provisions of the federal tax code are indexed for inflation, including income tax thresholds, the standard deduction, and the Earned Income Tax Credit (EITC), which affect the millions of American households who file taxes each year. PolicyEngine has updated its US model to reflect these changes.

## How does the IRS update tax parameters?

Federal tax law requires inflation adjustments for certain tax parameters using the Consumer Price Index (CPI). The [U.S. Bureau of Labor Statistics](https://www.bls.gov/cpi/) defines CPI as "a measure of the average change over time in the prices paid by urban consumers for a market basket of consumer goods and services." As prices grow over time, CPI increases accordingly. The Bureau maintains multiple versions of CPI, including the Consumer Price Index for All Urban Consumers (CPI-U), the Consumer Price Index for Urban Wage Earners and Clerical Workers (CPI-W), and the Chained Consumer Price Index for All Urban Consumers (C-CPI-U). Before 2018, indexed tax provisions used CPI-U; the [Tax Cuts and Jobs Act of 2017](https://www.congress.gov/115/plaws/publ97/PLAW-115publ97.pdf#page=7) (Public Law 115-97, section 11002) switched them to C-CPI-U, which accounts for consumer substitution behavior and by construction results in smaller inflation adjustments.

For 2027, the IRS compares average C-CPI-U for the 12 months ending August 31, 2026, with the same average for a base year, then applies each provision's statutory rounding rule. Most amounts rose by about 3%.

## What was updated?

PolicyEngine models most federal income tax provisions. For years the IRS has not yet published, we project each indexed amount from the Congressional Budget Office's [inflation projections](https://www.cbo.gov/data/budget-economic-data#4) and observed C-CPI-U, applying the same statutory rounding rules. This lets users calculate taxes and analyze policy proposals for future years before the IRS announces the official values.

As in [2025](/us/research/federal-tax-inflation-adjustments-2025), the IRS adjustments were somewhat larger than our projections: across the brackets, standard deduction, EITC, capital gains and AMT amounts, the official increases were about 9% larger at the median. For example, we projected that the standard deduction for single filers would rise $450, from $16,100 in 2026 to $16,550 in 2027. The IRS set it at $16,600, a $500 increase. Table 1 shows the standard deduction for each filing status.

**Table 1: Standard deduction in tax year 2027**

| Filing status | 2026 | 2027 (PolicyEngine projection) | 2027 (IRS) | Projected increase | IRS increase |
|---|---|---|---|---|---|
| Single | $16,100 | $16,550 | $16,600 | $450 | $500 |
| Married filing jointly | $32,200 | $33,150 | $33,200 | $950 | $1,000 |
| Head of household | $24,150 | $24,850 | $24,925 | $700 | $775 |
| Married filing separately | $16,100 | $16,550 | $16,600 | $450 | $500 |

Both indexed amounts of the Child Tax Credit (CTC) also rose. The maximum refundable portion, which the [Tax Cuts and Jobs Act of 2017](https://www.congress.gov/115/plaws/publ97/PLAW-115publ97.pdf#page=21) (Public Law 115-97, section 11022) set at $1,400 per child and indexed for inflation, rises from $1,700 in 2026 to $1,800 in 2027. The maximum credit, which [H.R. 1, the One Big Beautiful Bill Act](https://www.congress.gov/119/plaws/publ21/PLAW-119publ21.pdf#page=90) (Public Law 119-21, section 70104), raised to $2,200 and indexed for inflation after 2025, rises from $2,200 in 2026 to $2,300 in 2027. Both amounts round down to the next lowest multiple of $100.

In addition to the standard deduction and the CTC, we updated the following provisions to their 2027 values:

- [Additional standard deduction for the aged or blind](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/deductions/standard/aged_or_blind/amount.yaml) ($1,700, or $2,100 for unmarried filers)
- [Dependent standard deduction](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/deductions/standard/dependent/amount.yaml) ($1,400) and its [earned income addition](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/deductions/standard/dependent/additional_earned_income.yaml) ($500)
- [Income tax bracket thresholds](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/income/bracket.yaml)
- [Capital gains bracket thresholds](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/capital_gains/thresholds.yaml)
- [EITC maximum amounts](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/credits/eitc/max.yaml)
- [EITC phase-out start](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/credits/eitc/phase_out/start.yaml)
- [EITC joint bonus](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/credits/eitc/phase_out/joint_bonus.yaml) (the difference between the phase-out start for joint filers and other filers)
- [EITC maximum investment income](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/credits/eitc/phase_out/max_investment_income.yaml) ($12,600)
- [Alternative minimum tax (AMT) 28% bracket threshold](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/income/amt/brackets.yaml)
- [AMT exemption amount](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/income/amt/exemption/amount.yaml)
- [AMT exemption phase-out start](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/income/amt/exemption/phase_out/start.yaml)
- [AMT child exemption amount](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/income/amt/exemption/child/amount.yaml)
- [AMT separate limit](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/income/amt/exemption/separate_limit.yaml)
- [Qualified business income deduction threshold](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/deductions/qbi/phase_out/start.yaml) and [minimum deduction](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/deductions/qbi/deduction_floor/amount.yaml) ($415 for at least $1,030 of qualified business income)
- [Student loan interest deduction phase-out start](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/ald/student_loan_interest/reduction/start.yaml)
- [Educator expense deduction cap](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/ald/educator_expense/cap.yaml) ($350)
- [Excess business loss threshold](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/ald/loss/max.yaml)
- [Long-term care premium limits](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/deductions/itemized/medical/long_term_care_premium_limit.yaml) for the medical expense deduction
- [Qualifying relative gross income limit](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/income/exemption/amount.yaml) ($5,500)
- [Estate tax basic exclusion amount](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/credits/estate/base.yaml) ($15,480,000)

For the long-term care premium limit at ages 41 to 50, the revenue procedure prints $945. The statute rounds each amount to the nearest multiple of $10, and the other four age bands imply $940, so PolicyEngine uses $940.

Two state amounts follow the federal values and were updated with them: Arizona's standard deduction and Maine's additional standard deduction for the aged or blind.

You can browse these parameters in our [parameter explorer](/us/model/rules/parameters) and [compute your own policy reforms](https://app.policyengine.org/us) using the updated values.
