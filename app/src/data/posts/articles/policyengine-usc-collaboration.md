![University of Southern California](/assets/posts/policyengine-usc-collaboration/usc-logo.png)

PolicyEngine is collaborating with [Matt Unrath](https://priceschool.usc.edu/faculty/directory/matthew-unrath/), an assistant professor at the University of Southern California, on a new project examining effective marginal and average tax rates facing American families.

Understanding how taxes and benefits interact is notoriously difficult. A family's effective tax rate depends not just on federal and state income taxes, but on how dozens of benefit programs phase in and out as income changes. These interactions can create surprisingly high marginal tax rates that discourage work and complicate financial planning for families.

## What we're contributing

For this project, we're providing our Python microsimulation package, which researchers will run over restricted-use microdata to calculate comprehensive tax and benefit outcomes for households across the country.

Our US model currently covers:

- Federal and state income taxes for tax years 2022-2024
- Nationwide benefit programs including SSI, WIC, and Pell Grants
- State-level program rules for SNAP, Medicaid, CHIP, ACA subsidies, and related programs across all 50 states

The model captures critical state-level policy choices—such as broad-based categorical eligibility and expense deductions—that substantially affect household eligibility, benefit amounts, and effective tax rates. We've also [worked closely with NBER staff](https://www.policyengine.org/us/research/policyengine-nber-mou-taxsim) to ensure our estimates align with TAXSIM for overlapping tax years.

As part of this collaboration, we are extending our model back to tax year 2018 for the relevant programs and adding comprehensive state-specific TANF rules across all 50 states.

## Why open source matters

Other tools exist for this type of analysis, including TRIM, the Fiscal Analyzer, and the Policy Rules Database. However, most are proprietary or not adaptable for independent research. We built PolicyEngine to be different: fully transparent, publicly accessible, and designed so researchers can verify every calculation.

The entire codebase is [available on GitHub](https://github.com/PolicyEngine), and anyone can use our [web calculator](https://policyengine.org/us) to explore how policies affect hypothetical households. Policy researchers at Georgetown University, Vanderbilt University, University of Hawaii, and the Niskanen Center have used PolicyEngine's Python package and web interface to study tax and benefit program structures.

We're proud to support rigorous research that helps policymakers understand how the safety net actually works for American families.
