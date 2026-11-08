On November 5th, 2026, the Internal Revenue Service (IRS) released its annual inflation adjustments for federal tax parameters for tax year 2027 in [Revenue Procedure 2026-35](https://www.irs.gov/pub/irs-drop/rp-26-35.pdf). The revenue procedure lists new dollar amounts for more than sixty indexed provisions, from the income tax brackets and the standard deduction to the Earned Income Tax Credit (EITC) and the estate tax exclusion. These are the amounts that will apply to 2027 returns, filed in early 2028, and PolicyEngine's US model now uses them.

## Where the 2027 numbers come from

The Internal Revenue Code states each indexed amount in base-year dollars and directs the IRS to raise it every year by a cost-of-living adjustment. Since the [Tax Cuts and Jobs Act of 2017](https://www.congress.gov/115/plaws/publ97/PLAW-115publ97.pdf#page=7) (Public Law 115-97, section 11002), that adjustment has used the Chained Consumer Price Index for All Urban Consumers (C-CPI-U), which the [Bureau of Labor Statistics](https://www.bls.gov/cpi/) publishes monthly; earlier years used the standard CPI-U. The chained index reflects households shifting their spending as relative prices change, so it tends to grow more slowly than CPI-U, and indexed tax amounts grow more slowly with it.

For tax year 2027, the adjustment compares average C-CPI-U over the 12 months ending August 31, 2026, with the average for each provision's base year. The IRS then rounds each result as the statute directs, usually down to a set multiple: $50 for the standard deduction and $100 for the CTC, for example. Most 2027 amounts are about 3% above their 2026 values.

## How the official values compare with our projections

PolicyEngine models future tax years before the IRS publishes them. Until it does, the model estimates each indexed amount by applying the statutory formula to the C-CPI-U readings already available and to the Congressional Budget Office's [inflation projections](https://www.cbo.gov/data/budget-economic-data#4) for the months still to come. Swapping in the official figures shows how close those estimates came.

As we found for [tax year 2025](/us/research/federal-tax-inflation-adjustments-2025), the official increases slightly exceeded our projections. Across the brackets, standard deduction, EITC, capital gains and AMT amounts, the median official increase was about 9% larger than projected. For single filers, we projected a standard deduction of $16,550, a $450 rise from 2026; the IRS set it at $16,600, a $500 rise. Table 1 compares the two for each filing status.

**Table 1: Standard deduction in tax year 2027**

| Filing status | 2026 | 2027 (PolicyEngine projection) | 2027 (IRS) | Projected increase | IRS increase |
|---|---|---|---|---|---|
| Single | $16,100 | $16,550 | $16,600 | $450 | $500 |
| Married filing jointly | $32,200 | $33,150 | $33,200 | $950 | $1,000 |
| Head of household | $24,150 | $24,850 | $24,925 | $700 | $775 |
| Married filing separately | $16,100 | $16,550 | $16,600 | $450 | $500 |

Both indexed amounts of the Child Tax Credit (CTC) also rose. The maximum refundable portion, which the [Tax Cuts and Jobs Act of 2017](https://www.congress.gov/115/plaws/publ97/PLAW-115publ97.pdf#page=21) (Public Law 115-97, section 11022) set at $1,400 per child and indexed for inflation, rises from $1,700 in 2026 to $1,800 in 2027. The maximum credit, which [H.R. 1, the One Big Beautiful Bill Act](https://www.congress.gov/119/plaws/publ21/PLAW-119publ21.pdf#page=90) (Public Law 119-21, section 70104), raised to $2,200 and indexed for inflation after 2025, rises from $2,200 in 2026 to $2,300 in 2027. Both amounts round down to the next lowest multiple of $100.

Beyond the standard deduction and the CTC, the update covers these provisions:

**Income tax and deductions**

- The [ordinary income tax brackets](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/income/bracket.yaml) and the [0% and 15% capital gains brackets](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/capital_gains/thresholds.yaml)
- The [extra standard deduction for filers who are aged or blind](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/deductions/standard/aged_or_blind/amount.yaml): $1,700, or $2,100 if unmarried
- The [floor on a dependent's standard deduction](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/deductions/standard/dependent/amount.yaml) ($1,400) and the [amount added to a dependent's earned income](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/deductions/standard/dependent/additional_earned_income.yaml) ($500)
- The [taxable income threshold for the qualified business income deduction](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/deductions/qbi/phase_out/start.yaml) and its [minimum deduction](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/deductions/qbi/deduction_floor/amount.yaml): $415 for taxpayers with at least $1,030 of qualified business income
- The [income at which the student loan interest deduction starts to phase out](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/ald/student_loan_interest/reduction/start.yaml)
- The [cap on educator expenses](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/ald/educator_expense/cap.yaml), unchanged at $350
- The [excess business loss threshold](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/ald/loss/max.yaml)
- The [age-based limits on long-term care premiums](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/deductions/itemized/medical/long_term_care_premium_limit.yaml) counted as medical expenses

**Earned Income Tax Credit**

- The [maximum credit](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/credits/eitc/max.yaml) for each number of children, the [income where the phase-out begins](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/credits/eitc/phase_out/start.yaml), the [higher phase-out start for married couples](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/credits/eitc/phase_out/joint_bonus.yaml), and the [investment income limit](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/credits/eitc/phase_out/max_investment_income.yaml) of $12,600

**Alternative minimum tax**

- The [exemption](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/income/amt/exemption/amount.yaml), the [income where it begins to phase out](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/income/amt/exemption/phase_out/start.yaml), the [separate filers' phase-out limit](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/income/amt/exemption/separate_limit.yaml), the [exemption for children subject to the kiddie tax](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/income/amt/exemption/child/amount.yaml), and the [threshold for the 28% rate](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/income/amt/brackets.yaml)

**Other**

- The [gross income limit for a qualifying relative](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/income/exemption/amount.yaml), $5,500
- The [estate tax basic exclusion](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/credits/estate/base.yaml), $15,480,000

For the long-term care premium limit at ages 41 to 50, the revenue procedure prints $945. The statute rounds each amount to the nearest multiple of $10, and the other four age bands imply $940, so PolicyEngine uses $940.

Two state amounts follow the federal values and were updated with them: Arizona's standard deduction and Maine's additional standard deduction for the aged or blind.

Each item above links to its parameter file, which records the full history of values and their sources. The [parameter explorer](/us/model/rules/parameters) shows the same values, and the [PolicyEngine app](https://app.policyengine.org/us) lets you calculate a household's 2027 taxes or test a reform against the updated baseline.
