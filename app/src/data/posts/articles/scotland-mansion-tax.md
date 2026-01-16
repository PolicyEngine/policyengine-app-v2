The [Scottish Budget 2026-27](https://www.gov.scot/publications/scottish-budget-2026-27/) introduces new council tax bands for properties valued over £1 million, effective from April 2028. This reform creates Band I (£1m-£2m) and Band J (£2m+), with councils setting their own rates. Since the Scottish Government has not yet announced the specific rates, we estimate revenue using [UK Autumn Budget 2025 rates](https://github.com/PolicyEngine/uk-mansion-tax) as a benchmark.

To show where this reform would have the most impact, we mapped estimated property sales above £1 million by Scottish Parliament constituency. Unlike England and Wales where Land Registry provides free transaction-level data, Scotland's Registers of Scotland charges for bulk data access, so we developed a [population-weighted distribution model](https://github.com/PolicyEngine/scotland-mansion-tax) to allocate council-level estimates to constituencies.

## Key findings

| Metric | Value |
| :----- | :---: |
| £1m+ sales (2024-25) | [391](https://www.ros.gov.uk/data-and-statistics/property-market-statistics/property-market-report-2024-25) |
| £1m+ property stock | [~11,000](https://www.savills.co.uk/research_articles/229130/372275-0) |
| Stock/sales ratio | ~26x |
| Edinburgh share | ~47% |
| Glasgow share | ~3% |
| Constituencies affected | 69 of 73 |
| **Stock-based revenue** | **~£18.5m/year** |

Edinburgh's six constituencies account for nearly half of all affected properties (~£8.6m of £18.5m total). Edinburgh has higher average property prices ([£322,000 vs Glasgow's £190,000](https://www.ros.gov.uk/data-and-statistics/property-market-statistics)).

## Interactive map

<center><iframe src="https://policyengine.github.io/scotland-mansion-tax/scottish_mansion_tax_map.html?v=8" width="100%" height="950" style="border:none;"></iframe></center>

**Top 10 constituencies by estimated impact**

| Constituency | Council | Est. Sales | Revenue | Share |
| :----------- | :------ | :--------: | :-----: | :---: |
| Edinburgh Northern and Leith | City of Edinburgh | 37 | £1.58m | 8.6% |
| Edinburgh Central | City of Edinburgh | 36 | £1.54m | 8.3% |
| East Lothian | East Lothian | 35 | £1.51m | 8.2% |
| Edinburgh Eastern | City of Edinburgh | 35 | £1.50m | 8.1% |
| Edinburgh Western | City of Edinburgh | 33 | £1.41m | 7.6% |
| Edinburgh Southern | City of Edinburgh | 30 | £1.31m | 7.1% |
| Edinburgh Pentlands | City of Edinburgh | 30 | £1.27m | 6.9% |
| Strathkelvin and Bearsden | East Dunbartonshire | 25 | £1.08m | 5.8% |
| Stirling | Stirling | 10 | £0.43m | 2.3% |
| Eastwood | East Renfrewshire | 10 | £0.43m | 2.3% |

## Methodology

Since property-level transaction data is not freely available for Scotland, we use a three-stage approach:

**Stage 1: Council-level estimates** - We use the official [Registers of Scotland Property Market Report 2024-25](https://www.ros.gov.uk/data-and-statistics/property-market-statistics/property-market-report-2024-25) which reports [391 residential sales over £1 million](https://www.ros.gov.uk/data-and-statistics/property-market-statistics/property-market-report-2024-25), with "over half" in the City of Edinburgh.

**Stage 2: Population-based distribution** - Within each council, we distribute sales proportionally by constituency population using [NRS Scottish Parliamentary Constituency Population Estimates (mid-2021)](https://www.nrscotland.gov.uk/publications/scottish-parliamentary-constituency-population-estimates/). This transparent, reproducible approach uses official data rather than subjective assumptions.

**Stage 3: Stock-based revenue** - Council tax applies to all properties (stock), not just sales. The [stock figure (~11,000)](https://www.savills.co.uk/research_articles/229130/372275-0) tells us how many £1m+ properties exist in Scotland, but not where they are—sales data provides the geographic distribution. Following the [UK mansion tax methodology](https://github.com/PolicyEngine/uk-mansion-tax), we:
1. Use sales to determine each constituency's **share** (geographic distribution)
2. Calculate total stock-based revenue using UK rates (£1,500/yr for Band I, £2,500/yr for Band J)
3. Allocate proportionally by constituency share

Our estimate (**£18.5m**) is close to Finance Secretary Shona Robison's [verbal estimate of £16m](https://www.lbc.co.uk/article/wealthy-scots-in-snp-sights-as-budget-proposes-mansion-house-tax-and-a-tax-on-pr-5HjdQg9_2/). The difference likely reflects different rate assumptions or stock estimates.

**Validation**: Our Edinburgh share (~47%) matches [Registers of Scotland's finding](https://www.ros.gov.uk/__data/assets/pdf_file/0006/299184/Registers-of-Scotland-Property-Market-Report-2024-25-June.pdf) that "over half" of £1m+ sales are in Edinburgh. [The Scotsman's postcode analysis](https://www.scotsman.com/business/the-affluent-postcodes-driving-scotlands-record-sales-of-ps1-million-plus-homes-5215393) reports [53 sales over £1m in EH3](https://www.scotsman.com/business/the-affluent-postcodes-driving-scotlands-record-sales-of-ps1-million-plus-homes-5215393) and [49 in EH4](https://www.scotsman.com/business/the-affluent-postcodes-driving-scotlands-record-sales-of-ps1-million-plus-homes-5215393).

**Limitations**: Constituency-level figures are modelled estimates. Stock estimate (~11,000) is from [Savills](https://www.savills.co.uk/research_articles/229130/372275-0). UK rates are used as a benchmark since Scotland hasn't announced Band I/J rates.

[View code and methodology on GitHub](https://github.com/PolicyEngine/scotland-mansion-tax)
