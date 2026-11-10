On November 5, 2026, the Internal Revenue Service (IRS) [released](https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2027-taxpayers-continue-to-benefit-from-the-working-families-tax-cuts) its annual inflation adjustments to almost 70 tax provisions for tax year 2027 in [Revenue Procedure 2026-35](https://www.irs.gov/pub/irs-drop/rp-26-35.pdf). These include the standard deduction, income tax bracket thresholds, and the Earned Income Tax Credit (EITC). PolicyEngine has updated its US model to reflect these changes.

## Overview

In the [Tax Cuts and Jobs Act of 2017](https://www.congress.gov/115/plaws/publ97/PLAW-115publ97.pdf#page=7) ([26 U.S.C. § 1(f)(3)](https://www.law.cornell.edu/uscode/text/26/1#f_3)), Congress began indexing federal income tax provisions to the Chained Consumer Price Index for All Urban Consumers (C-CPI-U). The Bureau of Labor Statistics published no C-CPI-U value for October 2025. Over the other 11 months of the year ending August 31, 2026, the C-CPI-U averaged 182.86, up 3.2% from 177.11 over the 12 months ending August 31, 2025.

For years the IRS has not yet published, PolicyEngine projects these amounts. For most, we grow the latest IRS amount by the C-CPI-U, using observed values and then the Congressional Budget Office's [inflation projections](https://www.cbo.gov/data/budget-economic-data#4). For a few, including the EITC phase-out thresholds and the AMT 28% bracket threshold, we use CBO's projections of the amounts themselves. Users can then calculate household net income and analyze policy proposals for years before the IRS publishes official values.

## How the IRS amounts compare with our projections

As it did for [tax year 2025](/us/research/federal-tax-inflation-adjustments-2025), the IRS raised most indexed amounts by more than we projected. Across the bracket, standard deduction, EITC, capital gains, and AMT amounts, the IRS's increases exceeded our projected increases by about 9% at the median. For example, we projected that the standard deduction for single filers would rise $450, from $16,100 in 2026 to $16,550 in 2027; the IRS set it at $16,600, a $500 increase. Table 1 shows the standard deduction for each filing status.

**Table 1: Standard deduction in tax year 2027**

| Filing status | 2026 | 2027 (PolicyEngine projection) | 2027 (IRS) | Projected increase | IRS increase |
|---|---|---|---|---|---|
| Single | $16,100 | $16,550 | $16,600 | $450 | $500 |
| Married filing jointly | $32,200 | $33,150 | $33,200 | $950 | $1,000 |
| Head of household | $24,150 | $24,850 | $24,925 | $700 | $775 |
| Married filing separately | $16,100 | $16,550 | $16,600 | $450 | $500 |

## Other indexed provisions

The IRS raised both indexed amounts of the Child Tax Credit (CTC) for 2027: the maximum refundable portion from $1,700 to $1,800, and the maximum credit from $2,200 to $2,300. Congress set the refundable portion at $1,400 per child in the [Tax Cuts and Jobs Act of 2017](https://www.congress.gov/115/plaws/publ97/PLAW-115publ97.pdf#page=21) (Public Law 115-97, section 11022) and indexed it for inflation. Congress raised the maximum credit to $2,200 in [H.R. 1, the One Big Beautiful Bill Act](https://www.congress.gov/119/plaws/publ21/PLAW-119publ21.pdf#page=90) (Public Law 119-21, section 70104) and indexed it for inflation after 2025. For both, the IRS rounds each increase down to a multiple of $100 ([26 U.S.C. § 24(i)(3)](https://www.law.cornell.edu/uscode/text/26/24#i_3)).

In addition to the standard deduction and the CTC, we updated the following provisions to their 2027 values:

- [Additional standard deduction for the aged or blind](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/deductions/standard/aged_or_blind/amount.yaml) ($1,700, or $2,100 for unmarried filers other than surviving spouses)
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

Arizona's Department of Revenue adjusts the state's standard deduction for inflation the same way the IRS adjusts the federal one, so we updated Arizona's 2027 amounts to match. From 2027, Maine sets its standard deduction equal to the federal one, subject to Maine's own phase-out.

You can browse these parameters in our [parameter explorer](/us/model/rules/parameters) and [compute your own policy reforms](https://app.policyengine.org/us) using the updated values.
