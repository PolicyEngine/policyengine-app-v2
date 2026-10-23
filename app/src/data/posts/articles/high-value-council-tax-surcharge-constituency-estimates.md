At the [November 2025 Budget](https://www.gov.uk/government/collections/budget-2025), the government announced a high value council tax surcharge on homes in England worth £2 million or more. From April 2028, owners pay between £2,500 and £7,500 a year on top of their council tax. The Office for Budget Responsibility (OBR) [estimates](https://obr.uk/docs/dlm_uploads/Supplementary-forecast-information-high-value-council-tax-surcharge-costing.pdf#page=7) that the surcharge raises £605 million in 2028-29 before behavioural responses and £400 million after them.

We estimate the surcharge's revenue in each Westminster constituency in 2028-29, and for England to 2030-31, with [Microcosm UK](https://github.com/PolicyEngine/microcosm), PolicyEngine's microdata on households and their homes in every local area. Microcosm combines the [Family Resources Survey](https://www.gov.uk/government/collections/family-resources-survey--2), HMRC's [Survey of Personal Incomes](https://www.gov.uk/government/collections/personal-incomes-statistics) and the [Wealth and Assets Survey](https://www.ons.gov.uk/peoplepopulationandcommunity/personalandhouseholdfinances/debt/methodologies/wealthandassetssurveyqmi), and takes home values from [HM Land Registry sale prices](https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads). These are experimental modelled estimates with wide uncertainty, not official statistics.

Key findings for 2028-29:

- The surcharge raises £410 million from owner-occupied main residences, before behavioural responses.
- Ten constituencies, eight of them in London, raise 39% of the revenue.
- The top income decile pays 54% of the revenue, and the bottom half pays 17%.
- A support scheme for payers with net income under £30,000 would cut revenue by 14% at 75% take-up.

[Explore the interactive map](#revenue-by-constituency) | [Download the data](https://github.com/PolicyEngine/uk-mansion-tax/blob/main/estimates_2028_29/constituency_estimates_2028_29.csv)

## The policy

Under the government's [policy paper](https://www.gov.uk/government/publications/high-value-council-tax-surcharge/high-value-council-tax-surcharge), owners of homes in England pay an annual surcharge on top of their council tax from April 2028 if the Valuation Office, which values homes for council tax, values the home at £2 million or more in 2026 prices. Owners, rather than occupiers, are liable, and councils collect the surcharge on behalf of central government. An owner whose home the Valuation Office values at £2.8 million, for example, pays £3,500 in 2028-29.

The charges rise with consumer prices index (CPI) inflation each year from 2029-30. The Valuation Office revalues homes every five years, next in 2033 according to the government's [consultation](https://www.gov.uk/government/consultations/high-value-council-tax-surcharge/high-value-council-tax-surcharge), so values stay at their 2026 level until then. The policy paper sets four bands:

| Property value (2026 prices) | Annual surcharge before April 2028 | Annual surcharge from April 2028 |
| ---------------------------- | ---------------------------------- | -------------------------------- |
| £2 million to £2.5 million   | £0                                 | £2,500                           |
| £2.5 million to £3.5 million | £0                                 | £3,500                           |
| £3.5 million to £5 million   | £0                                 | £5,000                           |
| £5 million or more           | £0                                 | £7,500                           |

## Revenue by constituency

We report estimates for 110 of England's 543 constituencies. Together they hold about 90% of England's homes worth over £2 million in counts we derive from HM Land Registry sale prices: 91% of privately owned homes and 88% of owner-occupied homes. They include all 50 constituencies with the most such homes. The other 433, hatched grey on the map, have fewer than 10 survey households with homes over £2 million behind their estimates. Together they hold about 10% of such homes.

Constituency estimates carry wide uncertainty. For a typical constituency shown, the standard error is about 38% of the estimate. The ranking of the constituencies with the most revenue is steadier: when we resample the survey households, a median of 17 of the top 20 stay in the top 20.

<center><iframe src="https://policyengine.github.io/uk-mansion-tax/constituency_estimates_2028_29.html" width="100%" height="850" style="border:none;"></iframe></center>

The 10 constituencies with the most revenue account for £159 million, 39% of the £410 million total, and the 20 with the most account for 53%. The map's Table tab lists every constituency.

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

## Where homes worth over £2 million are

London holds 54% of England's owner-occupied homes worth over £2 million and the South East 25%, so the two regions together hold 79%. The East of England holds 9% and the South West 6%. Across constituencies, the estimates follow the Valuation Office's count of [band H homes](https://www.gov.uk/government/statistics/council-tax-stock-of-properties-2025), the highest council tax band, with a rank correlation of 0.77.

```chart
{
  "type": "bar",
  "title": "Share of England's owner-occupied homes worth over £2 million, by region",
  "subtitle": "2028-29, homes at 2026 values. Regions with enough survey data to report.",
  "xKey": "region",
  "series": [{ "key": "share", "name": "Share of homes worth over £2 million", "color": "primary" }],
  "data": [
    { "region": "London", "share": 54 },
    { "region": "South East", "share": 25 },
    { "region": "East of England", "share": 9 },
    { "region": "South West", "share": 6 }
  ],
  "yLabel": "Share of homes",
  "format": { "decimals": 0, "suffix": "%" },
  "source": "Source: PolicyEngine estimates from Microcosm UK (19 October 2026 release), with keyed noise."
}
```

## National revenue

We estimate the surcharge raises £410 million in 2028-29, £420 million in 2029-30 and £430 million in 2030-31 from about 127,000 owner-occupied homes, before behavioural responses. Revenue grows because the charges rise with CPI inflation, 2.0% a year, and the number of households grows with the Office for National Statistics (ONS) [projection of UK population](https://github.com/PolicyEngine/policyengine-uk/blob/2.132.6/policyengine_uk/parameters/gov/economic_assumptions/yoy_growth.yaml#L823-L835), 0.4% in 2029-30 and 0.5% in 2030-31. The OBR's [static estimate](https://obr.uk/docs/dlm_uploads/Supplementary-forecast-information-high-value-council-tax-surcharge-costing.pdf#page=7) rises from £605 million to £635 million over the same years, with CPI uprating and new builds adding 0.4% to 0.6% a year to the stock.

Our estimate covers owner-occupied main residences only, because Microcosm models households' main homes. The [OBR's tax base](https://obr.uk/docs/dlm_uploads/Supplementary-forecast-information-high-value-council-tax-surcharge-costing.pdf#page=2) of 165,000 properties in 2028-29 also includes second homes and let or company-owned properties. How many liable homes are owner-occupied is uncertain. The OBR's stamp duty data put about 40% of liable properties as not owner-occupied, which would leave about 99,000 owner-occupied homes (60% of 165,000). The Market Value Survey of the Ministry of Housing, Communities and Local Government, cited in the government's [consultation](https://www.gov.uk/government/consultations/high-value-council-tax-surcharge/high-value-council-tax-surcharge), found over 90% of homes worth £2 million or more owner-occupied in 2024, which would mean about 150,000. Our 127,000 falls between the two.

Our estimates are static, like the OBR's £605 million. They leave out behavioural responses, which in the [OBR's costing](https://obr.uk/docs/dlm_uploads/Supplementary-forecast-information-high-value-council-tax-surcharge-costing.pdf#page=7) include price effects, non-payment, appeals, the support scheme and effects on other taxes. Together these reduce the OBR's estimate for 2028-29 by £205 million, about a third. Non-payment, appeals and the support scheme account for £120 million of that.

| Estimate                                                                                                                                  | 2028-29 | 2029-30 | 2030-31 |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------- | ------- |
| PolicyEngine: owner-occupied main residences, static                                                                                      | £410m   | £420m   | £430m   |
| [OBR](https://obr.uk/docs/dlm_uploads/Supplementary-forecast-information-high-value-council-tax-surcharge-costing.pdf#page=7): all liable properties, static | £605m   | £620m   | £635m   |
| [OBR](https://obr.uk/docs/dlm_uploads/Supplementary-forecast-information-high-value-council-tax-surcharge-costing.pdf#page=7): all liable properties, after behavioural responses | £400m   | £430m   | £435m   |

## Who pays

We rank households by their net income after taxes and benefits, adjusted for household size, and split them into ten deciles that each hold a tenth of people. Households in the top decile pay 54% of the surcharge and households in deciles 6 to 9 pay 29%. Households in the bottom five deciles, which include households with negative incomes, pay 17%: some owners of homes worth over £2 million have incomes in the bottom half of the distribution, and the surcharge depends only on the home's value.

```chart
{
  "type": "bar",
  "title": "Share of surcharge revenue by household income decile, 2028-29",
  "subtitle": "Households ranked by net income after taxes and benefits, adjusted for household size",
  "xKey": "group",
  "series": [{ "key": "share", "name": "Share of surcharge revenue", "color": "primary" }],
  "data": [
    { "group": "Deciles 1 to 5", "share": 17 },
    { "group": "Deciles 6 to 9", "share": 29 },
    { "group": "Top decile", "share": 54 }
  ],
  "yLabel": "Share of revenue",
  "format": { "decimals": 0, "suffix": "%" },
  "source": "Source: PolicyEngine estimates from Microcosm UK (19 October 2026 release), with keyed noise. Deciles 1 to 5 include households with negative incomes."
}
```

### Support for owners on lower incomes

The [OBR's costing](https://obr.uk/docs/dlm_uploads/Supplementary-forecast-information-high-value-council-tax-surcharge-costing.pdf#page=4) assumes that households with net income under £30,000 a year can use a support scheme, that 75% of eligible households take it up, and that the scheme reduces revenue by 9%. The OBR estimates eligibility from the Wealth and Assets Survey.

In our data, payers with household net income under £30,000 make up 19% of payers and pay 19% of the revenue from owner-occupied main residences. At the same 75% take-up, the scheme would reduce that revenue by 14% (75% × 19%). The OBR's 9% is a share of revenue from all liable properties, including the roughly 40% that are [not owner-occupied](https://obr.uk/docs/dlm_uploads/Supplementary-forecast-information-high-value-council-tax-surcharge-costing.pdf#page=4), so the two figures measure different bases.

The government's [consultation](https://www.gov.uk/government/consultations/high-value-council-tax-surcharge/high-value-council-tax-surcharge) proposes a deferral scheme for owners with household income of £35,000 or less and savings of £16,000 or less, and for homes that are the main home of a disabled or severely mentally impaired person. We do not model those criteria.

<details>
<summary><strong>Methodology and limitations</strong></summary>

### Data

Microcosm UK represents households, their incomes and their homes in every local area of the UK. PolicyEngine builds it from the [Family Resources Survey](https://www.gov.uk/government/collections/family-resources-survey--2), HMRC's [Survey of Personal Incomes](https://www.gov.uk/government/collections/personal-incomes-statistics) and the [Wealth and Assets Survey](https://www.ons.gov.uk/peoplepopulationandcommunity/personalandhouseholdfinances/debt/methodologies/wealthandassetssurveyqmi), and calibrates it to official local statistics. This analysis uses the 2024-25 local-area release of 19 October 2026, with 150,000 households.

PolicyEngine ranks owners in each region by the home value imputed from the Wealth and Assets Survey, and gives each home the [HM Land Registry sale price](https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads) at the same percentile in its constituency. PolicyEngine calibrates the release to Land Registry-based counts of owner-occupied homes worth over £1 million, £1.5 million and £2 million by region and local authority.

We apply the surcharge as PolicyEngine's UK tax-benefit model, [policyengine-uk](https://pypi.org/project/policyengine-uk/2.132.6/) 2.132.6, defines it, and compute household incomes in 2028-29, for the income deciles and the support scheme, with policyengine-uk 2.122.2. The [policyengine](https://pypi.org/project/policyengine/6.10.0/) Python package, version 6.10.0, loads this release for constituency results with policyengine-uk 2.132.6. PolicyEngine has certified the national release built from the same survey data for national results; the local-area release behind these constituency results is not certified.

### Years and values

We estimate revenue by constituency for 2028-29, the surcharge's first year, and for England as a whole for 2028-29 to 2030-31, the years the OBR costs.

The surcharge charges each home on its value in 2026 prices until the first revaluation in 2033, so we value homes at 2026 prices in every year. To reach 2026 prices, policyengine-uk uprates 2024 home values with the OBR's [forecast](https://github.com/PolicyEngine/policyengine-uk/blob/2.132.6/policyengine_uk/parameters/gov/economic_assumptions/yoy_growth.yaml#L655-L736) growth in GDP per capita, 7.4%. The OBR's house price forecast grows 5.3% over the same period, and would put fewer homes over each threshold.

In policyengine-uk, the [charges](https://github.com/PolicyEngine/policyengine-uk/blob/2.132.6/policyengine_uk/parameters/gov/hmrc/council_tax/high_value_surcharge/amount.yaml) run from £2,500 to £7,500 in 2028-29 and rise with its CPI forecast, 2.0% a year, from 2029-30, while the bands stay at their 2026 values. The same homes therefore pay in every year.

We grow household numbers with the ONS [projection of UK population](https://github.com/PolicyEngine/policyengine-uk/blob/2.132.6/policyengine_uk/parameters/gov/economic_assumptions/yoy_growth.yaml#L823-L835), as policyengine-uk does: by 1.9% from 2024-25 to 2028-29, then by 0.4% in 2029-30 and 0.5% in 2030-31. Together with the CPI uprating, this puts the 2029-30 and 2030-31 estimates about 2% and 5% above 2028-29. The OBR instead grows the stock of homes over £2 million with [new builds](https://obr.uk/docs/dlm_uploads/Supplementary-forecast-information-high-value-council-tax-surcharge-costing.pdf#page=2), at 0.4% to 0.6% a year. Household growth and uprating with GDP per capita rather than house prices both put more homes over £2 million than the Land Registry-based counts that PolicyEngine calibrates Microcosm to.

### Privacy

PolicyEngine licenses the survey data from the [UK Data Service](https://ukdataservice.ac.uk/). To protect respondents, we report a constituency only if at least 10 survey households with homes over £2 million sit behind its estimate. Every estimate also includes keyed noise: we multiply each survey household's weight by a fixed factor between 8% and 12% away from 1, set by a secret key. The noise typically moves a constituency's estimate by a few per cent, and by more where one household accounts for much of it.

### Uncertainty

We measure uncertainty by resampling the survey households 500 times. For a typical constituency shown, the standard error is about 38% of the estimate, and the 90% range for England's revenue in 2028-29 runs from £360 million to £480 million. The 2029-30 and 2030-31 estimates scale the same households' charges and weights, so they carry the same uncertainty in proportion. These measures leave out calibration and modelling error, so the true uncertainty is larger.

### Behavioural responses

The estimates are static in every year. They assume no change in house prices, sales or compliance, and no appeals or deferral beyond the support scheme calculation above.

### Comparison with our November 2025 analysis

In [November 2025](/uk/research/high-value-council-tax-surcharge), we allocated the OBR's £400 million across constituencies in proportion to 2024 [Land Registry sales](https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads) above £2 million. This analysis instead models the stock of owner-occupied homes and the households that own them, which lets us estimate revenue directly and show which households pay. The two sets of figures measure different quantities. The surcharge applies in England only; the November 2025 analysis also covered Wales.

</details>

---

_Analysis by PolicyEngine. The constituency estimates and the code for the map are on [GitHub](https://github.com/PolicyEngine/uk-mansion-tax)._
