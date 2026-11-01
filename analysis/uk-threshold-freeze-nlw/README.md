# The threshold freeze and the National Living Wage

Supports [the post](../../app/src/data/posts/articles/uk-threshold-freeze-national-living-wage.md) on how much more income tax and National Insurance workers on the National Living Wage pay under the threshold freeze.

## Reproduce the figures

From the repository root, using Python 3.13:

```sh
uv venv --python 3.13 analysis/uk-threshold-freeze-nlw/.venv
uv pip install --python analysis/uk-threshold-freeze-nlw/.venv/bin/python -r analysis/uk-threshold-freeze-nlw/requirements.txt
analysis/uk-threshold-freeze-nlw/.venv/bin/python analysis/uk-threshold-freeze-nlw/nlw_freeze.py analysis/uk-threshold-freeze-nlw
analysis/uk-threshold-freeze-nlw/.venv/bin/python -m pytest analysis/uk-threshold-freeze-nlw
```

`nlw_freeze.py` runs PolicyEngine UK on hypothetical households and writes `results.csv` and `meta.json`. It uses no microdata. `thresholds.py` holds the CPI series and threshold paths and needs no model code. `test_freeze.py` checks the invariants below and compares every table, the chart and the key prose figures in the post with `results.csv`.

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

`allowance_path` takes two values. `s57` applies Income Tax Act 2007 section 57 each April from 2022, rounding each increase up to £10, which gives £16,080 and £16,650. `unrounded` uses £16,070 and £16,632, which leaves out that round-up.

## Decisions

- **Allowance basis.** The post uses the section 57 path. Both section 57 and the government's Budget 2026 policy costings (Annex A) set the Personal Allowance default as CPI rounded up to the nearest £10. The `unrounded` rows support the post's reconciliation sentence.
- **NI rounding.** The rows from £242 a week round to the nearest £1 a week, the Primary Threshold default in the same annex.
- **No national microsimulation.** In the Microcosm UK 2024-25 national file (`a6299504`), implied hourly pay (employment income divided by hours, adults aged 21 or over) shows no spike at the data year's £11.44 wage floor, and about 23% of 28.5 million employees sit more than 5% below it. The Low Pay Commission puts coverage at about 6% of jobs. A count of workers in each case would therefore reflect noise in reported hours and pay, so the post shows example workers and quotes no national figure from our microdata.
- **Council Tax Reduction.** `council_tax_benefit` returns £0 for the lone parent with £1,800 of council tax, so the post leaves it out and says so.

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

Extra NI on the last row turns negative in 2026-27 by design: £12,570 exceeds the £12,272 that path reaches.

## Sources

- ONS series [D7G7](https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/d7g7/mm23) and [D7BT](https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/d7bt/mm23), CPI rates and index.
- [Income Tax Act 2007 s57](https://www.legislation.gov.uk/ukpga/2007/3/section/57), Finance Act [2021 s5](https://www.legislation.gov.uk/ukpga/2021/26/section/5/enacted), [2023 s5](https://www.legislation.gov.uk/ukpga/2023/1/section/5) and [2026 s10](https://www.legislation.gov.uk/ukpga/2026/11/section/10).
- [Social Security Contributions and Benefits Act 1992 s5](https://www.legislation.gov.uk/ukpga/1992/4/section/5), [National Insurance Contributions (Increase of Thresholds) Act 2022 s1](https://www.legislation.gov.uk/ukpga/2022/16/section/1/enacted), [Spring Statement 2022](https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/1062486/Spring_Statement_2022_Web_Accessible.pdf) paragraph 2.11, and the [explanatory memorandum to SI 2026/231](https://www.legislation.gov.uk/uksi/2026/231/pdfs/uksiem_20260231_en_001.pdf) paragraph 5.1.
- [Budget 2026](https://www.gov.uk/government/publications/budget-2026-document/budget-2026-html#additional-support-for-households) and [Budget 2026 policy costings](https://assets.publishing.service.gov.uk/media/6ae1883fe4367e5c8b0467df/AB26_Policy_Costing.pdf#page=110), Annex A.
- Universal Credit Regulations 2013, regulations [22](https://www.legislation.gov.uk/uksi/2013/376/regulation/22) and [55](https://www.legislation.gov.uk/uksi/2013/376/regulation/55).
- [Low Pay Commission, The National Minimum Wage in 2026](https://assets.publishing.service.gov.uk/media/69cbe06e024cdf09254f3f92/2026_Uprating_report_v2.pdf), pages 7 and 8.
