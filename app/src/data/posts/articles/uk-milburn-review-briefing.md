On 17 November 2026 the Department for Work and Pensions (DWP) [published](https://www.gov.uk/government/publications/from-a-welfare-state-to-a-working-state-a-new-settlement-for-the-next-generation) _From a Welfare State to a Working State_, Alan Milburn's independent review of the rise in the number of young people not in education, employment or training (NEET), which it puts at nearly one million people aged 16 to 24, one in eight. For young people on Universal Credit (UC) and the Personal Independence Payment (PIP), the review proposes a Youth Allowance for UC claimants under 25, paid at today's under-25 standard allowance; an end to the UC health element and the Work Capability Assessment; and three new forms of support in place of PIP. Our [Milburn review dashboard](https://www.policyengine.org/uk/milburn-review) models five of its proposals: ending the UC health element and PIP for young people, the Youth Allowance's higher rate, a work allowance, and a higher employer National Insurance threshold for young workers in retail and hospitality. The survey data we use have no NEET flag, so we approximate the group as people aged 16 to 24 with no earnings in the year who are not recorded as in full-time education.

PolicyEngine's static microsimulation gives these results if the UC health element for under-25s and PIP for 18 to 24-year-olds end in April 2029, with no replacement awards and employment held fixed:

- The two removals would save £4.7 billion in 2029-30, in cash terms. If existing claimants moved as they are reassessed, the saving that year would be £2.8 billion.
- Household net income would fall by £159 a year in 2029-30, averaged over all households; 98% of people live in households whose net income would not change.
- 2.0% of people would live in households whose net income falls, including 580,000 people aged 16 to 24 (7.8% of that age group).
- Absolute poverty before housing costs would rise by 0.5 percentage points, or 342,000 people.

These figures cover the two removals only. They leave out the replacement support, the Youth Allowance, the work allowance and the rise in employment that the review's own estimates include.

_[Use PolicyEngine's Milburn review dashboard](https://www.policyengine.org/uk/milburn-review) to explore the results by proposal, year, age and household._

## What the review proposes and how we model it

- **UC health element.** The review would abolish the Work Capability Assessment and the UC health element for people under 25, with no new test taking their place "at the front of the system". We remove the health element wherever the claimant with limited capability for work and work-related activity is under 25; an award keeps it where a joint claimant aged 25 or over has that capability. We keep each claimant's assessment as having limited capability for work, so the UC work allowance that goes with it still applies. The review would also let young people pause support during serious illness or treatment; we model no such exception.

  **Table 1: UC health element for a claimant under 25 with limited capability for work and work-related activity, 2029-30 (£ a month)**

  | Claim                  | Current law | Under the review | What we model |
  | ---------------------- | ----------: | ---------------: | ------------: |
  | Made before April 2026 |      460.80 |             None |          None |
  | Made from April 2026   |      217.26 |             None |          None |

  PolicyEngine UK 2.177.7 parameters. The review's and our columns show a claimant who has moved to the new rules; the review moves existing claimants as they are reassessed. The £217.26 is set in law and frozen to 2029-30. The £460.80 is PolicyEngine UK's projection: the lowest amount the Universal Credit Act 2025 allows.

- **PIP.** For people under 25, a local Health and Disability Fund, an Additional Cost Allowance and a Severe and Complex Needs Insurance would replace PIP. The review gives no payment amounts or detailed eligibility rules for them, so we end PIP for 18 to 24-year-olds and model no replacement awards; we start at 18 because Disability Living Allowance for children would run to 18. We include Scottish recipients of Adult Disability Payment, which the data record as PIP. Under today's rules, other entitlements follow PIP: the disabled child addition in a parent's UC award for 18 and 19-year-olds, UC itself for some claimants in education, and an exemption from the shared accommodation rate in the UC housing element. The review doesn't say what happens to them, so they end with PIP.

  **Table 2: PIP at ages 18 to 24, 2029-30 (£ a week)**

  | Component                   | Current law | Under the review | What we model |
  | --------------------------- | ----------: | ---------------: | ------------: |
  | Daily living, standard rate |       83.73 |         Replaced |          None |
  | Daily living, enhanced rate |      125.10 |         Replaced |          None |
  | Mobility, standard rate     |       33.08 |         Replaced |          None |
  | Mobility, enhanced rate     |       87.33 |         Replaced |          None |

  PolicyEngine UK 2.177.7 parameters. The rates are the 2026-27 rates, uprated to 2029-30 on PolicyEngine UK's forecast; they apply to a claimant who has moved to the new rules. The review gives no amounts for the support that would replace PIP.

- **Youth Allowance.** The allowance would pay today's under-25 UC standard allowance, £339 a month, with a higher rate for young people living independently. In its microsimulation model the review's analytical annex uses receipt of the UC housing element as the proxy for living independently, then refines the costing with administrative data. We use the same proxy, and give awards with a housing costs element in which every claimant is under 25 the standard allowance for those aged 25 and over: £96.53 a month more for a single claimant in 2029-30.

  **Table 3: UC standard allowance for a claim in which every claimant is under 25, 2029-30 (£ a month)**

  | Claim                                | Current law | Under the review             |    What we model |
  | ------------------------------------ | ----------: | ---------------------------- | ---------------: |
  | Single, with a housing costs element |      378.62 | Higher rate, no amount given |  475.15 (+96.53) |
  | Single, without one                  |      378.62 | Under-25 rate                |           378.62 |
  | Couple, with a housing costs element |      590.83 | Higher rate, no amount given | 745.85 (+155.02) |
  | Couple, without one                  |      590.83 | Under-25 rate                |           590.83 |

  PolicyEngine UK 2.177.7 parameters. The amounts are PolicyEngine UK's projections; the single under-25 rate is £338.58 in 2026-27, the £339 above.

- **Work allowance.** Youth Allowance recipients in work could earn an amount before their award starts to fall. The review doesn't give the amount, so we assume today's UC work allowance for young claimants who have none today.

  **Table 4: UC work allowance for a claim in which every claimant is under 25, with no child and no limited capability for work, 2029-30 (£ a month)**

  | Claim                           | Current law | Under the review                | What we model |
  | ------------------------------- | ----------: | ------------------------------- | ------------: |
  | With a housing costs element    |        None | Work allowance, no amount given |        466.11 |
  | Without a housing costs element |        None | Work allowance, no amount given |        775.03 |

  PolicyEngine UK 2.177.7 parameters. Our amounts are current law's work allowances for claims with a child or limited capability for work, as PolicyEngine UK projects them. The 55% taper is unchanged.

- **Employer National Insurance.** "When fiscal conditions allow", employers in retail and hospitality would pay no National Insurance on the first £10,000 a year of the earnings of employees aged 21 to 24, up from £5,000, reached over five years. The review gives no start date and no costing. We model the £10,000 end state, and a path of equal steps from £6,000 in 2027-28 to £10,000 in 2031-32. The review describes the change as lowering the cost of recruiting low-paid young workers. The model passes the employer's saving to the employee as higher pay, with hiring held fixed.

  **Table 5: Employer National Insurance threshold for employees aged 21 to 24 in retail and hospitality, 2027-28 to 2031-32 (£ a year)**

  | Year    | Current law | What we model: £10,000 | What we model: equal steps |
  | ------- | ----------: | ---------------------: | -------------------------: |
  | 2027-28 |       5,000 |                 10,000 |                      6,000 |
  | 2028-29 |       5,000 |                 10,000 |                      7,000 |
  | 2029-30 |       5,000 |                 10,000 |                      8,000 |
  | 2030-31 |       5,000 |                 10,000 |                      9,000 |
  | 2031-32 |       5,100 |                 10,000 |                     10,000 |

  Current law: PolicyEngine UK 2.177.7 parameters. The review proposes £10,000, reached over five years, with no start date or yearly amounts; the April 2027 start and the steps are our assumptions. Current law's threshold is frozen at £5,000 to 2030-31, then rises with prices. The 15% rate is unchanged.

The review expects welfare savings to begin in 2029-30. New claims would move once legislation passes, and existing claimants at their scheduled reassessment once a Youth Opportunity Service reaches their area, within at most five years. Our headline figures move every eligible young person to the new rules in April 2029. A [phased run](https://www.policyengine.org/uk/milburn-review?tab=dashboard&sub=finances&policies=milburn_report_package_phased) moves existing claimants as they are reassessed, about 95% of them within five years; the appendix gives its rule.

We don't model the review's other proposals, among them the Opportunity and Support Guarantees, the Youth Jobs Grant, the apprenticeship incentive, the Care Leaver Transition Allowance, the duty to engage and further education funding. The dashboard's [Methodology tab](https://www.policyengine.org/uk/milburn-review?tab=methodology) lists the proposals we don't model, with the reason for each.

[See the proposals on the dashboard](https://www.policyengine.org/uk/milburn-review?tab=policies).

## Modelling choices

Four of our choices raise both the saving and the fall in household net income:

- **No replacement awards.** Any amount the Additional Cost Allowance, the Severe and Complex Needs Insurance or the Health and Disability Fund paid would lower both.
- **Ending the entitlements that follow PIP**, which adds £0.6 billion in 2029-30.
- **Including Scottish Adult Disability Payment**, which adds £121 million in 2029-30. Adult Disability Payment is the Scottish Government's, so a UK change to PIP would not itself change it, but the review's welfare costing covers the UK.
- **Moving everyone at once.** The phased run saves less in each year (Table 6).

Two lower both:

- **Keeping carers' awards.** A carer can qualify for Carer's Allowance and the UC carer element through the daily living component of the PIP award of the person they care for. The model keeps both awards because it doesn't link carers to care recipients. The review leaves open whether the replacements would preserve that entitlement.
- **Keeping the assessment of limited capability for work**, and so today's work allowance, for claimants who would no longer receive the health element.

Other choices, which don't move the results in a single direction, are in the appendix.

## Results

### Public finances

**Table 6: Budgetary impact of the proposals we model, static (£ million, cash terms)**

| Run                                                      | 2029-30 | 2030-31 | 2031-32 |
| -------------------------------------------------------- | ------: | ------: | ------: |
| The two removals: UC health element and PIP              |   4,666 |   4,784 |   4,889 |
| The two removals, phased as claimants are reassessed     |   2,766 |   4,011 |   4,563 |
| UC health element, on its own                            |   1,128 |   1,157 |   1,177 |
| PIP, on its own                                          |   3,643 |   3,733 |   3,816 |
| Youth Allowance higher rate, on its own                  |    −131 |    −132 |    −130 |
| Work allowance at our assumed level, on its own          |    −456 |    −463 |    −458 |
| Youth Allowance higher rate and work allowance, together |    −625 |    −635 |    −633 |
| The two removals with the higher rate and work allowance |   4,050 |   4,159 |   4,267 |
| Employer National Insurance at £10,000                   |    −221 |    −222 |    −213 |
| Employer National Insurance, equal steps from £6,000     |    −135 |    −179 |    −213 |

PolicyEngine estimates, from the [public finances on the dashboard](https://www.policyengine.org/uk/milburn-review?tab=dashboard&sub=finances). We model the benefit changes from April 2029, the year the review expects its welfare savings to begin, so they change nothing in 2027-28 and 2028-29. The review gives the employer National Insurance change no start date: at £10,000 it would cost £219 million in 2027-28 and £220 million in 2028-29, and £46 million and £91 million on the path of equal steps.

A positive number is a saving to the public finances, and a negative number a cost. Each run is against current law, and each combined row comes from a single simulation, so it need not equal the sum of the separate rows. The employer National Insurance cost is the change in the government's balance: since the model passes the employer's saving to the employee as higher pay, it is net of the income tax and employee National Insurance on that pay and of the lower UC that follows.

The phased run saves 59% as much as the two removals fully in force in 2029-30, and 93% in 2031-32. Of the £3,643 million saving from PIP on its own in 2029-30, £3,086 million is PIP itself and £557 million comes from the entitlements that follow it, all of it in UC.

The two removals would save £105 million less than the two runs on their own added together. Some young UC claimants in education rely on an exception to UC's education condition for people who receive PIP and have limited capability for work. Ending PIP on its own would end these awards in full, including £149 million of health element. Ending the health element on its own would also remove it from the same awards, so adding the two runs counts that saving in both. Other interactions offset part of this.

### Household net income by income decile

Under the two removals, net income would fall in every income decile. In pounds, net income would fall most in the seventh decile (£367) and the third (£333). Run on its own, ending PIP accounts for most of each: £302 in the seventh and £258 in the third, against £70 and £75 from ending the health element. Our results don't show whether these two deciles hold more young recipients or falls of more per household. The fall in the lowest decile, £85, ranks seventh of the ten in pounds and fourth as a share of net income, at 0.3%.

PIP is not means-tested, so a young person in a higher-income household can receive it. Ending the health element would also lower net income in the top three deciles, by £13 to £32, because UC is assessed on the income of the claimant and any partner, not on their parents' income: a young claimant living with higher-income parents can receive UC with the health element.

```chart
{
  "type": "bar",
  "title": "Figure 1: Change in household net income by income decile, UC health element and PIP removals, static",
  "xKey": "decile",
  "series": [
    {
      "key": "y2029",
      "name": "2029-30",
      "color": "primary"
    },
    {
      "key": "y2030",
      "name": "2030-31",
      "color": "tertiary"
    },
    {
      "key": "y2031",
      "name": "2031-32",
      "color": "quinary"
    }
  ],
  "data": [
    {
      "decile": "1",
      "y2029": -0.34,
      "y2030": -0.34,
      "y2031": -0.34
    },
    {
      "decile": "2",
      "y2029": -0.17,
      "y2030": -0.17,
      "y2031": -0.18
    },
    {
      "decile": "3",
      "y2029": -0.74,
      "y2030": -0.7,
      "y2031": -0.75
    },
    {
      "decile": "4",
      "y2029": -0.37,
      "y2030": -0.39,
      "y2031": -0.38
    },
    {
      "decile": "5",
      "y2029": -0.33,
      "y2030": -0.35,
      "y2031": -0.32
    },
    {
      "decile": "6",
      "y2029": -0.26,
      "y2030": -0.26,
      "y2031": -0.27
    },
    {
      "decile": "7",
      "y2029": -0.54,
      "y2030": -0.53,
      "y2031": -0.54
    },
    {
      "decile": "8",
      "y2029": -0.12,
      "y2030": -0.12,
      "y2031": -0.12
    },
    {
      "decile": "9",
      "y2029": -0.09,
      "y2030": -0.09,
      "y2031": -0.09
    },
    {
      "decile": "10",
      "y2029": -0.04,
      "y2030": -0.04,
      "y2031": -0.04
    }
  ],
  "yLabel": "Change in net income (%)",
  "format": {
    "decimals": 2,
    "suffix": "%"
  },
  "valueLabels": true,
  "subtitle": "Percentage of net income; decile 1 has the lowest incomes",
  "select": {
    "label": "Year",
    "default": "y2029"
  }
}
```

```chart
{
  "type": "bar",
  "title": "Figure 2: Average change in household net income by income decile, UC health element and PIP removals, static",
  "subtitle": "£ a year, cash terms; decile 1 has the lowest incomes",
  "xKey": "decile",
  "series": [
    {
      "key": "y2029",
      "name": "2029-30",
      "color": "primary"
    },
    {
      "key": "y2030",
      "name": "2030-31",
      "color": "tertiary"
    },
    {
      "key": "y2031",
      "name": "2031-32",
      "color": "quinary"
    }
  ],
  "data": [
    {
      "decile": "1",
      "y2029": -85,
      "y2030": -87,
      "y2031": -89
    },
    {
      "decile": "2",
      "y2029": -72,
      "y2030": -74,
      "y2031": -75
    },
    {
      "decile": "3",
      "y2029": -333,
      "y2030": -319,
      "y2031": -347
    },
    {
      "decile": "4",
      "y2029": -183,
      "y2030": -196,
      "y2031": -195
    },
    {
      "decile": "5",
      "y2029": -179,
      "y2030": -195,
      "y2031": -178
    },
    {
      "decile": "6",
      "y2029": -159,
      "y2030": -162,
      "y2031": -168
    },
    {
      "decile": "7",
      "y2029": -367,
      "y2030": -371,
      "y2031": -385
    },
    {
      "decile": "8",
      "y2029": -88,
      "y2030": -91,
      "y2031": -91
    },
    {
      "decile": "9",
      "y2029": -82,
      "y2030": -84,
      "y2031": -86
    },
    {
      "decile": "10",
      "y2029": -62,
      "y2030": -63,
      "y2031": -64
    }
  ],
  "yLabel": "Change in net income (£ a year)",
  "format": {
    "decimals": 0,
    "prefix": "£",
    "separator": true
  },
  "select": {
    "label": "Year",
    "default": "y2029"
  }
}
```

PolicyEngine estimates (Figures 1 and 2). Across all households the average change would be −£159 a year in 2029-30, −£163 in 2030-31 and −£166 in 2031-32. We rank households into deciles by their income under current law, before housing costs, under the Households Below Average Income (HBAI) definition, which adjusts for household size, with each decile holding about a tenth of people. The averages cover every household in each decile, including those whose net income doesn't change. The review publishes no results by income decile.

### People by age

The two removals would lower household net income for 2.0% of people in each of 2029-30, 2030-31 and 2031-32. They would raise it for no one, since they add no benefit. Under the phased run the share would be 1.3% in 2029-30, 1.7% in 2030-31 and 1.9% in 2031-32.

```chart
{
  "type": "bar",
  "title": "Figure 3: The two removals by age, static, 2029-30",
  "xKey": "age",
  "series": [
    {
      "key": "share",
      "name": "Share in households whose net income falls (%)",
      "color": "primary",
      "format": {
        "decimals": 1,
        "suffix": "%"
      },
      "yLabel": "Share of people (%)"
    },
    {
      "key": "change",
      "name": "Average change in household net income (£ a year)",
      "color": "primary",
      "format": {
        "decimals": 0,
        "prefix": "£",
        "separator": true
      },
      "yLabel": "Change (£ a year)"
    }
  ],
  "data": [
    {
      "age": "0 to 15",
      "share": 1.7,
      "change": -244
    },
    {
      "age": "16 to 24",
      "share": 7.8,
      "change": -1005
    },
    {
      "age": "25 to 34",
      "share": 0.9,
      "change": -115
    },
    {
      "age": "35 to 49",
      "share": 1.4,
      "change": -188
    },
    {
      "age": "50 to 64",
      "share": 2.3,
      "change": -287
    },
    {
      "age": "65+",
      "share": 0.3,
      "change": -40
    },
    {
      "age": "All",
      "share": 2.0,
      "change": -266
    }
  ],
  "select": {
    "label": "Measure"
  },
  "subtitle": "Each person takes their household's change; people of other ages live with an affected young person"
}
```

PolicyEngine estimates. Each person takes their household's change in net income, averaged over everyone in the age group, so it differs from Figure 2's average over households. People of other ages see a change only where they share a household with a young person whose PIP or health element ends. Run together at our assumed work allowance, the higher rate and the work allowance would raise household net income for 545,000 people aged 16 to 24 (7.3%) in 2029-30.

[See the results by age on the dashboard](https://www.policyengine.org/uk/milburn-review?tab=dashboard&sub=age).

### Young people by NEET status

On our approximation, 1.07 million people (14.3% of 16 to 24-year-olds) are NEET in 2029-30. The Office for National Statistics [estimates](https://www.ons.gov.uk/employmentandlabourmarket/peoplenotinwork/unemployment/bulletins/youngpeoplenotineducationemploymentortrainingneet/august2026) 981,000 (13.0%) for April to June 2026 from the Labour Force Survey, on its own definition and at a point in time, so the two are not like for like.

**Table 7: The two removals and people aged 16 to 24, by NEET status, static, 2029-30**

|                                                   | NEET (approximation) | Other 16 to 24-year-olds | All 16 to 24-year-olds |
| ------------------------------------------------- | -------------------: | -----------------------: | ---------------------: |
| People                                            |            1,073,000 |                6,412,000 |              7,485,000 |
| In households whose net income falls              |      19.4% (208,000) |           5.8% (372,000) |         7.8% (580,000) |
| Whose own PIP or health element ends              |      16.7% (180,000) |           3.3% (212,000) |         5.2% (391,000) |
| Average change in household net income (£ a year) |               −2,556 |                     −746 |                 −1,005 |

PolicyEngine estimates, from the [NEET table on the dashboard](https://www.policyengine.org/uk/milburn-review?tab=dashboard&sub=age&age=16-24). A person counts in the third row if the two removals would end their own PIP, or the health element in an award in which they are the claimant with limited capability for work; each person counts once. The averages hold employment fixed. Our 2025 data put 90.6% of 16 to 24-year-olds receiving the UC health element in Great Britain on PIP too, against 62.5% in [the Resolution Foundation's figures](https://www.resolutionfoundation.org/press-releases/government-must-match-milburns-ambition-to-properly-invest-in-young-people/), so more of the people in the third row receive both payments than its figures imply. The data count part-time students as in education, and someone who worked earlier in the year as not NEET. Figures may not sum because of rounding.

### Poverty

```chart
{
  "type": "bar",
  "title": "Figure 4: Change in poverty under the two removals, static, 2029-30",
  "xKey": "measure",
  "orientation": "horizontal",
  "series": [
    {
      "key": "pp",
      "name": "All people (percentage points)",
      "color": "primary",
      "format": {
        "decimals": 1,
        "signed": true
      },
      "yLabel": "Change (percentage points)"
    },
    {
      "key": "people",
      "name": "All people (number)",
      "color": "primary",
      "format": {
        "decimals": 0,
        "signed": true,
        "separator": true
      },
      "yLabel": "Change (people)"
    },
    {
      "key": "child",
      "name": "Children (percentage points)",
      "color": "primary",
      "format": {
        "decimals": 1,
        "signed": true
      },
      "yLabel": "Change (percentage points)"
    }
  ],
  "data": [
    {
      "measure": "Absolute, before housing costs",
      "pp": 0.5,
      "people": 342000,
      "child": 0.7
    },
    {
      "measure": "Absolute, after housing costs",
      "pp": 0.6,
      "people": 391000,
      "child": 1.0
    },
    {
      "measure": "Relative, before housing costs",
      "pp": 0.4,
      "people": 256000,
      "child": 0.5
    },
    {
      "measure": "Relative, after housing costs",
      "pp": 0.4,
      "people": 260000,
      "child": 0.6
    }
  ],
  "select": {
    "label": "Measure"
  },
  "subtitle": "Change against current law"
}
```

**Table 8: Change in poverty under the two removals, static, 2029-30**

| Measure                        | All people (percentage points) | All people (number) | Children (percentage points) |
| ------------------------------ | -----------------------------: | ------------------: | ---------------------------: |
| Absolute, before housing costs |                           +0.5 |            +342,000 |                         +0.7 |
| Absolute, after housing costs  |                           +0.6 |            +391,000 |                         +1.0 |
| Relative, before housing costs |                           +0.4 |            +256,000 |                         +0.5 |
| Relative, after housing costs  |                           +0.4 |            +260,000 |                         +0.6 |

PolicyEngine estimates, from [poverty on the dashboard](https://www.policyengine.org/uk/milburn-review?tab=dashboard&sub=poverty). Absolute poverty before housing costs would rise by 0.5 percentage points, or 342,000 people, and relative poverty after housing costs by 0.4 points, or 260,000 people. Children here are HBAI dependent children: everyone under 16, and 16 to 19-year-olds in non-advanced education living with a parent, who include 18 and 19-year-olds whose own PIP would end. Absolute child poverty before housing costs would rise by 0.7 points, against 0.5 for all people. The same holds for each removal on its own: 0.6 against 0.4 points for PIP; for the health element both round to 0.1 points, the children's figure the higher. Our results don't split child poverty by age or by whose benefit ends, so they don't show the reason. Absolute poverty before housing costs would rise by 0.5 points in each of 2030-31 and 2031-32, and relative poverty after housing costs by 0.4 and 0.3 points.

The review estimates that relative poverty after housing costs would fall by 50,000 people, a steady-state estimate that its [annex](https://www.gov.uk/government/publications/from-a-welfare-state-to-a-working-state-a-new-settlement-for-the-next-generation/from-a-welfare-state-to-a-working-state-analytical-annex) models up to 2030-31 with DWP's Policy Simulation Model. It includes the Additional Cost Allowance, the Severe and Complex Needs Insurance, the Health and Disability Fund, the Youth Allowance, the work allowance and 440,000 more young people in work; our estimate includes none of these. The review doesn't publish how much of its figure comes from each part, or a poverty figure for children.

### Inequality

On a static basis, the two removals would raise the Gini index of income inequality by 0.5% in each year from 2029-30 to 2031-32, and the share of income going to the highest-income tenth of people by 0.1 percentage points.

## How our estimates compare with the review's

The review publishes its costings for 2036-37, in 2026-27 prices; our model runs to 2031-32 in cash terms, so the two share no year.

**Table 9: The review's estimates for 2036-37 (£ million, 2026-27 prices)**

|                                    |   2036-37 |
| ---------------------------------- | --------: |
| **Spending**                       |           |
| Education                          |     2,100 |
| Opportunity and Support Guarantees |     1,900 |
| Youth hiring incentives            |     1,100 |
| Health                             |       700 |
| Local system reform                | under 100 |
| Total spending                     |     5,800 |
| **Savings**                        |           |
| Welfare savings                    |     3,600 |
| Fiscal offsets                     |     2,400 |
| **Net saving**                     |       200 |

Source: the review's [data tables](https://assets.publishing.service.gov.uk/media/6af74c9b9be17c68c69ca838/from-a-welfare-state-to-a-working-state-accompanying-data-tables.ods), table 2, and [analytical annex](https://www.gov.uk/government/publications/from-a-welfare-state-to-a-working-state-a-new-settlement-for-the-next-generation/from-a-welfare-state-to-a-working-state-analytical-annex), section 1, rounded to the nearest £100 million. The review's table shows the net saving as a total net cost of −£200 million.

On the review's figures, the proposals it costs would save £0.2 billion in 2036-37; none of its lines includes the National Insurance change. Its welfare savings of £3.6 billion cover PIP and UC across the UK, net of its replacement awards, its Youth Allowance and work allowance and the new UC claims it expects, with an assumed rise in employment among UC health claimants. Fiscal offsets are the extra tax paid, and benefits no longer paid, as employment rises.

**Table 10: The review's figures and ours**

| Figure                                  |     Published | Source                                                                                                                                                                                         | PolicyEngine | Basis                                                                                                                                                      |
| --------------------------------------- | ------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -----------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Welfare saving                          |        £3.6bn | [Review](https://www.gov.uk/government/publications/from-a-welfare-state-to-a-working-state-a-new-settlement-for-the-next-generation/from-a-welfare-state-to-a-working-state-analytical-annex) |       £4.7bn | Review: 2036-37, 2026-27 prices, net of its new support and claims, with a rise in employment; ours: 2029-30, cash, static, no replacement awards; both UK |
| PIP spending, 16 to 24                  |        £3.8bn | [Interim report Table 28](https://www.gov.uk/government/publications/young-people-and-work-interim-report)                                                                                     |       £3.3bn | England and Wales; review 2025-26, ours 2025                                                                                                               |
| PIP spending, 18 to 24                  |             — | —                                                                                                                                                                                              |       £3.1bn | Ours: UK, 2029-30                                                                                                                                          |
| UC health element spending              |       £0.92bn | [Interim report Table 28](https://www.gov.uk/government/publications/young-people-and-work-interim-report)                                                                                     |       £1.2bn | Review: 16 to 24, England and Wales, 2025-26; ours: young claimants, Great Britain, 2025                                                                   |
| Young people with the UC health element |       181,000 | [Interim report Table 28](https://www.gov.uk/government/publications/young-people-and-work-interim-report)                                                                                     |      233,000 | 16 to 24; review: England and Wales, 2025-26; ours: Great Britain, 2025                                                                                    |
| Young people with the UC health element |       176,000 | [Resolution Foundation](https://www.resolutionfoundation.org/press-releases/government-must-match-milburns-ambition-to-properly-invest-in-young-people/)                                       |      233,000 | 16 to 24; ours: Great Britain, 2025                                                                                                                        |
| Of whom also receiving PIP              |         62.5% | [Resolution Foundation](https://www.resolutionfoundation.org/press-releases/government-must-match-milburns-ambition-to-properly-invest-in-young-people/)                                       |        90.6% | 16 to 24; ours: Great Britain, 2025                                                                                                                        |
| Young people receiving PIP              | about 408,000 | [DWP Stat-Xplore](https://stat-xplore.dwp.gov.uk/)                                                                                                                                             |      407,000 | 16 to 24, England and Wales, 2025                                                                                                                          |
| Young people receiving PIP              |       465,000 | [Interim report Table 28](https://www.gov.uk/government/publications/young-people-and-work-interim-report)                                                                                     |      407,000 | 16 to 24, England and Wales; review 2025-26, ours 2025                                                                                                     |

Published figures as linked; the PolicyEngine column is PolicyEngine estimates. The review takes its 2025-26 spending figures from Table 28 of the [interim report](https://www.gov.uk/government/publications/young-people-and-work-interim-report)'s analytical annex data tables, which cover England and Wales.

The estimates differ for these reasons:

- **Design.** The review's saving is net of its replacement awards, its Youth Allowance and work allowance and the new UC claims it expects. Our £4.7 billion leaves out all of these; our £4.1 billion adds the higher rate and the work allowance.
- **Behaviour.** The review's welfare saving assumes a 9% rise in employment among UC health claimants. Ours is static.
- **Age band and area.** The review's spending figures cover 16 to 24-year-olds in England and Wales; our PIP change covers 18 to 24-year-olds in the UK. Our 2025 PIP spending covers England and Wales, as the review's does, and is 14% lower than its figure. Our 2025 health element spending covers Great Britain, so it doesn't compare like for like with the review's England and Wales figure.
- **Data.** Our 2025 data count 33% more young people receiving the UC health element than the Resolution Foundation reported, and 90.6% of them also receive PIP, against 62.5% in its figures, so in our data more young people would no longer receive either payment than its counts imply. Within ages 16 to 24 the data overcount PIP recipients aged 16 to 19 in England and undercount those aged 20 to 24, which affects a change that starts at 18. After 2025 the data grow young caseloads with the population only, while the interim report's Table 28 has PIP at ages 16 to 24 in England and Wales rising from 416,000 in 2024-25 to 511,000 in 2026-27 and 634,000 in 2029-30.

[See the benchmarks on the dashboard](https://www.policyengine.org/uk/milburn-review?tab=dashboard&sub=benchmarks).

## Household examples

The dashboard's [household calculator](https://www.policyengine.org/uk/milburn-review?tab=household) stores eight examples for 2029-30, each comparing net income under current law with the two removals together and with each other change on its own. Net income is before housing costs. We model a young person living with their parents as their own household, without the parents' income or rent; the appendix gives the other assumptions.

```household
{"type":"household","title":"Figure 5: Household net income under current law and under each modelled change, static, 2029-30","changes":[{"id":"removals","label":"Two removals"},{"id":"higher","label":"Higher rate"},{"id":"work","label":"Work allowance"},{"id":"nics","label":"Employer National Insurance"}],"examples":[{"id":"with_parents_health","label":"20, living with parents; UC health element (claim from April 2026); standard-rate PIP daily living; no earnings","results":{"removals":{"net":[11504.33,4543.49],"rows":[{"label":"Benefits","values":[11504.33,4543.49],"children":[{"label":"Universal Credit","values":[7150.61,4543.49],"children":[{"label":"Standard allowance","values":[4543.49,4543.49]},{"label":"Health element (LCWRA)","values":[2607.12,0.0]}]},{"label":"Personal Independence Payment","values":[4353.72,0.0],"children":[{"label":"Daily living","values":[4353.72,0.0]}]}]}]},"higher":{"net":[11504.33,11504.33],"rows":[{"label":"Benefits","values":[11504.33,11504.33],"children":[{"label":"Universal Credit","values":[7150.61,7150.61],"children":[{"label":"Standard allowance","values":[4543.49,4543.49]},{"label":"Health element (LCWRA)","values":[2607.12,2607.12]}]},{"label":"Personal Independence Payment","values":[4353.72,4353.72],"children":[{"label":"Daily living","values":[4353.72,4353.72]}]}]}]},"work":{"net":[11504.33,11504.33],"rows":[{"label":"Benefits","values":[11504.33,11504.33],"children":[{"label":"Universal Credit","values":[7150.61,7150.61],"children":[{"label":"Standard allowance","values":[4543.49,4543.49]},{"label":"Health element (LCWRA)","values":[2607.12,2607.12]}]},{"label":"Personal Independence Payment","values":[4353.72,4353.72],"children":[{"label":"Daily living","values":[4353.72,4353.72]}]}]}]},"nics":{"net":[11504.33,11504.33],"rows":[{"label":"Benefits","values":[11504.33,11504.33],"children":[{"label":"Universal Credit","values":[7150.61,7150.61],"children":[{"label":"Standard allowance","values":[4543.49,4543.49]},{"label":"Health element (LCWRA)","values":[2607.12,2607.12]}]},{"label":"Personal Independence Payment","values":[4353.72,4353.72],"children":[{"label":"Daily living","values":[4353.72,4353.72]}]}]}]}}},{"id":"renting_health","label":"22, renting alone; UC health element (claim before April 2026); enhanced-rate PIP daily living; no earnings","results":{"removals":{"net":[22398.18,9302.45],"rows":[{"label":"Benefits","values":[22578.19,9482.45],"children":[{"label":"Universal Credit","values":[16073.15,9482.45],"children":[{"label":"Standard allowance","values":[4543.49,4543.49]},{"label":"Health element (LCWRA)","values":[5529.65,0.0]},{"label":"Housing costs element","values":[6000.0,4938.96]}]},{"label":"Personal Independence Payment","values":[6505.04,0.0],"children":[{"label":"Daily living","values":[6505.04,0.0]}]}]},{"label":"Taxes","values":[180.0,180.0],"children":[{"label":"TV licence","values":[180.0,180.0]}]}]},"higher":{"net":[22398.18,23556.53],"rows":[{"label":"Benefits","values":[22578.19,23736.54],"children":[{"label":"Universal Credit","values":[16073.15,17231.5],"children":[{"label":"Standard allowance","values":[4543.49,5701.84]},{"label":"Health element (LCWRA)","values":[5529.65,5529.65]},{"label":"Housing costs element","values":[6000.0,6000.0]}]},{"label":"Personal Independence Payment","values":[6505.04,6505.04],"children":[{"label":"Daily living","values":[6505.04,6505.04]}]}]},{"label":"Taxes","values":[180.0,180.0],"children":[{"label":"TV licence","values":[180.0,180.0]}]}]},"work":{"net":[22398.18,22398.18],"rows":[{"label":"Benefits","values":[22578.19,22578.19],"children":[{"label":"Universal Credit","values":[16073.15,16073.15],"children":[{"label":"Standard allowance","values":[4543.49,4543.49]},{"label":"Health element (LCWRA)","values":[5529.65,5529.65]},{"label":"Housing costs element","values":[6000.0,6000.0]}]},{"label":"Personal Independence Payment","values":[6505.04,6505.04],"children":[{"label":"Daily living","values":[6505.04,6505.04]}]}]},{"label":"Taxes","values":[180.0,180.0],"children":[{"label":"TV licence","values":[180.0,180.0]}]}]},"nics":{"net":[22398.18,22398.18],"rows":[{"label":"Benefits","values":[22578.19,22578.19],"children":[{"label":"Universal Credit","values":[16073.15,16073.15],"children":[{"label":"Standard allowance","values":[4543.49,4543.49]},{"label":"Health element (LCWRA)","values":[5529.65,5529.65]},{"label":"Housing costs element","values":[6000.0,6000.0]}]},{"label":"Personal Independence Payment","values":[6505.04,6505.04],"children":[{"label":"Daily living","values":[6505.04,6505.04]}]}]},{"label":"Taxes","values":[180.0,180.0],"children":[{"label":"TV licence","values":[180.0,180.0]}]}]}}},{"id":"renting_health_25","label":"25, renting alone; as the 22-year-old","results":{"removals":{"net":[23556.53,23556.53],"rows":[{"label":"Benefits","values":[23736.54,23736.54],"children":[{"label":"Universal Credit","values":[17231.5,17231.5],"children":[{"label":"Standard allowance","values":[5701.84,5701.84]},{"label":"Health element (LCWRA)","values":[5529.65,5529.65]},{"label":"Housing costs element","values":[6000.0,6000.0]}]},{"label":"Personal Independence Payment","values":[6505.04,6505.04],"children":[{"label":"Daily living","values":[6505.04,6505.04]}]}]},{"label":"Taxes","values":[180.0,180.0],"children":[{"label":"TV licence","values":[180.0,180.0]}]}]},"higher":{"net":[23556.53,23556.53],"rows":[{"label":"Benefits","values":[23736.54,23736.54],"children":[{"label":"Universal Credit","values":[17231.5,17231.5],"children":[{"label":"Standard allowance","values":[5701.84,5701.84]},{"label":"Health element (LCWRA)","values":[5529.65,5529.65]},{"label":"Housing costs element","values":[6000.0,6000.0]}]},{"label":"Personal Independence Payment","values":[6505.04,6505.04],"children":[{"label":"Daily living","values":[6505.04,6505.04]}]}]},{"label":"Taxes","values":[180.0,180.0],"children":[{"label":"TV licence","values":[180.0,180.0]}]}]},"work":{"net":[23556.53,23556.53],"rows":[{"label":"Benefits","values":[23736.54,23736.54],"children":[{"label":"Universal Credit","values":[17231.5,17231.5],"children":[{"label":"Standard allowance","values":[5701.84,5701.84]},{"label":"Health element (LCWRA)","values":[5529.65,5529.65]},{"label":"Housing costs element","values":[6000.0,6000.0]}]},{"label":"Personal Independence Payment","values":[6505.04,6505.04],"children":[{"label":"Daily living","values":[6505.04,6505.04]}]}]},{"label":"Taxes","values":[180.0,180.0],"children":[{"label":"TV licence","values":[180.0,180.0]}]}]},"nics":{"net":[23556.53,23556.53],"rows":[{"label":"Benefits","values":[23736.54,23736.54],"children":[{"label":"Universal Credit","values":[17231.5,17231.5],"children":[{"label":"Standard allowance","values":[5701.84,5701.84]},{"label":"Health element (LCWRA)","values":[5529.65,5529.65]},{"label":"Housing costs element","values":[6000.0,6000.0]}]},{"label":"Personal Independence Payment","values":[6505.04,6505.04],"children":[{"label":"Daily living","values":[6505.04,6505.04]}]}]},{"label":"Taxes","values":[180.0,180.0],"children":[{"label":"TV licence","values":[180.0,180.0]}]}]}}},{"id":"college_17","label":"17, at college, living with parents; standard-rate PIP daily living; no UC","results":{"removals":{"net":[4353.72,4353.72],"rows":[{"label":"Benefits","values":[4353.72,4353.72],"children":[{"label":"Personal Independence Payment","values":[4353.72,4353.72],"children":[{"label":"Daily living","values":[4353.72,4353.72]}]}]}]},"higher":{"net":[4353.72,4353.72],"rows":[{"label":"Benefits","values":[4353.72,4353.72],"children":[{"label":"Personal Independence Payment","values":[4353.72,4353.72],"children":[{"label":"Daily living","values":[4353.72,4353.72]}]}]}]},"work":{"net":[4353.72,4353.72],"rows":[{"label":"Benefits","values":[4353.72,4353.72],"children":[{"label":"Personal Independence Payment","values":[4353.72,4353.72],"children":[{"label":"Daily living","values":[4353.72,4353.72]}]}]}]},"nics":{"net":[4353.72,4353.72],"rows":[{"label":"Benefits","values":[4353.72,4353.72],"children":[{"label":"Personal Independence Payment","values":[4353.72,4353.72],"children":[{"label":"Daily living","values":[4353.72,4353.72]}]}]}]}}},{"id":"couple_partner_health","label":"23, renting with a partner aged 27 who has limited capability for work; no earnings","results":{"removals":{"net":[20299.9,20299.9],"rows":[{"label":"Benefits","values":[20479.9,20479.9],"children":[{"label":"Universal Credit","values":[20479.9,20479.9],"children":[{"label":"Standard allowance","values":[8950.25,8950.25]},{"label":"Health element (LCWRA)","values":[5529.65,5529.65]},{"label":"Housing costs element","values":[6000.0,6000.0]}]}]},{"label":"Taxes","values":[180.0,180.0],"children":[{"label":"TV licence","values":[180.0,180.0]}]}]},"higher":{"net":[20299.9,20299.9],"rows":[{"label":"Benefits","values":[20479.9,20479.9],"children":[{"label":"Universal Credit","values":[20479.9,20479.9],"children":[{"label":"Standard allowance","values":[8950.25,8950.25]},{"label":"Health element (LCWRA)","values":[5529.65,5529.65]},{"label":"Housing costs element","values":[6000.0,6000.0]}]}]},{"label":"Taxes","values":[180.0,180.0],"children":[{"label":"TV licence","values":[180.0,180.0]}]}]},"work":{"net":[20299.9,20299.9],"rows":[{"label":"Benefits","values":[20479.9,20479.9],"children":[{"label":"Universal Credit","values":[20479.9,20479.9],"children":[{"label":"Standard allowance","values":[8950.25,8950.25]},{"label":"Health element (LCWRA)","values":[5529.65,5529.65]},{"label":"Housing costs element","values":[6000.0,6000.0]}]}]},{"label":"Taxes","values":[180.0,180.0],"children":[{"label":"TV licence","values":[180.0,180.0]}]}]},"nics":{"net":[20299.9,20299.9],"rows":[{"label":"Benefits","values":[20479.9,20479.9],"children":[{"label":"Universal Credit","values":[20479.9,20479.9],"children":[{"label":"Standard allowance","values":[8950.25,8950.25]},{"label":"Health element (LCWRA)","values":[5529.65,5529.65]},{"label":"Housing costs element","values":[6000.0,6000.0]}]}]},{"label":"Taxes","values":[180.0,180.0],"children":[{"label":"TV licence","values":[180.0,180.0]}]}]}}},{"id":"retail_part_time","label":"21, renting alone; 15 hours a week at the minimum wage in retail; UC","results":{"removals":{"net":[14156.03,14156.03],"rows":[{"label":"Market income","values":[10785.71,10785.71],"children":[{"label":"Employment income","values":[10785.71,10785.71],"children":[{"label":"Pay cut for the salary sacrifice cap (current law)","values":[-17.28,-17.28]}]}]},{"label":"Benefits","values":[3550.31,3550.31],"children":[{"label":"Universal Credit","values":[3550.31,3550.31],"children":[{"label":"Standard allowance","values":[4543.49,4543.49]},{"label":"Housing costs element","values":[4938.96,4938.96]},{"label":"Less: withdrawn against income","values":[-5932.14,-5932.14]}]}]},{"label":"Taxes","values":[180.0,180.0],"children":[{"label":"TV licence","values":[180.0,180.0]}]}]},"higher":{"net":[14156.03,15314.38],"rows":[{"label":"Market income","values":[10785.71,10785.71],"children":[{"label":"Employment income","values":[10785.71,10785.71],"children":[{"label":"Pay cut for the salary sacrifice cap (current law)","values":[-17.28,-17.28]}]}]},{"label":"Benefits","values":[3550.31,4708.66],"children":[{"label":"Universal Credit","values":[3550.31,4708.66],"children":[{"label":"Standard allowance","values":[4543.49,5701.84]},{"label":"Housing costs element","values":[4938.96,4938.96]},{"label":"Less: withdrawn against income","values":[-5932.14,-5932.14]}]}]},{"label":"Taxes","values":[180.0,180.0],"children":[{"label":"TV licence","values":[180.0,180.0]}]}]},"work":{"net":[14156.03,17232.36],"rows":[{"label":"Market income","values":[10785.71,10785.71],"children":[{"label":"Employment income","values":[10785.71,10785.71],"children":[{"label":"Pay cut for the salary sacrifice cap (current law)","values":[-17.28,-17.28]}]}]},{"label":"Benefits","values":[3550.31,6626.64],"children":[{"label":"Universal Credit","values":[3550.31,6626.64],"children":[{"label":"Standard allowance","values":[4543.49,4543.49]},{"label":"Housing costs element","values":[4938.96,4938.96]},{"label":"Less: withdrawn against income","values":[-5932.14,-2855.81]}]}]},{"label":"Taxes","values":[180.0,180.0],"children":[{"label":"TV licence","values":[180.0,180.0]}]}]},"nics":{"net":[14156.03,14449.5],"rows":[{"label":"Market income","values":[10785.71,11437.89],"children":[{"label":"Employment income","values":[10785.71,11437.89],"children":[{"label":"Pay cut for the salary sacrifice cap (current law)","values":[-17.28,-17.28]}]}]},{"label":"Benefits","values":[3550.31,3191.61],"children":[{"label":"Universal Credit","values":[3550.31,3191.61],"children":[{"label":"Standard allowance","values":[4543.49,4543.49]},{"label":"Housing costs element","values":[4938.96,4938.96]},{"label":"Less: withdrawn against income","values":[-5932.14,-6290.84]}]}]},{"label":"Taxes","values":[180.0,180.0],"children":[{"label":"TV licence","values":[180.0,180.0]}]}]}}},{"id":"hospitality_health","label":"24, renting alone; 20 hours a week at the minimum wage in hospitality (food and drink service); UC health element; standard-rate PIP daily living","results":{"removals":{"net":[29566.45,18622.04],"rows":[{"label":"Market income","values":[14380.95,14380.95],"children":[{"label":"Employment income","values":[14380.95,14380.95],"children":[{"label":"Pay cut for the salary sacrifice cap (current law)","values":[-23.05,-23.05]}]}]},{"label":"Benefits","values":[15872.56,4928.15],"children":[{"label":"Universal Credit","values":[11518.84,4928.15],"children":[{"label":"Standard allowance","values":[4543.49,4543.49]},{"label":"Health element (LCWRA)","values":[5529.65,0.0]},{"label":"Housing costs element","values":[6000.0,4938.96]},{"label":"Less: withdrawn against income","values":[-4554.3,-4554.3]}]},{"label":"Personal Independence Payment","values":[4353.72,0.0],"children":[{"label":"Daily living","values":[4353.72,0.0]}]}]},{"label":"Taxes","values":[687.07,687.07],"children":[{"label":"Income Tax","values":[362.19,362.19]},{"label":"Employee National Insurance","values":[144.88,144.88]},{"label":"TV licence","values":[180.0,180.0]}]}]},"higher":{"net":[29566.45,30724.8],"rows":[{"label":"Market income","values":[14380.95,14380.95],"children":[{"label":"Employment income","values":[14380.95,14380.95],"children":[{"label":"Pay cut for the salary sacrifice cap (current law)","values":[-23.05,-23.05]}]}]},{"label":"Benefits","values":[15872.56,17030.92],"children":[{"label":"Universal Credit","values":[11518.84,12677.2],"children":[{"label":"Standard allowance","values":[4543.49,5701.84]},{"label":"Health element (LCWRA)","values":[5529.65,5529.65]},{"label":"Housing costs element","values":[6000.0,6000.0]},{"label":"Less: withdrawn against income","values":[-4554.3,-4554.29]}]},{"label":"Personal Independence Payment","values":[4353.72,4353.72],"children":[{"label":"Daily living","values":[4353.72,4353.72]}]}]},{"label":"Taxes","values":[687.07,687.07],"children":[{"label":"Income Tax","values":[362.19,362.19]},{"label":"Employee National Insurance","values":[144.88,144.88]},{"label":"TV licence","values":[180.0,180.0]}]}]},"work":{"net":[29566.45,29566.45],"rows":[{"label":"Market income","values":[14380.95,14380.95],"children":[{"label":"Employment income","values":[14380.95,14380.95],"children":[{"label":"Pay cut for the salary sacrifice cap (current law)","values":[-23.05,-23.05]}]}]},{"label":"Benefits","values":[15872.56,15872.56],"children":[{"label":"Universal Credit","values":[11518.84,11518.84],"children":[{"label":"Standard allowance","values":[4543.49,4543.49]},{"label":"Health element (LCWRA)","values":[5529.65,5529.65]},{"label":"Housing costs element","values":[6000.0,6000.0]},{"label":"Less: withdrawn against income","values":[-4554.3,-4554.3]}]},{"label":"Personal Independence Payment","values":[4353.72,4353.72],"children":[{"label":"Daily living","values":[4353.72,4353.72]}]}]},{"label":"Taxes","values":[687.07,687.07],"children":[{"label":"Income Tax","values":[362.19,362.19]},{"label":"Employee National Insurance","values":[144.88,144.88]},{"label":"TV licence","values":[180.0,180.0]}]}]},"nics":{"net":[29566.45,29777.75],"rows":[{"label":"Market income","values":[14380.95,15033.13],"children":[{"label":"Employment income","values":[14380.95,15033.13],"children":[{"label":"Pay cut for the salary sacrifice cap (current law)","values":[-23.05,-23.05]}]}]},{"label":"Benefits","values":[15872.56,15614.3],"children":[{"label":"Universal Credit","values":[11518.84,11260.58],"children":[{"label":"Standard allowance","values":[4543.49,4543.49]},{"label":"Health element (LCWRA)","values":[5529.65,5529.65]},{"label":"Housing costs element","values":[6000.0,6000.0]},{"label":"Less: withdrawn against income","values":[-4554.3,-4812.56]}]},{"label":"Personal Independence Payment","values":[4353.72,4353.72],"children":[{"label":"Daily living","values":[4353.72,4353.72]}]}]},{"label":"Taxes","values":[687.07,869.68],"children":[{"label":"Income Tax","values":[362.19,492.63]},{"label":"Employee National Insurance","values":[144.88,197.05]},{"label":"TV licence","values":[180.0,180.0]}]}]}}},{"id":"lone_parent","label":"19, lone parent of a child aged 1, renting; UC; no earnings","results":{"removals":{"net":[15880.29,15880.29],"rows":[{"label":"Benefits","values":[16060.29,16060.29],"children":[{"label":"Universal Credit","values":[14524.85,14524.85],"children":[{"label":"Standard allowance","values":[4543.49,4543.49]},{"label":"Child element","values":[3981.35,3981.35]},{"label":"Housing costs element","values":[6000.0,6000.0]}]},{"label":"Child Benefit","values":[1535.44,1535.44]}]},{"label":"Taxes","values":[180.0,180.0],"children":[{"label":"TV licence","values":[180.0,180.0]}]}]},"higher":{"net":[15880.29,17038.64],"rows":[{"label":"Benefits","values":[16060.29,17218.64],"children":[{"label":"Universal Credit","values":[14524.85,15683.2],"children":[{"label":"Standard allowance","values":[4543.49,5701.84]},{"label":"Child element","values":[3981.35,3981.35]},{"label":"Housing costs element","values":[6000.0,6000.0]}]},{"label":"Child Benefit","values":[1535.44,1535.44]}]},{"label":"Taxes","values":[180.0,180.0],"children":[{"label":"TV licence","values":[180.0,180.0]}]}]},"work":{"net":[15880.29,15880.29],"rows":[{"label":"Benefits","values":[16060.29,16060.29],"children":[{"label":"Universal Credit","values":[14524.85,14524.85],"children":[{"label":"Standard allowance","values":[4543.49,4543.49]},{"label":"Child element","values":[3981.35,3981.35]},{"label":"Housing costs element","values":[6000.0,6000.0]}]},{"label":"Child Benefit","values":[1535.44,1535.44]}]},{"label":"Taxes","values":[180.0,180.0],"children":[{"label":"TV licence","values":[180.0,180.0]}]}]},"nics":{"net":[15880.29,15880.29],"rows":[{"label":"Benefits","values":[16060.29,16060.29],"children":[{"label":"Universal Credit","values":[14524.85,14524.85],"children":[{"label":"Standard allowance","values":[4543.49,4543.49]},{"label":"Child element","values":[3981.35,3981.35]},{"label":"Housing costs element","values":[6000.0,6000.0]}]},{"label":"Child Benefit","values":[1535.44,1535.44]}]},{"label":"Taxes","values":[180.0,180.0],"children":[{"label":"TV licence","values":[180.0,180.0]}]}]}}}],"subtitle":"£ a year. Choose a household and a change; net income is market income plus benefits, less taxes.","note":"PolicyEngine estimates, from the dashboard's household calculator. Each change is a separate run against current law. Taxes include the model's £180 TV licence. Figures may not sum because of rounding."}
```

The 25-year-old is above the review's age limit, and the 17-year-old below the PIP change's.

- **The 22-year-old renting alone** would no longer receive the health element or PIP, and without PIP daily living their housing element would fall to the shared accommodation rate, by £1,061.
- **The couple** would keep the health element, because the partner with limited capability for work is 27, and the higher rate applies only where every claimant is under 25.
- **The 21-year-old in retail** works 15 hours a week at the minimum wage, the review's example of pay below a £10,000 threshold at current rates. At the 2029-30 minimum wage that pay is £10,786, above the threshold, so employer National Insurance would fall but not to zero.
- **The 24-year-old in hospitality** would no longer receive the health element, PIP or the shared accommodation rate exemption. The work allowance run doesn't change their net income, because the assessment we keep already gives them a work allowance.

In a further, constructed example, a 19-year-old with the standard rate of the PIP daily living component lives with their parent, aged 50, who owns the home, doesn't work, cares for them for 40 hours a week and receives Carer's Allowance and UC with the carer element. Under the two removals, household net income would fall by £4,354 a year, the young person's PIP. The model keeps the parent's Carer's Allowance (£4,907 a year) and carer element (£2,742). If the replacements did not qualify the parent for either award, household net income could fall further, by less than the two awards added together, since DWP deducts Carer's Allowance from UC pound for pound (see [how Carer's Allowance affects UC](https://www.gov.uk/carers-allowance/effect-on-other-benefits)).

## Methodology

Our estimates come from PolicyEngine's [Milburn review dashboard](https://www.policyengine.org/uk/milburn-review), which runs the [`policyengine` Python package (version 6.20.2)](https://pypi.org/project/policyengine/6.20.2/) with [PolicyEngine UK (version 2.177.7)](https://github.com/PolicyEngine/policyengine-uk/tree/2.177.7) on [Microcosm UK](https://www.policyengine.org/uk/model/data), our survey-based dataset. Prices and earnings follow the Office for Budget Responsibility's October 2026 forecast. Each estimate is static: people work, earn and claim as they would without the change.

The results for each run, by decile, age and NEET status, and the household examples come from the dashboard's results tables. The split of the PIP saving, the Scottish figure and the overlap of the two removals come from further runs on the same model and data, and the 2025 figures from the same data build at its 2025 calibration. The carer example is a constructed household, run on the same model. Every figure from the review comes from its report, analytical annex or data tables, as cited.

## Appendix: other modelling choices

The dashboard's [Methodology tab](https://www.policyengine.org/uk/milburn-review?tab=methodology) gives the full detail. These choices don't move the results in a single direction:

- we hold employment fixed, where the review assumes more young people move into work;
- we set the work allowance at a level the review doesn't give (Table 4);
- we use the housing costs element as the marker for living independently;
- we give the health element's lower rate for claims from April 2026 to a random share of awards;
- we approximate NEET status from earnings and the data's education input;
- our data count 33% more young people receiving the UC health element than the Resolution Foundation reports, put 2025 PIP spending in England and Wales 14% below the review's 2025-26 figure, and grow young caseloads with the population only after 2025 (see the comparison with the review's estimates);
- our results end in 2031-32.

The phased run and the household examples also rest on these assumptions:

- **Phased run.** People who turned 18 since April 2028 move at once, and 45% of the remaining claimants are reassessed each year, drawn at random because the data hold no reassessment dates.
- **Household examples.** Renters pay £500 a month to a private landlord in the North West. Net income is after taxes and benefits and before housing costs. It leaves out Council Tax and takes off the model's £180 TV licence, which a young person living with their parents doesn't pay. Every award is claimed in full.
