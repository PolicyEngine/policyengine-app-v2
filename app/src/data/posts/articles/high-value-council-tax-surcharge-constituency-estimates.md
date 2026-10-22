At the [November 2025 Budget](https://www.gov.uk/government/collections/budget-2025), the government announced a high value council tax surcharge on homes in England worth £2 million or more. From April 2028, owners pay between £2,500 and £7,500 a year on top of their council tax. The Office for Budget Responsibility (OBR) [estimates](https://obr.uk/docs/dlm_uploads/Supplementary-forecast-information-high-value-council-tax-surcharge-costing.pdf) that the surcharge raises £605 million in 2028-29 before behavioural responses and £400 million after them.

We estimate the surcharge's revenue in each Westminster constituency in 2028-29 with [Microcosm UK](https://github.com/PolicyEngine/microcosm), PolicyEngine's microdata on households and their homes in every local area, built from the Family Resources Survey and other household surveys. These are experimental modelled estimates with wide uncertainty, not official statistics.

Key findings for 2028-29:

- The surcharge raises £410 million from owner-occupied main residences in England before behavioural responses (90% range: £360 million to £480 million), from about 127,000 homes.
- We report estimates for 110 of England's 543 constituencies, which hold about 90% of England's homes worth over £2 million.
- The surcharge raises the most in Kensington and Bayswater, £32.4 million. The 10 constituencies with the most revenue, eight of them in London, account for 39% of the total.
- London holds 54% of England's owner-occupied homes worth over £2 million, and the South East holds 25%.
- Households in the top income decile pay 54% of the revenue, and households in the bottom five deciles pay 17%.
- Payers with household net income under £30,000 make up 19% of payers. If 75% of them used a support scheme, revenue from owner-occupied main residences would fall by 14%.

[Explore the interactive map](#revenue-by-constituency) | [Download the data](https://github.com/PolicyEngine/uk-mansion-tax/blob/main/estimates_2028_29/constituency_estimates_2028_29.csv)

## The policy

From April 2028, owners of homes in England pay an annual surcharge on top of their council tax if the Valuation Office, which values homes for council tax, values the home at £2 million or more in 2026 prices. Owners, rather than occupiers, are liable, and councils collect the surcharge on behalf of central government. The [policy paper](https://www.gov.uk/government/publications/high-value-council-tax-surcharge/high-value-council-tax-surcharge) sets four bands:

| Property value (2026 prices) | Annual surcharge |
| ---------------------------- | ---------------- |
| £2 million to £2.5 million   | £2,500           |
| £2.5 million to £3.5 million | £3,500           |
| £3.5 million to £5 million   | £5,000           |
| £5 million or more           | £7,500           |

An owner whose home the Valuation Office values at £2.8 million, for example, pays £3,500 in 2028-29. The charges rise with consumer prices index (CPI) inflation each year from 2029-30. The Valuation Office revalues homes every five years, next in 2033, so values stay at their 2026 level until then.

## Revenue by constituency

<center><iframe src="https://policyengine.github.io/uk-mansion-tax/constituency_estimates_2028_29.html" width="100%" height="850" style="border:none;"></iframe></center>

We report estimates for 110 of England's 543 constituencies. Together they hold about 90% of England's homes worth over £2 million in counts we derive from HM Land Registry sale prices: 91% of privately owned homes and 88% of owner-occupied homes. They include all 50 constituencies with the most such homes. The other 433 constituencies, hatched grey on the map, have fewer than 10 survey households with homes over £2 million behind their estimates. Together they hold about 10% of such homes.

| Rank | Constituency                     | Region     | Estimated revenue | Share of England's revenue |
| ---- | -------------------------------- | ---------- | ----------------- | -------------------------- |
| 1    | Kensington and Bayswater         | London     | £32.4m            | 7.9%                       |
| 2    | Cities of London and Westminster | London     | £28.1m            | 6.9%                       |
| 3    | Chelsea and Fulham               | London     | £23.0m            | 5.6%                       |
| 4    | Richmond Park                    | London     | £14.5m            | 3.5%                       |
| 5    | Esher and Walton                 | South East | £13.8m            | 3.4%                       |
| 6    | Hampstead and Highgate           | London     | £12.8m            | 3.1%                       |
| 7    | Twickenham                       | London     | £10.2m            | 2.5%                       |
| 8    | Wimbledon                        | London     | £10.2m            | 2.5%                       |
| 9    | Battersea                        | London     | £7.3m             | 1.8%                       |
| 10   | Chesham and Amersham             | South East | £7.0m             | 1.7%                       |

These 10 constituencies account for £159 million, 39% of the £410 million total, and the 20 with the most revenue account for 53%. The map's Table tab lists every constituency.

Constituency estimates carry wide uncertainty. For a typical constituency shown, the standard error is about 38% of the estimate. The ranking of the constituencies with the most revenue is steadier: when we resample the survey households, a median of 17 of the top 20 stay in the top 20.

## Where homes worth over £2 million are

| Region          | Share of England's owner-occupied homes worth over £2 million |
| --------------- | ------------------------------------------------------------- |
| London          | 54%                                                           |
| South East      | 25%                                                           |
| East of England | 9%                                                            |
| South West      | 6%                                                            |

London and the South East together hold 79% of these homes. Across constituencies, the estimates follow the Valuation Office's count of band H homes, the highest council tax band, with a rank correlation of 0.77.

## National revenue

| Estimate                                                          | Homes   | Revenue, 2028-29 |
| ----------------------------------------------------------------- | ------- | ---------------- |
| PolicyEngine: owner-occupied main residences, static              | 127,000 | £410 million     |
| OBR: all liable properties, static                                | 165,000 | £605 million     |
| OBR: all liable properties, after behavioural responses           | 156,000 | £400 million     |

Our estimate covers owner-occupied main residences only, because Microcosm models households' main homes. The OBR's tax base also includes second homes and let or company-owned properties. How many liable homes are owner-occupied is uncertain. The OBR's stamp duty data put about 40% of liable properties as not owner-occupied, which would leave about 99,000 owner-occupied homes (60% of 165,000). The Market Value Survey of the Ministry of Housing, Communities and Local Government, cited in the government's [consultation](https://www.gov.uk/government/consultations/high-value-council-tax-surcharge), found over 90% of homes worth £2 million or more owner-occupied in 2024, which would mean about 150,000. Our 127,000 falls between the two.

Our £410 million is static, like the OBR's £605 million. It leaves out behavioural responses, which in the OBR's costing include price effects, non-payment, appeals, the support scheme and effects on other taxes. Together these reduce the OBR's estimate for 2028-29 by £205 million, about a third. Non-payment, appeals and the support scheme account for £120 million of that.

## Who pays

| Income decile         | Share of surcharge revenue |
| --------------------- | -------------------------- |
| 1 to 5 (bottom half)  | 17%                        |
| 6 to 9                | 29%                        |
| 10 (top)              | 54%                        |

We rank households by their net income after taxes and benefits, adjusted for household size, and split them into ten deciles that each hold a tenth of people. The bottom five deciles include households with negative incomes. Households in the top decile pay 54% of the surcharge. Households in the bottom five deciles pay 17%: some owners of homes worth over £2 million have incomes in the bottom half of the distribution, and the surcharge depends only on the home's value.

### Support for owners on lower incomes

The OBR's costing assumes that households with net income under £30,000 a year can use a support scheme, that 75% of eligible households take it up, and that the scheme reduces revenue by 9%. The OBR estimates eligibility from the Wealth and Assets Survey.

In our data, payers with household net income under £30,000 make up 19% of payers and pay 19% of the revenue from owner-occupied main residences. At the same 75% take-up, the scheme would reduce that revenue by 14% (75% × 19%). The OBR's 9% is a share of revenue from all liable properties, including the roughly 40% that are not owner-occupied, so the two figures measure different bases.

The government's consultation proposes a deferral scheme for owners with household income of £35,000 or less and savings of £16,000 or less, and for homes that are the main home of a disabled or severely mentally impaired person. We do not model those criteria.

## Methodology and limitations

### Data

Microcosm UK represents households, their incomes and their homes in every local area of the UK. PolicyEngine builds it from the Family Resources Survey and other UK Data Service surveys and calibrates it to official local statistics. This analysis uses the 2024-25 local-area release of 19 October 2026, with 150,000 households.

PolicyEngine ranks owners in each region by the home value imputed from the Wealth and Assets Survey, and gives each home the Land Registry sale price at the same percentile in its constituency. PolicyEngine calibrates the release to Land Registry-based counts of owner-occupied homes worth over £1 million, £1.5 million and £2 million by region and local authority.

We apply the surcharge as PolicyEngine's UK tax-benefit model, policyengine-uk 2.132.6, defines it, and compute household incomes for the income deciles and the support scheme with policyengine-uk 2.122.2. The policyengine Python package (version 6.10.0) loads this release for constituency results with policyengine-uk 2.132.6. PolicyEngine has certified the national release built from the same survey data for national results; the local-area release behind these constituency results is not certified.

### Year and values

The surcharge applies 2028-29 charges to values in 2026 prices. To reach 2026 prices, policyengine-uk uprates 2024 home values with the OBR's forecast growth in GDP per capita (7.4%). The OBR's house price forecast grows 5.3% over the same period, and would put fewer homes over each threshold.

We grow household numbers from 2024-25 to 2028-29 with the Office for National Statistics (ONS) projection of UK population (1.9%), as policyengine-uk does. The OBR instead grows the stock of homes over £2 million with new builds, at 0.4% to 0.6% a year.

Our 127,000 homes are about 10% above the Land Registry-based count of owner-occupied homes over £2 million that PolicyEngine calibrates Microcosm to (116,000). Household growth to 2028-29 accounts for about 2 percentage points of the gap. Uprating with GDP per capita rather than house prices also puts more homes over £2 million.

### Privacy

PolicyEngine licenses the survey data from the UK Data Service. To protect respondents, we report a constituency only if at least 10 survey households with homes over £2 million sit behind its estimate. Every estimate also includes keyed noise: we multiply each survey household's weight by a fixed factor between 8% and 12% away from 1, set by a secret key. The noise typically moves a constituency's estimate by a few per cent, and by more where one household accounts for much of it.

### Uncertainty

We measure uncertainty by resampling the survey households 500 times. For a typical constituency shown, the standard error is about 38% of the estimate, and the 90% range for England's revenue runs from £360 million to £480 million. These measures leave out calibration and modelling error, so the true uncertainty is larger.

### Behavioural responses

The estimates are static. They assume no change in house prices, sales or compliance, and no appeals or deferral beyond the support scheme calculation above.

### Comparison with our November 2025 analysis

In [November 2025](/uk/research/high-value-council-tax-surcharge), we allocated the OBR's £400 million across constituencies in proportion to 2024 Land Registry sales above £2 million. This analysis instead models the stock of owner-occupied homes and the households that own them, which lets us estimate revenue directly and show which households pay. The two sets of figures measure different quantities. The surcharge applies in England only; the November 2025 analysis also covered Wales.

---

_Analysis by PolicyEngine. The constituency estimates and the code for the map are on [GitHub](https://github.com/PolicyEngine/uk-mansion-tax)._
