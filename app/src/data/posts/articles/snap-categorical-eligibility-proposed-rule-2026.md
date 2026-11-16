On November 10, 2026, the U.S. Department of Agriculture (USDA) published a proposed rule, "Supplemental Nutrition Assistance Program: Reforming Categorical Eligibility" (91 FR 72454). The rule would end broad-based categorical eligibility (BBCE), the policy through which 46 state agencies extend the Supplemental Nutrition Assistance Program (SNAP) to households that qualify for a non-cash benefit funded by Temporary Assistance for Needy Families (TANF). Without BBCE, most SNAP households would again face the federal gross income limit of 130% of the federal poverty guidelines (FPG), the 100% net income limit, and the federal asset limit. USDA accepts comments through December 10, 2026.

PolicyEngine estimates that in 2029, the first year USDA expects the rule to apply to the full caseload, it would:

- Reduce SNAP benefits by $16 billion to $29 billion
- End SNAP for 3.5 million to 8.6 million SNAP households in an average month
- Raise the Supplemental Poverty Measure (SPM) poverty rate by 0.3 to 0.6 percentage points and the child SPM poverty rate by 0.7 to 1.4 percentage points

The range reflects how many current SNAP households have income or assets above the federal limits. The lower figures reweight PolicyEngine's SNAP caseload to match the shares above those limits in USDA's quality control data: 5.4% above an income limit and 11.5% above only the asset limit. The upper figures use the caseload as calibrated in our data, where the shares are 21% and 19%. USDA's Regulatory Impact Analysis (RIA) estimates a $14.3 billion reduction in federal and state SNAP benefits and 3.2 million households losing SNAP in fiscal year 2029, 9% below the lower end of our range. The [comparison section](#comparison-with-usdas-estimates) breaks down the difference.

## The proposed rule

Section 5(a) of the Food and Nutrition Act makes households in which every member receives TANF-funded benefits categorically eligible for SNAP. Categorical eligibility deems a household to meet SNAP's income and asset limits; benefits still follow the regular SNAP formula. Current regulations at 7 CFR 273.2(j)(2) let three groups of TANF benefits confer categorical eligibility:

| Provision | Current rule | Proposed rule |
|---|---|---|
| 273.2(j)(2)(i)(A) | All members receive or are authorized to receive TANF or MOE-funded **cash** | All members **receive** TANF or MOE-funded **assistance** as defined at 45 CFR 260.31(a) |
| 273.2(j)(2)(i)(B)-(C) | All members receive non-cash or in-kind services from a program more than 50% funded by TANF or MOE (purposes 3 and 4 require a 200% FPG gross income limit) | Removed |
| 273.2(j)(2)(ii) | State option for non-cash services from programs less than 50% funded by TANF or MOE | Removed |
| 273.2(j)(2)(iii) | One member's non-cash benefit can confer eligibility on the whole household | Removed |
| 273.2(j)(2)(i)(D)-(E) | All members receive SSI, or all receive TANF and/or SSI | Kept, renumbered (B)-(C); "authorized to receive" removed |
| 273.2(j)(2)(ix) | Ineligible non-citizens, ineligible students, members ineligible under the 7 CFR 273.7 work rules, and certain others are not counted as household members | Unchanged |

States use the non-cash routes for BBCE: a household qualifies by receiving a brochure, a hotline number, or a referral funded with TANF money. According to the preamble, 46 states used BBCE as of December 2025; 41 of them set no asset limit, and 37 set gross income limits above SNAP's 130% limit, up to 200% of FPG.

Under 45 CFR 260.31(a), TANF "assistance" covers cash, payments, vouchers and other benefits meant to meet ongoing basic needs, and some supportive services such as child care and transportation for families that are not employed. The preamble states that "for all practical purposes" TANF assistance recipients receive cash. Some news coverage has summarized the rule as requiring every member to receive TANF cash. The rule text says TANF "assistance", a slightly broader category, but the two readings produce the same model results because PolicyEngine does not model TANF-funded supportive services separately from cash TANF.

The rule keeps the "all members" requirement. A household qualifies only if every member receives TANF assistance or SSI. Members excluded under 273.2(j)(2)(ix), such as ineligible non-citizens and ineligible students, do not count against the test. A household that includes another adult who receives neither benefit, such as a grandparent outside the TANF case, would need to pass the regular SNAP income and asset tests.

USDA's RIA assumes the rule takes effect on October 1, 2027, the start of fiscal year 2028. States would apply it at each household's next certification or recertification, so the rule would reach the full caseload in fiscal year 2029.

## How we model the rule

