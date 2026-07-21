## Introduction

In March 2023, Chancellor Jeremy Hunt [announced](https://assets.publishing.service.gov.uk/media/66221ba8252f0d71cf757d2b/Spring_budget_2023_childcare_expansion_costing_note_information.pdf) an extension of funded childcare hours in England, extending the 30-hours free childcare (the extended childcare entitlement) to children between nine months and four years old (previously, the lower age limit was three years). In this report, we use PolicyEngine to model the fiscal and household impacts of this reform.

## Current policy

Under the previous policy, free childcare hours were available to the following groups:

- All three and four-year-olds were entitled to 15 hours of free childcare per week (the universal entitlement)
- Three and four-year-olds in families where all parents earn the equivalent of 16 hours at the National Minimum Wage were entitled to an additional 15 hours (the extended entitlement)
- Two-year-olds from households claiming specific benefits were eligible for 15 hours of free childcare (the targeted entitlement)

The free entitlement applied for 38 weeks per year (during term time). Parents can choose to spread their hours over more weeks, which reduces the weekly entitlement proportionally. The eligibility threshold for the additional 15 hours includes an income cap, with households where any parent earns over £100,000 not qualifying.

This policy includes several parameters in the PolicyEngine model, including:

- Age thresholds for entitlement (currently set at 1 year for certain provisions)
- Hour allocations for different age brackets
- Income eligibility criteria

## Reform

The reform extended the extended childcare entitlement in three phases:

- **April 2024**: The age eligibility condition is reduced from 3-4 years to 2-4 years. Children aged 2-3 years are entitled to 15 hours of free childcare per week rather than 30 hours.
- **September 2024**: This two-year old age limit is lowered to 9 months. Children aged 9 months to 3 years are entitled to 15 hours of free childcare per week.
- **September 2025**: Children aged 9 months to 4 years are entitled to 30 hours of free childcare per week.

The eligibility criteria for "working parents" remains the same as the current 30-hour offer for three and four-year-olds: parents must earn the equivalent of 16 hours at the National Minimum Wage, and no parent can earn more than £100,000.

Our PolicyEngine model implements this reform by:

1. Reducing the age threshold for childcare entitlement from 1 year to 9 months (0.75 years)
2. Increasing the funded hours for different age groups according to the implementation timeline
3. Maintaining the same income eligibility criteria

## Household impacts

Different household compositions experience varying impacts from the childcare extension. Here are examples based on our model:

**Single parent, one child aged 1, earning £25,000 per year**

- Pre-reform: No entitlement to free childcare
- Post-reform (full implementation): 30 hours free childcare weekly

**Couple, two children aged 10 months and 2 years, combined income of £60,000**

- Pre-reform: No entitlement to free childcare
- Post-reform (full implementation): 30 hours free childcare weekly for both children

The reform affects households differently based on family composition, income levels, and childcare usage patterns. Families with incomes over £100,000 are not eligible for the extended entitlement.

## Economic impacts

Our analysis shows that the childcare hours extension will reduce government revenue by the following amounts:

| Revenue impact (£bn) | 2024/25 | 2025/26 | 2026/27 | 2027/28 | 2028/29 | 2029/30 |
| :-------------------- | ------: | ------: | ------: | ------: | ------: | ------: |
| PolicyEngine           |    -1.3 |    -3.9 |    -4.3 |    -4.4 |    -4.6 |    -4.7 |
| HM Treasury            |    -1.7 |    -3.3 |    -4.1 |    -4.1 |       - |       - |

## Conclusion

We estimate that the UK's extended childcare entitlement will reduce government revenue by £4.7 billion in 2029/30, and will increase the net income of households with children who meet the eligibility criteria. The greatest income changes accrue to families with multiple young children who use the full entitlement.

Use PolicyEngine to view the full results or calculate the effect on your household.
