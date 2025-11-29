In the Autumn Budget 2025, the Government [announced](https://obr.uk/efo/economic-and-fiscal-outlook-november-2025/) a five-month freeze to fuel duty rates until September 2026, at which point the five pence cut first introduced in 2022 will be reversed through a staggered approach. From April 2027, the Government has stated that fuel duty rates will then be uprated annually by RPI. Previously announced increases to fuel duty rates have now been postponed for 16 consecutive years. The total cost of fuel duty freezes from 2010-11 to 2026-27 has risen to £120 billion.

To understand the impact of this policy, we follow OBR methodology to compare it against a baseline that assumes the five pence cut would have ended in March 2026 as previously planned. Table 1 shows how fuel duty rates differ between these two scenarios across different time periods.

**Table 1: Fuel duty rates under baseline and announced policy (pence per litre)**

| Period                     | Baseline | Announced policy |
| -------------------------- | -------- | ---------------- |
| Jan 1 - Mar 22, 2026       | 52.95    | 52.95            |
| Mar 23 - Mar 31, 2026      | 57.95    | 52.95            |
| Apr 1 - Aug 31, 2026       | 60.33    | 52.95            |
| Sep 1 - Nov 30, 2026       | 60.33    | 53.95            |
| Dec 1, 2026 - Feb 28, 2027 | 60.33    | 55.95            |
| Mar 1 - Mar 31, 2027       | 60.33    | 57.95            |
| Apr 1, 2027 - Mar 31, 2028 | 62.26    | 59.80            |
| Apr 1, 2028 - Mar 31, 2029 | 64.06    | 61.54            |
| Apr 1, 2029 onwards        | 65.92    | 63.34            |

The baseline assumes the 5p cut ends on March 22, 2026, returning the rate to 57.95p, followed by RPI uprating from April 2026 onwards (4.1% in 2026-27, 3.2% in 2027-28, 2.9% in 2028-29, and 2.9% in 2029-30). The announced policy maintains the freeze at 52.95p until September 2026, then implements a staggered reversal with increases of 1p, 2p, and 2p over three-month periods, reaching 57.95p by March 2027. Both policies then apply the same annual RPI uprating from April 2027 onwards.

In the following sections, we [estimate](https://gist.github.com/vahid-ahmadi/66f5b237735df1e36e043db9573b1548) the revenue impact and distributional effects of the fuel duty freeze across income deciles, examine how the policy affects income inequality, and analyse impacts across UK constituencies.[^1]

## Economic impacts

### Revenue impact

We [estimate](https://gist.github.com/vahid-ahmadi/66f5b237735df1e36e043db9573b1548) the revenue impact of the fuel duty freeze policy across fiscal years and compare our estimates with official OBR projections. Table 2 shows the cost of maintaining frozen rates rather than implementing the planned policy trajectory.

**Table 2: Revenue impact of fuel duty freeze (£ billion)**

| Source                                                                                                                                                                      | 2026-27 | 2027-28 | 2028-29 | 2029-30 |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------- | ------- | ------- |
| [PolicyEngine](https://gist.github.com/vahid-ahmadi/66f5b237735df1e36e043db9573b1548) | -3.5    | -1.6    | -1.5    | -0.9    |
| [OBR](https://obr.uk/efo/economic-and-fiscal-outlook-november-2025/)                                                                                                        | -2.4    | -0.9    | -0.9    | -0.9    |

PolicyEngine estimates the freeze reduces revenue by £3.5 billion in 2026-27, followed by £1.6 billion in 2027-28, £1.5 billion in 2028-29, and £0.9 billion in 2029-30. The OBR projects revenue reductions of £2.4 billion in 2026-27 and £0.9 billion annually thereafter.

### Distributional impact

Figure 1 [shows](https://gist.github.com/vahid-ahmadi/66f5b237735df1e36e043db9573b1548) the absolute change in household income by income decile from the fuel duty freeze across fiscal years 2026-27 through 2029-30.

**Figure 1: Absolute change in household income by income decile, 2026-27 to 2029-30**

```plotly
{
  "data": [
    {
      "x": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      "y": [68.18, 88.87, 65.05, 82.18, 100.42, 100.94, 121.35, 150.12, 161.85, 158.79],
      "type": "bar",
      "marker": {
        "color": "#2C6496",
        "line": {
          "width": 0
        }
      },
      "hovertemplate": "Decile %{x}<br>Change: £%{y:.2f}<extra></extra>",
      "text": ["£68.18", "£88.87", "£65.05", "£82.18", "£100.42", "£100.94", "£121.35", "£150.12", "£161.85", "£158.79"],
      "textposition": "outside",
      "textfont": {
        "family": "Roboto Serif",
        "size": 10,
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
        "text": "Absolute change in net income (£)",
        "font": {
          "family": "Roboto Serif",
          "size": 14
        }
      },
      "tickfont": {
        "family": "Roboto Serif"
      },
      "tickprefix": "£",
      "showgrid": true,
      "gridcolor": "#e0e0e0",
      "gridwidth": 1,
      "zeroline": true,
      "zerolinecolor": "#333",
      "zerolinewidth": 2,
      "range": [0, 180]
    },
    "height": 500,
    "margin": {
      "l": 100,
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
              "frame": {"duration": 2000, "redraw": false},
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
        "len": 0.6,
        "x": 0.5,
        "y": 1.15,
        "steps": [
          {
            "args": [["2026-27"], {
              "frame": {"duration": 800, "redraw": false},
              "mode": "immediate",
              "transition": {"duration": 800}
            }],
            "label": "2026-27",
            "method": "animate"
          },
          {
            "args": [["2027-28"], {
              "frame": {"duration": 800, "redraw": false},
              "mode": "immediate",
              "transition": {"duration": 800}
            }],
            "label": "2027-28",
            "method": "animate"
          },
          {
            "args": [["2028-29"], {
              "frame": {"duration": 800, "redraw": false},
              "mode": "immediate",
              "transition": {"duration": 800}
            }],
            "label": "2028-29",
            "method": "animate"
          },
          {
            "args": [["2029-30"], {
              "frame": {"duration": 800, "redraw": false},
              "mode": "immediate",
              "transition": {"duration": 800}
            }],
            "label": "2029-30",
            "method": "animate"
          }
        ]
      }
    ],
    "images": [
      {
        "source": "/assets/logos/policyengine/teal-square.svg",
        "x": 1,
        "y": -0.12,
        "xref": "paper",
        "yref": "paper",
        "sizex": 0.08,
        "sizey": 0.08,
        "xanchor": "right",
        "yanchor": "top"
      }
    ]
  },
  "frames": [
    {
      "name": "2026-27",
      "data": [
        {
          "x": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          "y": [68.18, 88.87, 65.05, 82.18, 100.42, 100.94, 121.35, 150.12, 161.85, 158.79],
          "text": ["£68.18", "£88.87", "£65.05", "£82.18", "£100.42", "£100.94", "£121.35", "£150.12", "£161.85", "£158.79"]
        }
      ]
    },
    {
      "name": "2027-28",
      "data": [
        {
          "x": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          "y": [30.25, 39.48, 26.53, 39.08, 44.33, 43.90, 55.56, 66.72, 70.95, 70.84],
          "text": ["£30.25", "£39.48", "£26.53", "£39.08", "£44.33", "£43.90", "£55.56", "£66.72", "£70.95", "£70.84"]
        }
      ]
    },
    {
      "name": "2028-29",
      "data": [
        {
          "x": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          "y": [29.37, 39.14, 25.87, 37.40, 44.41, 43.40, 53.05, 62.62, 71.30, 68.54],
          "text": ["£29.37", "£39.14", "£25.87", "£37.40", "£44.41", "£43.40", "£53.05", "£62.62", "£71.30", "£68.54"]
        }
      ]
    },
    {
      "name": "2029-30",
      "data": [
        {
          "x": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          "y": [17.27, 23.44, 15.23, 22.39, 26.50, 25.49, 31.81, 37.00, 42.26, 40.81],
          "text": ["£17.27", "£23.44", "£15.23", "£22.39", "£26.50", "£25.49", "£31.81", "£37.00", "£42.26", "£40.81"]
        }
      ]
    }
  ]
}
```

In 2026-27, the average household gains £109 from the fuel duty freeze. Higher income deciles gain more in absolute terms, with the tenth decile gaining £159 compared to £68 for the lowest decile. This pattern reflects higher vehicle ownership and fuel consumption among wealthier households. The gains decrease in subsequent years as the staggered reversal of the 5p cut takes effect.

### Winners and losers

Figure 2 [shows](https://gist.github.com/vahid-ahmadi/66f5b237735df1e36e043db9573b1548) the distribution of impacts across the population for fiscal years 2026-27 through 2029-30, categorising people by the magnitude of income changes they experience.[^1]

**Figure 2: Population share by income change from fuel duty freeze, 2026-27 to 2029-30**

```plotly
{
  "data": [
    {
      "name": "Gain more than 5%",
      "type": "bar",
      "orientation": "h",
      "x": [5.3, null, 4.3, 6.9, 5.1, 3.8, 5.6, 4.4, 6.7, 3.2, 7.6, 5.4],
      "y": ["All", " ", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"],
      "marker": {"color": "#2C6496"},
      "text": ["5%", "", "4%", "7%", "5%", "4%", "6%", "4%", "7%", "3%", "8%", "5%"],
      "textposition": "inside",
      "textfont": {"color": "white", "size": 11},
      "hovertemplate": "%{y}<br>Gain more than 5%: %{x:.1f}%<extra></extra>",
      "showlegend": true
    },
    {
      "name": "Gain less than 5%",
      "type": "bar",
      "orientation": "h",
      "x": [47.5, null, 42.3, 44.4, 52.3, 49.5, 44.7, 53.2, 36.4, 37.8, 38.8, 32.8],
      "y": ["All", " ", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"],
      "marker": {"color": "#C5D3E8"},
      "text": ["48%", "", "42%", "44%", "52%", "50%", "45%", "53%", "36%", "38%", "39%", "33%"],
      "textposition": "inside",
      "textfont": {"color": "#333", "size": 11},
      "hovertemplate": "%{y}<br>Gain less than 5%: %{x:.1f}%<extra></extra>",
      "showlegend": true
    },
    {
      "name": "No change",
      "type": "bar",
      "orientation": "h",
      "x": [47.2, null, 53.4, 48.7, 42.6, 46.6, 49.7, 42.3, 56.9, 59.0, 53.7, 61.8],
      "y": ["All", " ", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"],
      "marker": {"color": "#F0F0F0"},
      "text": ["47%", "", "53%", "49%", "43%", "47%", "50%", "42%", "57%", "59%", "54%", "62%"],
      "textposition": "inside",
      "textfont": {"color": "#333", "size": 11},
      "hovertemplate": "%{y}<br>No change: %{x:.1f}%<extra></extra>",
      "showlegend": true
    },
    {
      "name": "Lose less than 5%",
      "type": "bar",
      "orientation": "h",
      "x": [0, null, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      "y": ["All", " ", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"],
      "marker": {"color": "#FACBCB"},
      "text": ["", "", "", "", "", "", "", "", "", "", "", ""],
      "textposition": "inside",
      "textfont": {"color": "#333", "size": 11},
      "hovertemplate": "%{y}<br>Lose less than 5%: %{x:.1f}%<extra></extra>",
      "showlegend": true
    },
    {
      "name": "Lose more than 5%",
      "type": "bar",
      "orientation": "h",
      "x": [0, null, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      "y": ["All", " ", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"],
      "marker": {"color": "#B71C1C"},
      "text": ["", "", "", "", "", "", "", "", "", "", "", ""],
      "textposition": "inside",
      "textfont": {"color": "white", "size": 11},
      "hovertemplate": "%{y}<br>Lose more than 5%: %{x:.1f}%<extra></extra>",
      "showlegend": true
    }
  ],
  "layout": {
    "barmode": "stack",
    "xaxis": {
      "title": {
        "text": "Population share",
        "font": {
          "family": "Roboto Serif",
          "size": 16
        }
      },
      "tickfont": {
        "family": "Roboto Serif",
        "size": 12
      },
      "showgrid": true,
      "gridcolor": "#e0e0e0",
      "gridwidth": 1,
      "range": [0, 100],
      "tickformat": ".0f",
      "ticksuffix": "%"
    },
    "yaxis": {
      "title": {
        "text": "Income decile",
        "font": {
          "family": "Roboto Serif",
          "size": 16
        }
      },
      "tickfont": {
        "family": "Roboto Serif",
        "size": 12
      },
      "categoryorder": "array",
      "categoryarray": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", " ", "All"],
      "type": "category",
      "automargin": true
    },
    "height": 650,
    "margin": {
      "l": 100,
      "r": 50,
      "b": 120,
      "t": 100,
      "pad": 4
    },
    "plot_bgcolor": "white",
    "paper_bgcolor": "white",
    "font": {
      "family": "Roboto Serif"
    },
    "legend": {
      "orientation": "h",
      "yanchor": "top",
      "y": -0.25,
      "xanchor": "center",
      "x": 0.5,
      "font": {
        "family": "Roboto Serif",
        "size": 11
      },
      "title": {
        "text": ""
      }
    },
    "updatemenus": [
      {
        "buttons": [
          {
            "args": [null, {
              "frame": {"duration": 2000, "redraw": false},
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
        "x": 0.05,
        "xanchor": "left",
        "y": 1.25,
        "yanchor": "middle"
      }
    ],
    "sliders": [
      {
        "active": 0,
        "yanchor": "middle",
        "xanchor": "center",
        "currentvalue": {
          "font": {"size": 18, "family": "Roboto Serif"},
          "prefix": "",
          "visible": false,
          "xanchor": "center"
        },
        "transition": {"duration": 800, "easing": "cubic-in-out"},
        "pad": {"b": 10, "t": 50, "l": 80},
        "len": 0.75,
        "x": 0.45,
        "y": 1.25,
        "steps": [
          {
            "args": [["2026-27"], {
              "frame": {"duration": 800, "redraw": false},
              "mode": "immediate",
              "transition": {"duration": 800}
            }],
            "label": "2026-27",
            "method": "animate"
          },
          {
            "args": [["2027-28"], {
              "frame": {"duration": 800, "redraw": false},
              "mode": "immediate",
              "transition": {"duration": 800}
            }],
            "label": "2027-28",
            "method": "animate"
          },
          {
            "args": [["2028-29"], {
              "frame": {"duration": 800, "redraw": false},
              "mode": "immediate",
              "transition": {"duration": 800}
            }],
            "label": "2028-29",
            "method": "animate"
          },
          {
            "args": [["2029-30"], {
              "frame": {"duration": 800, "redraw": false},
              "mode": "immediate",
              "transition": {"duration": 800}
            }],
            "label": "2029-30",
            "method": "animate"
          }
        ]
      }
    ],
    "images": [
      {
        "source": "/assets/logos/policyengine/teal-square.svg",
        "x": 1,
        "y": -0.18,
        "xref": "paper",
        "yref": "paper",
        "sizex": 0.08,
        "sizey": 0.08,
        "xanchor": "right",
        "yanchor": "top"
      }
    ]
  },
  "frames": [
    {
      "name": "2026-27",
      "data": [
        {
          "x": [5.3, null, 4.3, 6.9, 5.1, 3.8, 5.6, 4.4, 6.7, 3.2, 7.6, 5.4],
          "text": ["5%", "", "4%", "7%", "5%", "4%", "6%", "4%", "7%", "3%", "8%", "5%"]
        },
        {
          "x": [47.5, null, 42.3, 44.4, 52.3, 49.5, 44.7, 53.2, 36.4, 37.8, 38.8, 32.8],
          "text": ["48%", "", "42%", "44%", "52%", "50%", "45%", "53%", "36%", "38%", "39%", "33%"]
        },
        {
          "x": [47.2, null, 53.4, 48.7, 42.6, 46.6, 49.7, 42.3, 56.9, 59.0, 53.7, 61.8],
          "text": ["47%", "", "53%", "49%", "43%", "47%", "50%", "42%", "57%", "59%", "54%", "62%"]
        },
        {
          "x": [0, null, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          "text": ["", "", "", "", "", "", "", "", "", "", "", ""]
        },
        {
          "x": [0, null, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          "text": ["", "", "", "", "", "", "", "", "", "", "", ""]
        }
      ]
    },
    {
      "name": "2027-28",
      "data": [
        {
          "x": [4.9, null, 3.9, 6.6, 4.9, 3.5, 4.9, 3.8, 6.5, 3.0, 6.0, 4.2],
          "text": ["5%", "", "4%", "7%", "5%", "4%", "5%", "4%", "7%", "3%", "6%", "4%"]
        },
        {
          "x": [47.0, null, 42.1, 43.8, 52.6, 51.5, 43.3, 53.2, 41.0, 34.9, 40.1, 34.1],
          "text": ["47%", "", "42%", "44%", "53%", "52%", "43%", "53%", "41%", "35%", "40%", "34%"]
        },
        {
          "x": [48.1, null, 54.0, 49.6, 42.4, 45.0, 51.8, 43.0, 52.5, 62.1, 53.8, 61.7],
          "text": ["48%", "", "54%", "50%", "42%", "45%", "52%", "43%", "53%", "62%", "54%", "62%"]
        },
        {
          "x": [0, null, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          "text": ["", "", "", "", "", "", "", "", "", "", "", ""]
        },
        {
          "x": [0, null, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          "text": ["", "", "", "", "", "", "", "", "", "", "", ""]
        }
      ]
    },
    {
      "name": "2028-29",
      "data": [
        {
          "x": [5.0, null, 4.4, 6.9, 5.1, 3.8, 4.6, 4.5, 6.3, 3.1, 6.3, 4.2],
          "text": ["5%", "", "4%", "7%", "5%", "4%", "5%", "5%", "6%", "3%", "6%", "4%"]
        },
        {
          "x": [46.0, null, 41.1, 44.9, 50.6, 49.4, 47.3, 50.9, 41.0, 34.3, 41.1, 33.9],
          "text": ["46%", "", "41%", "45%", "51%", "49%", "47%", "51%", "41%", "34%", "41%", "34%"]
        },
        {
          "x": [49.0, null, 54.4, 48.3, 44.3, 46.8, 48.1, 44.7, 52.8, 62.6, 52.6, 61.9],
          "text": ["49%", "", "54%", "48%", "44%", "47%", "48%", "45%", "53%", "63%", "53%", "62%"]
        },
        {
          "x": [0, null, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          "text": ["", "", "", "", "", "", "", "", "", "", "", ""]
        },
        {
          "x": [0, null, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          "text": ["", "", "", "", "", "", "", "", "", "", "", ""]
        }
      ]
    },
    {
      "name": "2029-30",
      "data": [
        {
          "x": [4.9, null, 4.5, 6.7, 5.1, 3.6, 4.7, 4.5, 6.2, 3.2, 6.2, 4.0],
          "text": ["5%", "", "5%", "7%", "5%", "4%", "5%", "5%", "6%", "3%", "6%", "4%"]
        },
        {
          "x": [45.5, null, 40.4, 44.8, 50.1, 49.7, 46.8, 51.2, 40.6, 33.6, 41.8, 33.8],
          "text": ["46%", "", "40%", "45%", "50%", "50%", "47%", "51%", "41%", "34%", "42%", "34%"]
        },
        {
          "x": [49.6, null, 55.1, 48.5, 44.7, 46.7, 48.6, 44.4, 53.1, 63.1, 52.0, 62.3],
          "text": ["50%", "", "55%", "49%", "45%", "47%", "49%", "44%", "53%", "63%", "52%", "62%"]
        },
        {
          "x": [0, null, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          "text": ["", "", "", "", "", "", "", "", "", "", "", ""]
        },
        {
          "x": [0, null, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          "text": ["", "", "", "", "", "", "", "", "", "", "", ""]
        }
      ]
    }
  ]
}
```

In 2026-27, 49.5% of the population gains from the freeze, with around half of households experiencing no change. The majority of beneficiaries experience income increases of less than 5%.

### Constituency impact

Figure 3 [shows](https://gist.github.com/vahid-ahmadi/b73dea80207de167490b0f1b8026ed68) the average net income change across UK parliamentary constituencies from the fuel duty freeze in 2026-27.

**Figure 3: Average net income change by constituency from the fuel duty freeze in 2026-27**

<iframe src="/assets/posts/uk-fuel-duty-freeze/constituency_map_fuel-duty.html" width="100%" height="600" frameborder="0"></iframe>

Average net income changes vary across constituencies, with all experiencing positive impacts. The distribution ranges from increases of 0.11% to 0.28%. The five constituencies with the largest relative gains are St Ives (£99.77), North Devon (£102.25), Ynys Môn (£118.59), Isle of Wight East (£98.79), and South Dorset (£98.87).

### Inequality impact

Table 3 shows the fuel duty freeze [reduces](https://gist.github.com/vahid-ahmadi/66f5b237735df1e36e043db9573b1548) income inequality across all years. The Gini index falls by 0.21% in 2026-27, declining to 0.05% by 2029-30 as the policy's impact diminishes.

**Table 3: Inequality impact of fuel duty freeze**

| Fiscal year | Gini change |
| ----------- | ----------- |
| 2026-27     | -0.21%      |
| 2027-28     | -0.09%      |
| 2028-29     | -0.09%      |
| 2029-30     | -0.05%      |

## Conclusion

PolicyEngine estimates the fuel duty freeze costs £3.5 billion in 2026-27. Higher income deciles gain more in absolute terms. The freeze reduces income inequality by 0.21% as measured by the Gini index in 2026-27.

---

[^1]: **Data note:** Our microdata shows 54% of households with zero fuel spending, while external data suggests around 75% of households own at least one vehicle. We are working to improve vehicle ownership calibration in our underlying data.
