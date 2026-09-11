On Tuesday, September 15, the Census Bureau publishes poverty rates for 2025. Our prediction for the Supplemental Poverty Measure is 13.2 percent of people, up from 13.0 percent in 2024. For children we predict 14.3 percent, up from 13.4; for people 65 and over, 14.6 percent, down from 15.1.

We wrote the numbers down before the release. The prediction file, its hash, and an OpenTimestamps proof are in the [spm-threshold-paper repository](https://github.com/PolicyEngine/spm-threshold-paper/blob/master/data/predictions/2025-spm-poverty-rates-2026-09-11.json). If it misses, it stays there.

## How the number is built

The prediction is the Census 2024 rate plus PolicyEngine's modeled change from 2024 to 2025. We do not publish the model's own level as the prediction, because the level differs from Census by construction: the model computes benefits from program rules instead of taking reported amounts, fits its population weights to administrative totals, and projects 2024 households forward rather than surveying 2025 ones. Poverty rates are never among the totals the weights are fitted to. That holdout is what makes the comparison on Tuesday informative.

| Group | Census 2024 | Modeled change, pp | Prediction 2025 |
| --- | ---: | ---: | ---: |
| All people | 13.0 | +0.22 | 13.2 |
| Under 18 | 13.4 | +0.86 | 14.3 |
| 65 and over | 15.1 | −0.52 | 14.6 |

The 2024 anchors are the corrected series Census published in August after BLS revised the thresholds. On the original series the anchors are 12.9, 13.4 and 15.0, and the predictions round to 13.1, 14.3 and 14.5.

The model in production until this week would have predicted a fall, to 12.5 percent. It aged the 2024 thresholds by 2.6 percent CPI-U inflation. The thresholds BLS published in August rose 4.4 to 6.3 percent, and the new [spm-calculator](/us/research/introducing-spm-calculator) uses them directly. Most of the difference between the two predictions is that threshold growth.

The modeled changes come from development runs on policyengine-core 3.30.1. A rerun on the exact runtime we are shipping is in progress as this posts; the prediction file commits us to adding a dated amendment, never an edit, if any group's change moves by 0.05 points or more.

## How PolicyEngine calculates SPM poverty

A person is in poverty when their SPM unit's resources are below its threshold. Three parts feed that comparison.

**Population.** The Microcosm US dataset holds 57,240 Current Population Survey households with 166,321 people. Their weights are fitted to 5,659 administrative targets: IRS income statistics by state and income level, Census population estimates by age and sex, Medicaid and Marketplace enrollment, SNAP participation and benefits, SSI, TANF, state tax collections and national accounts. 2025 values are the 2024 survey values carried forward by the model's uprating parameters for wages, prices and program rules, with household composition held at 2024.

**Thresholds.** spm-calculator supplies each unit's threshold from the published BLS 2025 national values and housing shares, the three-parameter equivalence scale, and a rent index for the unit's metro or nonmetro area. The 2025 rent indices are modeled, since Census had not published 2025 geography when the artifact was built.

**Resources.** Market income from the survey, plus benefits computed from statute for eligible units that the data marks as taking them up (Social Security, SSI, SNAP, WIC, school meals, TANF, unemployment compensation, energy assistance, and housing subsidies capped at the housing portion of the threshold), minus payroll, federal and state income taxes computed from statute, minus child support paid, medical out-of-pocket expenses and capped work and child care expenses.

The full description, with every variable named and linked, is in the [PolicyEngine US methodology documentation](https://github.com/PolicyEngine/policyengine-us/blob/main/docs-quarto/methodology/spm-poverty.qmd). It is maintained with the code.

## What the model does not do

- **Medicaid does not change non-premium medical spending.** The model computes Medicaid eligibility and enrollment, and it computes premiums from rules for Medicare, Marketplace coverage and CHIP (Medicaid expansion premium schedules are encoded for three states but are zero in the current baselines). Non-premium medical spending, which is most of MOOP, is a survey input uprated with CMS per-capita spending. Enrolling someone in Medicaid, or removing their coverage, leaves that spending unchanged, so coverage changes reach poverty only through the premium components.
- **Copays and employer premiums.** Neither is computed from rules; both stay as reported.
- **Levels.** The model's own 2025 level is 13.2 percent for all people, 16.6 for children and 10.9 for seniors. The child and senior levels sit far from Census, in opposite directions, which is why we report changes. Those gaps are open questions for us, not corrections to Census.
- **Local thresholds for 2025** are projections until Census publishes the geography.

## What Tuesday tells us

Census will publish the 2025 rate and a revised 2024 rate on the corrected thresholds. We will grade the prediction against the published change for each group, add the result to the [paper repository](https://github.com/PolicyEngine/spm-threshold-paper), and write up what the misses point to.
