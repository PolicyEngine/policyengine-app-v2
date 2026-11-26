On 24 November 2026 the Department for Work and Pensions (DWP) [published](https://www.gov.uk/government/publications/the-timms-review-final-report) the final report of the Timms Review of Personal Independence Payment (PIP), _Making PIP fit for purpose: A new vision_. Its steering group, co-chaired by Sharon Brennan, Dr Clenton Farquharson and Sir Stephen Timms, makes 15 recommendations to improve the current benefit and sets out principles for a reformed one. The report states that its recommendations "do not constitute government policy" (p. 6). It proposes no change to PIP's rates, components, points thresholds or age limits, and its terms of reference require PIP spending to stay within the Office for Budget Responsibility's (OBR) forecast (p. 15).

The change with the clearest effect on incomes is one the report discusses rather than recommends: the government's plan to make the PIP daily living component the single route to the Universal Credit (UC) health element. The report says "not all of the steering group endorse this commitment" (p. 119). PolicyEngine UK's static microsimulation gives these results for 2029-30 if that route applied to every UC award:

- UC spending would fall by £3.1 billion.
- 703,000 UC claimants with limited capability for work and work-related activity who don't receive PIP daily living would lose the health element. 227,000 claimants who receive PIP daily living but not the element would gain it.
- 1.7 million people would live in households whose net income falls, and 0.8 million in households whose net income rises.
- Absolute poverty before housing costs would rise by 0.2 percentage points, or 148,000 people.

If existing awards kept the element and only people on PIP daily living gained it, UC spending would rise by £0.6 billion and absolute poverty before housing costs would fall by 0.1 percentage points, or 75,000 people. Most of the report's other recommendations cannot be estimated yet; the last section explains why.

## What the report recommends

Most of the 15 recommendations concern how DWP runs PIP rather than who receives it or how much they get:

- **Award reviews (recommendation 1).** Fewer reviews for people with lifelong or degenerative conditions, and reviews that look at what has changed rather than every activity and descriptor (pp. 67–68). Reviews leading to no change in the award rose from 40% in 2017-18 to 75% in 2025-26 (p. 68).
- **Hospital stays (recommendation 7).** For claimants aged 18 or over, PIP payments are suspended after 28 days as a hospital inpatient, though entitlement continues. The report asks DWP to let some support continue where disability-related costs continue, and to abolish the "linking rule" that adds together stays separated by 28 days or less (pp. 83–85).
- **Fluctuating conditions (recommendation 12).** PIP currently asks whether a condition limits an activity on more than 50% of days over 12 months (p. 98). The report asks DWP to change how assessments capture conditions that vary over time, without setting a new rule.
- **The rest (recommendations 2 to 6, 8 to 11 and 13 to 15)** cover forms, letters, reasonable adjustments, advocacy, case management, assessor training, reconsiderations, evidence, face-to-face assessments, digital services and data.

For the longer term, the report describes a reformed benefit (pp. 13–15 and 110–116): fast-track awards for people receiving end-of-life care and people with serious, well-evidenced conditions; an "impact assessment" for everyone else, with an element for extra costs; a cash-first award with optional services; a flexible mix of payments, which the steering group "has not had time to explore" in detail (p. 114); and eligibility that gives the most support to people with the highest extra costs, introduced with transitional protection (pp. 15 and 116). The reformed benefit would remain non-means-tested and paid in cash (p. 110), and would not depend on work or on engaging with support (p. 10). One steering group member dissented from that last principle, and another disagreed with aspects of the flexible payments recommendation (p. 122).

## PIP daily living as the route to the UC health element

The government plans to abolish the Work Capability Assessment and let entitlement to PIP daily living give access to the UC health element. The report treats this as a commitment the government made before the review. It recognises that a single route could spare people two assessments, says that not all of the steering group endorse it, asks for an impact assessment of who may no longer be eligible for health-related support, and says it should proceed only if it meets the group's six tests (pp. 119–120). The government has not published the rules, so we model two versions in 2029-30:

- **No protection.** A UC award includes the health element only if a claimant receives PIP daily living. Awards that keep it keep their current rate; awards that newly qualify get the rate for new claims.
- **Existing awards protected.** Every award with the health element today keeps it, and awards with a claimant on PIP daily living but no element gain it at the rate for new claims.

In both, each claimant's assessment of limited capability for work is unchanged, so the UC work allowance that goes with it still applies. The health element is £217.26 a month for claims from April 2026 and, in PolicyEngine UK's projection, £460.80 a month for earlier claims.

**Table 1: PIP daily living as the route to the UC health element, 2029-30**

|                                                 |     No protection | Existing awards protected |
| ----------------------------------------------- | ----------------: | ------------------------: |
| Change in UC spending                           |           −£3.1bn |                   +£0.6bn |
| Claimants losing the health element             |           703,000 |                      None |
| of whom aged 16 to 24                           |            37,000 |                      None |
| Claimants gaining the health element            |           227,000 |                   227,000 |
| of whom aged 16 to 24                           |            25,000 |                    25,000 |
| People in households whose net income falls     |              1.7m |                      None |
| People in households whose net income rises     |              0.8m |                      0.6m |
| Change in absolute poverty before housing costs | +148,000 (+0.2pp) |          −75,000 (−0.1pp) |

PolicyEngine UK 2.179.2, Microcosm build b891aa69 (policyengine 6.20.3). Static: no change in behaviour, claims or take-up.

Without protection, the losses fall mostly on lower-income households, as Figure 1 shows: the people who lose the element are UC claimants, and most UC claimants are in the lower half of the income distribution.

```chart
{
  "type": "bar",
  "title": "Figure 1: Change in household net income by income decile, PIP daily living as the route to the UC health element, no protection, static, 2029-30",
  "subtitle": "Decile 1 has the lowest incomes. Averaged over all households in each decile",
  "xKey": "decile",
  "series": [
    {
      "key": "gbp2029",
      "name": "£ a year",
      "color": "primary",
      "format": {
        "decimals": 0,
        "prefix": "£",
        "separator": true
      },
      "yLabel": "Change in net income (£ a year)"
    }
  ],
  "data": [
    { "decile": "1", "gbp2029": -292 },
    { "decile": "2", "gbp2029": -204 },
    { "decile": "3", "gbp2029": -148 },
    { "decile": "4", "gbp2029": -133 },
    { "decile": "5", "gbp2029": -96 },
    { "decile": "6", "gbp2029": -69 },
    { "decile": "7", "gbp2029": -6 },
    { "decile": "8", "gbp2029": -31 },
    { "decile": "9", "gbp2029": -15 },
    { "decile": "10", "gbp2029": -13 }
  ],
  "valueLabels": true
}
```

The results depend on how far the two benefits overlap. Under current law in 2029-30, 2.88 million people receive the UC health element as claimants with limited capability for work and work-related activity; 2.15 million of them (75%) also receive PIP daily living. Among people aged 16 to 24, 208,000 receive the element and 171,000 (82%) also receive PIP daily living. The overlap is uncertain among young people. The Resolution Foundation [reports](https://www.resolutionfoundation.org/press-releases/government-must-match-milburns-ambition-to-properly-invest-in-young-people/) 110,000 of 176,000 (62.5%); its release does not state the data source, year or area, so the figures may not be directly comparable with ours. A lower overlap would mean more people losing the element without protection.

## The report's own figures

The report gives context figures rather than costings:

- Spending on disability benefits for people of working age was about £14.5 billion in 2019-20 and is forecast to exceed £34.6 billion in 2031-32, in 2026-27 prices (p. 51). This covers more than PIP.
- About 32% of the PIP caseload had an ongoing award in March 2026 (p. 67).
- Fewer than 20% of working-age recipients are in work (p. 56).
- Of people receiving the enhanced daily living rate, 24% are in the bottom third of claimants for care needs; of those with no daily living award, 16% are in the top third (p. 55).
- The sharpest rises in disability benefit receipt have been among people aged 16 to 19, people in their thirties and women (p. 50).

## How it relates to the Milburn review

A week earlier, Alan Milburn's review of young people and work proposed ending PIP and the UC health element for people under 25 and replacing PIP with three new forms of support. We estimate that ending the two without the replacements would save £4.4 billion in 2029-30 (see our [Milburn briefing](https://www.policyengine.org/uk/research/uk-milburn-review-briefing) and [dashboard](https://www.policyengine.org/uk/milburn-review)). The Timms Review makes no recommendation by age and mentions the Milburn review once, saying that joining up the reviews' findings "does not suggest endorsement" (p. 124). Its principles do not differ by age. The government has not yet responded to either review.

## What we can't estimate

Most of the report's recommendations can't be estimated from the survey data PolicyEngine UK uses. The data record whether someone receives PIP, but not review dates, scores for each activity or long hospital stays, so the changes to award reviews, fluctuating conditions and the hospital rule are out of reach. The reformed benefit's fast-track pathways, impact assessment, flexible payments and rebalancing of eligibility have no criteria or amounts yet. When the government responds, we will estimate any changes it sets out that the model can express.

## Methodology

We modelled the route to the UC health element by rewriting each benefit unit's health element in 2029-30 after PolicyEngine UK applies the UC rebalancing rules, then recalculating UC, household net income and poverty. A claimant passes the route when they are a UC claimant receiving PIP daily living above zero. Counts of people losing or gaining the element cover benefit units whose UC changes. Every published figure rests on at least three survey households. Page numbers are the report's printed page numbers.
