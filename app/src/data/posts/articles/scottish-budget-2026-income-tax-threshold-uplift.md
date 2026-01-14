The Scottish Government [announced in the 2026-27 Budget](https://www.gov.scot/publications/scottish-budget-2026-27/) that it will raise the Basic and Intermediate rate income tax thresholds by 7.4%, significantly more than inflation. Finance Secretary Shona Robison stated that whilst the UK Government has chosen to freeze all income tax thresholds, Scotland has chosen to support those with lower incomes. The government analysis suggests that 55% of taxpayers will be expected to pay less in 2026-27 than they would in the rest of the UK.

Using PolicyEngine's Scotland tax-benefit microsimulation model, we estimate that this reform would cost approximately £63 million in 2026-27, rising to £68 million by 2030-31. Benefits are spread across all income deciles, with the largest relative gains concentrated in middle to upper income households.

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
| 2026-27 | 62.7             |
| 2027-28 | 64.2             |
| 2028-29 | 65.2             |
| 2029-30 | 66.2             |
| 2030-31 | 67.5             |

## Distributional impact

Benefits are distributed across all income deciles, with higher relative gains in middle to upper deciles. Figure 1 shows the relative change in household income by decile, with a year selector to see how the impact evolves from 2026-27 to 2030-31.

**Figure 1: Relative change in household income by income decile**

```plotly
{
  "data": [
    {
      "x": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      "y": [0.65283333, 3.129607, 3.0004922, 3.6947224, 5.388424, 4.5356914, 6.0548972, 5.9629746, 5.669861, 4.1767877],
      "type": "bar",
      "marker": {"color": "#2C6496"},
      "hovertemplate": "Decile %{x}<br>Change: +%{y:.2f}%<extra></extra>",
      "text": ["+0.65%", "+3.13%", "+3.00%", "+3.69%", "+5.39%", "+4.54%", "+6.05%", "+5.96%", "+5.67%", "+4.18%"],
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
      "range": [0, 7.5]
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
        "y": [0.65283333, 3.129607, 3.0004922, 3.6947224, 5.388424, 4.5356914, 6.0548972, 5.9629746, 5.669861, 4.1767877],
        "text": ["+0.65%", "+3.13%", "+3.00%", "+3.69%", "+5.39%", "+4.54%", "+6.05%", "+5.96%", "+5.67%", "+4.18%"]
      }]
    },
    {
      "name": "2027-28",
      "data": [{
        "y": [0.72261863, 2.9985292, 3.1009406, 3.8062385999999995, 5.17637, 4.4246703, 6.2266923, 5.9788354, 5.6146316, 4.113659],
        "text": ["+0.72%", "+3.00%", "+3.10%", "+3.81%", "+5.18%", "+4.42%", "+6.23%", "+5.98%", "+5.61%", "+4.11%"]
      }]
    },
    {
      "name": "2028-29",
      "data": [{
        "y": [0.76094656, 3.0094706999999996, 2.8971385, 3.9929308, 5.1244195999999995, 4.391136, 6.1699875, 5.991827000000001, 5.525095, 4.0132288],
        "text": ["+0.76%", "+3.01%", "+2.90%", "+3.99%", "+5.12%", "+4.39%", "+6.17%", "+5.99%", "+5.53%", "+4.01%"]
      }]
    },
    {
      "name": "2029-30",
      "data": [{
        "y": [0.8450367999999999, 3.0047704, 2.9465867, 3.8727578, 5.263794, 4.254932, 6.1360553, 5.9736863, 5.45813, 3.9777554999999998],
        "text": ["+0.85%", "+3.00%", "+2.95%", "+3.87%", "+5.26%", "+4.25%", "+6.14%", "+5.97%", "+5.46%", "+3.98%"]
      }]
    },
    {
      "name": "2030-31",
      "data": [{
        "y": [0.9055623, 2.962463, 3.0915383000000003, 3.9661467, 5.2233756, 4.255492, 6.1046954, 5.96167, 5.37707, 3.9075474999999997],
        "text": ["+0.91%", "+2.96%", "+3.09%", "+3.97%", "+5.22%", "+4.26%", "+6.10%", "+5.96%", "+5.38%", "+3.91%"]
      }]
    }
  ]
}
```

In 2026-27, the seventh decile sees the largest relative gain at 6.05%, followed by the eighth decile at 5.96% and the ninth decile at 5.67%. Lower income deciles see smaller gains: the first decile gains 0.65%, the second decile 3.13%, and the third decile 3.00%.

Figure 2 shows the absolute change in household income (in £ per year) by income decile.

**Figure 2: Absolute change in household income by income decile (£/year)**

```plotly
{
  "data": [
    {
      "x": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      "y": [1.1739502, 8.528791, 9.657907, 14.925929, 24.573185, 21.517292, 35.703278, 41.6923, 44.787724, 49.502354],
      "type": "bar",
      "marker": {"color": "#319795"},
      "hovertemplate": "Decile %{x}<br>Change: £%{y:.2f}<extra></extra>",
      "text": ["£1.17", "£8.53", "£9.66", "£14.93", "£24.57", "£21.52", "£35.70", "£41.69", "£44.79", "£49.50"],
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
        "y": [1.1739502, 8.528791, 9.657907, 14.925929, 24.573185, 21.517292, 35.703278, 41.6923, 44.787724, 49.502354],
        "text": ["£1.17", "£8.53", "£9.66", "£14.93", "£24.57", "£21.52", "£35.70", "£41.69", "£44.79", "£49.50"]
      }]
    },
    {
      "name": "2027-28",
      "data": [{
        "y": [1.2980821, 8.324215, 10.2392645, 15.679519, 24.079605, 21.152308, 37.157948, 42.5038, 45.165546, 49.526917],
        "text": ["£1.30", "£8.32", "£10.24", "£15.68", "£24.08", "£21.15", "£37.16", "£42.50", "£45.17", "£49.53"]
      }]
    },
    {
      "name": "2028-29",
      "data": [{
        "y": [1.3772949, 8.475538, 9.819492, 16.672169, 23.944454, 21.515928, 37.438095, 43.30782, 45.329338, 49.461792],
        "text": ["£1.38", "£8.48", "£9.82", "£16.67", "£23.94", "£21.52", "£37.44", "£43.31", "£45.33", "£49.46"]
      }]
    },
    {
      "name": "2029-30",
      "data": [{
        "y": [1.5546128, 8.602399, 9.984511, 16.664972, 24.935036, 21.203747, 37.665592, 44.05479, 45.21265, 49.828674],
        "text": ["£1.55", "£8.60", "£9.98", "£16.66", "£24.94", "£21.20", "£37.67", "£44.05", "£45.21", "£49.83"]
      }]
    },
    {
      "name": "2030-31",
      "data": [{
        "y": [1.7043703, 8.769535, 10.391815, 17.41873, 25.217083, 21.588268, 37.593983, 44.76136, 45.396435, 49.975407],
        "text": ["£1.70", "£8.77", "£10.39", "£17.42", "£25.22", "£21.59", "£37.59", "£44.76", "£45.40", "£49.98"]
      }]
    }
  ]
}
```

## Poverty impact

We measure poverty using absolute poverty before housing costs, defined as households with income below 60% of the 2010/11 median income, adjusted for inflation. This is the standard definition used in the government's Households Below Average Income publication.

The income tax threshold uplift has minimal impact on poverty rates. In 2026-27, overall poverty remains essentially unchanged, and child poverty shows no change. This is expected as the policy primarily benefits working households above the poverty line who pay income tax.

## Constituency impact

Figure 3 shows the average annual household gain by constituency in 2026-27.

**Figure 3: Average gain by constituency (2026-27)**

<iframe src="/assets/posts/scottish-budget-2026-income-tax-threshold-uplift/constituency_map_income_tax_threshold_uplift.html" width="100%" height="600" frameborder="0"></iframe>

In 2026-27, Glasgow East sees the largest average gain at £24.28, followed by Glasgow South at £24.17 and Arbroath and Broughty Ferry at £24.03. Orkney and Shetland has the smallest average gain at £17.87.

## Conclusion

The Scottish income tax threshold uplift would cost approximately £63 million per year and provide tax relief averaging £23 per household annually. Benefits are distributed across all income deciles, with the largest relative gains going to middle and upper income households who pay more income tax. The policy has minimal impact on poverty rates, as it primarily benefits working households above the poverty line.
