Survey data systematically underreport unemployment insurance (UI) benefits. The Current Population Survey captures only [58-65% of actual UI outlays](https://www.federalreserve.gov/econres/notes/feds-notes/unemployment-insurance-in-survey-and-administrative-data-20220705.html). PolicyEngine corrects this underreporting using a methodology that differs from other approaches—and understanding these differences matters for interpreting results.

## Validation results

We compared PolicyEngine's 2024 UI estimates against administrative data from the [Congressional Budget Office](https://www.cbo.gov/data/budget-economic-data) and [Department of Labor](https://oui.doleta.gov/unemploy/claimssum.asp):

<iframe src="https://policyengine.github.io/blog-charts/validating-unemployment-insurance-estimates/" width="100%" height="500" frameborder="0"></iframe>

Raw CPS captures 59-64% of administrative totals. PolicyEngine matches within 2-4%. Hover over bars for absolute values.

## PolicyEngine's approach

PolicyEngine corrects UI underreporting in two steps:

### 1. Chained conditional imputation

We use quantile regression forests (QRF) to impute UI from [IRS Public Use File](https://www.irs.gov/statistics/soi-tax-stats-individual-public-use-microdata-files) data onto CPS records. QRF samples from the empirical conditional distribution of UI given demographics and other income sources—no parametric assumptions about the shape.

This is sequential: each variable conditions on all previously imputed ones. UI (imputed 38th in sequence) conditions on employment income, Social Security, pension income, and 34 other variables imputed earlier.

Why doesn't variable order matter? Correlations are symmetric in the training data. If UI and employment income are correlated in the PUF, then P(UI | income) and P(income | UI) both capture the same relationship. This is the foundation of [chained equations imputation (MICE)](https://stefvanbuuren.name/fimd/sec-FCS.html): with correctly specified conditionals, sequential imputation converges to the joint distribution.

### 2. Reweighting to multiple targets

After imputation, we optimize household weights to simultaneously match:

- [IRS SOI Table 1.4](https://www.irs.gov/statistics/soi-tax-stats-individual-income-tax-returns-publication-1304-complete-report): UI amounts and counts by AGI bracket (36 cells)
- [CBO program spending projections](https://www.cbo.gov/data/budget-economic-data)
- 2,800+ other calibration targets

This enables targeting both caseloads and benefit amounts simultaneously. Cell-based selection methods have one degree of freedom per cell (selection probability), which constrains benefit amounts to follow from who is selected.

## Other approaches

### Federal Reserve / Joint Committee on Taxation

A [2022 FEDS Notes paper](https://www.federalreserve.gov/econres/notes/feds-notes/unemployment-insurance-in-survey-and-administrative-data-20220705.html) by Fed and JCT researchers documented an imputation methodology ([Stata code](https://davidsplinter.com/CPS-UI-Imputation.txt)). This was a one-off research paper, not part of regular Fed publications:

1. Stratify CPS respondents into 100 income percentiles
2. Calculate mean and standard deviation of UI within each percentile from IRS 1099-G data
3. For non-reporters, draw UI amounts from Normal(μ, σ) for their percentile
4. Select non-reporters randomly until **benefit totals** match administrative targets

The method targets aggregate benefits, not recipient counts—the number of recipients is an outcome, not a constraint.

### CBO

[CBO Working Paper 2018-07](https://www.cbo.gov/publication/54234) ([GitHub code](https://github.com/US-CBO/means_tested_transfer_imputations)):

1. Estimate probability of UI receipt via probit regression on demographics and income
2. Assign each non-reporter a random number; if probability > random, they receive UI
3. Assign average benefit amount for their demographic/income group
4. Iterate until totals match administrative data

CBO notes their method "was designed with a degree of precision that is suited for estimating the distribution of income by quintiles—not by households."

### TRIM3 (Urban Institute)

[TRIM3](https://trim3.urban.org/) is a comprehensive microsimulation model. [Documentation](https://boreas.urban.org/T3Technical.php) describes detailed rules-based eligibility simulation for SNAP, TANF, and Medicaid, but provides less detail on UI methodology. What is documented:

1. Takes survey-reported UI from CPS
2. Allocates amounts across months within state-level constraints (max weeks, min/max weekly amounts)
3. Corrects for underreporting to match [DOL administrative totals](https://oui.doleta.gov/unemploy/claimssum.asp)

TRIM3 does not document how it selects which non-reporters to assign UI or how it determines benefit amounts for them. TRIM3 code is not publicly available.

### St. Louis Fed (Birinci & See)

[Birinci and See (2023)](https://www.aeaweb.org/articles?id=10.1257/mac.20200057) take a different approach, using a heterogeneous-agent job search model to study how UI policy changes affect different groups ([replication code](https://www.openicpsr.org/openicpsr/project/170261/version/V1/view)). Rather than correcting survey underreporting, they focus on behavioral responses:

1. Use SIPP, PSID, and CPS data to characterize wealth and income differences between UI recipients and non-recipients
2. Build a structural model that matches these empirical distributions
3. Simulate how different wealth groups respond to UI policy changes

Their key finding: labor market responses to UI are **non-monotonic in wealth**. The poorest unemployed show weak responses because they highly value employment and cannot afford to be selective about job offers.

## Summary

| Model               | Method                         | Distribution            | Open source                                                          |
| ------------------- | ------------------------------ | ----------------------- | -------------------------------------------------------------------- |
| **PolicyEngine**    | QRF + reweight to SOI          | Nonparametric (learned) | [Yes](https://github.com/PolicyEngine/policyengine-us-data)          |
| **Fed/JCT**         | Normal draw by percentile      | Normal(μ, σ)            | [Yes (Stata)](https://davidsplinter.com/CPS-UI-Imputation.txt)       |
| **CBO**             | Probit → assign group averages | Point estimates         | [Partial](https://github.com/US-CBO/means_tested_transfer_imputations) |
| **TRIM3**           | Adjust reported amounts        | Deterministic           | No                                                                   |
| **St. Louis Fed**   | Heterogeneous-agent model      | Structural simulation   | [Yes](https://www.openicpsr.org/openicpsr/project/170261/version/V1/view) |

## Why methodology matters

Consider two workers at the 40th income percentile ($48,000 AGI) who lose their jobs.

**Parametric approach** (normal distribution within percentile):

Drawing from Normal(μ=$9,200, σ=$4,800), about 2.3% of imputations exceed $18,800. A worker receiving this amount would see their AGI rise to $66,800—potentially crossing from the 12% to 22% federal tax bracket.

But actual UI rarely reaches $18,800. It requires ~30 weeks of benefits at near-maximum weekly amounts. The true probability is well below 2.3%.

The Fed stratifies by pre-UI income. Adding UI changes income rank: a worker at the 40th percentile ($48,000) who receives $18,800 UI now has $66,800—around the 52nd percentile. The imputed UI was drawn from the 40th percentile distribution.

**Nonparametric approach**:

QRF samples from the empirical UI distribution in tax data. High amounts are rare in the training data, so they remain rare in imputations.

This distinction extends beyond federal taxes. The Supplemental Poverty Measure (SPM) subtracts taxes from resources. If a model assigns higher UI amounts than actually occur, computed tax liabilities increase, SPM resources decrease, and SPM poverty rates rise. The Official Poverty Measure (pre-tax thresholds) does not incorporate taxes, so it is unaffected by this mechanism.

**Heterogeneity in behavioral responses**:

[Birinci and See (2023)](https://www.aeaweb.org/articles?id=10.1257/mac.20200057) provide additional evidence for why capturing heterogeneity matters. They find that labor market responses to UI changes are non-monotonic in wealth: the poorest unemployed workers show weak responses because they cannot afford to be selective about job offers, while middle-wealth workers are more responsive.

This has two implications for imputation methodology:

1. **Composition matters for policy analysis**: If a model misallocates UI benefits across wealth groups, downstream policy simulations will produce biased behavioral predictions. PolicyEngine's QRF conditions on 37+ variables including income and asset-related measures, preserving the empirical joint distribution.

2. **Simple stratification is insufficient**: Stratifying only by income percentile (as in the Fed/JCT approach) misses wealth variation within income groups. Two workers at the same income percentile may have very different wealth levels and thus different UI receipt probabilities and behavioral responses.

## Limitations

1. **Training data**: The IRS PUF is from 2015, aged forward. Structural changes in UI (extended benefits, gig economy workers) may not be fully captured.

2. **State variation**: We don't yet calibrate to state-level UI totals, though the methodology supports this.

3. **Monthly timing**: Like other annual models, we work with annual totals rather than monthly benefit flows.

## Conclusion

Survey underreporting of unemployment insurance is well-documented. Correcting it requires choices about imputation methodology that affect downstream tax and poverty calculations. PolicyEngine uses nonparametric imputation (QRF) and reweights to match administrative totals within 2-4%.

The Enhanced CPS with these corrections is available through our [web app](https://policyengine.org) and [Python package](https://github.com/PolicyEngine/policyengine-us-data).
