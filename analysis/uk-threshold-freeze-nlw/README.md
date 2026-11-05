# The threshold freeze and the National Living Wage

This folder holds the scripts, results and tests behind [the post](../../app/src/data/posts/articles/uk-threshold-freeze-national-living-wage.md) on how much more income tax and National Insurance workers on the National Living Wage pay under the threshold freeze, what the freeze does to net income after Universal Credit and Council Tax Reduction, and what it costs households across the UK.

## Reproduce the figures

From the repository root, using Python 3.13:

```sh
uv venv --python 3.13 analysis/uk-threshold-freeze-nlw/.venv
uv pip install --python analysis/uk-threshold-freeze-nlw/.venv/bin/python -r analysis/uk-threshold-freeze-nlw/requirements.txt
analysis/uk-threshold-freeze-nlw/.venv/bin/python analysis/uk-threshold-freeze-nlw/nlw_freeze.py analysis/uk-threshold-freeze-nlw
analysis/uk-threshold-freeze-nlw/.venv/bin/python analysis/uk-threshold-freeze-nlw/hours_net_income.py analysis/uk-threshold-freeze-nlw
analysis/uk-threshold-freeze-nlw/.venv/bin/python -m pytest analysis/uk-threshold-freeze-nlw
```

The tests need only `hypothesis`, `numpy` and `pytest`, and two of them rerun rows on the live model when PolicyEngine UK is installed.

The national figures need a separate environment, from `requirements-national.txt`, and the Microcosm UK file, which sits in a private Hugging Face repository because it derives from the Family Resources Survey. With that file at `DATA` and a private folder at `ARRAYS`, run each scenario in its own process, then add the results up:

```sh
for scenario in baseline ni_tracks_allowance ni_sep_cpi_from_jul22 ni_p2p_from_jul22 allowance_only ni_sep_cpi_from_2021 obr_thresholds hmrc_ten_percent; do
  python analysis/uk-threshold-freeze-nlw/national_freeze.py run --scenario "$scenario" --data "$DATA" --arrays "$ARRAYS" --label certified --overlay
done
python analysis/uk-threshold-freeze-nlw/national_freeze.py tables --arrays "$ARRAYS" --label certified --out analysis/uk-threshold-freeze-nlw --private "$ARRAYS" --data "$DATA" --dataset-name microcosm-uk-2024-25-national-20261025T091414Z-a6299504 --overlay
```

## Files

- `thresholds.py` holds the CPI series, threshold paths and council tax bills, and needs no model code.
- `nlw_freeze.py` runs PolicyEngine UK on hypothetical households and writes `results.csv` and `meta.json`. It uses no microdata.
- `hours_net_income.py` runs single workers and lone parents from 15 to 40 hours a week through UC and Council Tax Reduction, and writes `hours.csv` and `hours_meta.json`. It uses no microdata.
- `national_freeze.py` runs the national scenarios and writes the `national_*_certified` tables. Its record-level arrays stay outside this repository.
- `test_freeze.py`, `test_hours.py` and `test_national.py` check the invariants below and compare every table, chart and key prose figure in the post with the results.

## Versions

