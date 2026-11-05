# The threshold freeze and the National Living Wage

This folder holds the script, results and tests behind [the post](../../app/src/data/posts/articles/uk-threshold-freeze-national-living-wage.md) on how much more income tax and National Insurance workers on the National Living Wage pay under the threshold freeze.

## Reproduce the figures

From the repository root, using Python 3.13:

```sh
uv venv --python 3.13 analysis/uk-threshold-freeze-nlw/.venv
uv pip install --python analysis/uk-threshold-freeze-nlw/.venv/bin/python -r analysis/uk-threshold-freeze-nlw/requirements.txt
analysis/uk-threshold-freeze-nlw/.venv/bin/python analysis/uk-threshold-freeze-nlw/nlw_freeze.py analysis/uk-threshold-freeze-nlw
analysis/uk-threshold-freeze-nlw/.venv/bin/python -m pytest analysis/uk-threshold-freeze-nlw
```

`nlw_freeze.py` runs PolicyEngine UK on hypothetical households and writes `results.csv` and `meta.json`. It uses no microdata. `thresholds.py` holds the CPI series and threshold paths and needs no model code. `test_freeze.py` checks the invariants below, compares every table, the chart, the key prose figures and the post's metadata with `results.csv`, and reruns two rows on the live model when PolicyEngine UK is installed.

The run used PolicyEngine UK 2.170.0 at commit [`2da212ab`](https://github.com/PolicyEngine/policyengine-uk/tree/2da212abcf2086337fc088a4a1236f4ae7b6af63) and policyengine-core 3.34.2. That commit carries the Budget baseline from [policyengine-uk#2719](https://github.com/PolicyEngine/policyengine-uk/pull/2719). PyPI does not yet carry 2.170.0, so `requirements.txt` pins the commit.

## Comparisons

Each scenario overrides the Personal Allowance and the Class 1 primary threshold for one tax year.

| `scenario` | NI primary threshold |
| --- | --- |
| `ni_tracks_allowance` | Equal to the allowance |
| `ni_sep_cpi_from_jul22` | £242 a week, uprated each April from 2023 by the previous September's CPI, to the nearest £1 a week |
| `ni_p2p_from_jul22` | £242 a week, multiplied by the CPI index from July 2022 to the September before the tax year, to the nearest £1 a week |
| `allowance_only` | As it stands |
| `ni_sep_cpi_from_2021` | £184 a week from 2021-22, uprated by September CPI to the nearest £1 a week, with no July 2022 rise |

`allowance_path` takes two values. `s57` applies Income Tax Act 2007 section 57 each April from 2022, rounding each increase up to £10, which gives £16,080 and £16,650. `alternative` uses assumed allowances of £16,070 and £16,632.

## Decisions

- **Allowance basis.** We use the section 57 path in the post. Section 57 has the Treasury round each CPI increase up to a multiple of £10, and the government uses the same rule as its Personal Allowance default in Annex A of its Budget 2026 policy costings. We take the post's sensitivity sentence from the `alternative` rows.
- **NI rounding.** We round the rows from £242 a week to the nearest £1 a week, the government's Primary Threshold default in the same annex.
- **No national microsimulation.** In the Microcosm UK 2024-25 national file (`a6299504`), implied hourly pay (employment income divided by hours, adults aged 21 or over) shows no spike at the data year's £11.44 wage floor, and about 23% of 28.5 million employees sit more than 5% below it. The Low Pay Commission puts coverage at about 6% of jobs. A count of workers in each case would therefore reflect noise in reported hours and pay, so we show example workers in the post and quote no national figure from our microdata.
- **Council Tax Reduction.** The hypothetical households name no local scheme, so `council_tax_benefit` falls back to a reported £0. We leave Council Tax Reduction out of the post and say that a household receiving it could lose less.
- **UC pay pattern.** PolicyEngine UK calculates UC over a year, which matches 12 equal monthly assessments, so we assume in the post that employers pay workers the same amount each month. In 2026-27, the single renter's maximum award of £902 a month falls short of 55% of their £1,681 monthly net pay, so they receive no UC. If their employer paid them every four weeks, they would net £1,552 in a month with one payday and receive about £48 of UC that month.
- **Marriage Allowance.** Our main figures cover a single worker. The `couple_two_children` rows give the one-earner couple's income tax figures, which we state separately in the post.
- **Chart points.** We add 19.02, 23.6 and 24.33 hours to the chart's half-hour grid, where pay reaches £12,570, £15,600 and £16,080, so its straight segments meet at the kinks.

## Invariants

These hold for every input, and `test_freeze.py` checks them:

- Each section 57 step equals the CPI step rounded up to £10, for any CPI path of zero or more.
- Each weekly NI step stays within 50p of the exact CPI step.
- Extra tax and NI sit between zero and 20% of the allowance gap plus 8% of the threshold gap, for any thresholds at or above £12,570.
- Extra income tax plus extra NI equals the total, and the net loss equals the total plus the UC change within £1, for every row.
- The model matches plain arithmetic within £1 for every single worker row. `nlw_freeze.py` also asserts this during the run.
- The extra amount never falls as hours rise on the four rows with thresholds at or above £12,570, and stays at zero up to 19 hours in 2026-27 and 18 hours in 2027-28.
- UC rises by 55% of the extra tax and NI wherever UC stays in payment.
- At 35 hours, 37.5 hours, 40 hours, in Scotland and with minimum auto-enrolment contributions, extra income tax and NI stay equal.

Extra NI turns negative in 2026-27 on the path without the July 2022 rise, as intended, because £12,570 exceeds the £12,272 that path reaches.

## Sources

- ONS series [D7G7](https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/d7g7/mm23) and [D7BT](https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/d7bt/mm23), CPI rates and index.
- [Income Tax Act 2007 s57](https://www.legislation.gov.uk/ukpga/2007/3/section/57), Finance Act [2021 s5](https://www.legislation.gov.uk/ukpga/2021/26/section/5/enacted), [2023 s5](https://www.legislation.gov.uk/ukpga/2023/1/section/5) and [2026 s10](https://www.legislation.gov.uk/ukpga/2026/11/section/10).
- [Social Security Contributions and Benefits Act 1992 s5](https://www.legislation.gov.uk/ukpga/1992/4/section/5), [National Insurance Contributions (Increase of Thresholds) Act 2022 s1](https://www.legislation.gov.uk/ukpga/2022/16/section/1/enacted), [Spring Statement 2022](https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/1062486/Spring_Statement_2022_Web_Accessible.pdf) paragraph 2.11, and the [explanatory memorandum to SI 2026/231](https://www.legislation.gov.uk/uksi/2026/231/pdfs/uksiem_20260231_en_001.pdf) paragraph 5.1.
- [Budget 2026](https://www.gov.uk/government/publications/budget-2026-document/budget-2026-html#additional-support-for-households) and [Budget 2026 policy costings](https://assets.publishing.service.gov.uk/media/6ae1883fe4367e5c8b0467df/AB26_Policy_Costing.pdf#page=110), Annex A.
- Universal Credit Regulations 2013, regulations [22](https://www.legislation.gov.uk/uksi/2013/376/regulation/22) and [55](https://www.legislation.gov.uk/uksi/2013/376/regulation/55).
- [Low Pay Commission, The National Minimum Wage in 2026](https://assets.publishing.service.gov.uk/media/69cbe06e024cdf09254f3f92/2026_Uprating_report_v2.pdf), pages 7 and 8.
