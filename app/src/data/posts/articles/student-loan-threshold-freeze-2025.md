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

In the following sections, we estimate the revenue impact and distributional effects of the student loan threshold freeze across income deciles and examine how the policy affects different groups of borrowers.

## Economic impacts

### Revenue impact

We [estimate](https://www.policyengine.org/uk/autumn-budget-2025) the revenue impact of the student loan threshold freeze across fiscal years and compare our estimates with official HM Treasury (HMT) projections. Table 2 shows the additional revenue from freezing thresholds rather than allowing RPI uprating.

**Table 2: Revenue impact of student loan threshold freeze (£ million)**

| Source       | 2027-28 | 2028-29 | 2029-30 |
| ------------ | ------- | ------- | ------- |
| [PolicyEngine](https://www.policyengine.org/uk/autumn-budget-2025) | 135     | 260     | 400     |
| [HMT](https://www.gov.uk/government/publications/budget-2025-document/budget-2025-html) | 255     | 290     | 355     |

[PolicyEngine](https://www.policyengine.org/uk/autumn-budget-2025) estimates the freeze raises £135 million in 2027-28, growing to £400 million by 2029-30 as the gap between frozen and RPI-indexed thresholds widens. [HMT](https://www.gov.uk/government/publications/budget-2025-document/budget-2025-html) estimates the policy raises £255-355 million annually from 2027-30.[^1]

[^1]: HMT also estimates £5.9bn revenue in 2026-27 from student loan revaluation (a separate policy affecting existing loan balances), but our microsimulation focuses only on the threshold freeze starting in 2027.

The difference between PolicyEngine and HMT estimates reflects methodological differences: PolicyEngine models the full household sector response including income effects, while HMT figures focus on direct cash receipt changes. Both estimates confirm the policy direction - the threshold freeze raises revenue by requiring borrowers to repay a larger portion of their income.

### Distributional impact

Figure 1 [shows](https://www.policyengine.org/uk/autumn-budget-2025) the absolute change in household income by income decile from the student loan threshold freeze across fiscal years 2027-28 to 2029-30. Use the slider to see how the impact grows over time as the gap between frozen and RPI-indexed thresholds widens.

**Figure 1: Absolute change in household income by income decile**

```plotly
{
  "data": [
    {
      "x": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
      "y": [-0.08, -0.24, -0.18, -0.72, -1.16, -6.24, -7.06, -9.36, -9.52, -7.30],
      "type": "bar",
      "marker": {
        "color": "#2C6496",
        "line": {
          "width": 0
        }
      },
      "hovertemplate": "Decile %{x}<br>Change: £%{y:.2f}<extra></extra>",
      "text": ["-£0.08", "-£0.24", "-£0.18", "-£0.72", "-£1.16", "-£6.24", "-£7.06", "-£9.36", "-£9.52", "-£7.30"],
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
        "text": "Absolute change in net income (£/year)",
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
      "range": [-35, 5]
    },
    "height": 600,
    "margin": {
      "l": 100,
      "r": 40,
      "b": 60,
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
        "x": 0.08,
        "xanchor": "left",
        "y": 1.18,
        "yanchor": "top"
      }
    ],
    "sliders": [
      {
        "active": 0,
        "pad": {"t": 50, "b": 10},
        "len": 0.4,
        "x": 0.25,
        "xanchor": "left",
        "y": 1.28,
        "yanchor": "top",
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
        "y": -0.05,
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
          "y": [-0.08, -0.24, -0.18, -0.72, -1.16, -6.24, -7.06, -9.36, -9.52, -7.30],
          "text": ["-£0.08", "-£0.24", "-£0.18", "-£0.72", "-£1.16", "-£6.24", "-£7.06", "-£9.36", "-£9.52", "-£7.30"]
        }
      ]
    },
    {
      "name": "2028-29",
      "data": [
        {
          "x": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
          "y": [-0.0001, -0.48, -0.36, -1.95, -2.48, -11.86, -13.74, -17.82, -18.85, -14.20],
          "text": ["-£0.00", "-£0.48", "-£0.36", "-£1.95", "-£2.48", "-£11.86", "-£13.74", "-£17.82", "-£18.85", "-£14.20"]
        }
      ]
    },
    {
      "name": "2029-30",
      "data": [
        {
          "x": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
          "y": [-0.0002, -0.78, -0.56, -3.44, -3.74, -17.94, -26.00, -21.98, -28.11, -21.41],
          "text": ["-£0.00", "-£0.78", "-£0.56", "-£3.44", "-£3.74", "-£17.94", "-£26.00", "-£21.98", "-£28.11", "-£21.41"]
        }
      ]
    }
  ]
}
```

The policy primarily affects higher-income deciles (6-10), who see the largest absolute income reductions. In 2027-28, decile 9 sees the largest impact at -£9.52 per year, growing to -£28.11 by 2029-30 as the gap between frozen and RPI-indexed thresholds widens. This reflects the demographics of Plan 2 borrowers: graduates in early-to-mid career earning above the threshold. The lowest deciles are largely unaffected as their income falls below the repayment threshold.

### Constituency impact

Figure 2 [shows](https://www.policyengine.org/uk/autumn-budget-2025) the average change in household income across UK parliamentary constituencies from the student loan threshold freeze. The map includes a year selector to view impacts from 2027 to 2029. Constituencies with higher concentrations of young graduates see the largest impacts.

**Figure 2: Average income change by constituency from the student loan threshold freeze**

<iframe src="/assets/posts/student-loan-threshold-freeze-2025/constituency_map_student-loan.html" width="100%" height="600" frameborder="0"></iframe>

Table 3 [shows](https://www.policyengine.org/uk/autumn-budget-2025) the ten constituencies with the largest average income reductions in 2027-28. University cities and inner London constituencies experience the greatest impacts, reflecting higher concentrations of Plan 2 borrowers in these areas.

**Table 3: Top 10 constituencies by average income impact (2027-28)**

| Rank | Constituency | Average impact (£/year) |
|:----:|:-------------|:------------------------|
|  1   | Bristol Central | -£13.88 |
|  2   | Oxford East | -£12.78 |
|  3   | Cambridge | -£11.11 |
|  4   | Vauxhall and Camberwell Green | -£10.99 |
|  5   | Bath | -£9.95 |
|  6   | Brighton Pavilion | -£9.92 |
|  7   | Islington South and Finsbury | -£9.42 |
|  8   | Clapham and Brixton Hill | -£8.96 |
|  9   | Islington North | -£8.88 |
|  10  | Bermondsey and Old Southwark | -£8.80 |

## Who is affected?

The threshold freeze primarily affects:

1. **Plan 2 borrowers**: Those who started undergraduate degrees between September 2012 and July 2023, when the Plan 2 system was in effect
2. **Earners above £29,385**: Only those earning above the threshold make repayments
3. **Early-to-mid career graduates**: Those still repaying their loans, typically aged 22-50

The average affected borrower will pay approximately £250 more per year by 2029-30 compared to a scenario where thresholds continued to rise with RPI. Over the three-year freeze period (2027-28 through 2029-30), the cumulative additional repayment could reach £400-600 per borrower.

## Lifetime perspective: when faster repayment helps

While the threshold freeze increases annual repayments, some borrowers may actually benefit over their lifetime. This counterintuitive outcome occurs when higher repayments lead to faster loan payoff, reducing total interest paid.

Consider a 2026 graduate earning £31,000 initially with £15,000 in student debt. Table 4 compares their lifetime repayment under both scenarios.

**Table 4: Lifetime student loan repayment comparison**

| Metric | RPI-uprated threshold | Frozen threshold |
| ------ | -------------------- | ---------------- |
| Year loan paid off | 2043 (age 39) | 2041 (age 37) |
| Total payments | £25,659 | £24,305 |
| Total interest paid | £10,659 | £9,305 |
| **Lifetime savings** | - | **£1,354** |

Under the freeze, this borrower pays off their loan two years earlier. Despite higher annual payments during the repayment period, the faster payoff means less time for interest to compound at rates up to 7.1% (RPI + 3%). The result: £1,354 less paid over their lifetime.

This outcome depends on three key factors:

1. **Income high enough to pay off the loan fully** under both scenarios
2. **Sufficient years before the 30-year forgiveness** threshold
3. **Moderate debt relative to income trajectory** (in this case, £15,000 debt with income growing from £31,000 to £66,000+)

For borrowers who would have their loans forgiven after 30 years regardless, the freeze simply means higher payments with no offsetting benefit. But for those on track to repay in full, accelerated repayment can reduce lifetime costs.

To explore how the threshold freeze affects your specific circumstances, try our [UK Autumn Budget Lifetime Calculator](https://policyengine.github.io/uk-autumn-budget-lifecycle/).

## Conclusion

PolicyEngine estimates the student loan threshold freeze raises £135-400 million annually during the three-year freeze period (2027-28 through 2029-30). The policy impacts are concentrated on higher-income deciles, university cities, and inner London constituencies.
