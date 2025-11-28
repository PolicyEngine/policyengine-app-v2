In the Autumn Budget 2025, the Government announced a freeze on all regulated rail fares in England for one year starting from March 2026. This is the first freeze on regulated rail fares in 30 years. The freeze applies to season tickets, peak return fares for commuters, and off-peak returns between major cities, holding these fares at their current levels until March 2027.

## Revenue impact

Table 1 shows the cost of freezing fares rather than implementing the planned 5.8% increase. PolicyEngine estimates align closely with official HM Treasury projections.

**Table 1: Revenue impact of rail fares freeze (£ million)**

| Source       | 2025-26 | 2026-27 | 2027-28 | 2028-29 | 2029-30 |
| ------------ | ------- | ------- | ------- | ------- | ------- |
| PolicyEngine | 0       | -145    | -155    | -160    | -165    |
| [HM Treasury](https://www.gov.uk/government/publications/rail-fares-freeze-passenger-savings-estimate)  | 0       | -145    | -150    | -155    | -160    |

PolicyEngine estimates the freeze reduces revenue by £145 million in 2026-27, rising to £165 million by 2029-30 as baseline fare increases compound. This closely matches HM Treasury projections of £145 million in 2026-27, rising to £160 million by 2029-30.

## Distributional impact

Figure 1 shows the average change in household net income by income decile from the rail fares freeze in 2026-27. The distributional pattern reflects how rail usage varies across the income distribution.

**Figure 1: Average change in household income by income decile, 2026-27**

```plotly
{
  "data": [
    {
      "x": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
      "y": [3.19, 5.03, 2.80, 2.62, 3.10, 4.50, 2.41, 17.58, 2.55, 1.76],
      "type": "bar",
      "marker": {
        "color": "#2C6496",
        "line": {
          "width": 0
        }
      },
      "hovertemplate": "Decile %{x}<br>Change: £%{y:.2f}<extra></extra>",
      "text": ["£3.19", "£5.03", "£2.80", "£2.62", "£3.10", "£4.50", "£2.41", "£17.58", "£2.55", "£1.76"],
      "textposition": "outside",
      "textfont": {
        "family": "Roboto Serif",
        "size": 14,
        "color": "#333"
      }
    }
  ],
  "layout": {
    "xaxis": {
      "title": {
        "text": "Income decile",
        "font": {
          "family": "Roboto Serif",
          "size": 14
        }
      },
      "tickfont": {
        "family": "Roboto Serif"
      },
      "showgrid": true,
      "gridcolor": "#e0e0e0",
      "gridwidth": 1,
      "tickmode": "linear",
      "tick0": 1,
      "dtick": 1
    },
    "yaxis": {
      "title": {
        "text": "Average change in net income (£)",
        "font": {
          "family": "Roboto Serif",
          "size": 14
        }
      },
      "tickfont": {
        "family": "Roboto Serif"
      },
      "tickformat": "£.2f",
      "showgrid": true,
      "gridcolor": "#e0e0e0",
      "gridwidth": 1,
      "zeroline": true,
      "zerolinecolor": "#333",
      "zerolinewidth": 2,
      "range": [0, 20]
    },
    "height": 500,
    "margin": {
      "l": 100,
      "r": 40,
      "b": 80,
      "t": 40,
      "pad": 4
    },
    "plot_bgcolor": "white",
    "paper_bgcolor": "white",
    "font": {
      "family": "Roboto Serif"
    }
  }
}
```

In 2026-27, the average household benefit ranges from £1.76 per year for the highest decile to £17.58 for the eighth decile. The eighth decile sees the largest benefit, likely reflecting middle-to-upper-middle income commuters who rely heavily on rail travel. Lower and middle deciles see more modest benefits of £2-5 per household, while the top decile benefits least in absolute terms despite higher incomes.

## Appendix: Methodology

### Baseline scenario

Without the freeze, regulated rail fares would have increased by [5.8%](https://www.gov.uk/government/publications/rail-fares-freeze-passenger-savings-estimate) in March 2026 under the existing [fare formula](https://www.gov.uk/government/publications/railways-bill/railways-bill-fares), which sets annual fare increases at July RPI plus 1 percentage point. HM Treasury's passenger savings methodology document uses July 2025 RPI of 4.8%, yielding the 5.8% baseline increase. Subsequent years would follow the same formula, with fare increases compounding annually.

### Fiscal cost estimation

We calibrate our aggregate fiscal cost to [HM Treasury estimates](https://www.gov.uk/government/publications/rail-fares-freeze-passenger-savings-estimate). The freeze requires additional government subsidy to compensate train operating companies for foregone fare revenue, estimated at £145 million in 2026-27 rising to £775 million cumulative by 2030-31. Costs rise in subsequent years as the gap between frozen fares and the counterfactual baseline widens with each year of foregone increases.

### Household-level distribution

To estimate distributional impacts, we use household rail expenditure data from the [Family Resources Survey](https://www.gov.uk/government/collections/family-resources-survey--2) (FRS). The FRS records annual spending on rail travel for each sampled household, which we use as a proxy for rail usage intensity.

We distribute the aggregate Treasury cost estimate to households in proportion to their share of total weighted rail expenditure:

$$\text{Household benefit}_i = \text{Total cost} \times \frac{\text{Rail spending}_i \times \text{Weight}_i}{\sum_j \text{Rail spending}_j \times \text{Weight}_j}$$

This approach assumes the benefit of frozen fares accrues proportionally to existing rail usage patterns. Households that spend more on rail travel receive a larger absolute benefit from the freeze.

### Limitations

Our distributional estimates have several limitations:

1. **Static behaviour**: We assume rail usage patterns remain unchanged. In practice, the freeze may induce additional rail travel, particularly among price-sensitive households.

2. **Regulated fares only**: The freeze applies only to regulated fares (season tickets, some returns). Unregulated fares set by train operators may still increase.

3. **Survey coverage**: The FRS may undercount very high rail spending (e.g., long-distance commuters with expensive season tickets) due to survey design and response patterns.

4. **Geographic variation**: Benefits concentrate among households with access to rail services, primarily in urban areas and along commuter corridors.
