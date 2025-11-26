# UK high value council tax surcharge: constituency-level impact

In the November 2025 Autumn Budget, the UK government announced a new high value council tax surcharge on properties valued over £2 million. The Office for Budget Responsibility (OBR) [estimates](https://obr.uk/efo/economic-and-fiscal-outlook-november-2025/) this measure will raise £400 million in 2029-30.

Using 2024 Land Registry sales data, we estimate how this revenue will be distributed across Westminster constituencies.

Key findings:
- We project 553 of 650 constituencies will have sales subject to the surcharge in 2028
- The top 10 constituencies account for 35% of the estimated revenue
- Cities of London and Westminster alone accounts for 10% (£42 million)
- London constituencies account for 47% of total revenue

[Explore the interactive map](#map) | [Download the data](https://github.com/PolicyEngine/uk-mansion-tax)

## The policy

From April 2028, owners of properties valued over £2 million (in 2026 prices) will pay an annual surcharge in addition to their existing council tax. The surcharge rises with property value across four bands:

| Property value | Annual surcharge |
|----------------|------------------|
| £2m - £2.5m | £2,500 |
| £2.5m - £3m | £3,500 |
| £3m - £5m | £5,000 |
| £5m+ | £7,500 |

The OBR [explicitly states](https://obr.uk/efo/economic-and-fiscal-outlook-november-2025/) only the lowest band rate (£2,500) and highest band rate (£7,500). [Bloomberg reports](https://www.bloomberg.com/news/articles/2025-11-26/reeves-hits-uk-property-with-mansion-tax-on-2-million-homes) the middle band rates as £3,500 and £5,000, though does not cite a source.

The OBR expects the surcharge rates to increase with CPI inflation each year. Unlike standard council tax, the revenue flows to central government rather than local authorities.

## Constituency-level estimates

We estimate each constituency's share of the £400 million total by analysing 2024 property sales and projecting them to 2028. We uprate sale prices to April 2028 levels using OBR house price forecasts (10.7% cumulative growth from 2024), apply the surcharge band structure (with thresholds uprated by CPI from 2026 to 2028), and allocate the OBR's total estimate proportionally based on each constituency's share of projected revenue.

### Top 20 constituencies by estimated revenue

| Rank | Constituency | Projected sales | Estimated annual revenue | Share of total |
|------|--------------|----------------|--------------------------|----------------|
| 1 | Cities of London and Westminster | 767 | £41.9m | 10.5% |
| 2 | Kensington and Bayswater | 589 | £29.4m | 7.4% |
| 3 | Chelsea and Fulham | 393 | £17.9m | 4.5% |
| 4 | Hampstead and Highgate | 262 | £12.0m | 3.0% |
| 5 | Richmond Park | 167 | £7.0m | 1.8% |
| 6 | Battersea | 154 | £6.4m | 1.6% |
| 7 | Islington South and Finsbury | 149 | £6.1m | 1.5% |
| 8 | Holborn and St Pancras | 149 | £7.4m | 1.8% |
| 9 | Hammersmith and Chiswick | 131 | £5.5m | 1.4% |
| 10 | Finchley and Golders Green | 118 | £5.6m | 1.4% |
| 11 | Runnymede and Weybridge | 104 | £5.0m | 1.3% |
| 12 | Wimbledon | 99 | £4.3m | 1.1% |
| 13 | Ealing Central and Acton | 92 | £3.6m | 0.9% |
| 14 | Queen's Park and Maida Vale | 92 | £3.7m | 0.9% |
| 15 | Windsor | 84 | £4.0m | 1.0% |
| 16 | Esher and Walton | 81 | £3.1m | 0.8% |
| 17 | Dulwich and West Norwood | 61 | £2.3m | 0.6% |
| 18 | Harpenden and Berkhamsted | 60 | £2.0m | 0.5% |
| 19 | Hornsey and Friern Barnet | 60 | £1.8m | 0.5% |
| 20 | Chesham and Amersham | 60 | £2.1m | 0.5% |

The top 20 constituencies account for 43% of the estimated revenue while comprising 3% of all constituencies.

## Geographic distribution {#map}

The map below shows the estimated revenue allocation by constituency. Darker shading indicates higher estimated revenue from the surcharge.

<iframe src="surcharge_map_by_revenue.html" width="100%" height="850" frameborder="0"></iframe>

The concentration in London and the Home Counties reflects the geography of UK property wealth. Of the 553 constituencies we project will have sales subject to the surcharge in 2028:
- 56 are in Greater London (accounting for 47% of estimated revenue)
- The remaining 497 constituencies share 53% of estimated revenue

London constituencies account for 47% of projected affected sales while comprising 9% of all constituencies.

### Distribution by surcharge band

We project 9,139 sales will be subject to the surcharge in 2028, distributed across bands:

| Band (2028 prices) | Sales | Share of sales | Revenue contribution |
|--------------------|-------|----------------|---------------------|
| £2.09m - £2.61m | 2,806 | 31% | 17% |
| £2.61m - £3.14m | 1,607 | 18% | 13% |
| £3.14m - £5.23m | 2,423 | 27% | 29% |
| £5.23m+ | 2,303 | 25% | 41% |

Properties valued over £5.23 million (in 2028 prices) represent 25% of projected affected sales but contribute 41% of the estimated revenue due to the £7,500 annual surcharge rate.

## Methodology and limitations

### Data sources

- **Property sales**: UK Land Registry Price Paid Data for 2024 (881,757 transactions)
- **Revenue estimate**: OBR Economic and Fiscal Outlook, November 2025 (£400 million in 2029-30)
- **House price growth**: OBR November 2025 forecasts (2.9% in 2025, 2.5% in 2026-27, 2.4% in 2028)
- **Constituency boundaries**: MySoc 2025 Westminster constituencies

### Surcharge band rates

The OBR states there are "four price bands" but only explicitly confirms two surcharge rates:
- £2,500 for properties valued £2 million to £2.5 million (lowest band)
- £7,500 for properties valued £5 million or more (highest band)

We use the middle band rates (£3,500 for £2.5m-£3m; £5,000 for £3m-£5m) as reported by Bloomberg, though the official source for these figures is unclear. Since we allocate the OBR's total revenue estimate proportionally by constituency, this assumption affects the distribution of revenue across bands but not the total or constituency-level allocations.

### Uprating methodology

The policy takes effect in April 2028. We uprate 2024 sale prices to 2028 using OBR house price forecasts (10.7% cumulative growth). We also uprate the thresholds from their 2026 base values using OBR CPI forecasts (4.5% cumulative from 2026 to 2028). This means the £2m threshold becomes approximately £2.09m in 2028 prices, and the band boundaries are similarly adjusted.

This approach captures the properties that would actually be subject to the surcharge when it comes into effect, accounting for both house price appreciation and the inflation-linked adjustment to the thresholds.

### Key limitation: sales vs stock

This analysis uses property sales data, not the full housing stock. The OBR's £400 million estimate is based on Valuation Office data covering all properties, not just those sold in a given year.

We found:
- Implied surcharge from 2024 sales: £42 million
- OBR estimate (full housing stock): £400 million
- Ratio: approximately 10x

This ratio is consistent with annual property turnover rates of 5-10% of housing stock. Our constituency-level allocations assume the geographic distribution of high-value sales reflects the distribution of high-value housing stock.

We do not scale up transaction volumes to 2028 levels (the OBR [forecasts](https://obr.uk/efo/economic-and-fiscal-outlook-november-2025/) transactions rising from 1.1 million in 2024 to 1.3 million in 2029). Since we allocate the OBR's total revenue estimate proportionally by constituency, the absolute number of sales matters less than their geographic distribution. The OBR's £400 million estimate already accounts for the full housing stock and projected behavioral responses.

### Behavioural effects

The OBR's £400 million estimate incorporates behavioural responses including:
- Full pass-through of the surcharge into property prices
- Price bunching just below band boundaries
- Non-compliance and appeals

The OBR notes that these behavioural effects reduce revenue from other property taxes (stamp duty land tax, capital gains tax), which partly offsets the gross surcharge revenue in the early years of implementation.

## Conclusion

The high value council tax surcharge concentrates revenue collection in a small number of constituencies. The top 10 constituencies—all in London—account for over a third of the estimated £400 million annual revenue. This geographic concentration reflects the distribution of properties valued over £2 million, which are heavily concentrated in London and the South East.

---

*Analysis by PolicyEngine. Data and code available on [GitHub](https://github.com/PolicyEngine/uk-mansion-tax).*
