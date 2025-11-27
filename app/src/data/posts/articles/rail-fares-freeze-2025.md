Image credit: railsmartr

## Introduction

In the Autumn Budget 2025, the Government announced a freeze on all regulated rail fares in England for one year starting from March 2026. This is the first freeze on regulated rail fares in 30 years. The freeze applies to season tickets, peak return fares for commuters, and off-peak returns between major cities, holding these fares at their current levels until March 2027.

To estimate the reform impact, we follow OBR methodology and compare the freeze against a baseline where regulated fares increase by [5.8%](https://www.gov.uk/government/publications/rail-fares-freeze-passenger-savings-estimate) in March 2026, as would occur under the existing [fare formula](https://www.gov.uk/government/publications/railways-bill/railways-bill-fares) (July 2025 [RPI of 4.8%](https://obr.uk/efo/economic-and-fiscal-outlook-march-2025/) plus 1%). For subsequent years, we use RPI forecasts from the OBR's March 2025 Economic Outlook to project baseline fare increases under the standard formula. The freeze prevents this increase, requiring additional government subsidy to compensate for foregone fare revenue.

In the following sections, we estimate the cost of the rail fares freeze, compare the revenue impact with official statistics, and examine the distributional effects across income deciles.

## Economic impacts

### Revenue impact

We [estimate](https://gist.github.com/vahid-ahmadi/c0da31f3d92f117b4de92f31b4ca207b) the revenue impact of the rail fares freeze policy across fiscal years and compare our estimates with official HM Treasury projections. Table 1 shows the cost of freezing fares rather than implementing the planned 5.8% increase.

**Table 1: Revenue impact of rail fares freeze (£ million)**

| Source       | 2025-26 | 2026-27 | 2027-28 | 2028-29 | 2029-30 |
| ------------ | ------- | ------- | ------- | ------- | ------- |
| [PolicyEngine](https://gist.github.com/vahid-ahmadi/c0da31f3d92f117b4de92f31b4ca207b) | 0       | -163    | -170    | -178    | -185    |
| [HM Treasury](https://www.gov.uk/government/publications/budget-2025-document/budget-2025-html)  | 0       | -145    | -150    | -155    | -160    |

PolicyEngine estimates the freeze reduces revenue by £163 million in 2026-27, rising to £185 million by 2029-30 as baseline fare increases compound. HM Treasury projects revenue reductions of £145 million in 2026-27, rising to £160 million by 2029-30.

### Distributional impact

Figure 1 [shows](https://gist.github.com/vahid-ahmadi/c0da31f3d92f117b4de92f31b4ca207b) the relative change in household net income by income decile from the rail fares freeze in 2026-27. The distributional pattern reflects how rail usage varies across the income distribution.

**Figure 1: Relative change in household income by income decile, 2026-27**

```plotly
{
  "data": [
    {
      "x": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
      "y": [0.00022, 0.00006, 0.00004, 0.00006, 0.00008, 0.00006, 0.00010, 0.00010, 0.00006, 0.00011],
      "type": "bar",
      "marker": {
        "color": "#2C6496",
        "line": {
          "width": 0
        }
      },
      "hovertemplate": "Decile %{x}<br>Change: %{y:.3%}<extra></extra>",
      "text": ["+0.022%", "+0.006%", "+0.004%", "+0.006%", "+0.008%", "+0.006%", "+0.010%", "+0.010%", "+0.006%", "+0.011%"],
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
        "text": "Relative change in net income",
        "font": {
          "family": "Roboto Serif",
          "size": 14
        }
      },
      "tickfont": {
        "family": "Roboto Serif"
      },
      "tickformat": ".3%",
      "showgrid": true,
      "gridcolor": "#e0e0e0",
      "gridwidth": 1,
      "zeroline": true,
      "zerolinecolor": "#333",
      "zerolinewidth": 2,
      "range": [0, 0.00025]
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

In 2026-27, the lowest income decile gains 0.022% of household income on average, while the highest decile gains 0.011%, with gains ranging from 0.004% to 0.022% across deciles.
