Finance Secretary Shona Robison announced today that the Scottish Child Payment will be boosted to £40 per week for families with a baby under the age of one. This new "baby boost" rate represents a 47% increase over the current payment of £27.15 per week, delivering what Robison described as the "strongest package of support for families with young children anywhere in the UK."

Using PolicyEngine's Scotland tax-benefit microsimulation model, we estimate that this reform would cost approximately £80 million in 2026-27, rising to £83 million by 2030-31. The policy is highly targeted, benefiting around 0.12% of the Scottish population, with all gains concentrated in the bottom four income deciles.

## Background: The Scottish Child Payment

The Scottish Child Payment is a Scottish Government benefit paid to eligible low-income families for each child under 16. The payment is currently £27.15 per week (£1,412 per year) per eligible child. Eligibility requires the family to receive certain qualifying benefits, including Universal Credit, Child Tax Credit, Income Support, Pension Credit, or income-based Jobseeker's Allowance.

The new baby boost rate of £40 per week (£2,080 per year) will apply only to children under the age of one, providing an additional £668 per year of support during a child's first year of life.

## Budgetary impact

PolicyEngine estimates the following costs for the baby boost over the forecast period. The variation in annual costs reflects projected changes in the number of babies in eligible families.

**Table 1: Estimated cost of the Scottish Child Payment baby boost**

| Year    | Cost (£ million) |
| ------- | ---------------- |
| 2026-27 | 80               |
| 2027-28 | 75               |
| 2028-29 | 79               |
| 2029-30 | 79               |
| 2030-31 | 83               |

## Distributional impact

The reform is highly progressive, with benefits concentrated entirely in the bottom four income deciles. Figure 1 shows the relative change in household income by decile, with a year slider to see how the impact evolves from 2026-27 to 2030-31.

**Figure 1: Relative change in household income by income decile**

```plotly
{
  "data": [
    {
      "x": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      "y": [1.38, 0.95, 0.46, 0.18, 0, 0, 0, 0, 0, 0],
      "type": "bar",
      "marker": {"color": "#319795"},
      "hovertemplate": "Decile %{x}<br>Change: +%{y:.2f}%<extra></extra>",
      "text": ["+1.38%", "+0.95%", "+0.46%", "+0.18%", "+0.00%", "+0.00%", "+0.00%", "+0.00%", "+0.00%", "+0.00%"],
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
      "range": [0, 1.6]
    },
    "height": 500,
    "margin": {"l": 80, "r": 50, "b": 100, "t": 100, "pad": 4},
    "updatemenus": [{
      "type": "buttons",
      "showactive": false,
      "x": 0.1,
      "y": 1.25,
      "xanchor": "right",
      "buttons": [{
        "label": "Play",
        "method": "animate",
        "args": [null, {"frame": {"duration": 1000, "redraw": true}, "fromcurrent": true, "mode": "afterall"}]
      }]
    }],
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
      "y": 1.15,
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
        "y": [1.38, 0.95, 0.46, 0.18, 0, 0, 0, 0, 0, 0],
        "text": ["+1.38%", "+0.95%", "+0.46%", "+0.18%", "+0.00%", "+0.00%", "+0.00%", "+0.00%", "+0.00%", "+0.00%"]
      }]
    },
    {
      "name": "2027-28",
      "data": [{
        "y": [0.88, 0.95, 0.46, 0.24, 0, 0, 0, 0, 0, 0],
        "text": ["+0.88%", "+0.95%", "+0.46%", "+0.24%", "+0.00%", "+0.00%", "+0.00%", "+0.00%", "+0.00%", "+0.00%"]
      }]
    },
    {
      "name": "2028-29",
      "data": [{
        "y": [1.05, 0.93, 0.46, 0.29, 0, 0, 0, 0, 0, 0],
        "text": ["+1.05%", "+0.93%", "+0.46%", "+0.29%", "+0.00%", "+0.00%", "+0.00%", "+0.00%", "+0.00%", "+0.00%"]
      }]
    },
    {
      "name": "2029-30",
      "data": [{
        "y": [1.04, 0.92, 0.44, 0.29, 0, 0, 0, 0, 0, 0],
        "text": ["+1.04%", "+0.92%", "+0.44%", "+0.29%", "+0.00%", "+0.00%", "+0.00%", "+0.00%", "+0.00%", "+0.00%"]
      }]
    },
    {
      "name": "2030-31",
      "data": [{
        "y": [1.16, 0.91, 0.44, 0.28, 0, 0, 0, 0, 0, 0],
        "text": ["+1.16%", "+0.91%", "+0.44%", "+0.28%", "+0.00%", "+0.00%", "+0.00%", "+0.00%", "+0.00%", "+0.00%"]
      }]
    }
  ]
}
```

