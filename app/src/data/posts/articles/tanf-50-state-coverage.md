PolicyEngine now models Temporary Assistance for Needy Families (TANF) eligibility and benefit calculations for all 50 states and Washington, D.C. This completes our nationwide coverage of the federal block grant program that provides cash assistance to low-income families with children, with each state's specific rules encoded in our open-source rules engine.

## How we built it

Each state administers TANF under its own rules, setting benefit levels, income disregards, asset limits, and eligibility criteria independently. Encoding 51 distinct policy configurations required a systematic approach.

We used the multi-agent AI workflow we described in [this article](multi-agent-workflows-policy-research). Claude Code agents handled the repetitive components of the implementation: reading state policy manuals, structuring parameters, drafting variable logic, and generating test cases. Human reviewers validated each state's rules against official documentation and resolved cases where policy language was ambiguous or where program interactions required judgment.

This workflow allowed us to maintain consistent code quality and documentation standards across all 51 implementations while significantly reducing the time required for each additional state.

## What TANF covers

TANF is a federal block grant that gives states broad flexibility in designing cash assistance programs for families. Key policy dimensions that vary by state include:

- **Maximum benefit amounts** by household size
- **Earned income disregards** that determine how much employment income is excluded from benefit calculations
- **Asset limits** for eligibility
- **Income thresholds** for initial eligibility and ongoing receipt
- **Child age requirements** and school enrollment provisions

PolicyEngine's model captures these variations, enabling direct comparisons of how TANF operates across states and how proposed reforms would affect families differently depending on where they live.

## How to use it

The TANF models are available through multiple channels, each supporting both household-level calculations and population-wide microsimulation:

- **[Web app](https://policyengine.org).** Enter household details to calculate TANF eligibility and benefit amounts in any state, or use the population impact view to estimate the fiscal cost, poverty impact, and distributional effects of TANF reforms.
- **[Python package](https://github.com/PolicyEngine/policyengine-us).** Run household or microsimulation analyses programmatically, with full access to TANF variables and parameters for custom research.
- **[API](https://policyengine.org/api).** Integrate TANF calculations into external applications for benefits screening, policy design, or other tools.


## Looking ahead

With TANF coverage complete, PolicyEngine's US model now includes state-level rules for income taxes, SNAP, Medicaid, CHIP, ACA subsidies, and TANF across all 50 states and D.C. A full list of covered programs is available on our [model documentation page](https://policyengine.org/us/model). We are applying the same approach to encode the Child Care and Development Fund (CCDF), SSI State Supplements, and the Low Income Home Energy Assistance Program (LIHEAP) across all states. We also continue to validate our calculations against other microsimulation models through our partnerships with [NBER](policyengine-nber-mou-taxsim) and the [Federal Reserve Bank of Atlanta](policyengine-atlanta-fed-mou-prd).

For questions about using the TANF models or integrating them into your work, reach out to us directly or visit our [GitHub repository](https://github.com/PolicyEngine/policyengine-us).
