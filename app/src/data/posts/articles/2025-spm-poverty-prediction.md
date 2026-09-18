On September 11 we [registered a prediction](https://github.com/PolicyEngine/spm-threshold-paper/blob/master/data/predictions/2025-spm-poverty-rates-2026-09-11.json) of the 2025 Supplemental Poverty Measure (SPM) poverty rates that the Census Bureau would publish four days later: 13.2 percent of all people, up 0.2 points from 2024; 14.3 percent of children, up 0.9; and 14.6 percent of people 65 and over, down 0.5. Census [reported](https://www.census.gov/library/publications/2026/demo/p60-290.html) 13.1 percent, 13.4 percent and 15.4 percent: up 0.1, down 0.1 and up 0.2. The prediction came within 0.1 point for all people, and it missed by 0.9 points for children and 0.8 points for people 65 and over, in opposite directions.

The prediction file, its hash and an [OpenTimestamps](https://opentimestamps.org/) [proof](https://github.com/PolicyEngine/spm-threshold-paper/blob/master/data/predictions/2025-spm-poverty-rates-2026-09-11.json.ots) stay unchanged in the spm-threshold-paper repository. A [dated grade](https://github.com/PolicyEngine/spm-threshold-paper/blob/master/data/predictions/2025-spm-poverty-rates-2026-09-11.grade-2026-09-17.json) now sits beside them, and the [code](https://github.com/PolicyEngine/spm-threshold-paper/tree/master/analysis/prediction-grade-2025) behind everything below is in the same repository. A [companion post](/us/research/2025-spm-poverty-at-2024-thresholds) covers the release itself, including the rates by state and housing tenure.

![2025 SPM poverty: the prediction registered September 11 against the Census release](/assets/posts/2025-spm-poverty-prediction/prediction-chart.png)

## The grade

We committed to grading the prediction against the published change for each group. Census re-based its 2024 rates to new population controls in this release, which moved the 2024 child rate from 13.4 to 13.5 percent ([Table 4](https://www2.census.gov/programs-surveys/demo/tables/p60/290/table_4_spm_person.xlsx)), so the changes below use Census's own 2024 and 2025 figures, to two decimals from [Table 5](https://www2.census.gov/programs-surveys/demo/tables/p60/290/table_5_spm_program_effect_rates.xlsx).

| Group       | Census change | Registered change |  Miss | Prior model change |  Miss |
| ----------- | ------------: | ----------------: | ----: | -----------------: | ----: |
| All people  |         +0.07 |             +0.22 | +0.15 |              −0.53 | −0.60 |
| Under 18    |         −0.06 |             +0.86 | +0.92 |              −0.24 | −0.18 |
| 65 and over |         +0.24 |             −0.52 | −0.76 |              −1.24 | −1.48 |

Census marks none of the three changes as statistically different from zero at the 90 percent level. Table 4 puts the 90 percent margin of error on the 2025 rates at 0.3 points for all people, 0.6 for children and 0.5 for people 65 and over. The child and senior misses exceed those margins; the all-people miss sits inside its margin.

The prior-model columns come from policyengine-us 1.764.6, the model that served policyengine.org when we registered the prediction; the registered file records its changes and notes that it aged the 2024 thresholds by consumer price inflation. It came closer than the new model for children and further off for all people and for people 65 and over.

## Where the misses came from

Two things move a poverty rate between years: the thresholds, and the resources that families, or SPM units, have to compare with them. BLS raised the 2025 thresholds by 4.4 to 6.3 percent depending on housing tenure ([BLS](https://www.bls.gov/pir/spmhome.htm)), while the official poverty line rose 2.6 percent with consumer prices ([Table 10](https://www2.census.gov/programs-surveys/demo/tables/p60/290/table_10_opm_thresh.xlsx)). To separate the two, we ran 2025 a second time with the thresholds held at their 2024 values plus 2.6 percent. Threshold growth accounts for the gap between the two 2025 runs, and resource growth for the gap between the constant-threshold run and 2024. The companion post applies the same split to the [2026 CPS ASEC file](https://www2.census.gov/programs-surveys/cps/datasets/2026/march/asecpub26csv.zip), the survey behind the Census figures.

| Group       | Model: thresholds | Model: resources | Survey: thresholds | Survey: resources |
| ----------- | ----------------: | ---------------: | -----------------: | ----------------: |
| All people  |             +0.70 |            −0.49 |              +0.80 |             −0.73 |
| Under 18    |             +1.40 |            −0.54 |              +1.09 |             −1.15 |
| 65 and over |             +0.27 |            −0.79 |              +0.71 |             −0.47 |

For children the model erred the same way on both parts. Threshold growth pulled 1.40 points of children into poverty in the model against 1.09 in the survey, and resource growth lifted 0.54 points out against 1.15. For people 65 and over both errors ran the other way: thresholds added 0.27 points in the model against 0.71, and resources removed 0.79 against 0.47. For all people the two errors largely cancel.

The threshold columns measure how many people sit just above the line. The same rise in the thresholds catches more children in the model than in the survey, and fewer people 65 and over, so the model has more children and fewer seniors with resources near the threshold than the survey does. Its poverty levels say the same: 16.6 percent of children and 10.9 percent of people 65 and over in 2025, against Census's 13.4 and 15.4.

The resource columns measure what changed in families' resources at a fixed real line. Among people whose 2024 resources fell between 75 and 150 percent of their threshold, the model raised the median SPM unit's resources by 4.6 percent into 2025: 3.7 percent for children and 7.7 percent for people 65 and over ([results](https://github.com/PolicyEngine/spm-threshold-paper/blob/master/analysis/prediction-grade-2025/results/near_line_growth.json)). In the [2025 CPS ASEC file](https://www2.census.gov/programs-surveys/cps/datasets/2025/march/asecpub25csv.zip), which covers calendar 2024, one common growth rate applied to every unit's resources reproduces Census's 2025 figure at 4.9 percent for all people, 5.5 percent for children and 4.1 percent for people 65 and over ([results](https://github.com/PolicyEngine/spm-threshold-paper/blob/master/analysis/prediction-grade-2025/results/raw_aging.json)). The two are different statistics, a median for the same units and a common rate for a cross-section, so they show the direction of the gap by age group and not its size. The model gave children less resource growth than seniors; the survey's figures imply the reverse.

The new $6,000 [deduction for people 65 and over](https://www.irs.gov/newsroom/check-your-eligibility-for-the-new-enhanced-deduction-for-seniors) explains little of the modeled fall among seniors. Rerunning 2025 with the deduction [set to zero](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/parameters/gov/irs/deductions/senior_deduction/amount.yaml) raises the modeled poverty rate for people 65 and over by 0.012 points, about 7,700 people ([results](https://github.com/PolicyEngine/spm-threshold-paper/blob/master/analysis/prediction-grade-2025/results/senior_deduction.json)). The deduction cuts income tax for 44 percent of people 65 and over in the model, and for 8 percent of those with resources below 125 percent of their threshold.

A simpler forecast would have done better this year. Taking the 2025 CPS ASEC file, moving its thresholds to the 2025 BLS values and growing every unit's resources by the model's overall 4.6 percent gives 13.2, 13.7 and 15.2 percent: misses of 0.1, 0.3 and −0.1 points. We ran this check after the release, and the growth rate comes from the model, so it is a diagnostic rather than a second forecast. Survey-reported taxes and benefits also cannot respond to a change in law; the model computes them from the rules so that they can. The error sits in the model's population near the line and in how its resources grow from 2024 to 2025.

## How the number was built

The prediction is the Census 2024 rate plus PolicyEngine's modeled change from 2024 to 2025. We do not publish the model's own level as the prediction, because the level differs from Census by construction: the model computes benefits from program rules instead of taking reported amounts, fits its population weights to administrative totals, and projects 2024 households forward rather than surveying 2025 ones. None of the [5,659 calibration targets](https://huggingface.co/datasets/policyengine/populace-us/blob/populace-us-2024-spm-20260909/releases/populace-us-2024-buildp-sparse-rmloss100-cae8640-20260728T011454Z/calibration_diagnostics.json) is a poverty rate, so the Census release tests the model on a quantity it was never fitted to.

| Group       | Census 2024 | Modeled change, pp | Prediction 2025 |
| ----------- | ----------: | -----------------: | --------------: |
| All people  |        13.0 |              +0.22 |            13.2 |
| Under 18    |        13.4 |              +0.86 |            14.3 |
| 65 and over |        15.1 |              −0.52 |            14.6 |

The 2024 anchors are the corrected series in Census's [August working paper](https://www.census.gov/library/working-papers/2026/demo/sehsd-wp2026-17.html), issued after BLS revised the thresholds. On the original series the anchors are 12.9, 13.4 and 15.0, and the predictions round to 13.1, 14.3 and 14.5.

The modeled changes come from development runs on policyengine-core 3.30.1. A rerun on the released packages (policyengine-us 2.2.1, policyengine-core 3.32.5 and spm-calculator 1.0.0, the versions [policyengine 6.0.0](https://pypi.org/project/policyengine/6.0.0/) pins) reproduced all three changes to within 0.000001 points, so the amendment rule in the registered file, a dated amendment if any change moved by 0.05 points or more, did not trigger.

## How PolicyEngine calculates SPM poverty

A person is in poverty when their SPM unit's resources fall below its threshold. Three parts feed that comparison.

**Population.** The [Microcosm US dataset](https://huggingface.co/datasets/policyengine/populace-us/tree/populace-us-2024-spm-20260909) holds 57,240 Current Population Survey households with 166,321 people. Their weights are fitted to 5,659 administrative targets: IRS income statistics by state and income level, Census population estimates by age and sex, Medicaid and Marketplace enrollment, SNAP participation and benefits, SSI, TANF, state tax collections and national accounts, among others. The model carries the 2024 survey values to 2025 with [uprating parameters](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/tools/default_uprating.py): an IRS-based earnings index for wages, CMS per-capita spending for medical expenses, and Census population totals for the weights. Household composition stays as surveyed in 2024.

**Thresholds.** [spm-calculator](https://github.com/PolicyEngine/spm-calculator) supplies each unit's threshold from the published BLS 2025 national values and housing shares, the three-parameter equivalence scale, and a rent index for the unit's metro or nonmetro area. The 2025 rent indices were projections when we ran the model; Census published the 2025 geographic adjustments with the survey file in September.

**Resources.** Market income, Social Security, unemployment compensation, workers' compensation and child support received come from the survey record. The model computes SSI, SNAP, WIC, school meals, TANF and housing subsidies from [program rules](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/variables/household/income/spm_unit/spm_unit_benefits.py), for eligible units that the dataset marks as taking them up, and caps the housing subsidy at the [housing portion of the threshold less the tenant's payment](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/variables/household/income/spm_unit/spm_unit_capped_housing_subsidy.py). It computes payroll, federal and state income taxes from statute, then subtracts child support paid, medical out-of-pocket expenses, and work and child care expenses capped by earnings ([spm_unit_net_income](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/variables/household/income/spm_unit/spm_unit_net_income.py)).

The full description, with every variable named and linked, is in the [PolicyEngine US methodology documentation](https://github.com/PolicyEngine/policyengine-us/blob/main/docs-quarto/methodology/spm-poverty.qmd).

## What the model does not do

- **Medicaid does not change non-premium medical spending.** The model computes Medicaid eligibility and enrollment, and it computes premiums from rules for Medicare, Marketplace coverage and CHIP. Non-premium medical spending is a survey input [uprated with CMS per-capita spending](https://github.com/PolicyEngine/policyengine-us/blob/main/policyengine_us/variables/household/expense/health/other_medical_expenses.py). Enrolling someone in Medicaid, or removing their coverage, leaves that spending unchanged, so coverage changes reach poverty only through the premium components.
- **Other premiums stay as reported**, including the employee share of employer plans.
- **Levels.** The model's own 2025 level is 13.2 percent for all people, 16.6 for children and 10.9 for people 65 and over. The child and senior levels sit far from Census in opposite directions, so we report changes. We treat those gaps as open questions.
- **Local thresholds for 2025** were projections at the time of the prediction.

## Replication

The grade record, the population runs, the constant-threshold rerun, the senior-deduction counterfactual and the raw-survey aging check are in [`analysis/prediction-grade-2025`](https://github.com/PolicyEngine/spm-threshold-paper/tree/master/analysis/prediction-grade-2025) of the spm-threshold-paper repository, with a README that lists the commands. The runs use policyengine 6.0.0 and the Microcosm US population release [populace-us-2024-spm-20260909](https://huggingface.co/datasets/policyengine/populace-us/tree/populace-us-2024-spm-20260909).
