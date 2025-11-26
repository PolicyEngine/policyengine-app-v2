The Times [reports](https://www.thetimes.com/article/b43b7639-6a3b-4180-baa2-b1c249d8a30a?shareToken=2b69490f2c227849a9d6446b1f6c477e) that Chancellor Rachel Reeves plans to raise up to £450 million from a levy on homes worth over £2 million, affecting over 100,000 properties. Earlier speculation suggested a £1.5 million threshold, which would have affected 300,000 homes.

To illustrate where a mansion tax would have the greatest impact, we mapped 2024 Land Registry sales above these thresholds by parliamentary constituency. Sales data serves as a proxy for the stock of high-value homes; turnover rates vary by area, so these figures show the relative geographic concentration rather than the total number of homes that would be affected.

## Key findings

Raising the threshold from £1.5 million to £2 million nearly halves the number of affected properties:

| Threshold | Sales | Share of all sales |
|:----------|:-----:|:------------------:|
| £1.5 million | 14,820 | 1.7% |
| £2 million | 8,213 | 0.9% |

Three central London constituencies—Cities of London and Westminster, Kensington and Bayswater, and Chelsea and Fulham—account for 16% of affected properties at the £1.5m threshold and 21% at the £2m threshold. The median constituency saw 10 sales above £1.5m or 6 above £2m.

London constituencies account for 45-46% of all affected properties. Outside London, the constituencies with the most high-value sales are Runnymede and Weybridge (183), Queen's Park and Maida Vale (166), Esher and Walton (163), Windsor (134), and Chesham and Amersham (127).

## Interactive map

Use the toggle to switch between £1.5m and £2m thresholds.

<center><iframe src="/assets/posts/uk-mansion-tax/mansion_tax_d3.html" width="100%" height="750" style="border:none;"></iframe></center>

The top 10 constituencies account for 30% of sales above £1.5m and 36% above £2m. All are in London or the commuter belt.

**Top 10 constituencies by share of nationwide high-value sales**

| Constituency | £1.5m | £2m |
|:-------------|:-----:|:---:|
| Cities of London and Westminster | 6.7% | 9.5% |
| Kensington and Bayswater | 5.5% | 7.0% |
| Chelsea and Fulham | 4.2% | 4.6% |
| Hampstead and Highgate | 2.7% | 3.0% |
| Battersea | 2.2% | 1.7% |
| Richmond Park | 2.0% | 1.9% |
| Islington South and Finsbury | 1.7% | 1.7% |
| Hammersmith and Chiswick | 1.7% | 1.6% |
| Holborn and St Pancras | 1.5% | 1.7% |
| Finchley and Golders Green | 1.3% | 1.4% |

## Methodology

We identified 2024 property sales exceeding £1.5 million and £2 million from [Land Registry Price Paid Data](https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads), which includes postcodes for each transaction. We mapped postcodes to parliamentary constituencies using [MySociety's 2025 constituency lookup](https://github.com/mysociety/2025-constituencies), then uprated prices to 2026-27 values using the OBR house price index forecast (+3.56%) from the [October 2024 Economic and Fiscal Outlook](https://obr.uk/efo/economic-and-fiscal-outlook-october-2024/).

**Limitations**: We use sales as a proxy for housing stock, apply the national house price index uniformly (regional growth may vary), and properties near thresholds may be revalued.

[Download the constituency dataset (CSV)](/assets/posts/uk-mansion-tax/mansion_tax_constituency_data.csv) | [View code on GitHub](https://github.com/PolicyEngine/uk-mansion-tax)