PolicyEngine models BBCE through a TANF non-cash eligibility test that applies each state's gross income limit, net income test and asset limit. When a household passes that test, it qualifies for SNAP regardless of the federal limits. We modeled two versions of the rule:

- **Removing BBCE**: we drop the non-cash TANF test from SNAP's categorical eligibility list. Households then qualify categorically only if every member receives SSI, or the household receives TANF cash.
- **Cash TANF for every member**: we also require every member who counts toward the SNAP household to receive TANF cash or SSI. PolicyEngine computes TANF for the whole SPM unit, so we treat a member as a TANF recipient when the unit receives TANF and the member belongs to a tax unit with a child under 18.

The two versions differ by $89 million in SNAP benefits, 0.3% of the total effect. With BBCE in place, applying the all-members test alone changes SNAP by $1 million. We report the first version below.

Households that lose categorical eligibility face the federal income and asset tests. The gross income limit is 130% of FPG, with an exception for households with an elderly or disabled member; the net income limit is 100% of FPG. Our 2029 estimates hold asset limits at their fiscal year 2027 values, $3,000, or $4,750 for households with an elderly or disabled member, as modeled in PolicyEngine US 2.137.9. USDA adjusts these limits for inflation each year; the estimates omit adjustments after fiscal year 2027. PolicyEngine counts bank accounts, stocks and bonds as SNAP assets.

We model calendar year 2029 to match the RIA's first full-effect year. The estimates are static: they assume no change in behavior, such as households spending down savings to stay under the asset limit.

## Household impacts

### Example 1: earnings above 130% of FPG

Consider a single parent with children aged 5 and 3 in Philadelphia, paying $1,500 a month in rent with utilities included and no savings. Pennsylvania's BBCE program sets a gross income limit of 200% of FPG and no asset limit.

