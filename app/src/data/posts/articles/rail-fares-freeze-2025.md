Image credit: railsmartr

## Introduction

In the Autumn Budget 2025, the Government announced a freeze on all regulated rail fares in England for one year starting from March 2026. This is the first freeze on regulated rail fares in 30 years. The freeze applies to season tickets, peak return fares for commuters, and off-peak returns between major cities, holding these fares at their current levels until March 2027.

### Methodology

To estimate the reform impact, we follow OBR methodology and compare the freeze against a baseline where regulated fares increase by [5.8%](https://www.gov.uk/government/publications/rail-fares-freeze-passenger-savings-estimate) in March 2026, as would occur under the existing [fare formula](https://www.gov.uk/government/publications/railways-bill/railways-bill-fares) (July 2025 [RPI of 4.8%](https://obr.uk/efo/economic-and-fiscal-outlook-march-2025/) plus 1%). For subsequent years, we use RPI forecasts from the OBR's March 2025 Economic Outlook to project baseline fare increases under the standard formula. The freeze prevents this increase, requiring additional government subsidy to compensate for foregone fare revenue. We model this by transferring household expenditure that would have been spent on higher fares to government rail subsidy, distributed proportionally based on households' rail usage.

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

Figure 1 [shows](https://gist.github.com/vahid-ahmadi/c0da31f3d92f117b4de92f31b4ca207b) the average change in household net income by income decile from the rail fares freeze in 2026-27. The distributional pattern reflects how rail usage varies across the income distribution.

**Figure 1: Average change in household income by income decile, 2026-27**

```plotly
{
  "data": [
    {
      "x": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
      "y": [2.58, 1.28, 1.00, 1.97, 3.07, 2.76, 5.58, 6.54, 5.02, 18.89],
      "type": "bar",
      "marker": {
        "color": "#2C6496",
        "line": {
          "width": 0
        }
      },
      "hovertemplate": "Decile %{x}<br>Change: £%{y:.2f}<extra></extra>",
      "text": ["£2.58", "£1.28", "£1.00", "£1.97", "£3.07", "£2.76", "£5.58", "£6.54", "£5.02", "£18.89"],
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

In 2026-27, the average household benefit ranges from £1.00 per year for the third decile to £18.89 for the highest decile. The absolute benefit rises with income, reflecting higher rail usage among higher-income households.
