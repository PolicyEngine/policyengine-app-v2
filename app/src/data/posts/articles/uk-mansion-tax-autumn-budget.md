## Introduction

The Treasury is [reportedly considering](https://www.baggette.co.uk/accumulation/mansion-tax-uk-2025-what-homeowners-need-to-know/) a mansion tax for the [Autumn Budget 2025](https://cms-lawnow.com/en/ealerts/2025/11/autumn-budget-2025-expectations-and-speculation-regarding-tax-measures). The proposed tax would charge around 1% annually on property values above £2 million.

This analysis estimates which UK parliamentary constituencies would be most affected by a mansion tax.

## Methodology

We use Land Registry price paid data to identify property sales above £1.5 million and £2 million thresholds. We uprate 2024 transaction prices to 2026-27 values using the OBR house price index forecast from the [October 2024 Economic and Fiscal Outlook](https://obr.uk/efo/economic-and-fiscal-outlook-october-2024/).

| Parameter | Value |
|:----------|:------|
| 2024 HPI | 148.74 |
| 2026-27 HPI forecast | 154.03 |
| Uprating factor | 1.0355 (+3.55%) |

For each constituency, we calculate the number of properties exceeding each threshold after uprating and estimated annual revenue assuming a £2,000 annual charge per property.

[Download the full constituency dataset (CSV)](/assets/posts/uk-mansion-tax/mansion_tax_constituency_data.csv)

## £1.5 million threshold

Under a £1.5 million threshold, 15,300 properties would be affected in 2026-27, generating £30.6 million in annual revenue.

**Figure 1: Mansion tax impact by constituency (£1.5m threshold)**

<center><iframe src="/assets/posts/uk-mansion-tax/mansion_tax_d3_1m.html" width="100%" height="750" style="border:none;"></iframe></center>

**Table 1: Top 10 constituencies by properties affected (£1.5m threshold)**

| Constituency | Number of properties | Percent of properties |
|:-------------|:--------------------:|:---------------------:|
| Cities of London and Westminster | 990 | 1.67% |
| Kensington and Bayswater | 783 | 1.25% |
| Chelsea and Fulham | 637 | 1.17% |
| Hampstead and Highgate | 406 | 0.77% |
| Battersea | 362 | 0.76% |
| Richmond Park | 301 | 0.66% |
| Islington South and Finsbury | 277 | 0.53% |
| Hammersmith and Chiswick | 260 | 0.50% |
| Holborn and St Pancras | 219 | 0.48% |
| Runnymede and Weybridge | 184 | 0.42% |

## £2 million threshold

Under a £2 million threshold, 8,500 properties would be affected in 2026-27, generating £17.0 million in annual revenue.

**Figure 2: Mansion tax impact by constituency (£2m threshold)**

<center><iframe src="/assets/posts/uk-mansion-tax/mansion_tax_d3_2m.html" width="100%" height="750" style="border:none;"></iframe></center>

**Table 2: Top 10 constituencies by properties affected (£2m threshold)**

| Constituency | Number of properties | Percent of properties |
|:-------------|:--------------------:|:---------------------:|
| Cities of London and Westminster | 782 | 1.32% |
| Kensington and Bayswater | 583 | 0.93% |
| Chelsea and Fulham | 401 | 0.74% |
| Hampstead and Highgate | 242 | 0.46% |
| Richmond Park | 153 | 0.34% |
| Holborn and St Pancras | 147 | 0.32% |
| Battersea | 144 | 0.30% |
| Islington South and Finsbury | 146 | 0.28% |
| Hammersmith and Chiswick | 127 | 0.24% |
| Runnymede and Weybridge | 103 | 0.24% |

## Revenue concentration

The tax revenue is highly concentrated in a small number of constituencies.

**Table 3: Revenue concentration by threshold**

| Metric | £1.5m threshold | £2m threshold |
|:-------|:---------------:|:-------------:|
| Constituencies with 0 affected properties | 82 (13%) | 95 (15%) |
| Constituencies with 1+ affected properties | 568 (87%) | 555 (85%) |
| Top constituencies for 50% of revenue | 38 | 35 |
| Top constituencies for 75% of revenue | 129 | 139 |
| Top constituencies for 90% of revenue | 281 | 289 |

**Table 4: Top 5 constituencies by estimated revenue (£1.5m threshold)**

| Constituency | Est. revenue | % of total |
|:-------------|:------------:|:----------:|
| Cities of London and Westminster | £1,980,000 | 6.5% |
| Kensington and Bayswater | £1,566,000 | 5.1% |
| Chelsea and Fulham | £1,274,000 | 4.2% |
| Hampstead and Highgate | £812,000 | 2.7% |
| Battersea | £724,000 | 2.4% |

The top 5 constituencies alone account for 20.9% of total revenue.

## London dominance

London constituencies account for nearly half of all affected properties and revenue.

**Table 5: London share by threshold**

| Metric | £1.5m threshold | £2m threshold |
|:-------|:---------------:|:-------------:|
| Properties in London | 7,066 (46%) | 4,038 (47%) |
| Revenue from London | £14.1m (46%) | £8.1m (47%) |

## Distribution of impact

Most affected constituencies have only a small number of properties above the threshold.

**Table 6: Constituencies by number of affected properties (£1.5m threshold)**

| Properties | Constituencies |
|:-----------|:--------------:|
| 0 | 82 |
| 1-10 | 292 |
| 11-50 | 216 |
| 51-100 | 35 |
| 101-500 | 22 |
| 500+ | 3 |

## Limitations

1. We use property sales as a proxy for the stock of high-value properties.
2. We apply the national OBR house price index uniformly; regional price growth may vary.
3. Properties near thresholds may be revalued or contested.

## Conclusion

A mansion tax would primarily affect constituencies in London and the South East. Under a £1.5 million threshold, 15,300 properties would be affected in 2026-27, falling to 8,500 under a £2 million threshold. Half of all revenue would come from just 35-38 constituencies, and London alone would account for nearly half of all revenue. 82-95 constituencies (13-15%) would see zero impact.
