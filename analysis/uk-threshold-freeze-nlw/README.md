# The threshold freeze and the National Living Wage

We use these scripts, results and tests for [the post](../../app/src/data/posts/articles/uk-threshold-freeze-national-living-wage.md) on the threshold freeze. With them we calculate how much more income tax and National Insurance workers on the National Living Wage pay with thresholds frozen, their net income after Universal Credit and Council Tax Reduction, and how much more households across the UK pay.

## Reproduce the figures

From the repository root, using Python 3.13:

```sh
uv venv --python 3.13 analysis/uk-threshold-freeze-nlw/.venv
uv pip install --python analysis/uk-threshold-freeze-nlw/.venv/bin/python -r analysis/uk-threshold-freeze-nlw/requirements.txt
analysis/uk-threshold-freeze-nlw/.venv/bin/python analysis/uk-threshold-freeze-nlw/nlw_freeze.py analysis/uk-threshold-freeze-nlw
analysis/uk-threshold-freeze-nlw/.venv/bin/python analysis/uk-threshold-freeze-nlw/hours_net_income.py analysis/uk-threshold-freeze-nlw
analysis/uk-threshold-freeze-nlw/.venv/bin/python -m pytest analysis/uk-threshold-freeze-nlw
```

You need only `hypothesis`, `numpy`, `pytest` and `scipy` to run the tests; with only those, pytest skips seven. If you install PolicyEngine UK, two of the seven recompute rows on the live model, and one checks our Gini index against microdf's. If you also install `policyengine` 6.16.1, the other four compare `disclosure.py` with PolicyEngine's disclosure layer.

For the national figures, install `requirements-national.txt` in a separate environment and download the Microcosm UK file, which PolicyEngine keeps in a private Hugging Face repository because it derives from the Family Resources Survey. With that file at `DATA` and a private folder at `ARRAYS`, run each scenario in its own process, then add the results up:

```sh
for scenario in baseline ni_tracks_allowance ni_sep_cpi_from_jul22 ni_p2p_from_jul22 allowance_only ni_sep_cpi_from_2021 obr_thresholds hmrc_ten_percent; do
  python analysis/uk-threshold-freeze-nlw/national_freeze.py run --scenario "$scenario" --data "$DATA" --arrays "$ARRAYS" --label certified
done
python analysis/uk-threshold-freeze-nlw/national_freeze.py tables --arrays "$ARRAYS" --label certified --out analysis/uk-threshold-freeze-nlw --private "$ARRAYS" --data "$DATA" --dataset-name microcosm-uk-2024-25-national-20261107T020434Z-eeb6093e
```

## Files

- `thresholds.py` holds the CPI series, threshold paths and council tax bills, and imports no model code.
- `nlw_freeze.py` runs PolicyEngine UK on hypothetical households and writes `results.csv` and `meta.json`, with no microdata.
- `hours_net_income.py` runs single workers and lone parents from 15 to 40 hours a week through UC and Council Tax Reduction, and writes `hours.csv` and `hours_meta.json`, with no microdata.
- `national_freeze.py` runs the national scenarios and writes the `national_*_certified` tables, leaving blank each figure that `disclosure.py` withholds. It keeps its record-level arrays outside this repository.
- `disclosure.py` decides which national figures we publish, and imports no model code.
- `test_freeze.py`, `test_hours.py`, `test_national.py` and `test_disclosure.py` check the invariants below and compare the post's tables, charts and selected prose figures with the results.

## Versions

