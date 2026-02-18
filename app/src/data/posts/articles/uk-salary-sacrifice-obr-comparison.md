## Introduction

PolicyEngine models the government's proposed £2,000 salary sacrifice pension contributions cap using a full microsimulation of the UK tax-benefit system, built on the enhanced [Family Resources Survey](https://policyengine.github.io/policyengine-uk-data/) (FRS) with salary sacrifice values imputed using a quantile random forest model and calibrated to match administrative totals. This post presents our modelling approach, revenue and distributional results, and a comparison with the [OBR's supplementary forecast](https://obr.uk/supplementary-forecast-information-on-salary-sacrifice-pension-contributions-and-send-spending/).

### What is salary sacrifice?

Salary sacrifice is an arrangement where an employee gives up part of their cash pay in exchange for a non-cash benefit, most commonly an employer pension contribution. Because the sacrificed amount is paid by the employer rather than the employee, both parties save on National Insurance: the employee avoids employee NICs (8% basic rate, 2% higher rate) and the employer avoids employer NICs (15%). Income tax relief is also preserved, since the contribution goes directly into the pension. HMRC's [guidance](https://www.gov.uk/guidance/salary-sacrifice-and-the-effects-on-paye) defines the mechanism, and their [research](https://www.gov.uk/government/publications/understanding-the-attitudes-and-behaviours-of-employers-towards-salary-sacrifice-for-pensions/understanding-the-attitudes-and-behaviours-of-employers-towards-salary-sacrifice-for-pensions) shows it is widely used: 30% of private-sector employees in organisations offering salary sacrifice contributed to pensions through these arrangements in 2019.

The government's proposed cap would limit tax-advantaged salary sacrifice pension contributions to £2,000 per year. Above this threshold, standard NI rates would apply.

### How PolicyEngine models the cap

The cap is implemented as a modification to PolicyEngine's baseline microsimulation. For each individual in the dataset:

1. **Cap salary sacrifice** at £2,000 per year
2. **Reclassify the excess** as ordinary employment income (increasing the individual's taxable pay)
3. **Redirect the excess to employee pension contributions** (assuming employees maintain their pension saving)
4. **Optionally model pass-through**, where employers reduce wages across the workforce to offset their increased National Insurance costs

Because PolicyEngine computes the full tax-benefit system simultaneously, interactions between income tax, National Insurance, pension relief, the Annual Allowance, and means-tested benefits are captured endogenously, rather than calculating each tax component separately using average effective rates.

## Baseline: salary sacrifice in 2029-30

Before applying the cap, PolicyEngine's baseline simulation for 2029-30 identifies:

| Metric | PolicyEngine | OBR (ASHE) | Relative error |
| :--- | ---: | ---: | ---: |
| Salary sacrifice contributors | 8.4 million | 7.7 million | +9% |
| Workers above £2,000 cap | 3.6 million | 3.3 million | +11% |
| Total excess above cap | £10.2 billion | £14.3 billion | -28% |
| Average excess per affected worker | £2,809 | £4,333 | -35% |
| Total wages and salaries | £1,376 billion | £1,410 billion | -2% |

PolicyEngine has 9% more salary sacrifice users than the OBR but a 28% lower tax base. The gap is driven by lower average excess per worker (-35%): PolicyEngine's FRS-based data underestimates the right tail of the salary sacrifice distribution, likely because high earners with large contributions (£10,000+) are either under-represented in the FRS or their salary sacrifice values are under-imputed.

Economy-wide wages are well aligned (within 2.5%), confirming that the difference is in the distribution of salary sacrifice, not the overall scale of the economy.

## Revenue estimates under different assumptions

The cap's revenue impact depends on two key behavioural assumptions: whether employers pass their increased NI costs through to workers, and whether employees redirect their excess contributions to maintain pension saving. PolicyEngine models five scenarios:

| Scenario | Revenue |
| :--- | ---: |
| Absorb cost + maintain pension | £3.50 billion |
| OBR 76% pass-through + maintain pension | £2.96 billion |
| Spread cost (100% pass-through) + maintain pension | £2.79 billion |
| Absorb cost + take cash | £5.89 billion |
| Spread cost + take cash | £5.19 billion |

PolicyEngine's "absorb cost + maintain pension" scenario (£3.50 billion) is the closest analogue to a static yield. The "76% pass-through + maintain pension" scenario (£2.96 billion) uses the pass-through rate the [OBR derived](https://obr.uk/supplementary-forecast-information-on-salary-sacrifice-pension-contributions-and-send-spending/) from elasticities in the economic literature.

## Revenue decomposition

Breaking down PolicyEngine's £3.50 billion static estimate by tax component:

| Component | PolicyEngine | OBR (salary sacrifice only) |
| :--- | ---: | ---: |
| Income tax | +£1.68 billion | £0 (relief assumed) |
| Employee NICs | +£0.36 billion | +£0.39 billion |
| Employer NICs | +£1.45 billion | +£2.15 billion |
| **NICs subtotal** | **+£1.80 billion** | **+£2.50 billion** |
| **Total** | **+£3.50 billion** | **+£2.50 billion** |

### NICs comparison

On a NICs-only basis, PolicyEngine's £1.80 billion is 72% of the OBR's £2.50 billion. This ratio matches the tax base ratio (also 72%), confirming that the NICs gap is driven by the smaller tax base in PolicyEngine's FRS data, not by differences in NICs rates or calculations.

### Income tax: a finding unique to PolicyEngine

PolicyEngine produces +£1.68 billion in income tax revenue, where the [OBR records zero](https://obr.uk/supplementary-forecast-information-on-salary-sacrifice-pension-contributions-and-send-spending/) (assuming pension relief fully offsets the reclassified income). PolicyEngine models the pension tax system mechanically and finds that relief does not fully offset, for two reasons:

1. **Annual Allowance constraints** (+£0.61 billion): Under salary sacrifice, contributions are classified as employer contributions, which are exempt from the pension Annual Allowance (AA) tax charge. When reclassified as employee contributions, they push some workers over the £40,000 AA limit, triggering additional tax.

2. **Incomplete pension relief** (+£1.07 billion): Employment income rises by £10.25 billion (the excess), but pension contributions relief only rises by £8.88 billion. The £1.36 billion shortfall occurs because relief is capped at the Annual Allowance: workers already near the limit cannot claim full relief on the redirected amount.

This finding suggests that assuming full income tax neutrality may overstate the effectiveness of pension relief. Whether this income tax effect materialises in practice depends on how the policy is implemented, for example whether HMRC provides specific Annual Allowance exemptions for redirected contributions.

## Bonus sacrifice

PolicyEngine does not model bonus sacrifice, as there is no bonus sacrifice variable in `policyengine-uk`. The [OBR's headline £4.9 billion static yield](https://obr.uk/supplementary-forecast-information-on-salary-sacrifice-pension-contributions-and-send-spending/) includes both salary sacrifice (£2.5 billion) and bonus sacrifice (£2.3 billion). All comparisons in this analysis use the salary-sacrifice-only component.

## Behavioural adjustments

PolicyEngine models pass-through directly: at a 76% pass-through rate, revenue falls from £3.50 billion to £2.96 billion, a £0.53 billion offset. The remaining behavioural responses require off-model analysis:

| Adjustment | OBR estimate | PolicyEngine coverage |
| :--- | ---: | :---: |
| Pass-through to lower wages and profits | -£0.7 billion | Modelled directly (£0.53 billion at 76%) |
| Employers switching to ordinary pension contributions | -£0.5 billion | Not modelled |
| Employees switching to relief-at-source schemes | +£1.6 billion | Not modelled |
| Other (reduced DC contributions, forestalling) | -£0.5 billion | Not modelled |
| **Net behavioural** | **+£0.1 billion** | |

PolicyEngine's pass-through offset (£0.53 billion) is lower than the OBR's (£0.7 billion) because the OBR's elasticity-based calculations also account for profit pass-through (reducing corporation tax), which PolicyEngine does not model.

## Distributional impact

PolicyEngine's microsimulation provides household-level distributional detail. We find the salary sacrifice cap is progressive: lower-income households see minimal impact while higher earners bear the cost. Figure 1 shows the average change in household net income by income decile under the "absorb cost + maintain pension" scenario. Toggle between absolute (£/year) and relative (%) views.

**Figure 1: Average change in household net income by income decile**

<iframe src="/assets/posts/uk-salary-sacrifice-obr-comparison/distributional-impact.html" width="100%" height="550" frameborder="0"></iframe>

The top decile loses an average of £503 per year (0.36% of net income), while the bottom decile loses just £2.

### Winners and losers

Figure 2 shows the share of people in each decile who lose income under the cap. Overall, 11.2% of the population experiences a measurable income reduction.

**Figure 2: Share of people losing income**

<iframe src="/assets/posts/uk-salary-sacrifice-obr-comparison/winners-losers.html" width="100%" height="550" frameborder="0"></iframe>

In the bottom decile, 0.6% of people are affected. The eighth decile has the highest share of losers at 24.9%. No decile has winners; the cap only reduces net income for affected households.

## Conclusion

PolicyEngine estimates the £2,000 salary sacrifice cap would raise £3.50 billion in 2029-30 under static assumptions. The key finding is a £1.68 billion income tax effect from Annual Allowance constraints that does not appear in the OBR's costing. NICs revenue (£1.80 billion) is 28% below the OBR's, reflecting a smaller tax base in the FRS data. The cap is progressive, with 11.2% of the population affected and losses concentrated in upper income deciles.