```chart
{
  "type": "line",
  "title": "Figure 1: SNAP for a single parent of two in Philadelphia by earnings, 2029",
  "subtitle": "Annual SNAP benefit for a single parent with children aged 5 and 3, $1,500 monthly rent and no savings",
  "xKey": "earnings",
  "xLabel": "Annual earnings",
  "yLabel": "Annual SNAP benefit",
  "series": [
    {
      "key": "current",
      "name": "Current rules",
      "color": "quinary",
      "step": true
    },
    {
      "key": "proposed",
      "name": "Proposed rule",
      "color": "primary",
      "step": true
    }
  ],
  "data": [
    {
      "earnings": 0,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 500,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 1000,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 1500,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 2000,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 2500,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 3000,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 3500,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 4000,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 4500,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 5000,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 5500,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 6000,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 6500,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 7000,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 7500,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 8000,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 8500,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 9000,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 9500,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 10000,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 10500,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 11000,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 11500,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 12000,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 12500,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 13000,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 13500,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 14000,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 14500,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 15000,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 15500,
      "current": 10241,
      "proposed": 10241
    },
    {
      "earnings": 16000,
      "current": 10142,
      "proposed": 10142
    },
    {
      "earnings": 16500,
      "current": 10022,
      "proposed": 10022
    },
    {
      "earnings": 17000,
      "current": 9902,
      "proposed": 9902
    },
    {
      "earnings": 17500,
      "current": 9782,
      "proposed": 9782
    },
    {
      "earnings": 18000,
      "current": 9662,
      "proposed": 9662
    },
    {
      "earnings": 18500,
      "current": 9542,
      "proposed": 9542
    },
    {
      "earnings": 19000,
      "current": 9422,
      "proposed": 9422
    },
    {
      "earnings": 19500,
      "current": 9302,
      "proposed": 9302
    },
    {
      "earnings": 20000,
      "current": 9182,
      "proposed": 9182
    },
    {
      "earnings": 20500,
      "current": 9062,
      "proposed": 9062
    },
    {
      "earnings": 21000,
      "current": 8942,
      "proposed": 8942
    },
    {
      "earnings": 21500,
      "current": 8822,
      "proposed": 8822
    },
    {
      "earnings": 22000,
      "current": 8702,
      "proposed": 8702
    },
    {
      "earnings": 22500,
      "current": 8582,
      "proposed": 8582
    },
    {
      "earnings": 23000,
      "current": 8462,
      "proposed": 8462
    },
    {
      "earnings": 23500,
      "current": 8342,
      "proposed": 8342
    },
    {
      "earnings": 24000,
      "current": 8216,
      "proposed": 8216
    },
    {
      "earnings": 24500,
      "current": 8054,
      "proposed": 8054
    },
    {
      "earnings": 25000,
      "current": 7874,
      "proposed": 7874
    },
    {
      "earnings": 25500,
      "current": 7694,
      "proposed": 7694
    },
    {
      "earnings": 26000,
      "current": 7514,
      "proposed": 7514
    },
    {
      "earnings": 26500,
      "current": 7334,
      "proposed": 7334
    },
    {
      "earnings": 27000,
      "current": 7154,
      "proposed": 7154
    },
    {
      "earnings": 27500,
      "current": 6974,
      "proposed": 6974
    },
    {
      "earnings": 28000,
      "current": 6794,
      "proposed": 6794
    },
    {
      "earnings": 28500,
      "current": 6614,
      "proposed": 6614
    },
    {
      "earnings": 29000,
      "current": 6434,
      "proposed": 6434
    },
    {
      "earnings": 29500,
      "current": 6254,
      "proposed": 6254
    },
    {
      "earnings": 30000,
      "current": 6074,
      "proposed": 6074
    },
    {
      "earnings": 30500,
      "current": 5894,
      "proposed": 5894
    },
    {
      "earnings": 31000,
      "current": 5714,
      "proposed": 5714
    },
    {
      "earnings": 31500,
      "current": 5534,
      "proposed": 5534
    },
    {
      "earnings": 32000,
      "current": 5354,
      "proposed": 5354
    },
    {
      "earnings": 32500,
      "current": 5174,
      "proposed": 5174
    },
    {
      "earnings": 33000,
      "current": 4994,
      "proposed": 4994
    },
    {
      "earnings": 33500,
      "current": 4814,
      "proposed": 4814
    },
    {
      "earnings": 34000,
      "current": 4634,
      "proposed": 4634
    },
    {
      "earnings": 34500,
      "current": 4454,
      "proposed": 4454
    },
    {
      "earnings": 35000,
      "current": 4274,
      "proposed": 4274
    },
    {
      "earnings": 35500,
      "current": 4094,
      "proposed": 4094
    },
    {
      "earnings": 36000,
      "current": 3914,
      "proposed": 3914
    },
    {
      "earnings": 36500,
      "current": 3734,
      "proposed": 3734
    },
    {
      "earnings": 37000,
      "current": 3554,
      "proposed": 3554
    },
    {
      "earnings": 37488.0,
      "current": 3374,
      "proposed": 3374
    },
    {
      "earnings": 37488.01,
      "current": 3374,
      "proposed": 894
    },
    {
      "earnings": 38376.0,
      "current": 3059,
      "proposed": 813
    },
    {
      "earnings": 38376.01,
      "current": 3059,
      "proposed": 0
    },
    {
      "earnings": 38500,
      "current": 3014,
      "proposed": 0
    },
    {
      "earnings": 39000,
      "current": 2834,
      "proposed": 0
    },
    {
      "earnings": 39500,
      "current": 2654,
      "proposed": 0
    },
    {
      "earnings": 40000,
      "current": 2474,
      "proposed": 0
    },
    {
      "earnings": 40500,
      "current": 2294,
      "proposed": 0
    },
    {
      "earnings": 41000,
      "current": 2114,
      "proposed": 0
    },
    {
      "earnings": 41500,
      "current": 1934,
      "proposed": 0
    },
    {
      "earnings": 42000,
      "current": 1754,
      "proposed": 0
    },
    {
      "earnings": 42500,
      "current": 1574,
      "proposed": 0
    },
    {
      "earnings": 43000,
      "current": 1394,
      "proposed": 0
    },
    {
      "earnings": 43500,
      "current": 1214,
      "proposed": 0
    },
    {
      "earnings": 44000,
      "current": 1034,
      "proposed": 0
    },
    {
      "earnings": 44500,
      "current": 854,
      "proposed": 0
    },
    {
      "earnings": 45000,
      "current": 674,
      "proposed": 0
    },
    {
      "earnings": 45500,
      "current": 494,
      "proposed": 0
    },
    {
      "earnings": 46000,
      "current": 314,
      "proposed": 0
    },
    {
      "earnings": 46500,
      "current": 134,
      "proposed": 0
    },
    {
      "earnings": 47000,
      "current": 39,
      "proposed": 0
    },
    {
      "earnings": 47500,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 48000,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 48500,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 49000,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 49500,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 50000,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 50500,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 51000,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 51500,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 52000,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 52500,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 53000,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 53500,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 54000,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 54500,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 55000,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 55500,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 56000,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 56500,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 57000,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 57500,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 58000,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 58500,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 59000,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 59500,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 60000,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 60500,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 61000,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 61500,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 62000,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 62500,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 63000,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 63500,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 64000,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 64500,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 65000,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 65500,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 66000,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 66500,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 67000,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 67500,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 68000,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 68500,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 69000,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 69500,
      "current": 0,
      "proposed": 0
    },
    {
      "earnings": 70000,
      "current": 0,
      "proposed": 0
    }
  ],
  "markers": [
    {
      "x": 37488,
      "label": "Federal gross income limit (Jan–Sep)"
    },
    {
      "x": 38376,
      "label": "Federal gross income limit (Oct–Dec)"
    },
    {
      "x": 57670,
      "label": "200% of FPG (Pennsylvania BBCE limit, Jan–Sep)"
    }
  ],
  "format": {
    "prefix": "$",
    "decimals": 0,
    "separator": true
  },
  "xFormat": {
    "prefix": "$",
    "decimals": 0,
    "separator": true
  },
  "source": "PolicyEngine US 2.137.9"
}
```

