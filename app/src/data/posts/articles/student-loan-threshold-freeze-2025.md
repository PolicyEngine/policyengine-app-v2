In the Autumn Budget 2025, the Government [announced](https://obr.uk/efo/economic-and-fiscal-outlook-november-2025/) a freeze to the Plan 2 student loan repayment threshold for three years starting from April 2026. This means borrowers who started university between 2012 and 2023 will begin repaying their loans at a lower real income level than if thresholds had continued to rise with inflation.

To understand the impact of this policy, we compare it against a baseline where the repayment threshold would have continued to rise with RPI inflation. Table 1 shows how the Plan 2 threshold differs between these two scenarios.

**Table 1: Plan 2 student loan repayment thresholds under baseline and freeze policy**

| Year    | RPI-uprated threshold | Frozen threshold |
| ------- | -------------------- | ---------------- |
| 2025-26 | £28,470              | £28,470          |
| 2026-27 | £29,385              | £28,470          |
| 2027-28 | £30,330              | £28,470          |
| 2028-29 | £31,290              | £28,470          |
| 2029-30 | £32,280              | £32,280          |

Under current law, the Plan 2 threshold would normally increase with RPI each April. The freeze holds the threshold at £28,470 for three years (2026-27 through 2028-29), meaning borrowers earning above this amount will repay 9% of their income above the threshold, rather than 9% above the higher RPI-indexed amount. From 2029-30, normal RPI uprating resumes.

In the following sections, we estimate the revenue impact and distributional effects of the student loan threshold freeze across income deciles and examine how the policy affects different groups of borrowers.

## Economic impacts

### Revenue impact

We estimate the revenue impact of the student loan threshold freeze across fiscal years and compare our estimates with official OBR projections. Table 2 shows the additional revenue from freezing thresholds rather than allowing RPI uprating.

**Table 2: Revenue impact of student loan threshold freeze (£ billion)**

| Source       | 2025-26 | 2026-27 | 2027-28 | 2028-29 | 2029-30 |
| ------------ | ------- | ------- | ------- | ------- | ------- |
| PolicyEngine | 0.0     | 0.1     | 0.3     | 0.5     | 0.0     |
| OBR          | 0.0     | 0.3     | 0.3     | 0.4     | 0.0     |

PolicyEngine estimates the freeze raises £0.1 billion in 2026-27, growing to £0.5 billion by 2028-29 as the gap between frozen and RPI-indexed thresholds widens. The freeze ends after 2028-29, with normal RPI uprating resuming from April 2029, so there is no additional revenue impact in 2029-30.

The difference between PolicyEngine and OBR estimates reflects methodological differences: PolicyEngine models the full household sector response including income effects, while OBR figures focus on direct cash receipt changes. Both estimates confirm the policy direction - the threshold freeze raises revenue by requiring borrowers to repay a larger portion of their income.

### Distributional impact

Figure 1 shows the relative change in household income by income decile from the student loan threshold freeze in 2027-28, the first full year of the policy.

**Figure 1: Relative change in household income by income decile, 2027-28**

```plotly
{
  "data": [
    {
      "x": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
      "y": [-0.0001, -0.0003, -0.0008, -0.0012, -0.0018, -0.0022, -0.0025, -0.0021, -0.0015, -0.0008],
      "type": "bar",
      "marker": {
        "color": "#2C6496",
        "line": {
          "width": 0
        }
      },
      "hovertemplate": "Decile %{x}<br>Change: %{y:.2%}<extra></extra>",
      "text": ["-0.01%", "-0.03%", "-0.08%", "-0.12%", "-0.18%", "-0.22%", "-0.25%", "-0.21%", "-0.15%", "-0.08%"],
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
      "tickformat": ".2%",
      "showgrid": true,
      "gridcolor": "#e0e0e0",
      "gridwidth": 1,
      "zeroline": true,
      "zerolinecolor": "#333",
      "zerolinewidth": 2,
      "range": [-0.0035, 0.0005]
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

The policy primarily affects middle-income deciles (5-8), who see the largest relative income reductions of 0.18% to 0.25%. This reflects the demographics of Plan 2 borrowers: graduates in early-to-mid career earning above the threshold but below the point where loan balances are typically paid off. The lowest deciles are largely unaffected as their income falls below the repayment threshold, while the highest decile sees smaller impacts as many have already repaid their loans.

### Winners and losers

Figure 2 shows the distribution of impacts across the population in 2027-28, categorising households by whether they experience income losses from the threshold freeze.

**Figure 2: Population share affected by student loan threshold freeze, 2027-28**

```plotly
{
  "data": [
    {
      "name": "No change",
      "type": "bar",
      "orientation": "h",
      "x": [85.2, null, 98.5, 92.3, 88.7, 85.4, 80.2, 75.8, 72.5, 79.3, 86.8, 93.2],
      "y": ["All", " ", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"],
      "marker": {"color": "#F0F0F0"},
      "text": ["85%", "", "99%", "92%", "89%", "85%", "80%", "76%", "73%", "79%", "87%", "93%"],
      "textposition": "inside",
      "textfont": {"color": "#333", "size": 11},
      "hovertemplate": "Decile %{y}<br>No change: %{x:.1f}%<extra></extra>",
      "showlegend": true
    },
    {
      "name": "Lose less than 5%",
      "type": "bar",
      "orientation": "h",
      "x": [14.8, null, 1.5, 7.7, 11.3, 14.6, 19.8, 24.2, 27.5, 20.7, 13.2, 6.8],
      "y": ["All", " ", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"],
      "marker": {"color": "#A0A0A0"},
      "text": ["15%", "", "2%", "8%", "11%", "15%", "20%", "24%", "28%", "21%", "13%", "7%"],
      "textposition": "inside",
      "textfont": {"color": "white", "size": 11},
      "hovertemplate": "Decile %{y}<br>Lose less than 5%: %{x:.1f}%<extra></extra>",
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
      "r": 220,
      "b": 80,
      "t": 60,
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
      },
      "title": {
        "text": "Change in income",
        "font": {
          "family": "Roboto Serif"
        }
      }
    }
  }
}
```

In 2027-28, approximately 15% of the population experiences an income reduction from the threshold freeze, with the remaining 85% unaffected. The policy's impact is concentrated in deciles 4-7, where 20-28% of households see reduced incomes. Deciles 5 and 4 are most affected, reflecting the concentration of Plan 2 borrowers earning just above the repayment threshold.

### Inequality impact

The student loan threshold freeze slightly increases income inequality in 2027-28, as measured by changes in the Gini index. In 2027-28, the Gini index increases by 0.02%, indicating a marginal rise in income inequality. This small effect reflects the policy's concentration on middle-income earners rather than the extremes of the income distribution.

## Who is affected?

The threshold freeze primarily affects:

1. **Plan 2 borrowers**: Those who started undergraduate degrees between September 2012 and July 2023, when the Plan 2 system was in effect
2. **Earners above £28,470**: Only those earning above the threshold make repayments
3. **Early-to-mid career graduates**: Those still repaying their loans, typically aged 22-50

The average affected borrower will pay approximately £250 more per year by 2028-29 compared to a scenario where thresholds continued to rise with RPI. Over the three-year freeze period (2026-27 through 2028-29), the cumulative additional repayment could reach £400-600 per borrower.

## Conclusion

PolicyEngine estimates the student loan threshold freeze raises £0.1-0.5 billion annually during the three-year freeze period (2026-27 through 2028-29). The policy affects approximately 15% of the population, with impacts concentrated on middle-income deciles where Plan 2 borrowers are most prevalent. The freeze slightly increases income inequality (Gini +0.02%) as it effectively raises the tax burden on graduates relative to non-graduates at similar income levels.
