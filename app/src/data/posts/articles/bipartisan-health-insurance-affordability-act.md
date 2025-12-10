A bipartisan group of members of Congress have introduced the [Bipartisan Health Insurance Affordability Act](https://punchbowl.news/wp-content/uploads/Bipartisan-Health-Insurance-Affordability-Act-Section-by-Section-copy.pdf) which would extend and modify Affordable Care Act premium tax credits. In this report, we use the PolicyEngine ACA microsimulation model to analyze how this bill would affect representative households compared to current law and a full IRA extension.

_Code for the figures can be found [here](https://github.com/PolicyEngine/analysis-notebooks/tree/main/us/blog_posts)._

## Background

The enhanced ACA premium tax credits enacted under the American Rescue Plan Act and extended by the Inflation Reduction Act are set to expire at the end of 2025. The Bipartisan Health Insurance Affordability Act proposes an alternative approach that extends eligibility to 700% of the Federal Poverty Line (FPL) with a modified contribution schedule.

**Table 1: Required contribution percentage schedule under the Bipartisan Health Insurance Affordability Act**

| Income Range (% FPL) | Initial Premium % | Final Premium % |
|---------------------|-------------------|-----------------|
| 200% up to 250%     | 2.0%              | 4.0%            |
| 250% up to 300%     | 4.0%              | 6.0%            |
| 300% up to 400%     | 6.0%              | 8.5%            |
| 400% up to 600%     | 8.5%              | 8.5%            |
| 600% up to 700%     | 8.5%              | 9.25%           |

We compare three scenarios:

1. **Baseline (2026 law)**: Current law after IRA enhancements expire, with eligibility ending at 400% FPL.
2. **700% FPL Extension**: The proposed bill extending eligibility to 700% FPL with the amended contribution schedule.
3. **IRA Extension**: Extending the current enhanced subsidies indefinitely, with an 8.5% cap and no income limit above 400% FPL.

## Example 1: Family of four in Tampa, Florida

Consider a family of four in Hillsborough County, Florida with two parents aged 40 and two children aged 10 and 8.

**Table 2: Premium tax credits for Florida household at select income levels**

| Income Level | Income | Baseline PTC | 700% FPL Extension PTC | IRA Extension PTC |
|--------------|--------|--------------|------------------------|-------------------|
| 300% FPL | $96,450 | $9,173 | $12,993 | $12,993 |
| 400% FPL | $128,600 | $0 | $7,849 | $7,849 |
| 600% FPL | $192,900 | $0 | $1,100 | $2,383 |
| 700% FPL | $225,050 | $0 | $0 | $1,200 |

Table 2a shows the full picture of health assistance programs available to this Florida family at different income levels. Florida did not expand Medicaid under the ACA, so parents only qualify for Medicaid up to approximately 32% FPL. Additionally, adults cannot receive ACA premium tax credits until their income reaches 100% FPL. This creates a coverage gap between 32% and 100% FPL where parents may have no affordable coverage option. At zero income, the parents qualify for Medicaid. At $12,000 (36% FPL), the parents are in this coverage gap—they've lost Medicaid eligibility but don't yet qualify for PTCs. Above 100% FPL, the family can access marketplace coverage with premium tax credits.

**Table 2a: Health programs for Florida household at select income levels**

| Income Level | Income | Medicaid | CHIP | PTC (Baseline) | PTC (700% FPL) | PTC (IRA) |
|--------------|--------|----------|------|----------------|----------------|-----------|
| 0% FPL | $0 | $12,091 | $0 | $0 | $0 | $0 |
| 36% FPL | $12,000 | $5,527 | $0 | $0 | $0 | $0 |
| 138% FPL | $45,446 | $0 | $0 | $10,589 | $12,240 | $12,240 |
| 300% FPL | $98,797 | $0 | $0 | $9,727 | $13,466 | $13,466 |
| 400% FPL | $131,729 | $0 | $0 | $0 | $8,370 | $8,370 |
| 600% FPL | $197,593 | $0 | $0 | $0 | $2,564 | $2,772 |
| 700% FPL | $230,525 | $0 | $0 | $0 | $0 | $0 |

Figure 1 shows the health programs available to this Florida family across income levels. Medicaid covers parents at very low incomes, while ACA premium tax credits become available above 100% FPL. The chart illustrates how the PTC reforms extend coverage to higher income levels.

**Figure 1: Health Programs by Income - Florida Family of 4**

![](/images/posts/bipartisan-aca-florida-programs.png)

Figure 2 shows the premium tax credit across income levels for the Florida household under each scenario. Under baseline, the PTC phases out completely at 400% FPL. Both the 700% FPL extension and IRA extension provide credits above this threshold, with the IRA extension providing slightly higher credits at income levels above 600% FPL.

**Figure 2: ACA Premium Tax Credit by Income - Florida Family of 4**

![](/images/posts/bipartisan-aca-florida-ptc.png)

Figure 3 shows the change in net income (including the value of health benefits) relative to baseline for each reform scenario. Both reforms increase net income for households above 300% FPL, with the largest gains occurring around 400% FPL where baseline eligibility ends.

**Figure 3: Impact on Net Income - Florida Family of 4**

![](/images/posts/bipartisan-aca-florida-delta.png)

Figure 4 shows the marginal tax rate (MTR) including health benefits across income levels. The baseline shows a spike at 400% FPL where PTC eligibility ends. Both reform scenarios smooth this cliff, though they create higher MTRs at higher income levels as credits phase out more gradually.

**Figure 4: Marginal Tax Rate - Florida Family of 4**

![](/images/posts/bipartisan-aca-florida-mtr.png)

## Example 2: Couple in San Benito County, California

Consider a couple in San Benito County, California—one person aged 64 and another aged 62. This household faces higher benchmark premiums due to age-based rating in ACA marketplaces.

**Table 3: Premium tax credits for California household at select income levels**

| Income Level | Income | Baseline PTC | 700% FPL Extension PTC | IRA Extension PTC |
|--------------|--------|--------------|------------------------|-------------------|
| 300% FPL | $64,994 | $36,242 | $38,634 | $38,702 |
| 400% FPL | $86,658 | $0 | $33,737 | $35,349 |
| 600% FPL | $129,987 | $0 | $26,000 | $30,500 |

Table 3a shows the health assistance programs available to this California couple. Since this is an adult-only household with no children, CHIP does not apply. California expanded Medicaid under the ACA, so adults may qualify for Medi-Cal at lower income levels. The higher benchmark premiums for this older couple (due to age-based rating in ACA marketplaces) result in substantially larger PTC amounts compared to the younger Florida family.

**Table 3a: Health programs for California household at select income levels**

| Income Level | Income | Medicaid | PTC (Baseline) | PTC (700% FPL) | PTC (IRA) |
|--------------|--------|----------|----------------|----------------|-----------|
| 138% FPL | $29,897 | $0 | $0 | $0 | $0 |
| 300% FPL | $64,994 | $0 | $36,242 | $38,702 | $38,702 |
| 400% FPL | $86,658 | $0 | $0 | $35,349 | $35,349 |
| 600% FPL | $129,987 | $0 | $0 | $31,530 | $31,666 |
| 700% FPL | $151,652 | $0 | $0 | $0 | $29,825 |

Figure 5 shows the health programs available to this California couple across income levels. California expanded Medicaid (Medi-Cal) under the ACA, providing coverage at lower incomes. The chart shows how ACA premium tax credits phase in above the Medicaid threshold and how the reforms extend PTC eligibility.

**Figure 5: Health Programs by Income - California Couple (ages 64 & 62)**

![](/images/posts/bipartisan-aca-california-programs.png)

Figure 6 shows the premium tax credit across income levels for the California household. The higher benchmark premiums for this older couple result in larger absolute PTC amounts compared to the Florida household.

**Figure 6: ACA Premium Tax Credit by Income - California Couple (ages 64 & 62)**

![](/images/posts/bipartisan-aca-california-ptc.png)

Figure 7 shows the change in net income relative to baseline for the California household. The older couple sees larger absolute gains from the reforms due to their higher benchmark premiums.

**Figure 7: Impact on Net Income - California Couple (ages 64 & 62)**

![](/images/posts/bipartisan-aca-california-delta.png)

Figure 8 shows the marginal tax rate including health benefits for the California household. Similar to the Florida example, baseline law creates a cliff at 400% FPL, while both reforms extend eligibility with more gradual phase-outs.

**Figure 8: Marginal Tax Rate - California Couple (ages 64 & 62)**

![](/images/posts/bipartisan-aca-california-mtr.png)

## Conclusion

The Bipartisan Health Insurance Affordability Act would extend premium tax credit eligibility from 400% FPL to 700% FPL while implementing a modified contribution schedule. Compared to current law after IRA expiration, households between 400% and 700% FPL would receive premium tax credits they would not otherwise receive. Compared to a full IRA extension, the bill provides similar benefits up to 400% FPL, with differences emerging at higher income levels due to the 9.25% contribution cap at 700% FPL versus the IRA's 8.5% cap with no upper limit.

You can model these reforms and explore how they would affect your household using [PolicyEngine's ACA Calculator](https://www.policyengine.org/us/aca-calc).