Under current rules, the family's SNAP benefit phases out gradually and reaches zero at about $47,500 of earnings, before the 200% limit. Under the proposed rule, the federal gross income test ends the benefit above the monthly limit. For this family, the model uses poverty guidelines of $28,835 from January through September 2029 and $29,516 from October. SNAP rounds the monthly gross income limit up to a whole dollar, giving limits of $3,124 and $3,198. With earnings spread evenly across the year, the family therefore loses nine months of SNAP once annual earnings exceed $37,488, and the remaining three months above $38,376.

| Annual earnings | SNAP, current rules | SNAP, proposed rule | Net income, current rules | Net income, proposed rule |
|---|---|---|---|---|
| $30,000 | $6,074 | $6,074 | $46,124 | $46,124 |
| $37,000 | $3,554 | $3,554 | $48,109 | $48,109 |
| $38,500 | $3,014 | $0 | $48,410 | $45,396 |
| $40,000 | $2,474 | $0 | $48,710 | $46,237 |
| $45,000 | $674 | $0 | $54,482 | $53,808 |

At $40,000 of earnings, the family's net income falls by $2,474, all of it SNAP; the 5-year-old's school meals do not change, because Pennsylvania covers the reduced-price copay. Between $37,000 and $38,500 of earnings, the proposed rule lowers the family's net income by $2,713 for $1,500 in added earnings.

### Example 2: savings above $3,000

The same family with $30,000 of earnings stays below 130% of FPG. Under the proposed rule, its eligibility then depends on its savings.

