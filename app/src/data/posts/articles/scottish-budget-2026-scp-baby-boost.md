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
      "marker": {"color": "#2C6496"},
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

## Winners and losers

The baby boost creates no losers. Figure 3 shows the population share by income change category for each income decile. In 2026-27, approximately 0.12% of the Scottish population gains from the reform, with the remaining 99.88% unaffected. This reflects the highly targeted nature of the policy, which only affects low-income families with babies under one year old.

**Figure 3: Population share by income change**

```plotly
{
  "data": [
    {
      "name": "Gain more than 5%",
      "type": "bar",
      "orientation": "h",
      "x": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, null, 0.0],
      "y": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "", "All"],
      "marker": {"color": "#2C6496"},
      "hovertemplate": "%{y}<br>Gain more than 5%: %{x:.2f}%<extra></extra>"
    },
    {
      "name": "Gain less than 5%",
      "type": "bar",
      "orientation": "h",
      "x": [0.12, 0.12, 0.12, 0.12, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, null, 0.12],
      "y": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "", "All"],
      "marker": {"color": "#809ac2"},
      "text": ["", "", "", "", "", "", "", "", "", "", "", ""],
      "textposition": "inside",
      "hovertemplate": "%{y}<br>Gain less than 5%: %{x:.2f}%<extra></extra>"
    },
    {
      "name": "No change",
      "type": "bar",
      "orientation": "h",
      "x": [99.88, 99.88, 99.88, 99.88, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, null, 99.88],
      "y": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "", "All"],
      "marker": {"color": "#DCDCDC"},
      "text": ["99.9%", "99.9%", "99.9%", "99.9%", "100%", "100%", "100%", "100%", "100%", "100%", "", "99.9%"],
      "textposition": "outside",
      "textfont": {"color": "#333", "size": 12, "family": "Roboto Serif"},
      "hovertemplate": "%{y}<br>No change: %{x:.2f}%<extra></extra>"
    }
  ],
  "layout": {
    "barmode": "stack",
    "xaxis": {
      "title": {"text": "Population share", "font": {"family": "Roboto Serif", "size": 14}},
      "tickfont": {"family": "Roboto Serif", "size": 12},
      "ticksuffix": "%",
      "tickvals": [0, 20, 40, 60, 80, 100],
      "range": [0, 108],
      "showgrid": false,
      "zeroline": false
    },
    "yaxis": {
      "title": {"text": "Income decile", "font": {"family": "Roboto Serif", "size": 14}},
      "tickfont": {"family": "Roboto Serif", "size": 12},
      "showgrid": false,
      "zeroline": false,
      "type": "category"
    },
    "height": 650,
    "margin": {"l": 80, "r": 180, "b": 100, "t": 80, "pad": 4},
    "legend": {
      "orientation": "v",
      "x": 1.02,
      "y": 0.5,
      "xanchor": "left",
      "yanchor": "middle",
      "title": {"text": "Change in income", "font": {"family": "Roboto Serif", "size": 13}},
      "font": {"family": "Roboto Serif", "size": 12}
    },
    "plot_bgcolor": "white",
    "paper_bgcolor": "white",
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
  }
}
```

**Table 2: Distribution of outcomes (2026-27)**

| Outcome   | Share of population (%) |
| --------- | ----------------------- |
| Winners   | 0.12                    |
| Losers    | 0.00                    |
| Unchanged | 99.88                   |

## Poverty impact

Due to the narrow targeting of the policy, the impact on overall poverty rates is modest. Table 3 shows the change in poverty rates across the forecast period.

**Table 3: Change in poverty rates**

| Year    | Overall poverty change | Child poverty change |
| ------- | ---------------------- | -------------------- |
| 2026-27 | -0.004%                | -0.010%              |
| 2027-28 | -0.004%                | -0.010%              |
| 2028-29 | -0.004%                | -0.010%              |
| 2029-30 | -0.004%                | -0.010%              |
| 2030-31 | -0.004%                | -0.010%              |