In 2026-27, the first decile sees the largest relative gain at 1.38%, followed by the second decile at 0.95%. The benefits decline sharply for higher deciles, with deciles 5-10 seeing no gains as families in these income groups are unlikely to qualify for the Scottish Child Payment.

Figure 2 shows the absolute change in household income (in £ per year) by income decile. The second decile sees the largest absolute gains, reaching around £2.88 per year by 2030-31.

**Figure 2: Absolute change in household income by income decile (£/year)**

```plotly
{
  "data": [
    {
      "x": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      "y": [2.54, 2.84, 1.71, 0.70, 0, 0, 0, 0, 0, 0],
      "type": "bar",
      "marker": {"color": "#319795"},
      "hovertemplate": "Decile %{x}<br>Change: £%{y:.2f}<extra></extra>",
      "text": ["£2.54", "£2.84", "£1.71", "£0.70", "£0.00", "£0.00", "£0.00", "£0.00", "£0.00", "£0.00"],
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
      "range": [0, 3.5]
    },
    "height": 500,
    "margin": {"l": 80, "r": 50, "b": 100, "t": 100, "pad": 4},
    "updatemenus": [{
      "type": "buttons",
      "showactive": false,
      "x": 0.1,
      "y": 1.25,
      "xanchor": "right",
      "buttons": [{
        "label": "Play",
        "method": "animate",
        "args": [null, {"frame": {"duration": 1000, "redraw": true}, "fromcurrent": true, "mode": "afterall"}]
      }]
    }],
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
      "y": 1.15,
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
        "y": [2.54, 2.84, 1.71, 0.70, 0, 0, 0, 0, 0, 0],
        "text": ["£2.54", "£2.84", "£1.71", "£0.70", "£0.00", "£0.00", "£0.00", "£0.00", "£0.00", "£0.00"]
      }]
    },
    {
      "name": "2027-28",
      "data": [{
        "y": [1.63, 2.85, 1.73, 0.97, 0, 0, 0, 0, 0, 0],
        "text": ["£1.63", "£2.85", "£1.73", "£0.97", "£0.00", "£0.00", "£0.00", "£0.00", "£0.00", "£0.00"]
      }]
    },
    {
      "name": "2028-29",
      "data": [{
        "y": [1.96, 2.85, 1.75, 1.21, 0, 0, 0, 0, 0, 0],
        "text": ["£1.96", "£2.85", "£1.75", "£1.21", "£0.00", "£0.00", "£0.00", "£0.00", "£0.00", "£0.00"]
      }]
    },
    {
      "name": "2029-30",
      "data": [{
        "y": [1.96, 2.86, 1.72, 1.21, 0, 0, 0, 0, 0, 0],
        "text": ["£1.96", "£2.86", "£1.72", "£1.21", "£0.00", "£0.00", "£0.00", "£0.00", "£0.00", "£0.00"]
      }]
    },
    {
      "name": "2030-31",
      "data": [{
        "y": [2.18, 2.88, 1.71, 1.20, 0, 0, 0, 0, 0, 0],
        "text": ["£2.18", "£2.88", "£1.71", "£1.20", "£0.00", "£0.00", "£0.00", "£0.00", "£0.00", "£0.00"]
      }]
    }
  ]
}
```

## Poverty impact

Due to the narrow targeting of the policy, the impact on overall poverty rates is modest. In 2026-27, overall poverty falls by 0.004% and child poverty by 0.010%, remaining roughly stable through 2030-31. While these aggregate impacts appear small, they reflect the policy's precise targeting at families with very young children. For the approximately 6,000 families who receive the baby boost, the additional £668 per year during their child's first year of life provides meaningful support during a period of high financial pressure.

## Constituency impact

The impact of the baby boost varies across Scotland's 57 parliamentary constituencies. Figure 3 shows the average annual household gain by constituency.

**Figure 3: Average gain by constituency (2026-27)**

<iframe src="/assets/posts/scottish-budget-2026-scp-baby-boost/constituency_map_scp_baby_boost.html" width="100%" height="600" frameborder="0"></iframe>

Edinburgh South sees the largest average gain at £11.90, followed by Paisley and Renfrewshire North at £11.40. The constituencies with the smallest gains include Dumfries and Galloway (£6.69) and Airdrie and Shotts (£6.74).

## Conclusion

The Scottish Child Payment baby boost represents a targeted investment in families with very young children. At a cost of approximately £80 million per year, the policy provides an additional £668 annually to eligible families during their child's first year of life.

The reform is highly progressive, with all benefits flowing to the bottom four income deciles. While the aggregate poverty impact is modest due to the policy's precise targeting, the baby boost delivers meaningful support to around 6,000 families at a critical time in their children's development.

For more analysis of Scottish and UK policy reforms, visit [policyengine.org](https://policyengine.org) or explore our [Scotland economic outlook dashboard](https://policyengine.org/uk/research/scottish-budget-2026-27).