```chart
{
  "type": "line",
  "title": "Figure 2: SNAP for the same family by savings, 2029",
  "subtitle": "Annual SNAP benefit with $30,000 of earnings, by bank account balance",
  "xKey": "savings",
  "xLabel": "Bank account balance",
  "yLabel": "Annual SNAP benefit",
  "series": [
    {
      "key": "current",
      "name": "Current rules",
      "color": "quinary",
      "step": true
    },
    {
      "key": "proposed",
      "name": "Proposed rule",
      "color": "primary",
      "step": true
    }
  ],
  "data": [
    {
      "savings": 0,
      "current": 6074,
      "proposed": 6074
    },
    {
      "savings": 100,
      "current": 6074,
      "proposed": 6074
    },
    {
      "savings": 200,
      "current": 6074,
      "proposed": 6074
    },
    {
      "savings": 300,
      "current": 6074,
      "proposed": 6074
    },
    {
      "savings": 400,
      "current": 6074,
      "proposed": 6074
    },
    {
      "savings": 500,
      "current": 6074,
      "proposed": 6074
    },
    {
      "savings": 600,
      "current": 6074,
      "proposed": 6074
    },
    {
      "savings": 700,
      "current": 6074,
      "proposed": 6074
    },
    {
      "savings": 800,
      "current": 6074,
      "proposed": 6074
    },
    {
      "savings": 900,
      "current": 6074,
      "proposed": 6074
    },
    {
      "savings": 1000,
      "current": 6074,
      "proposed": 6074
    },
    {
      "savings": 1100,
      "current": 6074,
      "proposed": 6074
    },
    {
      "savings": 1200,
      "current": 6074,
      "proposed": 6074
    },
    {
      "savings": 1300,
      "current": 6074,
      "proposed": 6074
    },
    {
      "savings": 1400,
      "current": 6074,
      "proposed": 6074
    },
    {
      "savings": 1500,
      "current": 6074,
      "proposed": 6074
    },
    {
      "savings": 1600,
      "current": 6074,
      "proposed": 6074
    },
    {
      "savings": 1700,
      "current": 6074,
      "proposed": 6074
    },
    {
      "savings": 1800,
      "current": 6074,
      "proposed": 6074
    },
    {
      "savings": 1900,
      "current": 6074,
      "proposed": 6074
    },
    {
      "savings": 2000,
      "current": 6074,
      "proposed": 6074
    },
    {
      "savings": 2100,
      "current": 6074,
      "proposed": 6074
    },
    {
      "savings": 2200,
      "current": 6074,
      "proposed": 6074
    },
    {
      "savings": 2300,
      "current": 6074,
      "proposed": 6074
    },
    {
      "savings": 2400,
      "current": 6074,
      "proposed": 6074
    },
    {
      "savings": 2500,
      "current": 6074,
      "proposed": 6074
    },
    {
      "savings": 2600,
      "current": 6074,
      "proposed": 6074
    },
    {
      "savings": 2700,
      "current": 6074,
      "proposed": 6074
    },
    {
      "savings": 2800,
      "current": 6074,
      "proposed": 6074
    },
    {
      "savings": 2900,
      "current": 6074,
      "proposed": 6074
    },
    {
      "savings": 3000,
      "current": 6074,
      "proposed": 6074
    },
    {
      "savings": 3000.01,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 3100,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 3200,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 3300,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 3400,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 3500,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 3600,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 3700,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 3800,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 3900,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 4000,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 4100,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 4200,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 4300,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 4400,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 4500,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 4600,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 4700,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 4800,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 4900,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 5000,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 5100,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 5200,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 5300,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 5400,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 5500,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 5600,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 5700,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 5800,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 5900,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 6000,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 6100,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 6200,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 6300,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 6400,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 6500,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 6600,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 6700,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 6800,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 6900,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 7000,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 7100,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 7200,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 7300,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 7400,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 7500,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 7600,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 7700,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 7800,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 7900,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 8000,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 8100,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 8200,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 8300,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 8400,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 8500,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 8600,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 8700,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 8800,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 8900,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 9000,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 9100,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 9200,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 9300,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 9400,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 9500,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 9600,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 9700,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 9800,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 9900,
      "current": 6074,
      "proposed": 0
    },
    {
      "savings": 10000,
      "current": 6074,
      "proposed": 0
    }
  ],
  "markers": [
    {
      "x": 3000,
      "label": "Federal asset limit ($3,000)"
    }
  ],
  "format": {
    "prefix": "$",
    "decimals": 0,
    "separator": true
  },
  "xFormat": {
    "prefix": "$",
    "decimals": 0,
    "separator": true
  },
  "source": "PolicyEngine US 2.137.9"
}
```

With a bank balance up to $3,000, the family keeps its $6,074 annual SNAP benefit. Above $3,000, the federal asset test ends SNAP, and the family's net income falls by $6,074.

## National impacts

The figures in this section come from PolicyEngine's SNAP caseload as calibrated, the upper end of the range. The [comparison section](#comparison-with-usdas-estimates) gives the lower-end figures.

### Budget and participation

| Measure, 2029 | Value |
|---|---|
| SNAP benefits, current rules | $99.3 billion |
| SNAP benefits, proposed rule | $69.8 billion |
| Change in SNAP benefits | -$29.5 billion (-29.7%) |
| Change in school meal benefits | -$0.39 billion |
| Change in WIC benefits | -$0.03 billion |
| Change in household benefits | -$29.9 billion |

In an average month of 2029, PolicyEngine projects 21.3 million SNAP units under current rules. The proposed rule ends SNAP for 8.6 million of them (40.2%): 4.5 million fail the gross or net income test, and 4.0 million pass both income tests but fail the asset test. Over the year, 8.6 million units lose all of their SNAP, an average of $3,352 each, and another 0.28 million lose SNAP for part of the year.

PolicyEngine treats the SPM unit as the SNAP household. SPM units in the model's SNAP caseload average 2.8 people, against 1.9 people per household in USDA's fiscal 2029 baseline, so the 23.0 million people in losing units overstate the number of SNAP participants affected.

### Poverty

| Group | SPM poverty, current rules | SPM poverty, proposed rule | Change | People entering poverty |
|---|---|---|---|---|
| All people | 13.88% | 14.45% | +0.58 pp (+4.2%) | 2.02 million |
| Children under 18 | 18.29% | 19.74% | +1.45 pp (+7.9%) | 1.14 million |
| Adults 18-64 | 13.18% | 13.57% | +0.40 pp (+3.0%) | 0.82 million |
| Seniors 65+ | 10.65% | 10.73% | +0.09 pp (+0.8%) | 0.05 million |

Deep poverty, below half the SPM threshold, rises from 3.04% to 3.46% of people (+13.8%) and from 2.20% to 2.98% of children (+35.5%).