While these aggregate impacts appear small, they reflect the policy's precise targeting at families with very young children. For the approximately 6,000 families who receive the baby boost, the additional £668 per year during their child's first year of life provides meaningful support during a period of high financial pressure.

## Constituency impact

The impact of the baby boost varies across Scotland's 57 parliamentary constituencies. Figure 4 shows the constituencies with the highest and lowest average gains in 2026-27.

**Figure 4: Average gain by constituency (2026-27)**

```plotly
{
  "data": [
    {
      "y": ["Edinburgh South", "Paisley and Renfrewshire North", "Moray West, Nairn and Strathspey", "Gordon and Buchan", "Glenrothes and Mid Fife", "Bathgate and Linlithgow", "Alloa and Grangemouth", "Orkney and Shetland", "Coatbridge and Bellshill", "Midlothian", "Kilmarnock and Loudoun", "Ayr, Carrick and Cumnock", "Dumfriesshire, Clydesdale and Tweeddale", "Cowdenbeath and Kirkcaldy", "Livingston"],
      "x": [11.90, 11.40, 11.31, 11.04, 10.76, 10.89, 10.61, 10.58, 10.37, 10.35, 10.36, 10.24, 10.22, 10.23, 10.28],
      "type": "bar",
      "orientation": "h",
      "marker": {"color": "#2C6496"},
      "text": ["£11.90", "£11.40", "£11.31", "£11.04", "£10.76", "£10.89", "£10.61", "£10.58", "£10.37", "£10.35", "£10.36", "£10.24", "£10.22", "£10.23", "£10.28"],
      "textposition": "auto",
      "insidetextfont": {"family": "Roboto Serif", "color": "white", "size": 10},
      "hovertemplate": "%{y}<br>Average gain: £%{x:.2f}<extra></extra>"
    }
  ],
  "layout": {
    "xaxis": {
      "title": "Average annual gain (£)",
      "titlefont": {"family": "Roboto Serif"},
      "tickfont": {"family": "Roboto Serif"},
      "tickprefix": "£",
      "showgrid": true,
      "gridcolor": "#e0e0e0"
    },
    "yaxis": {
      "titlefont": {"family": "Roboto Serif"},
      "tickfont": {"family": "Roboto Serif"},
      "automargin": true
    },
    "height": 600,
    "margin": {"l": 250, "r": 50, "b": 100, "t": 50, "pad": 4},
    "images": [
      {
        "source": "https://raw.githubusercontent.com/PolicyEngine/policyengine-app-v2/main/app/public/assets/logos/policyengine/teal.png",
        "x": 1,
        "y": -0.12,
        "xref": "paper",
        "yref": "paper",
        "sizex": 0.15,
        "sizey": 0.15,
        "xanchor": "right",
        "yanchor": "bottom"
      }
    ],
    "plot_bgcolor": "white",
    "paper_bgcolor": "white"
  }
}
```

Edinburgh South sees the largest average gain at £11.90, followed by Paisley and Renfrewshire North at £11.40. Table 4 shows the full constituency breakdown sorted by average gain.

**Table 4: Constituency impact (2026-27)**

