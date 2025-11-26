## Introduction

The Financial Times [reports](https://www.ft.com/content/8e375410-dde2-43bc-8cc3-c6ae37c1aef3) that the Treasury is considering a mansion tax for the Autumn Budget 2025. The proposed tax would charge around 1% annually on property values above £2 million.

This analysis estimates which UK parliamentary constituencies would be most affected by a mansion tax.

## Methodology

We use Land Registry price paid data to identify property sales above £1.5 million and £2 million thresholds. We uprate 2024 transaction prices to 2026-27 values using the OBR house price index forecast from the [October 2024 Economic and Fiscal Outlook](https://obr.uk/efo/economic-and-fiscal-outlook-october-2024/).

| Parameter | Value |
|:----------|:------|
| 2024 HPI | 148.74 |
| 2026-27 HPI forecast | 154.03 |
| Uprating factor | 1.0356 (+3.56%) |

For each constituency, we calculate the number of properties exceeding each threshold after uprating and estimated annual revenue assuming a £2,000 annual charge per property.

[Download the full constituency dataset (CSV)](/assets/posts/uk-mansion-tax/mansion_tax_constituency_data.csv) | [View analysis code on GitHub](https://github.com/PolicyEngine/uk-mansion-tax)

## £1.5 million threshold

Under a £1.5 million threshold, 14,820 properties would be affected in 2026-27, generating £29.6 million in annual revenue.

**Figure 1: Mansion tax impact by constituency (£1.5m threshold)**

<center><iframe src="/assets/posts/uk-mansion-tax/mansion_tax_d3_1m.html" width="100%" height="750" style="border:none;"></iframe></center>

**Table 1: Top 10 constituencies by properties affected (£1.5m threshold)**

| Constituency | Number of properties | Share of total |
|:-------------|:--------------------:|:---------------------:|
| Cities of London and Westminster | 951 | 6.4% |
| Kensington and Bayswater | 778 | 5.2% |
| Chelsea and Fulham | 603 | 4.1% |
| Hampstead and Highgate | 408 | 2.8% |
| Battersea | 339 | 2.3% |
| Richmond Park | 301 | 2.0% |
| Islington South and Finsbury | 260 | 1.8% |
| Hammersmith and Chiswick | 255 | 1.7% |
| Holborn and St Pancras | 211 | 1.4% |
| Finchley and Golders Green | 197 | 1.3% |

## £2 million threshold

Under a £2 million threshold, 8,213 properties would be affected in 2026-27, generating £16.4 million in annual revenue.

**Figure 2: Mansion tax impact by constituency (£2m threshold)**

<center><iframe src="/assets/posts/uk-mansion-tax/mansion_tax_d3_2m.html" width="100%" height="750" style="border:none;"></iframe></center>

**Table 2: Top 10 constituencies by properties affected (£2m threshold)**

| Constituency | Number of properties | Share of total |
|:-------------|:--------------------:|:---------------------:|
| Cities of London and Westminster | 755 | 9.2% |
| Kensington and Bayswater | 577 | 7.0% |
| Chelsea and Fulham | 376 | 4.6% |
| Hampstead and Highgate | 244 | 3.0% |
| Richmond Park | 153 | 1.9% |
| Islington South and Finsbury | 143 | 1.7% |
| Holborn and St Pancras | 142 | 1.7% |
| Battersea | 138 | 1.7% |
| Hammersmith and Chiswick | 125 | 1.5% |
| Finchley and Golders Green | 112 | 1.4% |

## Revenue concentration

The tax revenue is highly concentrated in a small number of constituencies.

**Table 3: Revenue concentration by threshold**

| Metric | £1.5m threshold | £2m threshold |
|:-------|:---------------:|:-------------:|
| Constituencies with 0 affected properties | 82 (13%) | 97 (15%) |
| Constituencies with 1+ affected properties | 568 (87%) | 553 (85%) |
| Top constituencies for 50% of revenue | 36 | 33 |
| Top constituencies for 75% of revenue | 127 | 135 |
| Top constituencies for 90% of revenue | 278 | 285 |

**Table 4: Top 5 constituencies by estimated revenue (£1.5m threshold)**

| Constituency | Est. revenue | % of total |
|:-------------|:------------:|:----------:|
| Cities of London and Westminster | £1,902,000 | 6.4% |
| Kensington and Bayswater | £1,556,000 | 5.3% |
| Chelsea and Fulham | £1,206,000 | 4.1% |
| Hampstead and Highgate | £816,000 | 2.8% |
| Battersea | £678,000 | 2.3% |

The top 5 constituencies alone account for 20.8% of total revenue.

## London dominance

London constituencies account for nearly half of all affected properties and revenue.

**Table 5: London share by threshold**

| Metric | £1.5m threshold | £2m threshold |
|:-------|:---------------:|:-------------:|
| Properties in London | 7,187 (48%) | 4,089 (50%) |
| Revenue from London | £14.4m (48%) | £8.2m (50%) |

## Distribution of impact

Most affected constituencies have only a small number of properties above the threshold.

**Table 6: Constituencies by number of affected properties (£1.5m threshold)**

| Properties | Constituencies |
|:-----------|:--------------:|
| 0 | 82 |
| 1-10 | 307 |
| 11-50 | 203 |
| 51-100 | 33 |
| 101-500 | 22 |
| 500+ | 3 |

## Limitations

1. We use property sales as a proxy for the stock of high-value properties.
2. We apply the national OBR house price index uniformly; regional price growth may vary.
3. Properties near thresholds may be revalued or contested.

## Conclusion

A mansion tax would primarily affect constituencies in London and the South East. Under a £1.5 million threshold, 14,820 properties would be affected in 2026-27, falling to 8,213 under a £2 million threshold. Half of all revenue would come from just 33-36 constituencies, and London alone would account for nearly half of all revenue. 82-97 constituencies (13-15%) would see zero impact.