With the caseload reweighted to USDA's quality control shares, SPM poverty rises by 0.29 percentage points (1.0 million people) and child SPM poverty by 0.75 percentage points (0.6 million children). The reweighting also raises the baseline poverty rate from 13.9% to 14.6%, because it shifts weight toward lower-income SNAP households, so these lower-end poverty figures are approximate.

### Distributional impact

```chart
{
  "type": "bar",
  "title": "Figure 3: Average change in household net income by income decile, 2029",
  "subtitle": "Proposed rule compared with current law, PolicyEngine caseload as calibrated",
  "xKey": "decile",
  "yLabel": "Average change per household",
  "series": [
    {
      "key": "change",
      "name": "Change in net income",
      "color": "primary"
    }
  ],
  "data": [
    {
      "decile": "1",
      "change": -854
    },
    {
      "decile": "2",
      "change": -509
    },
    {
      "decile": "3",
      "change": -331
    },
    {
      "decile": "4",
      "change": -145
    },
    {
      "decile": "5",
      "change": -76
    },
    {
      "decile": "6",
      "change": -32
    },
    {
      "decile": "7",
      "change": -19
    },
    {
      "decile": "8",
      "change": -8
    },
    {
      "decile": "9",
      "change": -5
    },
    {
      "decile": "10",
      "change": -27
    }
  ],
  "format": {
    "prefix": "$",
    "decimals": 0,
    "separator": true,
    "signed": true
  },
  "legend": false,
  "source": "PolicyEngine US 2.137.9, Microcosm populace_us_2024"
}
```

The bottom decile loses $854 per household on average, 3.0% of its net income; 27% of people in that decile live in households whose net income falls. Losses shrink to $76 per household in the fifth decile. The top three deciles lose $5 to $27 per household on average. About half of the losing households in those deciles contain more than one SPM unit, such as an adult relative or roommate whose own SPM unit receives SNAP within a higher-income household.

### States

The rule changes SNAP only in states that use BBCE. PolicyEngine models BBCE in 43 states, including DC, and models no BBCE in eight: Arkansas, Kansas, Mississippi, Missouri, South Dakota, Tennessee, Utah and Wyoming.

| States | SNAP, current rules | Change in SNAP | Share of SNAP units losing SNAP |
|---|---|---|---|
| BBCE states (43) | $93.3 billion | -$29.5 billion (-31.6%) | 42.6% |
| Non-BBCE states (8) | $6.0 billion | $0 | 0% |

```chart
{
  "type": "stateMap",
  "title": "Figure 4: Share of SNAP households losing SNAP by state, 2029",
  "subtitle": "SNAP units losing SNAP in an average month under the proposed rule, PolicyEngine caseload as calibrated",
  "stateKey": "state",
  "valueKey": "share",
  "data": [
    {
      "state": "AK",
      "share": 45.8
    },
    {
      "state": "AL",
      "share": 26.7
    },
    {
      "state": "AR",
      "share": 0.0
    },
    {
      "state": "AZ",
      "share": 46.4
    },
    {
      "state": "CA",
      "share": 50.8
    },
    {
      "state": "CO",
      "share": 51.8
    },
    {
      "state": "CT",
      "share": 43.0
    },
    {
      "state": "DC",
      "share": 55.8
    },
    {
      "state": "DE",
      "share": 37.7
    },
    {
      "state": "FL",
      "share": 46.5
    },
    {
      "state": "GA",
      "share": 34.0
    },
    {
      "state": "HI",
      "share": 42.5
    },
    {
      "state": "IA",
      "share": 53.0
    },
    {
      "state": "ID",
      "share": 5.7
    },
    {
      "state": "IL",
      "share": 48.1
    },
    {
      "state": "IN",
      "share": 6.5
    },
    {
      "state": "KS",
      "share": 0.0
    },
    {
      "state": "KY",
      "share": 38.8
    },
    {
      "state": "LA",
      "share": 35.2
    },
    {
      "state": "MA",
      "share": 45.5
    },
    {
      "state": "MD",
      "share": 43.0
    },
    {
      "state": "ME",
      "share": 57.6
    },
    {
      "state": "MI",
      "share": 59.3
    },
    {
      "state": "MN",
      "share": 21.3
    },
    {
      "state": "MO",
      "share": 0.0
    },
    {
      "state": "MS",
      "share": 0.0
    },
    {
      "state": "MT",
      "share": 55.5
    },
    {
      "state": "NC",
      "share": 41.4
    },
    {
      "state": "ND",
      "share": 34.7
    },
    {
      "state": "NE",
      "share": 35.6
    },
    {
      "state": "NH",
      "share": 44.9
    },
    {
      "state": "NJ",
      "share": 25.1
    },
    {
      "state": "NM",
      "share": 51.5
    },
    {
      "state": "NV",
      "share": 28.2
    },
    {
      "state": "NY",
      "share": 41.7
    },
    {
      "state": "OH",
      "share": 30.2
    },
    {
      "state": "OK",
      "share": 34.6
    },
    {
      "state": "OR",
      "share": 55.2
    },
    {
      "state": "PA",
      "share": 44.6
    },
    {
      "state": "RI",
      "share": 19.3
    },
    {
      "state": "SC",
      "share": 19.9
    },
    {
      "state": "SD",
      "share": 0.0
    },
    {
      "state": "TN",
      "share": 0.0
    },
    {
      "state": "TX",
      "share": 25.9
    },
    {
      "state": "UT",
      "share": 0.0
    },
    {
      "state": "VA",
      "share": 61.7
    },
    {
      "state": "VT",
      "share": 61.8
    },
    {
      "state": "WA",
      "share": 53.2
    },
    {
      "state": "WI",
      "share": 50.6
    },
    {
      "state": "WV",
      "share": 40.0
    },
    {
      "state": "WY",
      "share": 0.0
    }
  ],
  "bins": [
    {
      "below": 0.05,
      "label": "No change (no BBCE)"
    },
    {
      "below": 20,
      "label": "Under 20%"
    },
    {
      "below": 40,
      "label": "20% to 40%"
    },
    {
      "below": 50,
      "label": "40% to 50%"
    },
    {
      "label": "50% and up"
    }
  ],
  "summary": {
    "label": "United States",
    "value": 40.2
  },
  "format": {
    "decimals": 1,
    "suffix": "%"
  },
  "source": "PolicyEngine US 2.137.9, Microcosm populace_us_2024"
}
```

