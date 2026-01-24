Survey data systematically underreport unemployment insurance (UI) benefits. The Current Population Survey captures only 58-65% of actual UI outlays. PolicyEngine corrects this underreporting using a methodology that differs from other approaches—and understanding these differences matters for interpreting results.

## Validation results

We compared PolicyEngine's 2025 UI estimates against administrative data from the Congressional Budget Office and Department of Labor:

![Unemployment Insurance: PolicyEngine vs External Data (2025)](/images/posts/validating-unemployment-insurance-estimates.png)

| Metric         | Raw CPS | External (CBO/DOL) | PolicyEngine |
| -------------- | ------- | ------------------ | ------------ |
| Total benefits | $25.6B  | $40.0B             | $39.1B       |
| Recipients     | 3.2M    | 5.4M               | 5.6M         |

PolicyEngine matches administrative totals within 2-4%, while raw CPS underreports by 35-42%.

## How we correct underreporting

PolicyEngine's approach differs from other microsimulation models in three key ways:

**1. Chained conditional imputation**

We use quantile regression forests (QRF) to impute UI from IRS Public Use File data onto CPS records. Rather than drawing from parametric distributions, QRF samples from the actual conditional distribution of UI given demographics and other income sources.

Critically, this is sequential: each variable conditions on all previously imputed ones. UI (imputed 38th in sequence) conditions on employment income, Social Security, pension income, and 34 other variables imputed earlier.

Why doesn't variable order matter? Because correlations are symmetric in the training data. If UI and employment income are correlated in the PUF, then P(UI | income) and P(income | UI) both capture the same relationship—QRF learns from the joint distribution regardless of which variable comes first. This is the foundation of chained equations imputation (MICE): with correctly specified conditionals, sequential imputation converges to the joint distribution.

**2. Reweighting to multiple targets**

After imputation, we optimize household weights to simultaneously match:

- IRS SOI Table 1.4: UI amounts and counts by AGI bracket (36 cells)
- CBO: Total program spending projections
- 2,800+ other calibration targets

This enables targeting both caseloads and benefit amounts simultaneously. Cell-based selection methods have one degree of freedom per cell (selection probability), which constrains benefit amounts to follow from who is selected.

**3. No parametric assumptions**

Other approaches assume UI follows a normal distribution within income strata. QRF learns the empirical shape from tax data: spike at zero, mass at typical amounts ($5k-$15k), thin tail at high values.

## Why methodology matters: an example

Consider two workers at the 40th income percentile ($48,000 AGI) who lose their jobs.

**Parametric approach** (normal distribution within percentile):

Drawing from Normal(μ=$9,200, σ=$4,800), about 2.3% of imputations exceed $18,800. A worker receiving this amount would see their AGI rise to $66,800—potentially crossing from the 12% to 22% federal tax bracket.

But actual UI rarely reaches $18,800. It requires ~30 weeks of benefits at near-maximum weekly amounts. The true probability is well below 2.3%.

The Fed stratifies by pre-UI income. Adding UI changes income rank: a worker at the 40th percentile ($48,000) who receives $18,800 UI now has $66,800—around the 52nd percentile. The imputed UI was drawn from the 40th percentile distribution.

**PolicyEngine's approach**:

QRF samples from the empirical UI distribution in tax data. High amounts are rare in the training data, so they remain rare in imputations.

This distinction extends beyond federal taxes. The Supplemental Poverty Measure (SPM) subtracts taxes from resources. If a model assigns higher UI amounts than actually occur, computed tax liabilities increase, SPM resources decrease, and SPM poverty rates rise. The Official Poverty Measure (pre-tax thresholds) does not incorporate taxes, so it is unaffected by this mechanism.

## Comparison to other models

| Model               | Method                           | Distribution            | Open source |
| ------------------- | -------------------------------- | ----------------------- | ----------- |
| **PolicyEngine**    | QRF + reweight to SOI            | Nonparametric (learned) | Yes         |
| **Federal Reserve** | Normal draw by percentile        | Normal(μ, σ)            | Yes (Stata) |
| **CBO**             | Probit → assign group averages   | Point estimates         | Partial     |
| **TRIM3**           | Rules + probabilistic enrollment | Deterministic           | No          |

The Federal Reserve's [2022 methodology](https://www.federalreserve.gov/econres/notes/feds-notes/unemployment-insurance-in-survey-and-administrative-data-20220705.html) explicitly optimizes for aggregate poverty rates, noting that "estimates of aggregate poverty rates are not sensitive to which individuals are randomly assigned" within income percentiles.

This holds for OPM (Official Poverty Measure), which uses pre-tax cash income thresholds. SPM (Supplemental Poverty Measure) subtracts taxes from resources. A normal distribution assigns ~2.3% of imputations above 2 standard deviations; if the empirical distribution has fewer high values, SPM resources will differ between the two approaches.

CBO's [working paper](https://www.cbo.gov/publication/54234) acknowledges their method "was designed with a degree of precision that is suited for estimating the distribution of income by quintiles—not by households."

## Limitations

PolicyEngine's approach has limitations:

1. **Training data**: The IRS PUF is from 2015, aged forward. Structural changes in UI (extended benefits, gig economy workers) may not be fully captured.

2. **State variation**: We don't yet calibrate to state-level UI totals, though the methodology supports this.

3. **Monthly timing**: Like other annual models, we work with annual totals rather than monthly benefit flows.

## Conclusion

Survey underreporting of unemployment insurance is well-documented. Correcting it requires choices about imputation methodology that affect downstream tax and poverty calculations. PolicyEngine uses nonparametric imputation (QRF) and reweights to match administrative totals within 2-4%.

The Enhanced CPS with these corrections is available through our [web app](https://policyengine.org), [Python package](https://github.com/PolicyEngine/policyengine-us), and [direct download](https://github.com/PolicyEngine/policyengine-us/releases).