We run the household scripts on PolicyEngine UK 2.175.5 and policyengine-core 3.34.7, both from PyPI. PolicyEngine UK 2.170.0 and later carry the Budget baseline from [policyengine-uk#2719](https://github.com/PolicyEngine/policyengine-uk/pull/2719), and `nlw_freeze.py` gives a byte-identical `results.csv` on 2.170.0, 2.175.3, 2.175.4 and 2.175.5.

We run the national figures on the certified pair behind PolicyEngine's Autumn Budget 2026 dashboard: PolicyEngine UK 2.151.0 and the Microcosm UK file `microcosm-uk-2024-25-national-20261025T091414Z-a6299504`, which `policyengine` 6.11.1 pins, with the OBR's October 2026 forecast from [`../uk-budget-2026-income-tax/forecast.py`](../uk-budget-2026-income-tax/forecast.py). `national_meta_certified.json` records the file's hash, the forecast's provenance and the thresholds each run held. PolicyEngine UK 2.151.0 predates the Budget, so it has no Pension Tax Allowance. National sensitivity runs on 2.175.5, which has one, are summarised under [Decisions](#decisions).

## Comparisons

Each path overrides the Personal Allowance and the Class 1 primary threshold for one tax year. The basic rate band stays at £37,700, so the higher rate threshold rises with the allowance, and the upper earnings limit, Class 4 limits and employer thresholds stay put.

| `scenario` | NI primary threshold |
| --- | --- |
| `ni_tracks_allowance` | Equal to the allowance |
| `ni_sep_cpi_from_jul22` | £242 a week, uprated each April from 2023 by the previous September's CPI, to the nearest £1 a week |
| `ni_p2p_from_jul22` | £242 a week, multiplied by the CPI index from July 2022 to the September before the tax year, to the nearest £1 a week |
| `allowance_only` | As it stands |
| `ni_sep_cpi_from_2021` | £184 a week from 2021-22, uprated by September CPI to the nearest £1 a week, with no July 2022 rise |

`allowance_path` takes two values. `s57` applies Income Tax Act 2007 section 57 each April from 2022, rounding each increase up to £10, which gives £16,080 and £16,650. `alternative` uses assumed allowances of £16,070 and £16,632.

Two more national scenarios exist for comparison with outside estimates:

- `obr_thresholds` takes the OBR's "with indexation" levels from Table 4.19 of the receipts tables of its October 2026 outlook: Personal Allowance, higher rate threshold, upper earnings limit, upper profits limit and primary threshold, with the additional rate threshold back at £150,000 and the lower profits limit equal to the primary threshold.
- `hmrc_ten_percent` raises the Personal Allowance, basic rate band and starting rate limit for savings by 10%, to compare with HMRC's row "Increase all main allowances, starting and basic rate limits by 10%".

Every comparison runs one way: frozen less raised. Extra income tax of £100 means a person pays £100 more with thresholds frozen, and a net income change of −£45 means they have £45 less with thresholds frozen.

## Decisions

- **Allowance basis.** We use the section 57 path in the post. Section 57 has the Treasury round each CPI increase up to a multiple of £10, and the government uses the same rule as its Personal Allowance default in Annex A of its Budget 2026 policy costings. We take the post's sensitivity sentence from the `alternative` rows.
- **NI rounding.** We round the rows from £242 a week to the nearest £1 a week, the government's Primary Threshold default in the same annex.
- **Pay bands, with no count of National Living Wage workers.** In the Microcosm UK national file, implied hourly pay (employment income divided by hours, adults aged 21 or over) shows no spike at the data year's £11.44 wage floor, and about 23% of 28.5 million employees sit more than 5% below it. The Low Pay Commission puts coverage at about 6% of jobs. A count of workers at the wage floor would therefore reflect noise in reported hours and pay. Annual pay holds up better, so we report employees by pay band, with £20,000 to £25,000 holding full-time National Living Wage pay of £23,132 and £24,042.
- **Disclosure.** We hold every published cell to 10 survey households behind its change, the level the dashboard's binned and area results keep, and the level the UK Data Service advises against secondary disclosure. The checks' shares of records rest on few records, so they stay private.
- **Council Tax Reduction, households.** PolicyEngine UK simulates the working-age schemes of Merton, Kingston upon Thames, Newham, Westminster and Oxford. `hours_net_income.py` names each council and uses its Band D figure for 2026-27 from MHCLG's Table 10, as PolicyEngine UK stores it, times 8/9 for Band C and 3/4 for the single person discount. Merton and Kingston express the taper as 2 6/7 per cent of the weekly difference for each day, which comes to 20% a week. Newham's parameters come from the model, and we state no rate for it. `results.csv` names no council, so its `council_tax_benefit` falls back to a reported £0.
- **Council Tax Reduction, national.** In a data-built simulation, PolicyEngine UK 2.151.0 counts only families who report Council Tax Reduction, and it gives working-age families in other English councils their reported amount. So the national figures show no change for those families. [policyengine-uk#1966](https://github.com/PolicyEngine/policyengine-uk/pull/1966) covers the working-age rules in Scotland and Wales, and we state no Scottish or Welsh Council Tax Reduction effect.
- **UC pay pattern.** PolicyEngine UK calculates UC over a year, which matches 12 equal monthly assessments, so we assume in the post that employers pay workers the same amount each month. In 2026-27, the single renter's maximum award of £902 a month falls short of 55% of their £1,681 monthly net pay at 35 hours, so they receive no UC. If their employer paid them every four weeks, they would net £1,552 in a month with one payday and receive about £48 of UC that month.
- **UC's minimum income floor.** Regulation 62 of the Universal Credit Regulations 2013 treats a gainfully self-employed claimant under all work-related requirements as earning a set amount after "deducting such amount for income tax and national insurance contributions as the Secretary of State considers appropriate". PolicyEngine UK works out those deductions from the standard Personal Allowance and NI thresholds, so frozen thresholds lower the net floor and raise UC, even for someone who pays no more tax. Most households with higher net income when frozen include such a claimant. `hours_meta.json` records the worked case.
- **Marriage Allowance.** Our main household figures cover a single worker. The `couple_two_children` rows give the one-earner couple's income tax figures, which we state separately in the post.
- **Capital gains.** PolicyEngine UK's main capital gains elasticity defaults to 1 from 2.134.0, and the forecast overlay counts as a change of rules. `national_freeze.py` sets both elasticities to 0 in every scenario, baseline included, so the runs hold gains fixed like everything else.
- **Benefits by pay band.** We share each family's change in benefits among its members in proportion to the extra income tax and NI each pays.
- **Chart points.** We add 19.02, 23.6 and 24.33 hours to the charts' half-hour grid, where pay reaches £12,570, £15,600 and £16,080. The net income chart also adds the hours at which UC and Council Tax Reduction run out on either side, found on a grid of 0.01 hours, so its straight segments stay within £3 of the model.

<!--COMPARISON-->

## Invariants

These hold for every input, and the tests check them.

Household results (`test_freeze.py`, `test_hours.py`):

- Each section 57 step equals the CPI step rounded up to £10, for any CPI path of zero or more.
- Each weekly NI step stays within 50p of the exact CPI step.
- Extra tax and NI sit between zero and 20% of the allowance gap plus 8% of the threshold gap, for any thresholds at or above £12,570.
- Extra income tax plus extra NI equals the total, and the net loss equals the total plus the UC change within £1, for every row.
- The model matches plain arithmetic within £1 for every single worker row. `nlw_freeze.py` also asserts this during the run.
- The extra amount never falls as hours rise on the four rows with thresholds at or above £12,570, and stays at zero up to 19 hours in 2026-27 and 18 hours in 2027-28.
- UC rises by 55% of the extra tax and NI wherever UC stays in payment.
- Where a 20% scheme's reduction and UC both stay in payment, Council Tax Reduction rises by 20% of the 45p UC leaves, and net income falls by 36p for each £1.
- A worker with no benefits loses all of the extra tax and NI, and no one who pays more loses more than they pay.
- At 35 hours, the net income rows match `results.csv`.

National results (`test_national.py`, and the checks `national_freeze.py` records in `national_meta_certified.json`):

- Net income changes by the change in benefits less the change in tax, within 32-bit float rounding, for every household. Market income and pension contributions stay fixed.
- The benefit components add up to `household_benefits`, within 32-bit float rounding, for every household.
- All five paths give each person the same income tax, and a higher primary threshold never gives anyone less extra NI.
- Employees whose income tax and NI plain arithmetic can state match it within £1.
- `allocate` conserves each family's change in benefits.
- `gini` stays between 0 and 1, ignores scale, treats a weight as that many records, falls after a transfer from richer to poorer, and matches microdf.
- Each pay falls in one pay band, and deciles and bands add up to the totals.
- No published cell rests on fewer than 10 survey households behind its change.

Some results go against the headline, as intended:

- Extra NI turns negative in 2026-27 on the path without the July 2022 rise, because £12,570 exceeds the £12,272 that path reaches. A worker between those levels pays less NI with thresholds frozen, and UC takes back 55p of each £1.
- In Oxford, a fall in income can keep a lone parent in a higher band of support, so they gain from 23.5 to 24.5 hours.
- On UC's minimum income floor, frozen thresholds raise UC for a self-employed claimant.
- Relative poverty falls with the freeze, because the median falls.

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