California (-$5.0 billion), Florida (-$2.7 billion), Illinois (-$2.0 billion), New York (-$2.0 billion) and Pennsylvania (-$1.8 billion) account for 45% of the national reduction. The effect is smaller in states whose BBCE programs already apply limits closer to the federal ones. Texas sets a 165% gross income limit and a $5,000 asset limit, so its SNAP falls by 13.5%. Indiana and Idaho set 130% gross income limits and $5,000 asset limits, and their SNAP falls by 10.0% and 5.5%.

The RIA counts Arkansas among the BBCE states, with a $5,500 resource limit; PolicyEngine does not model Arkansas's BBCE program and shows no change there. The RIA shows no change in Alaska, which adopted BBCE in July 2025, after the data years USDA used.

## Comparison with USDA's estimates

PolicyEngine's caseload is close to USDA's in size but differs in composition. Averaged over fiscal 2029, 21% of the model's SNAP units have incomes above the federal gross or net limit, against 5.4% of households in USDA's analysis of SNAP quality control (QC) data. Another 19% of the model's units pass the income tests but hold assets above the federal limit, against USDA's 11.5%. Benefit amounts are close: units that fail an income test receive $91 a month in the model and $110 in USDA's data, and the caseload as a whole receives $387 per unit per month in the model and $401 in USDA's baseline.

The table below moves from PolicyEngine's calendar 2029 estimate to USDA's fiscal 2029 estimate one difference at a time.

| Step | SNAP cut | Households losing SNAP (average month) |
|---|---|---|
| PolicyEngine, calendar 2029 | $29.5 billion | 8.6 million |
| Fiscal 2029 (October 2028 to September 2029) | $29.3 billion | 8.6 million |
| Exclude Alaska, which adopted BBCE after USDA's data years | $29.3 billion | 8.5 million |
| Apply PolicyEngine's loss rates to USDA's baseline caseload and benefits | $27.3 billion | 7.7 million |
| Use the composition of households that reported SNAP in the Current Population Survey | $23.0 billion | 6.3 million |
| Set the share above an income limit to USDA's 5.4% | $20.3 billion | 4.1 million |
| Set the share above only the asset limit to USDA's 11.5% | $14.3 billion | 3.2 million |
| USDA RIA, fiscal 2029 | $14.3 billion | 3.2 million |

The share of SNAP households above the federal limits accounts for $13.0 billion of the $15.2 billion difference and 4.4 million of the 5.4 million household difference. The result depends on the order of the steps, but the composition steps dominate in any order. Three features of the data raise those shares:

