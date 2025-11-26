**Image credit: which.co.uk**
## Introduction

In the Autumn Budget 2025, the Government announced a five-month freeze to fuel duty rates until September 2026, at which point the five pence cut first introduced in 2022 will be reversed through a staggered approach. From April 2027, the Government has stated that fuel duty rates will then be uprated annually by RPI. Previously announced increases to fuel duty rates have now been postponed for 16 consecutive years. The total cost of fuel duty freezes from 2010-11 to 2026-27 has risen to £120 billion.

In this analysis, we [estimate](https://legacy.policyengine.org/uk/policy?focus=policyOutput.policyBreakdown&reform=95121&region=uk&timePeriod=2026&baseline=95126&uk_local_areas_beta=true) the revenue impact and distributional effects of the fuel duty freeze across income deciles, examine how the policy affects income inequality, and analyse the geographic distribution of impacts across UK constituencies. Our analysis compares the announced policy (freezing rates at 52.95p per litre through 2026-27, then staggered reversal) against the OBR baseline that assumes immediate reversal of the five pence cut to 57.95p per litre with subsequent RPI uprating.

## Economic impacts

### Revenue impact

We [estimate](https://legacy.policyengine.org/uk/policy?focus=policyOutput.policyBreakdown&reform=95121&region=uk&timePeriod=2026&baseline=95126&uk_local_areas_beta=true) the revenue impact of the fuel duty freeze policy across fiscal years and compare our estimates with official OBR projections. The table below shows the cost of maintaining frozen rates rather than implementing the planned policy trajectory.

**Table 1: Revenue impact of fuel duty freeze (£ billion)**

| Source       | 2025-26 | 2026-27 | 2027-28 | 2028-29 | 2029-30 |
| ------------ | ------- | ------- | ------- | ------- | ------- |
| PolicyEngine | 0.0     | 4.9     | 1.4     | 2.2     | 2.2     |
| [OBR](https://obr.uk/efo/economic-and-fiscal-outlook-november-2025/)          | 0.0     | 2.4     | 0.9     | 0.9     | 0.9     |

PolicyEngine estimates the freeze costs £4.9 billion in 2026-27, £1.4 billion in 2027-28, £2.2 billion in 2028-29, and £2.2 billion in 2029-30. The OBR estimates costs of £2.4 billion in 2026-27 and £0.9 billion in each subsequent year. Our higher estimate for 2026-27 reflects that we model the full annual impact of the policy, while the OBR's lower figure accounts for the five-month partial-year implementation of the freeze.

### Distributional impact

Figure 1 [shows](https://legacy.policyengine.org/uk/policy?focus=policyOutput.policyBreakdown&reform=95121&region=uk&timePeriod=2026&baseline=95126&uk_local_areas_beta=true) the relative change in household income by income decile from the fuel duty freeze across four fiscal years.

**Figure 1: Household income impact from fuel duty freeze, by income decile, 2026-27 to 2029-30**

```plotly
{
  "data": [
    {
      "x": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
      "y": [0.0053, 0.0056, 0.0034, 0.0035, 0.0032, 0.0037, 0.0030, 0.0033, 0.0029, 0.0018],
      "type": "bar",
      "marker": {
        "color": "#2C6496",
        "line": {
          "width": 0
        }
      },
      "hovertemplate": "Decile %{x}<br>Change: %{y:.2%}<extra></extra>",
      "text": ["+0.5%", "+0.6%", "+0.3%", "+0.4%", "+0.3%", "+0.4%", "+0.3%", "+0.3%", "+0.3%", "+0.2%"],
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
      "title": "Income decile",
      "titlefont": {
        "family": "Roboto Serif"
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
      "title": "Change in household income",
      "titlefont": {
        "family": "Roboto Serif"
      },
      "tickfont": {
        "family": "Roboto Serif"
      },
      "tickformat": ".2%",
      "showgrid": true,
      "gridcolor": "#e0e0e0",
      "gridwidth": 1,
      "zeroline": true,
      "zerolinecolor": "#333",
      "zerolinewidth": 2,
      "range": [0, 0.0070]
    },
    "height": 500,
    "margin": {
      "l": 80,
      "r": 40,
      "b": 80,
      "t": 80,
      "pad": 4
    },
    "plot_bgcolor": "white",
    "paper_bgcolor": "white",
    "font": {
      "family": "Roboto Serif"
    },
    "updatemenus": [
      {
        "buttons": [
          {
            "args": [null, {
              "frame": {"duration": 2000, "redraw": true},
              "fromcurrent": true,
              "transition": {"duration": 1000, "easing": "quadratic-in-out"}
            }],
            "label": "▶ Play",
            "method": "animate"
          }
        ],
        "direction": "left",
        "pad": {"r": 10, "t": 10},
        "showactive": false,
        "type": "buttons",
        "x": 0.1,
        "xanchor": "left",
        "y": 1.15,
        "yanchor": "middle"
      }
    ],
    "sliders": [
      {
        "active": 0,
        "yanchor": "middle",
        "xanchor": "center",
        "currentvalue": {
          "font": {"size": 16, "family": "Roboto Serif"},
          "prefix": "Year: ",
          "visible": false,
          "xanchor": "center"
        },
        "transition": {"duration": 800, "easing": "cubic-in-out"},
        "pad": {"b": 10, "t": 10, "l": 100},
        "len": 0.75,
        "x": 0.5,
        "y": 1.15,
        "steps": [
          {
            "args": [["2026-27"], {
              "frame": {"duration": 0, "redraw": true},
              "mode": "immediate",
              "transition": {"duration": 300}
            }],
            "label": "2026-27",
            "method": "animate"
          },
          {
            "args": [["2027-28"], {
              "frame": {"duration": 0, "redraw": true},
              "mode": "immediate",
              "transition": {"duration": 300}
            }],
            "label": "2027-28",
            "method": "animate"
          },
          {
            "args": [["2028-29"], {
              "frame": {"duration": 0, "redraw": true},
              "mode": "immediate",
              "transition": {"duration": 300}
            }],
            "label": "2028-29",
            "method": "animate"
          },
          {
            "args": [["2029-30"], {
              "frame": {"duration": 0, "redraw": true},
              "mode": "immediate",
              "transition": {"duration": 300}
            }],
            "label": "2029-30",
            "method": "animate"
          }
        ]
      }
    ]
  },
  "frames": [
    {
      "name": "2026-27",
      "data": [
        {
          "x": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
          "y": [0.0053, 0.0056, 0.0034, 0.0035, 0.0032, 0.0037, 0.0030, 0.0033, 0.0029, 0.0018],
          "text": ["+0.5%", "+0.6%", "+0.3%", "+0.4%", "+0.3%", "+0.4%", "+0.3%", "+0.3%", "+0.3%", "+0.2%"],
          "textposition": "outside",
          "type": "bar"
        }
      ]
    },
    {
      "name": "2027-28",
      "data": [
        {
          "x": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
          "y": [0.0016, 0.0017, 0.0010, 0.0010, 0.0009, 0.0011, 0.0009, 0.0009, 0.0008, 0.0005],
          "text": ["+0.2%", "+0.2%", "+0.1%", "+0.1%", "+0.1%", "+0.1%", "+0.1%", "+0.1%", "+0.1%", "+0.1%"],
          "textposition": "outside",
          "type": "bar"
        }
      ]
    },
    {
      "name": "2028-29",
      "data": [
        {
          "x": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
          "y": [0.0024, 0.0025, 0.0015, 0.0016, 0.0014, 0.0015, 0.0014, 0.0014, 0.0013, 0.0008],
          "text": ["+0.2%", "+0.3%", "+0.1%", "+0.2%", "+0.1%", "+0.2%", "+0.1%", "+0.1%", "+0.1%", "+0.1%"],
          "textposition": "outside",
          "type": "bar"
        }
      ]
    },
    {
      "name": "2029-30",
      "data": [
        {
          "x": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
          "y": [0.0024, 0.0020, 0.0018, 0.0015, 0.0015, 0.0015, 0.0014, 0.0014, 0.0013, 0.0008],
          "text": ["+0.2%", "+0.2%", "+0.2%", "+0.2%", "+0.1%", "+0.1%", "+0.1%", "+0.1%", "+0.1%", "+0.1%"],
          "textposition": "outside",
          "type": "bar"
        }
      ]
    }
  ]
}
```

In 2026-27, the lowest income decile gains 0.53% and the highest decile gains 0.18%. In 2027-28, gains decline to 0.16% for the lowest decile and 0.05% for the highest decile. In 2028-29 and 2029-30, gains increase to around 0.24% for the lowest decile and 0.08% for the highest decile.

### Winners and losers

Figure 2 [shows](https://legacy.policyengine.org/uk/policy?focus=policyOutput.policyBreakdown&reform=95121&region=uk&timePeriod=2026&baseline=95126&uk_local_areas_beta=true) the distribution of impacts across the population over time, categorising households by the magnitude of income changes they experience. The chart displays the share of the population in each income decile that gains more than 5%, gains less than 5%, experiences no change, loses less than 5%, or loses more than 5% of their household income.

**Figure 2: Population share by income change from fuel duty freeze, 2026-27 to 2029-30**

```plotly
{
  "data": [
    {
      "name": "Gain more than 5%",
      "type": "bar",
      "orientation": "h",
      "x": [8.7, 7.8, 5.6, 6.9, 4.6, 5.4, 5.9, 7.4, 5.9, 4.3, 0, 6.2],
      "y": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", " ", "All"],
      "marker": {"color": "#2C6496"},
      "text": ["9%", "8%", "6%", "7%", "5%", "5%", "6%", "7%", "6%", "4%", "", "6%"],
      "textposition": "inside",
      "textfont": {"color": "white", "size": 11},
      "hovertemplate": "Decile %{y}<br>Gain more than 5%: %{x:.1f}%<extra></extra>",
      "showlegend": true
    },
    {
      "name": "Gain less than 5%",
      "type": "bar",
      "orientation": "h",
      "x": [28.9, 37.7, 38.6, 39.1, 46.1, 52.8, 46.7, 42.3, 42.0, 49.1, 0, 42.3],
      "y": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", " ", "All"],
      "marker": {"color": "#C5D3E8"},
      "text": ["29%", "38%", "39%", "39%", "46%", "53%", "47%", "42%", "42%", "49%", "", "42%"],
      "textposition": "inside",
      "textfont": {"color": "#333", "size": 11},
      "hovertemplate": "Decile %{y}<br>Gain less than 5%: %{x:.1f}%<extra></extra>",
      "showlegend": true
    },
    {
      "name": "No change",
      "type": "bar",
      "orientation": "h",
      "x": [62.4, 54.6, 55.8, 54.0, 49.3, 41.8, 47.4, 50.3, 52.1, 46.6, 0, 51.4],
      "y": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", " ", "All"],
      "marker": {"color": "#F0F0F0"},
      "text": ["62%", "55%", "56%", "54%", "49%", "42%", "47%", "50%", "52%", "47%", "", "51%"],
      "textposition": "inside",
      "textfont": {"color": "#333", "size": 11},
      "hovertemplate": "Decile %{y}<br>No change: %{x:.1f}%<extra></extra>",
      "showlegend": true
    },
    {
      "name": "Lose less than 5%",
      "type": "bar",
      "orientation": "h",
      "x": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      "y": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", " ", "All"],
      "marker": {"color": "#A0A0A0"},
      "text": ["", "", "", "", "", "", "", "", "", "", "", ""],
      "textposition": "inside",
      "textfont": {"color": "white", "size": 11},
      "hovertemplate": "Decile %{y}<br>Lose less than 5%: %{x:.1f}%<extra></extra>",
      "showlegend": true
    },
    {
      "name": "Lose more than 5%",
      "type": "bar",
      "orientation": "h",
      "x": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      "y": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", " ", "All"],
      "marker": {"color": "#616161"},
      "text": ["", "", "", "", "", "", "", "", "", "", "", ""],
      "textposition": "inside",
      "textfont": {"color": "white", "size": 11},
      "hovertemplate": "Decile %{y}<br>Lose more than 5%: %{x:.1f}%<extra></extra>",
      "showlegend": true
    }
  ],
  "layout": {
    "barmode": "stack",
    "xaxis": {
      "title": "Population share (%)",
      "titlefont": {
        "family": "Roboto Serif"
      },
      "tickfont": {
        "family": "Roboto Serif"
      },
      "showgrid": true,
      "gridcolor": "#e0e0e0",
      "gridwidth": 1,
      "range": [0, 100]
    },
    "yaxis": {
      "title": "Income decile",
      "titlefont": {
        "family": "Roboto Serif"
      },
      "tickfont": {
        "family": "Roboto Serif"
      }
    },
    "height": 500,
    "margin": {
      "l": 80,
      "r": 220,
      "b": 80,
      "t": 80,
      "pad": 4
    },
    "plot_bgcolor": "white",
    "paper_bgcolor": "white",
    "font": {
      "family": "Roboto Serif"
    },
    "legend": {
      "orientation": "v",
      "yanchor": "top",
      "y": 1,
      "xanchor": "left",
      "x": 1.02,
      "font": {
        "family": "Roboto Serif"
      }
    },
    "updatemenus": [
      {
        "buttons": [
          {
            "args": [null, {
              "frame": {"duration": 2000, "redraw": true},
              "fromcurrent": true,
              "transition": {"duration": 1000, "easing": "quadratic-in-out"}
            }],
            "label": "▶ Play",
            "method": "animate"
          }
        ],
        "direction": "left",
        "pad": {"r": 10, "t": 10},
        "showactive": false,
        "type": "buttons",
        "x": 0.1,
        "xanchor": "left",
        "y": 1.15,
        "yanchor": "middle"
      }
    ],
    "sliders": [
      {
        "active": 0,
        "yanchor": "middle",
        "xanchor": "center",
        "currentvalue": {
          "font": {"size": 16, "family": "Roboto Serif"},
          "prefix": "Year: ",
          "visible": false,
          "xanchor": "center"
        },
        "transition": {"duration": 800, "easing": "cubic-in-out"},
        "pad": {"b": 10, "t": 10, "l": 100},
        "len": 0.75,
        "x": 0.5,
        "y": 1.15,
        "steps": [
          {
            "args": [["2026-27"], {
              "frame": {"duration": 0, "redraw": true},
              "mode": "immediate",
              "transition": {"duration": 300}
            }],
            "label": "2026-27",
            "method": "animate"
          },
          {
            "args": [["2027-28"], {
              "frame": {"duration": 0, "redraw": true},
              "mode": "immediate",
              "transition": {"duration": 300}
            }],
            "label": "2027-28",
            "method": "animate"
          },
          {
            "args": [["2028-29"], {
              "frame": {"duration": 0, "redraw": true},
              "mode": "immediate",
              "transition": {"duration": 300}
            }],
            "label": "2028-29",
            "method": "animate"
          },
          {
            "args": [["2029-30"], {
              "frame": {"duration": 0, "redraw": true},
              "mode": "immediate",
              "transition": {"duration": 300}
            }],
            "label": "2029-30",
            "method": "animate"
          }
        ]
      }
    ]
  },
  "frames": [
    {
      "name": "2026-27",
      "data": [
        {"x": [8.7, 7.8, 5.6, 6.9, 4.6, 5.4, 5.9, 7.4, 5.9, 4.3, 0, 6.2], "text": ["9%", "8%", "6%", "7%", "5%", "5%", "6%", "7%", "6%", "4%", "", "6%"], "type": "bar"},
        {"x": [28.9, 37.7, 38.6, 39.1, 46.1, 52.8, 46.7, 42.3, 42.0, 49.1, 0, 42.3], "text": ["29%", "38%", "39%", "39%", "46%", "53%", "47%", "42%", "42%", "49%", "", "42%"], "type": "bar"},
        {"x": [62.4, 54.6, 55.8, 54.0, 49.3, 41.8, 47.4, 50.3, 52.1, 46.6, 0, 51.4], "text": ["62%", "55%", "56%", "54%", "49%", "42%", "47%", "50%", "52%", "47%", "", "51%"], "type": "bar"},
        {"x": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], "text": ["", "", "", "", "", "", "", "", "", "", "", ""], "type": "bar"},
        {"x": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], "text": ["", "", "", "", "", "", "", "", "", "", "", ""], "type": "bar"}
      ]
    },
    {
      "name": "2027-28",
      "data": [
        {"x": [4.2, 4.5, 2.7, 3.4, 2.3, 3.0, 3.7, 4.4, 2.8, 2.5, 0, 3.4], "text": ["4%", "4%", "3%", "3%", "2%", "3%", "4%", "4%", "3%", "2%", "", "3%"], "type": "bar"},
        {"x": [31.6, 40.2, 38.2, 38.8, 42.5, 44.3, 40.4, 37.2, 34.7, 37.5, 0, 38.5], "text": ["32%", "40%", "38%", "39%", "43%", "44%", "40%", "37%", "35%", "38%", "", "39%"], "type": "bar"},
        {"x": [64.1, 55.3, 59.1, 57.8, 55.2, 52.7, 55.9, 58.4, 62.5, 60.0, 0, 58.1], "text": ["64%", "55%", "59%", "58%", "55%", "53%", "56%", "58%", "63%", "60%", "", "58%"], "type": "bar"},
        {"x": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], "text": ["", "", "", "", "", "", "", "", "", "", "", ""], "type": "bar"},
        {"x": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], "text": ["", "", "", "", "", "", "", "", "", "", "", ""], "type": "bar"}
      ]
    },
    {
      "name": "2028-29",
      "data": [
        {"x": [5.2, 5.1, 3.7, 4.1, 2.5, 3.1, 4.9, 5.3, 3.4, 3.2, 0, 4.0], "text": ["5%", "5%", "4%", "4%", "3%", "3%", "5%", "5%", "3%", "3%", "", "4%"], "type": "bar"},
        {"x": [30.3, 42.8, 39.5, 41.7, 44.3, 50.7, 42.0, 41.5, 40.1, 42.6, 0, 41.6], "text": ["30%", "43%", "40%", "42%", "44%", "51%", "42%", "42%", "40%", "43%", "", "42%"], "type": "bar"},
        {"x": [64.5, 52.1, 56.9, 54.2, 53.1, 46.2, 53.1, 53.2, 56.5, 54.3, 0, 54.4], "text": ["65%", "52%", "57%", "54%", "53%", "46%", "53%", "53%", "56%", "54%", "", "54%"], "type": "bar"},
        {"x": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], "text": ["", "", "", "", "", "", "", "", "", "", "", ""], "type": "bar"},
        {"x": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], "text": ["", "", "", "", "", "", "", "", "", "", "", ""], "type": "bar"}
      ]
    },
    {
      "name": "2029-30",
      "data": [
        {"x": [5.3, 3.4, 5.2, 3.5, 4.7, 3.3, 4.9, 5.6, 3.5, 2.9, 0, 4.2], "text": ["5%", "3%", "5%", "3%", "5%", "3%", "5%", "6%", "3%", "3%", "", "4%"], "type": "bar"},
        {"x": [29.8, 44.0, 37.6, 42.6, 43.8, 50.0, 42.5, 41.5, 39.9, 42.8, 0, 41.5], "text": ["30%", "44%", "38%", "43%", "44%", "50%", "43%", "42%", "40%", "43%", "", "42%"], "type": "bar"},
        {"x": [64.9, 52.7, 57.3, 53.9, 51.6, 46.7, 52.5, 53.0, 56.6, 54.2, 0, 54.3], "text": ["65%", "53%", "57%", "54%", "52%", "47%", "53%", "53%", "57%", "54%", "", "54%"], "type": "bar"},
        {"x": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], "text": ["", "", "", "", "", "", "", "", "", "", "", ""], "type": "bar"},
        {"x": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], "text": ["", "", "", "", "", "", "", "", "", "", "", ""], "type": "bar"}
      ]
    }
  ]
}
```

Between 42% and 49% of the population gains from the freeze across the four years, with around half of households experiencing no change. The share of gainers is highest in 2026-27 (48.6%), declines to 41.9% in 2027-28, then increases again to around 45-46% in 2028-29 and 2029-30. Most gains are modest, with the majority of beneficiaries experiencing income increases of less than 5%.

### Inequality impact

The fuel duty freeze [reduces](https://legacy.policyengine.org/uk/policy?focus=policyOutput.policyBreakdown&reform=95121&region=uk&timePeriod=2026&baseline=95126&uk_local_areas_beta=true) income inequality across all four years, as measured by changes in the Gini index. Lower-income households benefit more in relative terms because fuel duty represents a higher proportion of their household budgets. Table 2 shows the impact on income inequality for each fiscal year.

**Table 2: Impact on Gini index**

| Fiscal year | Impact on Gini index |
| ----------- | -------------------- |
| 2026-27     | -0.31%               |
| 2027-28     | -0.09%               |
| 2028-29     | -0.13%               |
| 2029-30     | -0.14%               |

The Gini index declines by 0.31% in 2026-27, 0.09% in 2027-28, 0.13% in 2028-29, and 0.14% in 2029-30.

### Constituency impact

Figure 3 [shows](https://legacy.policyengine.org/uk/policy?focus=policyOutput.policyBreakdown&reform=95121&region=uk&timePeriod=2026&baseline=95126&uk_local_areas_beta=true) the average net income change across UK parliamentary constituencies from the fuel duty freeze in 2026-27.

**Figure 3: The fuel duty freeze raises net income on average in a majority of the 650 parliamentary constituencies in 2026-27**

![](/assets/posts/uk-fuel-duty-freeze-2025/constituencies-map-uk-fuel-duty-2025.png)

Constituencies show varying average net income changes, ranging from losses of around 0.4% to gains of around 0.4%. The majority of constituencies experience small positive changes.

## Conclusion

PolicyEngine estimates the fuel duty freeze costs £4.9 billion in 2026-27, £1.4 billion in 2027-28, £2.2 billion in 2028-29, and £2.2 billion in 2029-30. The policy benefits 42-49% of the population across the four years, with the lowest income decile gaining between 0.16% and 0.53% depending on the year. The freeze reduces income inequality in all four years (Gini -0.09% to -0.31%).
