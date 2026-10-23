At the [November 2025 Budget](https://www.gov.uk/government/collections/budget-2025), the government announced a high value council tax surcharge on homes in England worth £2 million or more. The Office for Budget Responsibility (OBR) [estimates](https://obr.uk/docs/dlm_uploads/Supplementary-forecast-information-high-value-council-tax-surcharge-costing.pdf#page=7) that it raises £605 million in 2028-29 before behavioural responses and £400 million after them.

We estimate the surcharge's revenue in each Westminster constituency in 2028-29, and for England to 2030-31, with [Microcosm UK](https://github.com/PolicyEngine/microcosm), PolicyEngine's microdata on households and their homes in every local area. Microcosm combines the [Family Resources Survey](https://www.gov.uk/government/collections/family-resources-survey--2), HMRC's [Survey of Personal Incomes](https://www.gov.uk/government/collections/personal-incomes-statistics) and the [Wealth and Assets Survey](https://www.ons.gov.uk/peoplepopulationandcommunity/personalandhouseholdfinances/debt/methodologies/wealthandassetssurveyqmi), and takes home values from [HM Land Registry sale prices](https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads). These are experimental modelled estimates with wide uncertainty, not official statistics.

Key findings for 2028-29:

- The surcharge raises £410 million from owner-occupied main residences, before behavioural responses.
- Ten constituencies, eight of them in London, raise 39% of the revenue.
- The top income quintile pays 65% of the revenue; each of the bottom three pays about 7%.
- A support scheme for payers with net income under £30,000 would cut revenue by 14% at 75% take-up.

[Explore the interactive map](#revenue-by-constituency) | [Download the data](https://github.com/PolicyEngine/uk-mansion-tax/blob/main/estimates_2028_29/constituency_estimates_2028_29.csv)

## The policy

Under the government's [policy paper](https://www.gov.uk/government/publications/high-value-council-tax-surcharge/high-value-council-tax-surcharge), owners of homes in England pay the surcharge from April 2028 on top of their council tax if the Valuation Office values the home at £2 million or more in 2026 prices. Owners, rather than occupiers, are liable, and councils collect the surcharge for central government. The charges rise with consumer prices index (CPI) inflation from 2029-30, and homes keep their 2026 values until the next revaluation in 2033, according to the government's [consultation](https://www.gov.uk/government/consultations/high-value-council-tax-surcharge/high-value-council-tax-surcharge). An owner whose home is valued at £2.8 million, for example, pays £3,500 in 2028-29.

| Property value (2026 prices) | Annual surcharge before April 2028 | Annual surcharge from April 2028 |
| ---------------------------- | ---------------------------------- | -------------------------------- |
| £2 million to £2.5 million   | £0                                 | £2,500                           |
| £2.5 million to £3.5 million | £0                                 | £3,500                           |
| £3.5 million to £5 million   | £0                                 | £5,000                           |
| £5 million or more           | £0                                 | £7,500                           |

## Revenue by constituency

We report estimates for 110 of England's 543 constituencies, which hold about 90% of England's homes worth over £2 million in counts we derive from Land Registry sale prices, including all 50 constituencies with the most such homes. The other 433, hatched grey on the map, have fewer than 10 survey households with homes over £2 million behind their estimates. Constituency estimates are uncertain: for a typical constituency shown, the standard error is about 38% of the estimate, though the ranking of those with the most revenue is steadier.

<center><iframe src="https://policyengine.github.io/uk-mansion-tax/constituency_estimates_2028_29.html" width="100%" height="850" style="border:none;"></iframe></center>

The 10 constituencies with the most revenue account for £159 million, and the 20 with the most for 53% of the total.

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

London and the South East hold 79% of England's owner-occupied homes worth over £2 million. Across constituencies, the estimates follow the Valuation Office's count of [band H homes](https://www.gov.uk/government/statistics/council-tax-stock-of-properties-2025), the highest council tax band, with a rank correlation of 0.77.

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
  "format": { "decimals": 0, "suffix": "%" }
}
```

## National revenue

We estimate the surcharge raises £410 million in 2028-29, rising to £430 million in 2030-31 as charges rise with inflation and household numbers grow. Our estimate covers about 127,000 owner-occupied main residences. The [OBR's tax base](https://obr.uk/docs/dlm_uploads/Supplementary-forecast-information-high-value-council-tax-surcharge-costing.pdf#page=2) of 165,000 properties also includes second homes and let or company-owned properties. How many liable homes are owner-occupied is uncertain: the OBR's stamp duty data put about 40% of them as not owner-occupied, leaving about 99,000, while the Market Value Survey cited in the government's [consultation](https://www.gov.uk/government/consultations/high-value-council-tax-surcharge/high-value-council-tax-surcharge) found over 90% owner-occupied, about 150,000. Our estimate falls between the two.

Neither our estimates nor the OBR's static figures include behavioural responses. In the [OBR's costing](https://obr.uk/docs/dlm_uploads/Supplementary-forecast-information-high-value-council-tax-surcharge-costing.pdf#page=7), price effects, non-payment, appeals, the support scheme and effects on other taxes reduce revenue in 2028-29 by £205 million, about a third.

| Estimate                                                                                                                                  | 2028-29 | 2029-30 | 2030-31 |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------- | ------- |
| PolicyEngine: owner-occupied main residences, static                                                                                      | £410m   | £420m   | £430m   |
| [OBR](https://obr.uk/docs/dlm_uploads/Supplementary-forecast-information-high-value-council-tax-surcharge-costing.pdf#page=7): all liable properties, static | £605m   | £620m   | £635m   |
| [OBR](https://obr.uk/docs/dlm_uploads/Supplementary-forecast-information-high-value-council-tax-surcharge-costing.pdf#page=7): all liable properties, after behavioural responses | £400m   | £430m   | £435m   |

## Who pays

We rank households by net income after taxes and benefits, adjusted for household size, and split them into five quintiles that each hold a fifth of people; the bottom quintile includes households with negative incomes. The top quintile pays 65% of the surcharge. Each of the bottom three quintiles pays about 7%: some owners of homes worth over £2 million have low incomes, and the surcharge depends only on the home's value.

```chart
{
  "type": "bar",
  "title": "Share of surcharge revenue by household income quintile, 2028-29",
  "subtitle": "Households ranked by net income after taxes and benefits, adjusted for household size",
  "xKey": "quintile",
  "series": [{ "key": "share", "name": "Share of surcharge revenue", "color": "primary" }],
  "data": [
    { "quintile": "Lowest", "share": 8 },
    { "quintile": "Second", "share": 7 },
    { "quintile": "Middle", "share": 7 },
    { "quintile": "Fourth", "share": 14 },
    { "quintile": "Highest", "share": 65 }
  ],
  "yLabel": "Share of revenue",
  "format": { "decimals": 0, "suffix": "%" }
}
```

### Support for owners on lower incomes

The [OBR's costing](https://obr.uk/docs/dlm_uploads/Supplementary-forecast-information-high-value-council-tax-surcharge-costing.pdf#page=4) assumes that households with net income under £30,000 a year can use a support scheme, that 75% of them take it up, and that this reduces revenue by 9%. In our data, these payers make up 19% of payers and pay 19% of the revenue, so 75% take-up would reduce revenue by 14%. The OBR's 9% applies to revenue from all liable properties, including those not owner-occupied, so the two figures measure different bases.

The government's [consultation](https://www.gov.uk/government/consultations/high-value-council-tax-surcharge/high-value-council-tax-surcharge) proposes deferral for owners with household income of £35,000 or less and savings of £16,000 or less, and for homes that are the main home of a disabled or severely mentally impaired person. We do not model those criteria.

<details>
<summary style="font-size: clamp(1.75rem, 3vw, 2rem); font-weight: 600; line-height: 1.3; margin: 28px 0 20px; padding-bottom: 6px; border-bottom: 1px solid var(--border-light, #e2e8f0); cursor: pointer;">Methodology and limitations</summary>

### Data

We use the data and model that [policyengine 6.10.0](https://pypi.org/project/policyengine/6.10.0/) pins: Microcosm UK's 2024-25 local-area release, with 150,000 households, and PolicyEngine's UK tax-benefit model, policyengine-uk 2.132.6, which defines the surcharge. Household incomes come from policyengine-uk 2.122.2. PolicyEngine has certified the national release built from the same surveys; the local-area release behind these constituency results is not certified.

PolicyEngine calibrates the release to official local statistics, including Land Registry-based counts of owner-occupied homes worth over £1 million, £1.5 million and £2 million by region and local authority. It ranks owners in each region by the home value imputed from the Wealth and Assets Survey, and gives each home the [Land Registry sale price](https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads) at the same percentile in its constituency.

### Years and values

Homes keep their 2026 values in every year. To reach 2026 prices, policyengine-uk uprates 2024 home values with the OBR's [forecast](https://github.com/PolicyEngine/policyengine-uk/blob/2.132.6/policyengine_uk/parameters/gov/economic_assumptions/yoy_growth.yaml#L655-L736) growth in GDP per capita, 7.4%; the OBR's house price forecast, 5.3%, would put fewer homes over each threshold. Uprating with GDP per capita puts more homes over £2 million than the Land Registry-based counts Microcosm is calibrated to.

In policyengine-uk, the [charges](https://github.com/PolicyEngine/policyengine-uk/blob/2.132.6/policyengine_uk/parameters/gov/hmrc/council_tax/high_value_surcharge/amount.yaml) rise with its CPI forecast, 2.0% a year, from 2029-30, while the bands stay at their 2026 values, so the same homes pay in every year. Household numbers grow with the ONS [projection of UK population](https://github.com/PolicyEngine/policyengine-uk/blob/2.132.6/policyengine_uk/parameters/gov/economic_assumptions/yoy_growth.yaml#L823-L835): 1.9% from 2024-25 to 2028-29, then 0.4% in 2029-30 and 0.5% in 2030-31. The OBR instead grows the stock of homes over £2 million with [new builds](https://obr.uk/docs/dlm_uploads/Supplementary-forecast-information-high-value-council-tax-surcharge-costing.pdf#page=2), at 0.4% to 0.6% a year.

### Privacy

PolicyEngine licenses the survey data from the [UK Data Service](https://ukdataservice.ac.uk/). We report a constituency only if at least 10 survey households with homes over £2 million sit behind its estimate, and every estimate includes keyed noise: we multiply each survey household's weight by a fixed factor between 8% and 12% away from 1, set by a secret key. The noise typically moves a constituency's estimate by a few per cent.

### Uncertainty

We measure uncertainty by resampling the survey households 500 times. The 90% range for England's revenue in 2028-29 runs from £360 million to £480 million, and the later years carry the same uncertainty in proportion. These measures leave out calibration and modelling error, so the true uncertainty is larger. The estimates are static: they assume no change in house prices, sales or compliance, and no appeals or deferral beyond the support scheme calculation.

</details>

---

_Analysis by PolicyEngine. The constituency estimates and the code for the map are on [GitHub](https://github.com/PolicyEngine/uk-mansion-tax)._
