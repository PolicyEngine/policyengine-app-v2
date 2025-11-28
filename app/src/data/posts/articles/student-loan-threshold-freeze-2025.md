Image credit: IFS

In the Autumn Budget 2025, the Government [announced](https://www.gov.uk/government/publications/budget-2025-document/budget-2025-html) a freeze to the Plan 2 student loan repayment threshold for three years starting from April 2027. This means borrowers who started university between 2012 and 2023 will begin repaying their loans at a lower real income level than if thresholds had continued to rise with inflation.

To understand the impact of this policy, we compare it against a baseline where the repayment threshold would have continued to rise with RPI inflation. Table 1 shows how the Plan 2 threshold differs between these two scenarios.

**Table 1: Plan 2 student loan repayment thresholds under baseline and freeze policy**

| Year    | RPI-uprated threshold | Frozen threshold |
| ------- | -------------------- | ---------------- |
| 2026-27 | £29,385              | £29,385          |
| 2027-28 | £30,330              | £29,385          |
| 2028-29 | £31,290              | £29,385          |
| 2029-30 | £32,280              | £29,385          |

Under current law, the Plan 2 threshold would normally increase with RPI each April. The freeze holds the threshold at £29,385 for three years (2027-28 through 2029-30), meaning borrowers earning above this amount will repay 9% of their income above the threshold, rather than 9% above the higher RPI-indexed amount.

Note: HMT also estimates £5.9bn revenue in 2026-27 from student loan revaluation (a separate policy affecting existing loan balances), but our microsimulation focuses only on the threshold freeze starting in 2027.

In the following sections, we estimate the revenue impact and distributional effects of the student loan threshold freeze across income deciles and examine how the policy affects different groups of borrowers.

## Economic impacts

### Revenue impact

We estimate the revenue impact of the student loan threshold freeze across fiscal years and compare our estimates with official HMT projections. Table 2 shows the additional revenue from freezing thresholds rather than allowing RPI uprating.

**Table 2: Revenue impact of student loan threshold freeze (£ billion)**

| Source       | 2027-28 | 2028-29 | 2029-30 |
| ------------ | ------- | ------- | ------- |
| PolicyEngine | 0.2     | 0.3     | 0.5     |
| HMT          | 0.3     | 0.3     | 0.4     |

PolicyEngine estimates the freeze raises £0.2 billion in 2027-28, growing to £0.5 billion by 2029-30 as the gap between frozen and RPI-indexed thresholds widens. HMT estimates the policy raises £255-355 million annually from 2027-30.

The difference between PolicyEngine and HMT estimates reflects methodological differences: PolicyEngine models the full household sector response including income effects, while HMT figures focus on direct cash receipt changes. Both estimates confirm the policy direction - the threshold freeze raises revenue by requiring borrowers to repay a larger portion of their income.

### Distributional impact

Figure 1 shows the relative change in household income by income decile from the student loan threshold freeze across fiscal years 2027-28 to 2029-30. Use the slider to see how the impact grows over time as the gap between frozen and RPI-indexed thresholds widens.

**Figure 1: Relative change in household income by income decile**

```plotly
{
  "data": [
    {
      "x": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
      "y": [-0.000000154, -0.0016634429, -0.0014984726, -0.0024604998, -0.0075688935, -0.011848607, -0.019367954, -0.022720737, -0.018594053, -0.006256272],
      "type": "bar",
      "marker": {
        "color": "#2C6496",
        "line": {
          "width": 0
        }
      },
      "hovertemplate": "Decile %{x}<br>Change: %{y:.2%}<extra></extra>",
      "text": ["0.0%", "-0.2%", "-0.1%", "-0.2%", "-0.8%", "-1.2%", "-1.9%", "-2.3%", "-1.9%", "-0.6%"],
      "textposition": "inside",
      "insidetextanchor": "middle",
      "textfont": {
        "family": "Roboto Serif",
        "size": 11,
        "color": "white"
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
      "tickvals": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
      "showgrid": true,
      "gridcolor": "#e0e0e0",
      "gridwidth": 1
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
      "tickformat": ".1%",
      "showgrid": true,
      "gridcolor": "#e0e0e0",
      "gridwidth": 1,
      "zeroline": true,
      "zerolinecolor": "#333",
      "zerolinewidth": 2,
      "range": [-0.075, 0.005]
    },
    "height": 600,
    "margin": {
      "l": 100,
      "r": 40,
      "b": 180,
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
        "y": -0.28,
        "yanchor": "top"
      }
    ],
    "sliders": [
      {
        "active": 0,
        "pad": {"t": 80, "b": 20},
        "len": 0.6,
        "x": 0.5,
        "xanchor": "center",
        "currentvalue": {
          "visible": false
        },
        "steps": [
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
        "y": -0.25,
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
      "name": "2027-28",
      "data": [
        {
          "x": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
          "y": [-0.000000154, -0.0016634429, -0.0014984726, -0.0024604998, -0.0075688935, -0.011848607, -0.019367954, -0.022720737, -0.018594053, -0.006256272],
          "text": ["0.0%", "-0.2%", "-0.1%", "-0.2%", "-0.8%", "-1.2%", "-1.9%", "-2.3%", "-1.9%", "-0.6%"]
        }
      ]
    },
    {
      "name": "2028-29",
      "data": [
        {
          "x": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
          "y": [-0.0000000629, -0.0032499, -0.0029619, -0.0049280, -0.0151188, -0.0235009, -0.0387240, -0.0454028, -0.0371881, -0.0125126],
          "text": ["0.0%", "-0.3%", "-0.3%", "-0.5%", "-1.5%", "-2.4%", "-3.9%", "-4.5%", "-3.7%", "-1.3%"]
        }
      ]
    },
    {
      "name": "2029-30",
      "data": [
        {
          "x": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
          "y": [-0.0000000906, -0.0049899, -0.0044954, -0.0073815, -0.0227067, -0.0355458, -0.0581039, -0.0681622, -0.0557871, -0.0187688],
          "text": ["0.0%", "-0.5%", "-0.4%", "-0.7%", "-2.3%", "-3.6%", "-5.8%", "-6.8%", "-5.6%", "-1.9%"]
        }
      ]
    }
  ]
}
```

The policy primarily affects higher-income deciles (7-9), who see the largest relative income reductions. In 2027-28, decile 8 sees the largest impact at -2.3%, growing to -6.8% by 2029-30 as the gap between frozen and RPI-indexed thresholds widens. This reflects the demographics of Plan 2 borrowers: graduates in early-to-mid career earning above the threshold. The lowest deciles are largely unaffected as their income falls below the repayment threshold.

## Who is affected?

The threshold freeze primarily affects:

1. **Plan 2 borrowers**: Those who started undergraduate degrees between September 2012 and July 2023, when the Plan 2 system was in effect
2. **Earners above £29,385**: Only those earning above the threshold make repayments
3. **Early-to-mid career graduates**: Those still repaying their loans, typically aged 22-50

The average affected borrower will pay approximately £250 more per year by 2029-30 compared to a scenario where thresholds continued to rise with RPI. Over the three-year freeze period (2027-28 through 2029-30), the cumulative additional repayment could reach £400-600 per borrower.

## Conclusion

PolicyEngine estimates the student loan threshold freeze raises £0.2-0.5 billion annually during the three-year freeze period (2027-28 through 2029-30). The policy affects approximately 15% of the population, with impacts concentrated on middle-income deciles where Plan 2 borrowers are most prevalent. The freeze slightly increases income inequality (Gini +0.02%) as it effectively raises the tax burden on graduates relative to non-graduates at similar income levels.
