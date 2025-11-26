The Office for Budget Responsibility (OBR) released its [November 2025 Economic and Fiscal Outlook](https://obr.uk/efo/economic-and-fiscal-outlook-november-2025/) alongside the Autumn Budget. This forecast updates the March 2025 projections with significant revisions to inflation and earnings growth.

PolicyEngine uses these OBR projections to uprate monetary values across our UK tax-benefit model, affecting calculations for benefits, tax thresholds, and policy impacts.

## Key changes

The November 2025 forecast shows notably higher inflation and earnings growth in the near term compared to March:

- **2024 data revised upward**: The 2024 figures were already outturn (actual data) in March, but have been revised upward by the ONS since then. CPI is now recorded at 2.5% versus 2.3% in March, and earnings growth at 4.9% versus 4.7%.
- **Higher CPI inflation in 2025-26**: CPI revised up from 3.2% to 3.5% in 2025, and from 1.9% to 2.5% in 2026. The OBR attributes this to higher energy prices and the inflationary impact of the employer National Insurance increases announced in the Budget.
- **Higher earnings growth through 2026**: Average earnings growth revised up significantly, with 2025 now at 5.2% versus 3.7% previously—a 1.5 percentage point increase. This reflects stronger-than-expected wage growth and the impact of the National Living Wage increase.
- **Higher RPI through 2027**: RPI projections revised upward, reflecting the CPI revisions plus continued housing cost pressures. RPI matters particularly for student loan repayments and some pension uprating.
- **Convergence to long-run assumptions by 2030**: Despite near-term revisions, both forecasts converge toward the same long-run equilibrium: 2% CPI (the Bank of England's target) and around 2.3% RPI.

## Interactive comparison

Explore how the OBR's projections changed between March and November 2025:

<center><iframe src="/assets/posts/obr-november-2025-projections/chart.html" width="100%" height="500" style="border:none;"></iframe></center>

## Detailed comparison

### Consumer Price Index (CPI)

| Year | March 2025 | November 2025 | Change |
| :--: | :--------: | :-----------: | :----: |
| 2024 |    2.3%    |     2.5%      | +0.2pp |
| 2025 |    3.2%    |     3.5%      | +0.3pp |
| 2026 |    1.9%    |     2.5%      | +0.6pp |
| 2027 |    2.0%    |     2.0%      |   —    |
| 2028 |    2.0%    |     2.0%      |   —    |
| 2029 |    2.0%    |     2.0%      |   —    |
| 2030 |    2.0%    |     2.0%      |   —    |

### Retail Price Index (RPI)

| Year | March 2025 | November 2025 | Change |
| :--: | :--------: | :-----------: | :----: |
| 2024 |    3.3%    |     3.6%      | +0.3pp |
| 2025 |    4.2%    |     4.3%      | +0.1pp |
| 2026 |    3.1%    |     3.7%      | +0.6pp |
| 2027 |    3.0%    |     3.1%      | +0.1pp |
| 2028 |    2.8%    |     2.9%      | +0.1pp |
| 2029 |    2.8%    |     2.9%      | +0.1pp |
| 2030 |    2.4%    |     2.3%      | −0.1pp |

### Average earnings growth

| Year | March 2025 | November 2025 | Change |
| :--: | :--------: | :-----------: | :----: |
| 2024 |    4.7%    |     4.9%      | +0.2pp |
| 2025 |    3.7%    |     5.2%      | +1.5pp |
| 2026 |    2.2%    |     3.3%      | +1.1pp |
| 2027 |    2.1%    |     2.3%      | +0.2pp |
| 2028 |    2.3%    |     2.1%      | −0.2pp |
| 2029 |    2.5%    |     2.2%      | −0.3pp |
| 2030 |    2.9%    |     2.3%      | −0.6pp |

## What we updated in PolicyEngine

We've updated the following OBR-derived parameters in [policyengine-uk](https://github.com/PolicyEngine/policyengine-uk):

- **CPI growth**: Used for benefit uprating, poverty thresholds, and real-terms analysis
- **RPI growth**: Used for student loan interest rates and some pension calculations
- **CPIH growth**: Consumer prices including owner occupiers' housing costs
- **Average earnings growth**: Used for projecting employment income and State Pension triple lock calculations
- **House price growth**: Used for property-related calculations including stamp duty projections
- **Rent growth**: Used for housing benefit and Universal Credit housing element calculations
- **Mortgage interest growth**: Used for housing cost projections

These parameters affect both household-level calculations and economy-wide budget impact estimates.

## Implications for PolicyEngine users

These updated projections affect several PolicyEngine calculations:

1. **Benefit uprating**: Most working-age benefits are uprated by September CPI each April. The higher 2025-26 CPI forecasts mean larger benefit increases in April 2026 and 2027, improving support for low-income households.

2. **Tax threshold freezes**: The higher inflation forecasts increase the real cost of frozen income tax thresholds. With the personal allowance frozen at £12,570 and higher rate threshold frozen, more income gets pushed into higher tax bands—a phenomenon known as "fiscal drag."

3. **State Pension**: The triple lock guarantees pensions rise by the highest of CPI inflation, average earnings growth, or 2.5%. The higher earnings growth forecast (5.2% in 2025) suggests larger State Pension increases.

4. **Earnings projections**: Our household simulations use earnings growth to project future incomes, affecting multi-year policy impact estimates. Higher near-term earnings growth means higher projected incomes.

5. **Real terms analysis**: When presenting results in real terms, we deflate using these CPI projections. Higher inflation means slower real income growth even if nominal incomes rise.

6. **Housing costs**: Updated rent and house price forecasts affect calculations for housing-related benefits and property taxes.

## Data sources

- [OBR Economic and Fiscal Outlook - November 2025](https://obr.uk/efo/economic-and-fiscal-outlook-november-2025/)
- [OBR Economic and Fiscal Outlook - March 2025](https://obr.uk/efo/economic-and-fiscal-outlook-march-2025/)
- [OBR Detailed forecast tables](https://obr.uk/download/november-2025-economic-and-fiscal-outlook-detailed-forecast-tables-zip-file/)
- [OBR long-run RPI-CPI wedge methodology](https://obr.uk/box/the-long-run-difference-between-rpi-and-cpi-inflation/)
