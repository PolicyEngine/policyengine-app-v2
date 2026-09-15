At 10 am ET on September 15, the Census Bureau published poverty rates for 2025. Our prediction, registered September 11, was that Supplemental Poverty Measure poverty would rise 0.2 points to 13.2 percent of people, rise 0.9 points to 14.3 percent for children, and fall 0.5 points to 14.6 percent for people 65 and over. Census reported 13.1 percent (up 0.1), 13.4 percent for children (down 0.1), and 15.4 percent for people 65 and over (up 0.2). The child prediction missed by a point. The results section at the end grades both this prediction and the prior model's.

We wrote the numbers down before the release. The prediction file, its hash, and an OpenTimestamps proof are in the [spm-threshold-paper repository](https://github.com/PolicyEngine/spm-threshold-paper/blob/master/data/predictions/2025-spm-poverty-rates-2026-09-11.json). If it misses, it stays there.

## How the number is built

The prediction is the Census 2024 rate plus PolicyEngine's modeled change from 2024 to 2025. We do not publish the model's own level as the prediction, because the level differs from Census by construction: the model computes benefits from program rules instead of taking reported amounts, fits its population weights to administrative totals, and projects 2024 households forward rather than surveying 2025 ones. Poverty rates are never among the totals the weights are fitted to. That holdout is what makes the comparison on Tuesday informative.

| Group | Census 2024 | Modeled change, pp | Prediction 2025 |
| --- | ---: | ---: | ---: |
| All people | 13.0 | +0.22 | 13.2 |
| Under 18 | 13.4 | +0.86 | 14.3 |
| 65 and over | 15.1 | −0.52 | 14.6 |

The 2024 anchors are the corrected series in Table 3 of Census's [August working paper](https://www.census.gov/library/working-papers/2026/demo/sehsd-wp2026-17.html), issued after BLS revised the thresholds. On the original series the anchors are 12.9, 13.4 and 15.0, and the predictions round to 13.1, 14.3 and 14.5.

The model serving policyengine.org today would have predicted a fall, to 12.5 percent. It ages the 2024 thresholds by 2.6 percent CPI-U inflation. The thresholds BLS published in August rose 4.4 to 6.3 percent, and the new [spm-calculator](/us/research/introducing-spm-calculator) uses them directly.

The modeled changes come from development runs on policyengine-core 3.30.1. A rerun before the release on the shipping runtime, policyengine-us 2.2.1 with the certified population release, reproduced the all-people and child changes to within 0.001 points. The prediction file commits us to a dated amendment, never an edit, if any group's change moves by 0.05 points or more.

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

## What Census published

*Poverty in the United States: 2025* (P60-290) reports SPM poverty of 13.1 percent for all people, up 0.1 point from 2024; 13.4 percent for children, down 0.1; and 15.4 percent for people 65 and over, up 0.2. In numbers, 44.4 million people and 9.7 million children were below the SPM threshold. The report re-bases 2024 to Vintage 2025 population controls, which puts its 2024 child rate at 13.5 percent rather than the 13.4 we anchored on; the changes below are the ones Census printed. By housing tenure, the renter rate rose 0.8 points to 24.0 percent, the rate for owners with a mortgage fell 0.2 to 6.0, and the rate for owners without a mortgage was unchanged at 11.9.

| Group | Census change, pp | Registered prediction | Miss | Prior model | Miss |
| --- | ---: | ---: | ---: | ---: | ---: |
| All people | +0.1 | +0.2 | +0.1 | −0.5 | −0.6 |
| Under 18 | −0.1 | +0.9 | +1.0 | −0.2 | −0.1 |
| 65 and over | +0.2 | −0.5 | −0.7 | −1.2 | −1.4 |

The registered prediction was closer than the prior model for all people and for people 65 and over. The prior model was closer for children, where the registered change missed by a full point. The public-use microdata says where the miss sits. Recomputing the 2025 SPM from the 2026 CPS ASEC file with the national thresholds held at their 2024 values plus CPI-U (2.6 percent), and everything else as published, gives 12.3 percent for all people, 12.3 for children, and 14.7 for people 65 and over. Against the 2024 rates that is a fall of 0.7 points overall, 1.2 for children, and 0.4 for seniors before threshold growth; the thresholds rising faster than prices then added 0.8, 1.1, and 0.7 points. The model's threshold effect for children, 1.1 points between the prior run and the new one, matches the data. Its resource-side change did not: the data show child poverty falling 1.2 points at constant real thresholds, and the model had 0.2. The grade goes into the [paper repository](https://github.com/PolicyEngine/spm-threshold-paper) as a dated record, and the child miss is the next thing to take apart.
