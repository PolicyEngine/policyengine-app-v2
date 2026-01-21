Our co-founder and CTO Nikhil Woodruff has spent the past six months working with the data science team at 10 Downing Street to adapt and extend PolicyEngine's microsimulation technology for government use.

We're excited to share that PolicyEngine's microsimulation technology has been supporting policy analysis at 10 Downing Street—and now Nikhil has [written publicly about the work](https://fellows.ai.gov.uk/news/2025/01/06/innovation-fellow-develops-microsimulation-model-for-analysis-in-number-10/).

<div style="text-align: center; margin: 24px 0;"><a class="cta-button" href="https://fellows.ai.gov.uk/news/2025/01/06/innovation-fellow-develops-microsimulation-model-for-analysis-in-number-10/">Read Nikhil's article on gov.uk →</a></div>

Since summer 2025, Nikhil has been working as an [Innovation Fellow](https://www.gov.uk/government/publications/the-no10-innovation-fellowship-programme) with [10DS](https://no10innovationfellows.campaign.gov.uk/401-2/)—the data science team at No 10—adapting PolicyEngine's open-source microsimulation model for government use. The goal: give decision-makers faster access to analysis when the policy process moves too quickly for traditional approaches.

## Why PolicyEngine?

Government analysts chose PolicyEngine as the foundation for this work because of several distinctive features that set our model apart:

### Modern, accessible technology

PolicyEngine is built in Python—the language of choice for data scientists across government and academia. Unlike legacy microsimulation tools built on proprietary or niche technologies, our codebase can be understood, modified, and extended by the growing community of Python developers in the civil service.

### Novel calibration and imputation methods

Our microsimulation goes beyond traditional static models by applying [machine learning-based imputation](https://policyengine.org/uk/research/how-machine-learning-tools-make-policyengine-more-accurate) to fill gaps in survey data and calibration techniques to align our estimates with known administrative totals. This gives us accuracy that exceeds what conventional microsimulation methods can achieve.

### Comprehensive policy coverage

PolicyEngine UK models the full breadth of the UK tax and benefit system: [income tax, National Insurance, VAT, capital gains tax, council tax, stamp duty](https://policyengine.org/uk/research/uk-taxes-post), [Universal Credit, Child Benefit, State Pension, disability benefits](https://policyengine.org/uk/research/uk-benefits-post), and more. Recent additions include the [new surcharge on properties over £2 million](https://policyengine.org/uk/research/high-value-council-tax-surcharge), [private school VAT changes](https://policyengine.org/uk/research/vat-school-comparison), and the [latest Capital Gains Tax reforms](https://policyengine.org/uk/research/cgt-autumn-budget). This comprehensiveness means analysts can model realistic reform packages rather than isolated policy changes.

### Local area modelling

With [support from the Nuffield Foundation](https://policyengine.org/uk/research/uk-nuffield-grant), we've developed enhanced microdata that enables [geographic analysis down to local authority level](https://policyengine.org/uk/local-areas-dashboard). Nikhil's work at No 10 has leveraged this capability to provide estimates of how policies affect local area incomes—analysis that would be difficult or impossible with other tools.

## What this means

As Nikhil writes, the 10DS team built a package called 10ds-microsim on top of PolicyEngine that can rapidly estimate the impacts of policy reforms on living standards, local area incomes, and distributional outcomes. The tool was intensively validated against external projections and official forecasts before being put into use.

The results are used as supplementary, experimental analysis—clearly labelled as such—to provide decision-makers with information when they need it, even when there isn't time for the full analytical process. This doesn't replace the high-quality work of departmental analysts, but it expands the evidence base available during fast-moving policy discussions.

## Open source at the heart of government

This project demonstrates what open-source policy modelling can achieve. Because PolicyEngine's code is freely available, the 10DS team could adapt it to their specific needs, validate it against their internal benchmarks, and build infrastructure around it—all without the constraints of proprietary licensing or black-box models.

We believe government analysis should be built on transparent, reproducible foundations. Seeing PolicyEngine's technology contribute to decision-making at the centre of UK government is a validation of that vision.

You can read Nikhil's full article on the [No10 Innovation Fellows website](https://fellows.ai.gov.uk/news/2025/01/06/innovation-fellow-develops-microsimulation-model-for-analysis-in-number-10/), and as always, you can explore PolicyEngine's UK model at [policyengine.org/uk](https://policyengine.org/uk).
