**Image credit: which.co.uk**
## Introduction

In the Autumn Budget 2025, the Government [announced](https://obr.uk/efo/economic-and-fiscal-outlook-november-2025/) a five-month freeze to fuel duty rates until September 2026, at which point the five pence cut first introduced in 2022 will be reversed through a staggered approach. From April 2027, the Government has stated that fuel duty rates will then be uprated annually by RPI. Previously announced increases to fuel duty rates have now been postponed for 16 consecutive years. The total cost of fuel duty freezes from 2010-11 to 2026-27 has risen to £120 billion.

To understand the impact of this policy, we follow OBR methodology to compare it against a baseline that assumes the five pence cut would have ended in March 2026 as previously planned. Table 1 shows how fuel duty rates differ between these two scenarios across different time periods.

**Table 1: Fuel duty rates under baseline and announced policy (pence per litre)**

| Period | Baseline | Announced policy |
| ------ | ------------------------- | ---------------- |
| Jan 1 - Mar 22, 2026 | 52.95 | 52.95 |
| Mar 23 - Mar 31, 2026 | 57.95 | 52.95 |
| Apr 1 - Aug 31, 2026 | 60.33 | 52.95 |
| Sep 1 - Nov 30, 2026 | 60.33 | 53.95 |
| Dec 1, 2026 - Feb 28, 2027 | 60.33 | 55.95 |
| Mar 1 - Mar 31, 2027 | 60.33 | 57.95 |
| Apr 1, 2027 - Mar 31, 2028 | 62.26 | 59.80 |
| Apr 1, 2028 - Mar 31, 2029 | 64.06 | 61.54 |
| Apr 1, 2029 onwards | 65.92 | 63.34 |

The baseline assumes the 5p cut ends on March 22, 2026, returning the rate to 57.95p, followed by RPI uprating from April 2026 onwards (4.1% in 2026-27, 3.2% in 2027-28, 2.9% in 2028-29, and 2.9% in 2029-30). The announced policy maintains the freeze at 52.95p until September 2026, then implements a staggered reversal with increases of 1p, 2p, and 2p over three-month periods, reaching 57.95p by March 2027. Both policies then apply the same annual RPI uprating from April 2027 onwards.

In the following sections, we [estimate](https://legacy.policyengine.org/uk/policy?focus=policyOutput.policyBreakdown&reform=95140&region=uk&timePeriod=2026&baseline=95147&uk_local_areas_beta=true) the revenue impact and distributional effects of the fuel duty freeze across income deciles, examine how the policy affects income inequality, and analyse impacts across UK constituencies.

## Economic impacts

### Revenue impact

We [estimate](https://legacy.policyengine.org/uk/policy?focus=policyOutput.policyBreakdown&reform=95140&region=uk&timePeriod=2026&baseline=95147&uk_local_areas_beta=true) the revenue impact of the fuel duty freeze policy across fiscal years and compare our estimates with official OBR projections. Table 2 shows the cost of maintaining frozen rates rather than implementing the planned policy trajectory.

**Table 2: Revenue impact of fuel duty freeze (£ billion)**

| Source       | 2025-26 | 2026-27 | 2027-28 | 2028-29 | 2029-30 |
| ------------ | ------- | ------- | ------- | ------- | ------- |
| [PolicyEngine](https://legacy.policyengine.org/uk/policy?focus=policyOutput.policyBreakdown&reform=95140&region=uk&timePeriod=2026&baseline=95147&uk_local_areas_beta=true) | 0.0     | 2.8     | 0.7     | 0.7     | 0.7     |
| [OBR](https://obr.uk/efo/economic-and-fiscal-outlook-november-2025/)          | 0.0     | 2.4     | 0.9     | 0.9     | 0.9     |

PolicyEngine estimates the freeze costs £2.8 billion in 2026-27, followed by £0.7 billion annually from 2027-28 onwards. The OBR projects costs of £2.4 billion in 2026-27 and £0.9 billion annually thereafter.

### Distributional impact

Figure 1 [shows](https://legacy.policyengine.org/uk/policy?focus=policyOutput.policyBreakdown&reform=95140&region=uk&timePeriod=2026&baseline=95147&uk_local_areas_beta=true) the relative change in household income by income decile from the fuel duty freeze in 2026-27.

**Figure 1: Relative change in household income by income decile, 2026-27**

```plotly
{
  "data": [
    {
      "x": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
      "y": [0.0030, 0.0032, 0.0019, 0.0020, 0.0018, 0.0021, 0.0017, 0.0019, 0.0016, 0.0011],
      "type": "bar",
      "marker": {
        "color": "#2C6496",
        "line": {
          "width": 0
        }
      },
      "hovertemplate": "Decile %{x}<br>Change: %{y:.2%}<extra></extra>",
      "text": ["+0.30%", "+0.32%", "+0.19%", "+0.20%", "+0.18%", "+0.21%", "+0.17%", "+0.19%", "+0.16%", "+0.11%"],
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
      "range": [0, 0.0040]
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

In 2026-27, the lowest income decile gains 0.30% and the highest decile gains 0.11%. The gains decline progressively across higher income deciles, reflecting that fuel duty represents a larger share of expenditure for lower-income households. Deciles 3-7 experience gains between 0.17% and 0.21%.

### Winners and losers

Figure 2 [shows](https://legacy.policyengine.org/uk/policy?focus=policyOutput.policyBreakdown&reform=95140&region=uk&timePeriod=2026&baseline=95147&uk_local_areas_beta=true) the distribution of impacts across the population in 2026-27, categorising households by the magnitude of income changes they experience. The chart displays the share of the population in each income decile that gains more than 5%, gains less than 5%, experiences no change, loses less than 5%, or loses more than 5% of their household income.

**Figure 2: Population share by income change from fuel duty freeze, 2026-27**

```plotly
{
  "data": [
    {
      "name": "Gain more than 5%",
      "type": "bar",
      "orientation": "h",
      "x": [4.17, null, 3.12, 3.50, 5.51, 4.48, 3.60, 3.07, 4.23, 3.49, 5.27, 5.42],
      "y": ["All", " ", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"],
      "marker": {"color": "#2C6496"},
      "text": ["4%", "", "3%", "4%", "6%", "4%", "4%", "3%", "4%", "3%", "5%", "5%"],
      "textposition": "inside",
      "textfont": {"color": "white", "size": 11},
      "hovertemplate": "Decile %{y}<br>Gain more than 5%: %{x:.1f}%<extra></extra>",
      "showlegend": true
    },
    {
      "name": "Gain less than 5%",
      "type": "bar",
      "orientation": "h",
      "x": [42.50, null, 44.88, 41.11, 43.44, 43.29, 51.03, 47.35, 41.43, 40.56, 39.87, 32.03],
      "y": ["All", " ", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"],
      "marker": {"color": "#C5D3E8"},
      "text": ["43%", "", "45%", "41%", "43%", "43%", "51%", "47%", "41%", "41%", "40%", "32%"],
      "textposition": "inside",
      "textfont": {"color": "#333", "size": 11},
      "hovertemplate": "Decile %{y}<br>Gain less than 5%: %{x:.1f}%<extra></extra>",
      "showlegend": true
    },
    {
      "name": "No change",
      "type": "bar",
      "orientation": "h",
      "x": [53.33, null, 52.00, 55.39, 51.04, 52.23, 45.37, 49.58, 54.34, 55.95, 54.87, 62.55],
      "y": ["All", " ", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"],
      "marker": {"color": "#F0F0F0"},
      "text": ["53%", "", "52%", "55%", "51%", "52%", "45%", "50%", "54%", "56%", "55%", "63%"],
      "textposition": "inside",
      "textfont": {"color": "#333", "size": 11},
      "hovertemplate": "Decile %{y}<br>No change: %{x:.1f}%<extra></extra>",
      "showlegend": true
    },
    {
      "name": "Lose less than 5%",
      "type": "bar",
      "orientation": "h",
      "x": [0, null, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      "y": ["All", " ", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"],
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
      "x": [0, null, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      "y": ["All", " ", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"],
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

In 2026-27, 46.7% of the population gains from the freeze, with around half of households experiencing no change. The majority of beneficiaries experience income increases of less than 5%.

### Inequality impact

The fuel duty freeze [reduces](https://legacy.policyengine.org/uk/policy?focus=policyOutput.policyBreakdown&reform=95140&region=uk&timePeriod=2026&baseline=95147&uk_local_areas_beta=true) income inequality in 2026-27, as measured by changes in the Gini index. In 2026-27, the Gini index declines by 0.18%, indicating a reduction in income inequality.

### Constituency impact

Figure 3 [shows](https://legacy.policyengine.org/uk/policy?focus=policyOutput.policyBreakdown&reform=95140&region=uk&timePeriod=2026&baseline=95147&uk_local_areas_beta=true) the average net income change across UK parliamentary constituencies from the fuel duty freeze in 2026-27.

**Figure 3: The fuel duty freeze raises net income on average in a majority of the 650 parliamentary constituencies in 2026-27**

![](/assets/posts/uk-fuel-duty-freeze-2025/uk-fuel-duty-freeze-2025.png)

Average net income changes vary across constituencies, with all experiencing positive impacts. The distribution ranges from increases of 0.09% to 0.24%. The five constituencies with the largest gains are Cardiff East (0.24%), Swansea West (0.24%), Cardiff South and Penarth (0.23%), Torfaen (0.23%), and Vale of Glamorgan (0.23%).

## Conclusion

PolicyEngine estimates the fuel duty freeze costs £2.8 billion in 2026-27. The policy benefits 46.7% of the population, with the lowest income decile gaining 0.30% and the highest income decile gaining 0.11%. The freeze reduces income inequality by 0.18% as measured by the Gini index.
