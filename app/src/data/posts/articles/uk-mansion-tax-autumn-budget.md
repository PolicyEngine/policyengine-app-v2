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

Under a £1.5 million threshold, 13,884 properties would be affected in 2026-27, generating £27.8 million in annual revenue.

**Figure 1: Mansion tax impact by constituency (£1.5m threshold)**

<center><iframe src="/assets/posts/uk-mansion-tax/mansion_tax_d3_1m.html" width="100%" height="750" style="border:none;"></iframe></center>

**Table 1: Top 10 constituencies by properties affected (£1.5m threshold)**

| Constituency | Number of properties | Percent of properties |
|:-------------|:--------------------:|:---------------------:|
| Cities of London and Westminster | 929 | 6.69% |
| Kensington and Bayswater | 757 | 5.45% |
| Chelsea and Fulham | 578 | 4.16% |
| Hampstead and Highgate | 380 | 2.74% |
| Battersea | 309 | 2.23% |
| Richmond Park | 281 | 2.02% |
| Islington South and Finsbury | 242 | 1.74% |
| Hammersmith and Chiswick | 239 | 1.72% |
| Holborn and St Pancras | 203 | 1.46% |
| Finchley and Golders Green | 185 | 1.33% |

## £2 million threshold

Under a £2 million threshold, 7,849 properties would be affected in 2026-27, generating £15.7 million in annual revenue.

**Figure 2: Mansion tax impact by constituency (£2m threshold)**

<center><iframe src="/assets/posts/uk-mansion-tax/mansion_tax_d3_2m.html" width="100%" height="750" style="border:none;"></iframe></center>

**Table 2: Top 10 constituencies by properties affected (£2m threshold)**

| Constituency | Number of properties | Percent of properties |
|:-------------|:--------------------:|:---------------------:|
| Cities of London and Westminster | 742 | 9.45% |
| Kensington and Bayswater | 553 | 7.05% |
| Chelsea and Fulham | 364 | 4.64% |
| Hampstead and Highgate | 237 | 3.02% |
| Richmond Park | 147 | 1.87% |
| Islington South and Finsbury | 137 | 1.75% |
| Holborn and St Pancras | 135 | 1.72% |
| Battersea | 131 | 1.67% |
| Hammersmith and Chiswick | 123 | 1.57% |
| Finchley and Golders Green | 107 | 1.36% |

## Revenue concentration

The tax revenue is highly concentrated in a small number of constituencies.

**Table 3: Revenue concentration by threshold**

| Metric | £1.5m threshold | £2m threshold |
|:-------|:---------------:|:-------------:|
| Constituencies with 0 affected properties | 0 (0%) | 14 (2%) |
| Constituencies with 1+ affected properties | 567 (100%) | 553 (98%) |
| Top constituencies for 50% of revenue | 36 | 33 |
| Top constituencies for 75% of revenue | 127 | 135 |
| Top constituencies for 90% of revenue | 278 | 285 |

**Table 4: Top 5 constituencies by estimated revenue (£1.5m threshold)**

| Constituency | Est. revenue | % of total |
|:-------------|:------------:|:----------:|
| Cities of London and Westminster | £1,858,000 | 6.7% |
| Kensington and Bayswater | £1,514,000 | 5.5% |
| Chelsea and Fulham | £1,156,000 | 4.2% |
| Hampstead and Highgate | £760,000 | 2.7% |
| Battersea | £618,000 | 2.2% |

The top 5 constituencies alone account for 21.3% of total revenue.

## London dominance

London constituencies account for nearly half of all affected properties and revenue.

**Table 5: London share by threshold**

| Metric | £1.5m threshold | £2m threshold |
|:-------|:---------------:|:-------------:|
| Properties in London | 6,739 (49%) | 3,899 (50%) |
| Revenue from London | £13.5m (49%) | £7.8m (50%) |

## Distribution of impact

Most affected constituencies have only a small number of properties above the threshold.

**Table 6: Constituencies by number of affected properties (£1.5m threshold)**

| Properties | Constituencies |
|:-----------|:--------------:|
| 0 | 0 |
| 1-10 | 318 |
| 11-50 | 197 |
| 51-100 | 28 |
| 101-500 | 21 |
| 500+ | 3 |

## Limitations

1. We use property sales as a proxy for the stock of high-value properties.
2. We apply the national OBR house price index uniformly; regional price growth may vary.
3. Properties near thresholds may be revalued or contested.

## Conclusion

A mansion tax would primarily affect constituencies in London and the South East. Under a £1.5 million threshold, 13,884 properties would be affected in 2026-27, falling to 7,849 under a £2 million threshold. Half of all revenue would come from just 33-36 constituencies, and London alone would account for nearly half of all revenue. 0-14 constituencies (0-2%) would see zero impact.