| Constituency                            | Average gain (£) | Relative change (%) |
| --------------------------------------- | ---------------- | ------------------- |
| Edinburgh South                         | 11.90            | 3.03                |
| Paisley and Renfrewshire North          | 11.40            | 2.14                |
| Moray West, Nairn and Strathspey        | 11.31            | 2.73                |
| Gordon and Buchan                       | 11.04            | 2.73                |
| Bathgate and Linlithgow                 | 10.89            | 2.56                |
| Glenrothes and Mid Fife                 | 10.76            | 2.54                |
| Alloa and Grangemouth                   | 10.61            | 1.92                |
| Orkney and Shetland                     | 10.58            | 2.96                |
| Coatbridge and Bellshill                | 10.37            | 2.42                |
| Midlothian                              | 10.35            | 2.37                |
| Kilmarnock and Loudoun                  | 10.36            | 2.17                |
| Livingston                              | 10.28            | 2.49                |
| Ayr, Carrick and Cumnock                | 10.24            | 2.42                |
| Cowdenbeath and Kirkcaldy               | 10.23            | 2.41                |
| Dumfriesshire, Clydesdale and Tweeddale | 10.22            | 2.64                |
| Cumbernauld and Kirkintilloch           | 10.02            | 2.33                |
| Dundee Central                          | 9.95             | 2.22                |
| Aberdeen North                          | 9.87             | 2.16                |
| Motherwell, Wishaw and Carluke          | 9.88             | 2.37                |
| Inverclyde and Renfrewshire West        | 9.88             | 2.30                |
| Inverness, Skye and West Ross-shire     | 9.83             | 2.29                |
| Angus and Perthshire Glens              | 9.80             | 2.11                |
| Rutherglen                              | 9.78             | 2.15                |
| Argyll, Bute and South Lochaber         | 9.56             | 2.22                |
| Central Ayrshire                        | 9.32             | 1.93                |
| Edinburgh West                          | 9.28             | 2.03                |
| Edinburgh North and Leith               | 9.39             | 2.18                |
| West Dunbartonshire                     | 9.17             | 1.99                |
| Paisley and Renfrewshire South          | 9.13             | 1.81                |
| Dunfermline and Dollar                  | 9.69             | 2.27                |
| Stirling and Strathallan                | 8.90             | 2.04                |
| Na h-Eileanan an Iar                    | 8.88             | 2.04                |
| Glasgow West                            | 8.72             | 2.00                |
| East Renfrewshire                       | 8.75             | 2.06                |
| Glasgow South West                      | 8.47             | 1.73                |
| Glasgow South                           | 8.83             | 1.48                |
| Falkirk                                 | 8.52             | 1.85                |
| Mid Dunbartonshire                      | 8.45             | 1.77                |
| Arbroath and Broughty Ferry             | 8.34             | 1.68                |
| North Ayrshire and Arran                | 8.30             | 1.63                |
| Perth and Kinross-shire                 | 8.18             | 1.84                |
| Lothian East                            | 8.11             | 1.53                |
| Hamilton and Clyde Valley               | 8.06             | 1.86                |
| Edinburgh East and Musselburgh          | 7.91             | 1.86                |
| Edinburgh South West                    | 8.62             | 1.85                |
| Caithness, Sutherland and Easter Ross   | 7.73             | 1.50                |
| Glasgow North                           | 7.70             | 1.30                |
| North East Fife                         | 7.37             | 1.41                |
| Aberdeen South                          | 7.32             | 1.50                |
| Glasgow North East                      | 9.39             | 1.88                |
| Glasgow East                            | 8.68             | 1.32                |
| East Kilbride and Strathaven            | 9.60             | 2.21                |
| Berwickshire, Roxburgh and Selkirk      | 8.95             | 1.89                |
| Aberdeenshire North and Moray East      | 10.12            | 2.39                |
| West Aberdeenshire and Kincardine       | 9.04             | 2.19                |
| Airdrie and Shotts                      | 6.74             | 1.68                |
| Dumfries and Galloway                   | 6.69             | 1.30                |

## Conclusion

The Scottish Child Payment baby boost represents a targeted investment in families with very young children. At a cost of approximately £80 million per year, the policy provides an additional £668 annually to eligible families during their child's first year of life.

The reform is highly progressive, with all benefits flowing to the bottom four income deciles. While the aggregate poverty impact is modest due to the policy's precise targeting, the baby boost delivers meaningful support to around 6,000 families at a critical time in their children's development.

For more analysis of Scottish and UK policy reforms, visit [policyengine.org](https://policyengine.org) or explore our [Scotland economic outlook dashboard](https://policyengine.org/uk/research/scottish-budget-2026-27).
