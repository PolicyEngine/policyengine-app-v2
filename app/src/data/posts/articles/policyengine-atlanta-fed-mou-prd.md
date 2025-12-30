PolicyEngine has signed a [memorandum of understanding](https://drive.google.com/file/d/1ye8BQo6gXVWl50F1ht6UzB9HsdrfpeOQ/view) with the [Federal Reserve Bank of Atlanta](https://www.atlantafed.org/) to integrate their [Policy Rules Database](https://www.atlantafed.org/economic-mobility-and-resilience/advancing-careers-for-low-income-families/policy-rules-database) into our validation infrastructure. This partnership marks another step in our mission to build a robust, multi-model validation ecosystem for tax and benefit microsimulation.

## Building on our NBER partnership

Earlier this year, we [partnered with NBER](policyengine-nber-mou-taxsim) to develop an open-source emulator of TAXSIM, the tax calculator that has powered academic research for nearly five decades. That collaboration is establishing a validation framework that compares estimates between PolicyEngine and TAXSIM using representative household samples from the Current Population Survey.

The Atlanta Fed partnership extends this framework to include a third major microsimulation approach. The Policy Rules Database covers over a dozen programs—including SNAP, Medicaid, housing vouchers, and child care subsidies—along with federal and state income taxes and credits like the EITC and Child Tax Credit. By integrating it, we're creating a system where researchers can compare calculations across three independently developed models, each with its own methodology and policy interpretations.

## The Policy Rules Database

The [Policy Rules Database](https://www.atlantafed.org/economic-mobility-and-resilience/advancing-careers-for-low-income-families/policy-rules-database) is a collaboration between the Federal Reserve Bank of Atlanta and the [National Center for Children in Poverty](https://www.nccp.org/), consolidating eligibility information into one system.

The database powers the Atlanta Fed's [CLIFF tools](https://www.atlantafed.org/economic-mobility-and-resilience/advancing-careers-for-low-income-families), which help users understand how benefits phase out as income rises. [Colorado's Workforce Development Council](https://cdle.colorado.gov/press-releases/press-release-new-tool-analyzes-interplay-of-employment-and-benefits-to-help-workers) uses these tools to help workforce center staff guide clients through career decisions, while the [New Mexico Caregivers Coalition](https://www.nmdcc.org/public-assistance-benefits-test/) uses them to help job-seekers and social workers understand how employment changes affect public assistance.

Alex Ruder, Assistant Vice President, and Jacob Walker, Senior Research Analyst, lead this work at the Atlanta Fed and will collaborate with us on the validation.

## A three-way validation approach

Multi-model validation provides significant benefits for the research community. When independently developed models agree on a calculation, researchers can have high confidence in the result. When they diverge, the differences reveal important questions about policy interpretation, implementation details, or modeling assumptions that warrant investigation.

Having three models in the comparison also helps isolate where differences originate. If two models agree and one differs, it narrows the scope of inquiry. This approach strengthens all participating models over time as teams collaborate to understand and resolve discrepancies.

## Technical integration

The integration will combine the PRD's R-based framework with PolicyEngine's Python-based system, allowing us to run comparisons across both platforms.

The MOU establishes protocols for both organizations to share updates and collaborate when discrepancies arise. Through our ongoing TAXSIM validation work, we've identified opportunities to improve how models encode complex policy rules. We expect similar benefits from incorporating the Policy Rules Database.

## Looking ahead

Tax and benefit microsimulation shapes research and policy decisions affecting millions of families. By validating across multiple independent models, we're working to ensure these tools provide the most accurate estimates possible. The Atlanta Fed partnership brings us closer to that goal, and we're grateful to Karen Leone de Nie, Vice President and Community Affairs Officer, for making this collaboration possible.

We'll share updates as the validation progresses. For questions about the project, reach out to us directly.
