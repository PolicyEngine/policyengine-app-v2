The Office for Budget Responsibility (OBR) released its [November 2025 Economic and Fiscal Outlook](https://obr.uk/efo/economic-and-fiscal-outlook-november-2025/) alongside the Autumn Budget. This forecast updates the March 2025 projections with revisions to inflation and earnings growth.

PolicyEngine uses these OBR projections to uprate monetary values across our UK tax-benefit model, affecting calculations for benefits, tax thresholds, and policy impacts.

## Key changes

The November 2025 forecast shows higher inflation and earnings growth in the near term compared to March:

- **Higher CPI inflation in 2025-26**: CPI revised up from 3.2% to 3.5% in 2025, and from 2.1% to 2.5% in 2026. The OBR attributes this to higher energy prices and the inflationary impact of the employer National Insurance increases announced in the Budget.
- **Higher earnings growth through 2026**: Average earnings growth revised up from 4.3% to 5.2% in 2025—a 0.9 percentage point increase. This reflects stronger-than-expected wage growth and the impact of the National Living Wage increase.
- **Higher RPI through 2027**: RPI projections revised upward, reflecting the CPI revisions plus continued housing cost pressures. RPI matters particularly for student loan repayments and some pension uprating.
- **Convergence to long-run assumptions by 2030**: Despite near-term revisions, both forecasts converge toward the same long-run equilibrium: 2% CPI (the Bank of England's target) and around 2.3% RPI.

_Note: The OBR also revised historical outturn data back to 2022 as final ONS estimates became available (e.g., 2023 CPI from 5.7% to 7.3%). The March 2025 forecast only projected housing, income, and council tax variables through 2029, while November 2025 extends these to 2030. We updated all values in [policyengine-uk PR #1377](https://github.com/PolicyEngine/policyengine-uk/pull/1377)._

## Interactive comparison

Explore how the OBR's projections changed between March and November 2025:

<center><iframe src="https://policyengine.github.io/official-forecast-vintages/uk/obr-comparison.html" width="100%" height="500" style="border:none;"></iframe></center>

## What we updated in PolicyEngine

We've updated the following OBR-derived parameters in [policyengine-uk](https://github.com/PolicyEngine/policyengine-uk):

**Inflation indices** (from Economy Table 1.7):
- **CPI growth**: Used for benefit uprating, poverty thresholds, and real-terms analysis
- **RPI growth**: Used for student loan interest rates and some pension calculations
- **CPIH growth**: Consumer prices including owner occupiers' housing costs

**Labour market** (from Economy Table 1.6):
- **Average earnings growth**: Used for projecting employment income and State Pension triple lock calculations

**Housing** (from Economy Tables 1.7 and 1.16):
- **House price growth**: Used for property-related calculations including stamp duty projections
- **Rent growth**: Used for housing benefit and Universal Credit housing element calculations
- **Mortgage interest growth**: Used for housing cost projections
- **Social rent growth**: Derived from CPI+1% with one-year lag

**Income components** (from Economy Table 1.12):
- **Non-labour income growth**: Used for projecting investment and property income
- **Per capita GDP growth**: Used for scaling aggregate statistics
- **Per capita mixed income growth**: Used for self-employment income projections
- **Per capita non-labour income growth**: Used for household income projections

**Local taxes** (from Expenditure Table 4.1):
- **Council tax receipt growth**: Separate forecasts for England, Scotland, and Wales

All projections now extend to 2030, with clear annotations distinguishing outturn data (2009-2024) from OBR forecasts (2025-2030) and long-run equilibrium assumptions (2031+).

These parameters affect both household-level calculations and economy-wide budget impact estimates.

## Implications for PolicyEngine users

These updated projections affect several PolicyEngine calculations:

1. **Benefit uprating**: Most working-age benefits are uprated by September CPI each April. The higher 2025-26 CPI forecasts mean larger benefit increases in April 2026 and 2027, improving support for low-income households.

2. **Tax threshold freezes**: The higher inflation forecasts increase the real cost of frozen income tax thresholds. With the personal allowance frozen at £12,570 and higher rate threshold frozen, more income gets pushed into higher tax bands—a phenomenon known as "fiscal drag."

3. **State Pension**: The triple lock guarantees pensions rise by the highest of CPI inflation, average earnings growth, or 2.5%. The higher earnings growth forecast (5.2% vs 4.3% in 2025) suggests larger State Pension increases.

4. **Earnings projections**: Our household simulations use earnings growth to project future incomes, affecting multi-year policy impact estimates. Higher near-term earnings growth means higher projected incomes.

5. **Real terms analysis**: When presenting results in real terms, we deflate using these CPI projections. Higher inflation means slower real income growth even if nominal incomes rise.

6. **Housing costs**: Updated rent and house price forecasts affect calculations for housing-related benefits and property taxes.

## Data sources

- [OBR Economic and Fiscal Outlook - November 2025](https://obr.uk/efo/economic-and-fiscal-outlook-november-2025/)
- [OBR Economic and Fiscal Outlook - March 2025](https://obr.uk/efo/economic-and-fiscal-outlook-march-2025/)
- [OBR Detailed forecast tables](https://obr.uk/download/november-2025-economic-and-fiscal-outlook-detailed-forecast-tables-zip-file/)
- [OBR long-run RPI-CPI wedge methodology](https://obr.uk/box/the-long-run-difference-between-rpi-and-cpi-inflation/)