- **Take-up.** The Microcosm dataset assigns SNAP to every household that reported SNAP in the Current Population Survey. It then selects other eligible households at random until each state's caseload matches USDA's count, without regard to benefit size. Households eligible only through BBCE, which tend to qualify for smaller benefits, are therefore as likely to enroll as other eligible households. These selected households make up 63% of the modeled caseload; 45% of them lose SNAP under the rule, against 33% of households that reported SNAP.
- **Assets.** Microcosm imputes bank, stock and bond holdings. Among modeled SNAP units, 27% hold more than $3,000 in these assets. USDA's resource estimate relies on December 2019 Survey of Income and Program Participation data.
- **Annual income.** The model spreads each household's annual income evenly across the year. SNAP households apply and recertify based on current monthly income.

Alternative estimates bracket the result:

| Estimate | SNAP cut | Households losing SNAP |
|---|---|---|
| PolicyEngine caseload as calibrated, calendar 2029 | $29.5 billion | 8.6 million |
| Loss rates of households that reported SNAP, applied to USDA's baseline | $23.0 billion | 6.3 million |
| PolicyEngine caseload reweighted to USDA's QC income and asset shares | $15.7 billion | 3.5 million |
| Same, scaled to USDA's caseload size | $14.1 billion | 3.2 million |
| USDA RIA, fiscal 2029 | $14.3 billion | 3.2 million |

State patterns also differ. Across the 43 BBCE states, the correlation between PolicyEngine's and USDA's state shares of households losing SNAP is 0.11. The state chart and decile chart above use the caseload as calibrated; with the reweighted caseload, losses still concentrate in the bottom three deciles and occur only in BBCE states, but at roughly half the level.

USDA's own sensitivity analysis ranges from an $11.0 billion reduction, if a quarter of households above the asset limit spend down their savings, to $17.7 billion, if survey data understate assets.

## What the estimates exclude

- **"Authorized to receive."** The rule would stop counting households that are approved for TANF or SSI but not yet paid. Neither USDA nor PolicyEngine quantifies this change.
- **TANF supportive services.** PolicyEngine does not model TANF-funded child care or transportation for families that are not employed, which count as TANF assistance.
- **TANF reporting.** The dataset does not flag reported TANF receipt; PolicyEngine computes TANF cash for 0.78 million SPM units in 2029. Because TANF households rarely exceed federal limits, this affects the estimates little.
- **Vehicles.** PolicyEngine's SNAP asset test counts bank accounts, stocks and bonds, and leaves out vehicles, which some states count.
- **Behavior.** The estimates assume no spend-down of savings, no change in earnings, and no change in application rates among households that remain eligible.
- **Administrative costs.** USDA estimates $1.2 billion in added federal and state administrative costs over fiscal years 2027-2031, which the model does not capture.
- **State cost-sharing.** The One Big Beautiful Bill Act requires some states to pay part of SNAP benefit costs from fiscal year 2028. We report total benefits without a federal-state split.

## Methodology

We used PolicyEngine US 2.137.9 with policyengine-core 3.36.1, run through the policyengine 6.19.0 package on the Microcosm dataset `populace_us_2024` (build populace-us-2024-spm-20260915), projected to 2029. The policyengine 6.19.0 bundle certifies this dataset for PolicyEngine US 2.2.1; these results apply the newer model rules to the same data and SPM thresholds. All results are static and compare the proposed rule with current law in 2029. The lower end of the range keeps each household's modeled SNAP outcome and multiplies the survey weights of SNAP households by 0.25 if they fail an income test, 0.60 if they fail only the asset test, and 1.40 if they meet all federal limits, which preserves the caseload's size and matches USDA's quality control shares. The lower-end SNAP figures cover fiscal 2029 months and exclude Alaska, to match USDA's coverage; the lower-end poverty figures apply the same weights to calendar 2029.

## References

- U.S. Department of Agriculture, Food and Nutrition Administration. ["Supplemental Nutrition Assistance Program: Reforming Categorical Eligibility," proposed rule, 91 FR 72454, November 10, 2026 #page 1,4-6,11](https://www.govinfo.gov/content/pkg/FR-2026-11-10/pdf/2026-22936.pdf#page=1)
- U.S. Department of Agriculture. ["Reforming Categorical Eligibility RIA," docket FNA-2026-0661-0002 #page 4,20,27-28,31,69,76-83](https://downloads.regulations.gov/FNA-2026-0661-0002/content.pdf#page=4)
- [7 CFR 273.2(j)(2), Categorically eligible PA and SSI households](https://www.ecfr.gov/current/title-7/section-273.2#p-273.2(j)(2))
- [45 CFR 260.31, What does the term "assistance" mean?](https://www.ecfr.gov/current/title-45/section-260.31)
- U.S. Department of Agriculture, Food and Nutrition Administration. [SNAP Eligibility, fiscal year 2027 (October 1, 2026 through September 30, 2027)](https://www.fna.usda.gov/snap/recipient/eligibility)
