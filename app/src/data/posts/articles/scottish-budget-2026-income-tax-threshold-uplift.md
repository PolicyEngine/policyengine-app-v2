The Scottish Government [announced in the 2026-27 Budget](https://www.gov.scot/publications/scottish-budget-2026-27/) that it will raise the Basic and Intermediate rate income tax thresholds by 7.4%. Finance Secretary Shona Robison stated that whilst the UK Government has chosen to freeze all income tax thresholds, Scotland has chosen to support those with lower incomes. The [government analysis](https://www.gov.scot/publications/scottish-budget-2026-27/) suggests that 55% of taxpayers will be expected to pay less in 2026-27 than they would in the rest of the UK.

Using PolicyEngine's Scotland tax-benefit microsimulation model, we estimate that this reform would cost approximately £62 million in 2026-27, rising to £67 million by 2030-31. Benefits are spread across all income deciles, with the largest relative gains concentrated in middle to upper income households.

## Background: Scottish income tax thresholds

Scotland has devolved powers over income tax rates and bands. The current Scottish income tax system includes a Starter rate (19%), Basic rate (20%), Intermediate rate (21%), Higher rate (42%), and Top rate (48%).

The 2026-27 Budget raises two key thresholds:
- Basic rate threshold: increases from £15,398 to £16,537 (+7.4%)
- Intermediate rate threshold: increases from £27,492 to £29,527 (+7.4%)

This means taxpayers will pay the lower 19% starter rate on more of their income before moving into higher tax bands. The Higher rate threshold (42%) remains unchanged at £43,663.

## Budgetary impact

PolicyEngine estimates the following costs for the threshold uplift over the forecast period.

**Table 1: Estimated cost of the income tax threshold uplift**

| Year    | Cost (£ million) |
| ------- | ---------------- |
| 2026-27 | 61.7             |
| 2027-28 | 63.1             |
| 2028-29 | 64.2             |
| 2029-30 | 65.2             |
| 2030-31 | 66.5             |

## Distributional impact

Benefits are distributed across all income deciles, with higher relative gains in middle to upper deciles. Figure 1 shows the relative change in household income by decile, with a year selector to see how the impact evolves from 2026-27 to 2030-31.

**Figure 1: Relative change in household income by income decile**

```plotly
{
  "data": [
    {
      "x": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      "y": [0.62, 2.93, 3.41, 3.97, 5.07, 4.73, 5.33, 5.57, 5.46, 4.17],
      "type": "bar",
      "marker": {"color": "#319795"},
      "hovertemplate": "Decile %{x}<br>Change: +%{y:.2f}%<extra></extra>",
      "text": ["+0.62%", "+2.93%", "+3.41%", "+3.97%", "+5.07%", "+4.73%", "+5.33%", "+5.57%", "+5.46%", "+4.17%"],
      "textposition": "outside",
      "textfont": {"family": "Roboto Serif", "size": 11}
    }
  ],
  "layout": {
    "xaxis": {
      "title": "Income decile",
      "titlefont": {"family": "Roboto Serif"},
      "tickfont": {"family": "Roboto Serif"},
      "tickmode": "array",
      "tickvals": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      "showgrid": true,
      "gridcolor": "#e0e0e0"
    },
    "yaxis": {
      "title": "Relative change in household income (%)",
      "titlefont": {"family": "Roboto Serif"},
      "tickfont": {"family": "Roboto Serif"},
      "ticksuffix": "%",
      "showgrid": true,
      "gridcolor": "#e0e0e0",
      "range": [0, 7]
    },
    "height": 500,
    "margin": {"l": 80, "r": 50, "b": 100, "t": 100, "pad": 4},
    "plot_bgcolor": "#F4F4F4",
    "paper_bgcolor": "#F4F4F4",
    "font": {"family": "Roboto Serif"},
    "sliders": [{
      "active": 0,
      "steps": [
        {"label": "2026-27", "method": "animate", "args": [["2026-27"], {"frame": {"duration": 0, "redraw": true}, "mode": "immediate"}]},
        {"label": "2027-28", "method": "animate", "args": [["2027-28"], {"frame": {"duration": 0, "redraw": true}, "mode": "immediate"}]},
        {"label": "2028-29", "method": "animate", "args": [["2028-29"], {"frame": {"duration": 0, "redraw": true}, "mode": "immediate"}]},
        {"label": "2029-30", "method": "animate", "args": [["2029-30"], {"frame": {"duration": 0, "redraw": true}, "mode": "immediate"}]},
        {"label": "2030-31", "method": "animate", "args": [["2030-31"], {"frame": {"duration": 0, "redraw": true}, "mode": "immediate"}]}
      ],
      "x": 0.25,
      "len": 0.5,
      "y": 1.12,
      "yanchor": "bottom",
      "currentvalue": {"visible": false},
      "font": {"family": "Roboto Serif"}
    }],
    "images": [
      {
        "source": "https://raw.githubusercontent.com/PolicyEngine/policyengine-app-v2/main/app/public/assets/logos/policyengine/teal.png",
        "x": 1,
        "y": -0.15,
        "xref": "paper",
        "yref": "paper",
        "sizex": 0.15,
        "sizey": 0.15,
        "xanchor": "right",
        "yanchor": "bottom"
      }
    ]
  },
  "frames": [
    {
      "name": "2026-27",
      "data": [{
        "y": [0.62, 2.93, 3.41, 3.97, 5.07, 4.73, 5.33, 5.57, 5.46, 4.17],
        "text": ["+0.62%", "+2.93%", "+3.41%", "+3.97%", "+5.07%", "+4.73%", "+5.33%", "+5.57%", "+5.46%", "+4.17%"]
      }]
    },
    {
      "name": "2027-28",
      "data": [{
        "y": [0.61, 2.88, 3.52, 3.81, 5.05, 4.76, 5.37, 5.59, 5.42, 4.12],
        "text": ["+0.61%", "+2.88%", "+3.52%", "+3.81%", "+5.05%", "+4.76%", "+5.37%", "+5.59%", "+5.42%", "+4.12%"]
      }]
    },
    {
      "name": "2028-29",
      "data": [{
        "y": [0.64, 3.01, 3.43, 3.83, 5.11, 4.74, 5.31, 5.61, 5.33, 4.05],
        "text": ["+0.64%", "+3.01%", "+3.43%", "+3.83%", "+5.11%", "+4.74%", "+5.31%", "+5.61%", "+5.33%", "+4.05%"]
      }]
    },
    {
      "name": "2029-30",
      "data": [{
        "y": [0.66, 3.21, 3.42, 3.85, 5.07, 4.65, 5.28, 5.61, 5.26, 4.00],
        "text": ["+0.66%", "+3.21%", "+3.42%", "+3.85%", "+5.07%", "+4.65%", "+5.28%", "+5.61%", "+5.26%", "+4.00%"]
      }]
    },
    {
      "name": "2030-31",
      "data": [{
        "y": [0.70, 3.17, 3.33, 4.02, 5.14, 4.65, 5.23, 5.56, 5.22, 3.92],
        "text": ["+0.70%", "+3.17%", "+3.33%", "+4.02%", "+5.14%", "+4.65%", "+5.23%", "+5.56%", "+5.22%", "+3.92%"]
      }]
    }
  ]
}
```

In 2026-27, the eighth decile sees the largest relative gain at 5.57%, followed by the ninth decile at 5.46% and the seventh decile at 5.33%. Lower income deciles see smaller gains: the first decile gains 0.62%, the second decile 2.93%, and the third decile 3.41%.

Figure 2 shows the absolute change in household income (in £ per year) by income decile.

**Figure 2: Absolute change in household income by income decile (£/year)**

```plotly
{
  "data": [
    {
      "x": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      "y": [1.13, 8.21, 11.04, 17.06, 22.67, 24.21, 27.80, 41.19, 42.69, 49.15],
      "type": "bar",
      "marker": {"color": "#319795"},
      "hovertemplate": "Decile %{x}<br>Change: £%{y:.2f}<extra></extra>",
      "text": ["£1.13", "£8.21", "£11.04", "£17.06", "£22.67", "£24.21", "£27.80", "£41.19", "£42.69", "£49.15"],
      "textposition": "outside",
      "textfont": {"family": "Roboto Serif", "size": 11}
    }
  ],
  "layout": {
    "xaxis": {
      "title": "Income decile",
      "titlefont": {"family": "Roboto Serif"},
      "tickfont": {"family": "Roboto Serif"},
      "tickmode": "array",
      "tickvals": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      "showgrid": true,
      "gridcolor": "#e0e0e0"
    },
    "yaxis": {
      "title": "Absolute change in household income (£/year)",
      "titlefont": {"family": "Roboto Serif"},
      "tickfont": {"family": "Roboto Serif"},
      "tickprefix": "£",
      "showgrid": true,
      "gridcolor": "#e0e0e0",
      "range": [0, 60]
    },
    "height": 500,
    "margin": {"l": 80, "r": 50, "b": 100, "t": 100, "pad": 4},
    "plot_bgcolor": "#F4F4F4",
    "paper_bgcolor": "#F4F4F4",
    "font": {"family": "Roboto Serif"},
    "sliders": [{
      "active": 0,
      "steps": [
        {"label": "2026-27", "method": "animate", "args": [["2026-27"], {"frame": {"duration": 0, "redraw": true}, "mode": "immediate"}]},
        {"label": "2027-28", "method": "animate", "args": [["2027-28"], {"frame": {"duration": 0, "redraw": true}, "mode": "immediate"}]},
        {"label": "2028-29", "method": "animate", "args": [["2028-29"], {"frame": {"duration": 0, "redraw": true}, "mode": "immediate"}]},
        {"label": "2029-30", "method": "animate", "args": [["2029-30"], {"frame": {"duration": 0, "redraw": true}, "mode": "immediate"}]},
        {"label": "2030-31", "method": "animate", "args": [["2030-31"], {"frame": {"duration": 0, "redraw": true}, "mode": "immediate"}]}
      ],
      "x": 0.25,
      "len": 0.5,
      "y": 1.12,
      "yanchor": "bottom",
      "currentvalue": {"visible": false},
      "font": {"family": "Roboto Serif"}
    }],
    "images": [
      {
        "source": "https://raw.githubusercontent.com/PolicyEngine/policyengine-app-v2/main/app/public/assets/logos/policyengine/teal.png",
        "x": 1,
        "y": -0.15,
        "xref": "paper",
        "yref": "paper",
        "sizex": 0.15,
        "sizey": 0.15,
        "xanchor": "right",
        "yanchor": "bottom"
      }
    ]
  },
  "frames": [
    {
      "name": "2026-27",
      "data": [{
        "y": [1.13, 8.21, 11.04, 17.06, 22.67, 24.21, 27.80, 41.19, 42.69, 49.15],
        "text": ["£1.13", "£8.21", "£11.04", "£17.06", "£22.67", "£24.21", "£27.80", "£41.19", "£42.69", "£49.15"]
      }]
    },
    {
      "name": "2027-28",
      "data": [{
        "y": [1.09, 8.30, 11.43, 16.78, 23.15, 24.94, 28.36, 42.00, 43.25, 49.25],
        "text": ["£1.09", "£8.30", "£11.43", "£16.78", "£23.15", "£24.94", "£28.36", "£42.00", "£43.25", "£49.25"]
      }]
    },
    {
      "name": "2028-29",
      "data": [{
        "y": [1.18, 8.80, 11.23, 17.27, 23.57, 25.30, 28.40, 42.93, 43.30, 49.29],
        "text": ["£1.18", "£8.80", "£11.23", "£17.27", "£23.57", "£25.30", "£28.40", "£42.93", "£43.30", "£49.29"]
      }]
    },
    {
      "name": "2029-30",
      "data": [{
        "y": [1.30, 9.21, 11.40, 17.43, 23.74, 25.37, 28.73, 43.66, 43.25, 49.49],
        "text": ["£1.30", "£9.21", "£11.40", "£17.43", "£23.74", "£25.37", "£28.73", "£43.66", "£43.25", "£49.49"]
      }]
    },
    {
      "name": "2030-31",
      "data": [{
        "y": [1.37, 9.29, 11.25, 18.64, 24.46, 25.93, 28.78, 44.35, 43.42, 49.74],
        "text": ["£1.37", "£9.29", "£11.25", "£18.64", "£24.46", "£25.93", "£28.78", "£44.35", "£43.42", "£49.74"]
      }]
    }
  ]
}
```

## Poverty impact

We measure poverty using absolute poverty before housing costs, defined as households with income below 60% of the 2010/11 median income, adjusted for inflation. This is the standard definition used in the government's [Households Below Average Income](https://www.gov.uk/government/collections/households-below-average-income-hbai--2) publication.

The income tax threshold uplift has negligible impact on poverty rates. In 2026-27, overall poverty changes by less than 0.01 percentage points, and child poverty shows no change. This is expected as the policy primarily benefits working households above the poverty line who pay income tax.

## Constituency impact

Figure 3 shows the average annual household gain by constituency in 2026-27.

**Figure 3: Average gain by constituency (2026-27)**

<iframe src="/assets/posts/scottish-budget-2026-income-tax-threshold-uplift/constituency_map_income_tax_threshold_uplift.html" width="100%" height="600" frameborder="0"></iframe>

In 2026-27, Glasgow South sees the largest average gain at £29.31, followed by Glasgow East at £28.90 and Glasgow North at £28.09. Orkney and Shetland has the smallest average gain at £12.74.

## Conclusion

The Scottish income tax threshold uplift would cost approximately £62 million per year and provide tax relief averaging £23 per household annually. Benefits are distributed across all income deciles, with the largest relative gains going to middle and upper income households who pay more income tax. The policy has minimal impact on poverty rates, as it primarily benefits working households above the poverty line.
