The [Scottish Budget 2026-27](https://www.gov.scot/publications/scottish-budget-2026-27/) introduces new council tax bands for properties valued over £1 million, effective from April 2028. This reform creates Band I (£1m-£2m) and Band J (£2m+), with councils setting their own rates. The Scottish Government estimates this will raise £16 million annually, affecting less than 1% of Scottish households.

To show where this reform would have the most impact, we mapped estimated property sales above £1 million by Scottish Parliament constituency. Unlike England and Wales where Land Registry provides free transaction-level data, Scotland's Registers of Scotland charges for bulk data access, so we developed a [weighted distribution model](https://github.com/PolicyEngine/scotland-mansion-tax) to allocate council-level estimates to constituencies.

## Key findings

| Metric | Value |
| :----- | :---: |
| Constituencies affected | 69 of 73 |
| Edinburgh share | 50.1% (£8.0m) |

Edinburgh's six constituencies account for half of all affected properties. Edinburgh has higher average property prices ([£322,000 vs Glasgow's £190,000](https://www.ros.gov.uk/data-and-statistics/property-market-statistics)).

## Interactive map

<center><iframe src="https://policyengine.github.io/scotland-mansion-tax/scottish_mansion_tax_map.html?v=6" width="100%" height="950" style="border:none;"></iframe></center>

**Top 10 constituencies by estimated impact**

| Constituency | Council | Est. Sales | Revenue | Share |
| :----------- | :------ | :--------: | :-----: | :---: |
| Edinburgh Central | City of Edinburgh | 58 | £2.00m | 12.5% |
| Edinburgh Western | City of Edinburgh | 46 | £1.60m | 10.0% |
| Edinburgh Southern | City of Edinburgh | 41 | £1.44m | 9.0% |
| East Lothian | East Lothian | 35 | £1.22m | 7.6% |
| Edinburgh Pentlands | City of Edinburgh | 34 | £1.20m | 7.5% |
| Edinburgh Northern and Leith | City of Edinburgh | 28 | £0.96m | 6.0% |
| Edinburgh Eastern | City of Edinburgh | 23 | £0.80m | 5.0% |
| Strathkelvin and Bearsden | East Dunbartonshire | 16 | £0.57m | 3.5% |
| North East Fife | Fife | 15 | £0.52m | 3.3% |
| Stirling | Stirling | 10 | £0.35m | 2.2% |

## Methodology

Since property-level transaction data is not freely available for Scotland, we use a two-stage weighted distribution approach:

**Stage 1: Council-level estimates** - We compiled £1m+ sales by council area from Registers of Scotland Property Market Reports, Rettie Research, and Savills Scotland market analysis.

**Stage 2: Council to constituency distribution** - Each council contains 1-9 Scottish Parliament constituencies. We distribute council totals using property value weights based on postcode-level price data (e.g., EH3 New Town gets 25% of Edinburgh's allocation vs EH6 Leith at 10%).

**Validation**: Our Edinburgh share (50.1%) matches [Rettie Research's finding](https://www.rettie.co.uk/property-research-services/2024-a-record-year-for-1m-sales) that "Edinburgh accounted for over half of Scotland's £1m+ sales." [The Scotsman's postcode analysis](https://www.scotsman.com/business/the-affluent-postcodes-driving-scotlands-record-sales-of-ps1-million-plus-homes-5215393) confirms EH3 (Edinburgh Central) and EH4 (Edinburgh Western) as top areas.

**Limitations**: Constituency-level figures are modelled estimates, not directly observed. We assume static buying patterns and uniform distribution within postcodes.

[View code on GitHub](https://github.com/PolicyEngine/scotland-mansion-tax)