We run the household scripts on PolicyEngine UK 2.175.5 and policyengine-core 3.34.7, both from PyPI. PolicyEngine UK 2.170.0 and later carry the Budget baseline from [policyengine-uk#2719](https://github.com/PolicyEngine/policyengine-uk/pull/2719), and `nlw_freeze.py` writes a byte-identical `results.csv` on 2.170.0, 2.174.1, 2.175.3, 2.175.4, 2.175.5, 2.175.6, 2.177.8 and 2.178.0. `hours_net_income.py` writes a byte-identical `hours.csv` on 2.175.5, 2.175.6, 2.177.8 and 2.178.0. On 2.174.1, its results differ only for the Oxford lone parent, because PolicyEngine UK assesses a UC claimant in Oxford under Appendix 3 of the council's scheme from 2.174.8.

We run the national figures on the pair that `policyengine` 6.16.1 pins: PolicyEngine UK 2.174.1 with policyengine-core 3.33.3, and the Microcosm UK file `microcosm-uk-2024-25-national-20261107T020434Z-eeb6093e`. PolicyEngine UK 2.174.1 carries the OBR's October 2026 forecast and the Pension Tax Allowance. `national_meta_certified.json` records the file's hash and the thresholds each run held.

## Comparisons

On each path, we change the Personal Allowance and the Class 1 primary threshold for one tax year. We keep the basic rate band at £37,700, so the higher rate threshold rises with the allowance, and leave the upper earnings limit, Class 4 limits and employer thresholds as they stand.

| `scenario` | NI primary threshold |
| --- | --- |
| `ni_tracks_allowance` | Equal to the allowance |
| `ni_sep_cpi_from_jul22` | From £242 a week, we raise the threshold each April from 2023 by the previous September's CPI, to the nearest £1 a week |
| `ni_p2p_from_jul22` | We multiply £242 a week by the rise in the CPI index from July 2022 to the September before the tax year, to the nearest £1 a week |
| `allowance_only` | £12,570 a year, as it stands |
| `ni_sep_cpi_from_2021` | From £184 a week, we raise the threshold each April from 2021-22 by the previous September's CPI, to the nearest £1 a week, with no July 2022 rise |

In `results.csv`, `allowance_path` takes two values. With `s57`, we apply Income Tax Act 2007 section 57 each April from 2022 and round each increase up to a multiple of £10, which gives £16,080 and £16,650. With `alternative`, we assume allowances of £16,070 and £16,632, and we leave those rows out of the post.

We run two more national scenarios to compare our estimates with published ones:

- In `obr_thresholds`, we set the Personal Allowance, higher rate threshold, upper earnings limit, upper profits limit and primary threshold to the OBR's "with indexation" levels from Table 4.19 of the receipts tables of its October 2026 outlook. We also put the additional rate threshold back at £150,000 and set the lower profits limit equal to the primary threshold.
- In `hmrc_ten_percent`, we raise the Personal Allowance, basic rate band and starting rate limit for savings by 10%, as HMRC does in its row "Increase all main allowances, starting and basic rate limits by 10%".

We subtract each result under raised thresholds from the same result under the freeze. We record extra income tax of £100 when someone pays £100 more with thresholds frozen, and a net income change of −£45 when they have £45 less.

## Decisions

- **Allowance basis.** We use the section 57 path in the post. Under section 57, the Treasury rounds each CPI increase up to a multiple of £10, and the government uses the same rule as its Personal Allowance default in Annex A of its Budget 2026 policy costings.
- **NI rounding.** On the two paths from £242 a week, we round the threshold to the nearest £1 a week, the government's Primary Threshold default in the same annex.
- **Pay bands, with no count of National Living Wage workers.** In the Microcosm UK file, 13% of the 27.8 million employees aged 21 or over with pay and hours earn more than 5% below the data year's £11.44 wage floor when we divide their pay by their hours. Another 8.2% earn within half a penny of it, where [Microcosm's build](https://github.com/PolicyEngine/microcosm/blob/95a51edb981fcba962db48fba06caaf402bb34a7/packages/microcosm-build/src/microcosm/build/uk/spec/sources.yaml#L1862) lifts pay it draws from HMRC's Survey of Personal Incomes when the draw falls short of the minimum wage for the record's usual hours. The Low Pay Commission projected that 5.9% of jobs for people aged 21 or over would pay the National Living Wage or up to 5p more in April 2026. If we counted workers at the wage floor, we would count records that Microcosm's build placed there along with noise in reported hours and pay, so we group employees by annual pay. Full-time National Living Wage pay of £23,132 and £24,042 falls in the £20,000 to £25,000 band.
- **Disclosure.** We publish a national figure only when it passes the rules of [PolicyEngine's disclosure layer](https://github.com/PolicyEngine/policyengine.py/tree/6.16.1/src/policyengine/disclosure) in `policyengine` 6.16.1. At least 10 survey households must stand behind it, no one household may hold more than half of it, and no reader, nor a household that knows its own part, may estimate one household's part to within 10%. A share must pass on both the records it counts and the rest of its group, and copies of one survey household count once. Our figures add up in ways a reader knows, so we record each identity among them, work out what a reader could recover from the published figures, and withhold further figures until nothing a reader recovers fails the rules. When we must withhold one more figure to protect another, we take it from the scenario furthest down our list first: HMRC's, then the OBR's, then the five paths from the last to the first, so the path the post leads with keeps its figures, and the figures the same in every scenario go last. A reader can also subtract one scenario's figure from another's, and a comparison scenario's figure often differs from a path's because of a few survey households, such as those with income between the OBR's £16,070 allowance and our £16,080. We publish those two scenarios' own figures to one decimal place fewer than the paths', so those differences stay out of reach without blanking the figures we compare with the OBR and HMRC. We find a reader's bounds with SciPy's HiGHS solver. HiGHS can call an unbounded programme infeasible, so we accept either verdict only once we find a direction that lowers the bound without limit. In 2026-27, we withhold 95 of 1,049 figures: 23 that fail the rules and 72 that would let a reader work one of those out. In 2027-28, we withhold 97: 28 and 69. We leave each withheld figure blank and name it in its row's `suppressed` column. Where fewer than 30 effective survey households stand behind a published figure, PolicyEngine's layer marks it approximate, and we name it in the row's `approximate` column: 88 figures in 2026-27 and 80 in 2027-28. `disclosure.py` sets out the rules in full.
- **More, less or the same.** We count a household as having more or less net income when its net income changes by more than £1 a year. PolicyEngine's disclosure layer counts a change of £1 or less as none.
- **Decile ranking.** PolicyEngine UK sets each household's HBAI income before housing costs to zero where it falls below zero, adjusts it for household size and ranks people into deciles by it. We take the deciles with thresholds frozen. For changes in net income, decile percentages and the Gini index, we use household net income. In household net income, unlike HBAI income, we count capital gains, free childcare hours and the value of public services such as the NHS, and take off other taxes, such as fuel, alcohol and tobacco duty, stamp duty and vehicle excise duty. For the Gini index, PolicyEngine UK adjusts household net income for household size, and we weight each household by its people and count income below zero as zero.
- **Decile percentages.** We divide each decile's change in net income by its net income on the raised side.
- **Council Tax Reduction, households.** PolicyEngine UK simulates the working-age schemes of Merton, Kingston upon Thames, Newham, Westminster and Oxford. `hours_net_income.py` names each council and uses its Band D figure for 2026-27 from MHCLG's Table 10, as PolicyEngine UK stores it, times 8/9 for Band C and 3/4 for the single person discount. Merton and Kingston express the taper as 2 6/7 per cent of the weekly difference for each day, which comes to 20% a week. We take Newham's parameters from the model and state no rate for it. `nlw_freeze.py` names no council, so PolicyEngine UK falls back to a reported £0 of Council Tax Reduction in `results.csv`.
- **Council Tax Reduction, national.** In a data-built simulation, PolicyEngine UK 2.174.1 counts only the families who report Council Tax Reduction. It simulates the Scottish and Welsh schemes for families of every age, the English scheme for pension-age families, and the five councils above for working-age families. For working-age families in other English councils, it generally keeps the reported amount, so we estimate no change for them. It can cap that amount where another family shares the bill and receives a simulated reduction. From 2.175.8, PolicyEngine UK gives working-age families in Scotland and Wales their own rules ([policyengine-uk#1966](https://github.com/PolicyEngine/policyengine-uk/pull/1966)).
- **UC pay pattern.** PolicyEngine UK calculates UC over a year, which matches 12 equal monthly assessments, so we assume in the post that employers pay workers the same amount each month. In 2026-27, the single renter's maximum award of £902 a month falls short of 55% of their £1,681 monthly net pay at 35 hours, so they receive no UC. If their employer paid them every four weeks, they would net £1,552 in a month with one payday and receive about £48 of UC that month.
- **UC's minimum income floor.** Under regulation 62 of the Universal Credit Regulations 2013, DWP counts a gainfully self-employed claimant past any start-up period who faces all work-related requirements as earning a set amount. DWP sets that amount after "deducting such amount for income tax and national insurance contributions as the Secretary of State considers appropriate". PolicyEngine UK deducts the income tax a claimant would pay if the floor were their only income, after the standard Personal Allowance. It also deducts Class 2 and Class 4 NI on profits of that amount, and on all five paths we leave the Class 2 and Class 4 limits where they stand. So with the allowance frozen, we calculate a lower net floor and more UC, even for someone who pays no more tax. On the first path in 2026-27, we estimate that more than 90% of the households that have more net income with thresholds frozen include such a claimant, though that share rests on fewer than 30 effective survey households. We withhold the share for 2027-28. `hours_meta.json` records a worked case.
- **Marriage Allowance.** Our main household figures cover a single worker. The `couple_two_children` rows give the one-earner couple's income tax figures, which we state separately in the post.
- **Capital gains.** When a reform changes someone's marginal rate on gains, PolicyEngine UK 2.174.1 scales their realised gains with an elasticity of 1 by default. `national_freeze.py` sets that elasticity and the marginal-rate elasticity to 0, with no separate elasticity for Business Asset Disposal Relief, in every scenario including the baseline, so we hold gains fixed in every run.
- **Benefits by pay band.** For the pay band figures, we share each family's change in benefits among its members in proportion to the extra income tax and NI each pays, and leave out changes to other taxes.
- **Chart points.** We add 19.02, 23.6 and 24.33 hours to the charts' half-hour grid, where pay reaches £12,570, £15,600 and £16,080. We also add the hours at which UC and Council Tax Reduction run out on either side to the net income chart, locating them on a grid of 0.01 hours, so its straight segments stay within £3 of the model.

## Comparison with the OBR and HMRC

We compare our national estimates with published OBR and HMRC figures, and in each comparison we take the frozen result less the raised one.

| £ billion | 2026-27 | 2027-28 |
| --- | --- | --- |
| OBR Table 4.17, "PA and HRT freezes" | 32.67 | 38.23 |
| OBR Table 4.17, "Additional rate threshold: reduction" | 0.91 | 0.94 |
| OBR Table 4.17, the two lines together | 33.58 | 39.17 |
| Ours, `obr_thresholds`, extra income tax | 43.5 | 50.5 |
| OBR Table A.5, income tax receipts | 365.4 | 392.2 |
| Ours, baseline income tax | 352.63 | 372.31 |
| OBR November 2025, Box 3.3 Table A, employee NI | −1.3 | −0.5 |
| Ours, `obr_thresholds`, extra NI | withheld | −5.2 |
| Ours, `ni_sep_cpi_from_2021`, extra NI | −0.63 | 0.25 |
| OBR November 2025, Box 3.3 Table A, income tax and employee NI | 33.9 | 39.3 |
| Ours, `obr_thresholds`, extra income tax and NI | withheld | 45.3 |
| HMRC reckoner, all main allowances, starting and basic rate limits +10% | 14.4 | 17.7 |
| Ours, `hmrc_ten_percent`, extra income tax outside Scottish income tax | 15.5 | 16.2 |

HMRC includes behavioural responses and leaves out Scottish income tax and the Welsh rates of income tax, according to notes 1 and 3 of the reckoner. It also counts Self Assessment income tax when people pay it, so most of the 2026-27 change in that tax falls outside its 2026-27 figure. We include no behavioural response, and we leave out Scottish taxpayers' income tax but keep the Welsh rates. The OBR gives no note on behavioural responses in Table 4.17.

In `obr_thresholds`, we raise the upper earnings and profits limits to the OBR's higher rate threshold and move the lower profits limit to its primary threshold. We withhold our 2026-27 NI figure for `obr_thresholds`, because a reader could combine it with our other figures to work out too much about a few survey households. In 2027-28, the fifth path's primary threshold of £244 a week exceeds the OBR's £243, and both exceed £12,570 a year. On the primary threshold alone, our NI figure against the OBR's levels would therefore fall between zero and the fifth path's £0.25 billion, and the OBR's lower profits limit of £12,636 would add to it. We estimate £5.2 billion less, because we also raise the upper limits, above which the NI rate falls, and that reverses the sign. The OBR indexes the upper earnings limit with the higher rate threshold in Table 4.19. In Box 3.3, it names the primary threshold and lower profits limit under employee NI and gives one row with no split by threshold, so we report both of our figures and can't say which one its row matches. Our income tax and NI together exceed Box 3.3's by 15% in 2027-28, and our run uses the OBR's later forecast.

| Millions of people | 2026-27 | 2027-28 |
| --- | --- | --- |
| OBR Table 4.18, brought into income tax | 4.83 | 5.3 |
| OBR Table 4.18, memo, removed through the Pension Tax Allowance | 0 | 0.289 |
| Ours, `obr_thresholds`, income taxpayers frozen less raised | 4.703 | 4.994 |
| OBR Table 4.18, higher and additional rate taxpayers without indexation | 8.97 | 9.46 |
| Ours, total income above £50,270 | 9.155 | 9.592 |
| OBR Table 4.18, higher and additional rate taxpayers with indexation | 4.93 | 4.88 |
| Ours, total income above the OBR's indexed higher rate threshold | 5.360 | 5.358 |
| OBR Table 4.18, additional rate taxpayers with the threshold at the end of the taper | 1.26 | 1.33 |
| Ours, total income above £125,140 | 1.198 | 1.245 |
| OBR Table 4.18, additional rate taxpayers with the threshold at £150,000 | 0.78 | 0.82 |
| Ours, total income above £150,000 | 0.857 | 0.909 |

For the rows by rate, we count people by total income, and the OBR counts taxpayers by the band they reach.

Our estimate against the OBR's levels exceeds the sum of its two lines by about £10 billion in 2026-27 and £11 billion in 2027-28, or 29% to 30% across the rounding of our figures. We multiply each of the OBR's groups by the extra income tax we work out by hand from its thresholds in 2026-27:

| Group, on the OBR's counts | Millions | Extra income tax each | £ billion |
| --- | --- | --- | --- |
| Basic rate taxpayers with indexation (36.0 less 4.15 less 0.78) | 31.07 | £700 | 21.7 |
| Higher rate taxpayers with indexation | 4.15 | £3,540 | 14.7 |
| Additional rate taxpayers at £150,000 | 0.78 | £3,383 | 2.6 |
| Brought into income tax | 4.83 | about £350, half of £700 | 1.7 |
| Brought into the higher rate, on top of their £700 | 3.56 | about £1,420, half of £2,840 | 5.1 |
| Brought into the additional rate, on top of their £3,540 | 0.48 | about £621, half of 5% of £24,860 | 0.3 |
| Total | | | about 46 |

We multiply HMRC's +10% row by 2.8, for the OBR's roughly 28% rise in the Personal Allowance, and get about £40 billion. We ignore other income and reliefs in these sums, so we read them as orders of magnitude; both exceed the OBR's £33.6 billion. The OBR publishes the yield by measure with no split by income, so we can't reconcile the two.

## Invariants

These hold for every input, and the tests check them.

Household results (`test_freeze.py`, `test_hours.py`):

- Each section 57 step equals the CPI step rounded up to £10, for any CPI path of zero or more.
- Each weekly NI step stays within 50p of the exact CPI step.
- Extra tax and NI stay between zero and 20% of the allowance gap plus 8% of the threshold gap, for any thresholds at or above £12,570.
- Extra income tax plus extra NI equals the total, and the net loss equals the total plus the UC change within £1, for every row.
- The model matches plain arithmetic within £1 for every single worker row, and `nlw_freeze.py` asserts the same check during the run.
- On the four paths whose NI thresholds stand at or above £12,570, the extra amount never falls as hours rise, and stays at zero up to 19 hours in 2026-27 and 18 hours in 2027-28.
- UC rises by 55% of the extra tax and NI wherever UC stays in payment on both sides.
- Where a 20% scheme's reduction and UC both stay in payment on both sides, Council Tax Reduction rises by 20% of the 45p UC leaves, and net income falls by 36p for each £1.
- A worker with no benefits loses all of the extra tax and NI, and no one who pays more loses more than they pay.
- At 35 hours, the net income rows match `results.csv`.

National results (`test_national.py`, `test_disclosure.py`, and the checks `national_freeze.py` records in `national_meta_certified.json`):

- Net income changes by the change in benefits less the change in tax, within 32-bit float rounding, for every household, while market income and pension contributions stay the same.
- The benefit components add up to `household_benefits`, within 32-bit float rounding, for every household.
- All five paths give each person the same income tax, and a higher primary threshold never gives anyone less extra NI.
- For employees in the simple cases we identify, the model's income tax and NI match plain arithmetic within £1.
- `allocate` conserves each family's change in benefits.
- `gini` stays between 0 and 1, ignores scale, treats a weight as that many records, falls after a transfer from richer to poorer, and matches microdf.
- Each pay falls in one pay band.
- `disclosure.py` counts survey households, computes top shares and applies the 10% rule as PolicyEngine's layer does, and passes, withholds and marks approximate the same figures.
- Every identity we record between published figures holds record by record.
- No published figure fails the rules, no figure a reader can work out from the published ones through those identities fails them, and withholding gives the same result each time.
- On made-up tables of sums, means, counts and shares, including figures we never publish, the bounds `disclosure.py` gives a reader match the bounds of a linear programme in levels over every figure at once. That programme takes each figure's level, sign and denominator, and each share's cap, from the records, without `disclosure.py`.

Within the rounding of every figure involved, and wherever we publish all of them, the tests also check that the published tables add up:

- In each column of average changes, the deciles, which we weight by their households, add up to the total.
- In each average and share where every band shows a figure, the row for all employees averages the bands, which we weight by their employees. We withhold the top band's UC share and change in benefits in every scenario and year, so the tests can't check those two columns. Nor can they check the averages on and off UC, where we weight the bands by their employees on and off UC.
- In each band, income tax plus NI gives the total, benefits less income tax and NI give the change in net income, and the averages on and off UC, which we weight by the UC share, give the band's average.

Some households gain, and relative poverty falls:

- Extra NI turns negative in 2026-27 on the path without the July 2022 rise, because £12,570 exceeds the £12,272 that path reaches. A worker between those levels pays less NI with thresholds frozen, and DWP pays them 55p less UC for each £1.
- On the same path, someone on more than £132,160 has no allowance on either side, so they pay up to £24 less NI and no more income tax with thresholds frozen. We estimate 1.6% of households have more net income with thresholds frozen than on that path in 2026-27, and 61% of them include such a person (`share_of_those_higher_with_no_allowance_and_less_ni`, which rests on fewer than 30 effective survey households).
- Oxford's council awards support in weekly-income bands, so a fall in income can keep a lone parent in a band with more support, and they gain from 23.5 to 24.5 hours.
- In our calculations, DWP pays more UC to a self-employed claimant on the minimum income floor under the freeze.
- Relative poverty falls with the freeze, because median income falls by a larger share than incomes near the line.

## Sources

- ONS series [D7G7](https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/d7g7/mm23) and [D7BT](https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/d7bt/mm23), CPI rates and index.
- [Income Tax Act 2007 s57](https://www.legislation.gov.uk/ukpga/2007/3/section/57), Finance Act [2021 s5](https://www.legislation.gov.uk/ukpga/2021/26/section/5/enacted), [2023 s5](https://www.legislation.gov.uk/ukpga/2023/1/section/5) and [2026 s10](https://www.legislation.gov.uk/ukpga/2026/11/section/10).
- [Social Security Contributions and Benefits Act 1992 s5](https://www.legislation.gov.uk/ukpga/1992/4/section/5), [National Insurance Contributions (Increase of Thresholds) Act 2022 s1](https://www.legislation.gov.uk/ukpga/2022/16/section/1/enacted), [Spring Statement 2022](https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/1062486/Spring_Statement_2022_Web_Accessible.pdf) paragraph 2.11, and the [explanatory memorandum to SI 2026/231](https://www.legislation.gov.uk/uksi/2026/231/pdfs/uksiem_20260231_en_001.pdf) paragraph 5.1.
- [Budget 2026](https://www.gov.uk/government/publications/budget-2026-document/budget-2026-html#additional-support-for-households) and [Budget 2026 policy costings](https://assets.publishing.service.gov.uk/media/6ae1883fe4367e5c8b0467df/AB26_Policy_Costing.pdf#page=110), Annex A.
- Universal Credit Regulations 2013, regulations [22](https://www.legislation.gov.uk/uksi/2013/376/regulation/22), [55](https://www.legislation.gov.uk/uksi/2013/376/regulation/55) and [62](https://www.legislation.gov.uk/uksi/2013/376/regulation/62).
- [Local Government Finance Act 1992](https://www.legislation.gov.uk/ukpga/1992/14) sections [5](https://www.legislation.gov.uk/ukpga/1992/14/section/5), [11](https://www.legislation.gov.uk/ukpga/1992/14/section/11) and [13A](https://www.legislation.gov.uk/ukpga/1992/14/section/13A), and MHCLG's [Table 10](https://assets.publishing.service.gov.uk/media/6a02eeeccd2e0e8b5b20b449/Table_10_2026-27.ods) of council tax levels for 2026-27.
- Council Tax Reduction schemes for 2026-27: [Kingston upon Thames](https://www.kingston.gov.uk/sites/default/files/2026-03/Council%20Tax%20Reduction%20Scheme%202026%20-%202027.pdf), paragraphs 17, 28 and 37; [Merton](https://www.merton.gov.uk/sites/default/files/2026-03/Council%20Tax%20Reduction%20Scheme%20L%20B%20Merton%202026-27.pdf), paragraphs 17, 28 and 37; [Westminster](https://www.westminster.gov.uk/sites/default/files/media/documents/council-tax-support-scheme-for-2026-27.pdf), section 4; [Newham](https://www.newham.gov.uk/downloads/file/10753/council-tax-reduction-scheme-2026); and [Oxford](https://www.oxford.gov.uk/council-tax-reduction/council-tax-reduction-scheme-2026-27).
- [Low Pay Commission, The National Minimum Wage in 2026](https://assets.publishing.service.gov.uk/media/69cbe06e024cdf09254f3f92/2026_Uprating_report_v2.pdf), pages 7 and 8.
- OBR [October 2026 detailed forecast tables, receipts](https://obr.uk/download/october-2026-economic-and-fiscal-outlook-detailed-forecast-tables-receipts/), Tables 4.17, 4.18 and 4.19; [October 2026 Economic and fiscal outlook](https://obr.uk/efo/economic-and-fiscal-outlook-october-2026/), Table A.5; and [November 2025 Economic and fiscal outlook](https://obr.uk/docs/dlm_uploads/OBR_Economic_and_fiscal_outlook_November_2025.pdf), Box 3.3, Table A.
- HMRC [ready reckoner, June 2025](https://assets.publishing.service.gov.uk/media/68552862b46781eacfd71d71/June_2025_TRR_ODS__1_.ods) and its [bulletin](https://www.gov.uk/government/statistics/direct-effects-of-illustrative-tax-changes/direct-effects-of-illustrative-tax-changes-bulletin-january-2025).
- PolicyEngine's [disclosure layer](https://github.com/PolicyEngine/policyengine.py/tree/6.16.1/src/policyengine/disclosure) in `policyengine` 6.16.1, and Microcosm's [minimum wage floor](https://github.com/PolicyEngine/microcosm/blob/95a51edb981fcba962db48fba06caaf402bb34a7/packages/microcosm-build/src/microcosm/build/uk/spec/sources.yaml#L1862) for drawn pay.
