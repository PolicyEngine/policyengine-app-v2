In the November 2025 Autumn Budget, the UK government announced a new high value council tax surcharge on properties valued over £2 million. The Office for Budget Responsibility (OBR) [estimates](https://obr.uk/efo/economic-and-fiscal-outlook-november-2025/) this measure will raise £400 million in 2029-30.

Using 2024 Land Registry sales data, we estimate how this revenue distributes across Westminster constituencies.

## Key findings

- 559 of 650 constituencies had sales above £2 million in 2024
- The top 10 constituencies account for 34% of the estimated revenue
- Cities of London and Westminster alone accounts for 10% (£40 million)
- London constituencies account for 48% of total revenue

## The policy

From April 2028, owners of properties valued over £2 million (in 2026 prices) pay an annual surcharge in addition to their existing council tax:

| Property value | Annual surcharge |
| :------------- | :--------------: |
| £2m - £2.5m    |      £2,500      |
| £2.5m - £3m    |      £3,500      |
| £3m - £5m      |      £5,000      |
| £5m+           |      £7,500      |

The OBR expects the surcharge rates to increase with CPI inflation each year. Unlike standard council tax, the revenue flows to central government rather than local authorities.

## Interactive map

The map shows estimated revenue allocation by constituency. Hover over a constituency to see details.

<center><iframe src="/assets/posts/uk-mansion-tax/surcharge_map_by_revenue.html" width="100%" height="750" style="border:none;"></iframe></center>

## Constituency-level estimates

We estimate each constituency's share of the £400 million total by analysing 2024 property sales. We uprate sale prices to 2029-30 levels using OBR house price growth forecasts (13.4% cumulative growth from 2024), apply the surcharge band structure to each sale above £2 million, and allocate the OBR's total estimate proportionally.

**Top 20 constituencies by estimated revenue**

| Rank | Constituency                     | Sales | Revenue | Share |
| :--: | :------------------------------- | :---: | :-----: | :---: |
|  1   | Cities of London and Westminster |    811     | £39.8m  | 9.9%  |
|  2   | Kensington and Bayswater         |    634     | £28.4m  | 7.1%  |
|  3   | Chelsea and Fulham               |    440     | £17.7m  | 4.4%  |
|  4   | Hampstead and Highgate           |    286     | £11.6m  | 2.9%  |
|  5   | Battersea                        |    198     |  £7.0m  | 1.8%  |
|  6   | Richmond Park                    |    186     |  £7.0m  | 1.8%  |
|  7   | Holborn and St Pancras           |    163     |  £7.1m  | 1.8%  |
|  8   | Islington South and Finsbury     |    174     |  £6.5m  | 1.6%  |
|  9   | Hammersmith and Chiswick         |    156     |  £5.7m  | 1.4%  |
|  10  | Finchley and Golders Green       |    133     |  £5.6m  | 1.4%  |
|  11  | Runnymede and Weybridge          |    118     |  £5.0m  | 1.2%  |
|  12  | Wimbledon                        |    112     |  £4.3m  | 1.1%  |
|  13  | Queen's Park and Maida Vale      |    111     |  £4.0m  | 1.0%  |
|  14  | Ealing Central and Acton         |    104     |  £3.7m  | 0.9%  |
|  15  | Esher and Walton                 |    101     |  £3.4m  | 0.8%  |
|  16  | Windsor                          |     92     |  £4.0m  | 1.0%  |
|  17  | Hornsey and Friern Barnet        |     79     |  £2.2m  | 0.6%  |
|  18  | Dulwich and West Norwood         |     78     |  £2.6m  | 0.6%  |
|  19  | Twickenham                       |     77     |  £2.6m  | 0.7%  |
|  20  | Harpenden and Berkhamsted        |     73     |  £2.3m  | 0.6%  |

The top 20 constituencies account for 43% of the estimated revenue while comprising 3% of all constituencies.

## Geographic concentration

Of the 559 constituencies with sales above £2 million in 2024:

- 69 are in Greater London (accounting for 48% of estimated revenue)
- The remaining 490 constituencies share 52% of estimated revenue

London constituencies account for 48% of high-value property sales while comprising 11% of all constituencies.

## Distribution by surcharge band

Of the 10,371 property sales above £2 million in 2024 (after uprating to 2029 prices):

| Band          | Sales | Share | Revenue contribution |
| :------------ | :---: | :---: | :------------------: |
| £2m - £2.5m   |   3,372    |  33%  |         19%          |
| £2.5m - £3m   |   1,667    |  16%  |         13%          |
| £3m - £5m     |   2,807    |  27%  |         32%          |
| £5m+          |   2,525    |  24%  |         43%          |

Properties valued over £5 million represent 24% of affected sales but contribute 43% of the estimated revenue due to the £7,500 annual surcharge rate.

## Methodology

**Data sources:**

- Property sales: [UK Land Registry Price Paid Data](https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads) for 2024 (881,757 transactions)
- Revenue estimate: [OBR Economic and Fiscal Outlook](https://obr.uk/efo/economic-and-fiscal-outlook-november-2025/), November 2025 (£400 million in 2029-30)
- House price growth: OBR forecasts of 2.9% in 2025, then 2.4-2.5% annually through 2029
- Constituency boundaries: [MySoc 2025 Westminster constituencies](https://github.com/mysociety/2025-constituencies)

**Key limitation:** This analysis uses property sales data, not the full housing stock. The OBR's £400 million estimate is based on Valuation Office data covering all properties, not just those sold in a given year. We found:

- Implied surcharge from 2024 sales: £47 million
- OBR estimate (full housing stock): £400 million
- Ratio: approximately 8.5x

This ratio is consistent with annual property turnover rates of 5-10% of housing stock. Our constituency-level allocations assume the geographic distribution of high-value sales reflects the distribution of high-value housing stock.

[Download the constituency dataset (CSV)](/assets/posts/uk-mansion-tax/constituency_surcharge_summary.csv) | [View code on GitHub](https://github.com/PolicyEngine/uk-mansion-tax)
