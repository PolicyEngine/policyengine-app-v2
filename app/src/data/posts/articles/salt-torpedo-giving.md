The One Big Beautiful Bill Act (OBBBA) raised the SALT deduction cap from $10,000 to $40,000 for 2025 — but this higher cap phases out for high earners, creating a counterintuitive effect on charitable giving incentives: a person earning $700,000 pays **$1,928 more** for a $10,000 donation than someone earning $300,000.

## The SALT Torpedo

OBBBA's SALT cap isn't a simple $40,000 limit. It phases out rapidly for high-income filers:

| MAGI | SALT Cap |
|------|----------|
| Below $500k | $40,000 |
| $500k - $600k | Phases out at 30% per $10k excess |
| Above $600k | $10,000 (floor) |

<iframe src="https://policyengine.github.io/salt-torpedo-giving/salt_cap.html" width="100%" height="550" style="border:none;"></iframe>

This rapid phase-out creates what tax experts call the "SALT torpedo" — an artificially high marginal tax rate for filers in the $500k-$600k range.

## How It Affects Charitable Giving

The SALT cap phase-out fundamentally changes the calculus of charitable giving for high earners. The mechanism is subtle but powerful:

**For a $300,000 earner in New York:**
- SALT deduction: $17,603 (under the $40k cap)
- Standard deduction: $15,750
- Decision: **Itemizes** (SALT > Standard)
- A $10,000 donation adds the full $10,000 to their itemized deductions
- Tax savings: **$3,500** (35% marginal rate × $10,000)
- Net cost of donation: **$6,500**

**For a $700,000 earner in New York:**
- SALT deduction: $10,000 (cap phased down to floor)
- Standard deduction: $15,750
- Decision: **Standard** ($15,750 > $10k SALT)
- A $10,000 donation makes itemizing worthwhile ($10k SALT + $10k donation = $20k)
- But extra deduction is only $20k - $15,750 = **$4,250**
- Tax savings: **$1,572** (37% rate × $4,250)
- Net cost of donation: **$8,428**

<iframe src="https://policyengine.github.io/salt-torpedo-giving/net_cost.html" width="100%" height="550" style="border:none;"></iframe>

The $700,000 earner pays **$1,928 more** for the exact same donation — and gets a lower effective giving incentive rate despite being in a higher tax bracket.

## The Effective Giving Rate

This chart shows how the effective tax benefit of giving varies with income:

<iframe src="https://policyengine.github.io/salt-torpedo-giving/effective_rate.html" width="100%" height="550" style="border:none;"></iframe>

The giving incentive rate drops dramatically in the SALT torpedo zone ($500k-$600k income) because:

1. The SALT cap phases down, pushing these filers toward the standard deduction
2. When they donate, they switch to itemizing but lose the "free" standard deduction benefit
3. Their effective extra deduction from giving is reduced by the standard deduction they're giving up

## Tax Savings by Income

The total tax savings from a $10,000 donation shows a clear pattern:

<iframe src="https://policyengine.github.io/salt-torpedo-giving/giving_benefit.html" width="100%" height="550" style="border:none;"></iframe>

Tax savings peak around $500,000 income (just before the SALT cap phase-out kicks in) and then plateau at a lower level for higher earners who are stuck with the $10,000 SALT floor.

## Policy Implications

This analysis reveals an unintended consequence of the SALT cap design: it creates a "giving penalty" for high-income households in high-tax states who are pushed to the standard deduction.

Potential responses include:
- **Donation bunching:** Combining multiple years of donations into a single year to maximize the itemizing benefit
- **Donor-advised funds:** Contributing larger amounts in years when itemizing is beneficial
- **Above-the-line charitable deductions:** Policy proposals to allow charitable deductions without itemizing

## Methodology

This analysis uses [PolicyEngine US](https://policyengine.org/us) to model federal income taxes for a single filer in New York with employment income only and no other deductions. The SALT cap parameters reflect the One Big Beautiful Bill Act provisions for tax year 2025.

Interactive charts and source code are available at [github.com/PolicyEngine/salt-torpedo-giving](https://github.com/PolicyEngine/salt-torpedo-giving).
