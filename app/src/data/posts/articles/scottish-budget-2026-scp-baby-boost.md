Finance Secretary Shona Robison announced today that the Scottish Child Payment will be boosted to £40 per week for families with a baby under the age of one. This new "baby boost" rate represents a 47% increase over the current payment of £27.15 per week, delivering what Robison described as the "strongest package of support for families with young children anywhere in the UK."

Using PolicyEngine's Scotland tax-benefit microsimulation model, we estimate that this reform would cost approximately £80 million in 2026-27, rising to £83 million by 2030-31. The policy is highly targeted, benefiting around 0.12% of the Scottish population, with all gains concentrated in the bottom four income deciles.

## Background: The Scottish Child Payment

The Scottish Child Payment is a Scottish Government benefit paid to eligible low-income families for each child under 16. The payment is currently £27.15 per week (£1,412 per year) per eligible child. Eligibility requires the family to receive certain qualifying benefits, including Universal Credit, Child Tax Credit, Income Support, Pension Credit, or income-based Jobseeker's Allowance.

The new baby boost rate of £40 per week (£2,080 per year) will apply only to children under the age of one, providing an additional £668 per year of support during a child's first year of life.

## Budgetary impact

PolicyEngine estimates the following costs for the baby boost over the forecast period:

| Year    | Cost (£ million) |
| ------- | ---------------- |
| 2026-27 | 80               |
| 2027-28 | 75               |
| 2028-29 | 79               |
| 2029-30 | 79               |
| 2030-31 | 83               |

Table 1: Estimated cost of the Scottish Child Payment baby boost

The variation in annual costs reflects projected changes in the number of babies in eligible families over the forecast period.

## Distributional impact

The reform is highly progressive, with benefits concentrated entirely in the bottom four income deciles. Figure 1 shows the average gain by income decile in 2026-27.

```plotly
{
  "data": [
    {
      "x": ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"],
      "y": [2.54, 2.84, 1.71, 0.70, 0, 0, 0, 0, 0, 0],
      "type": "bar",
      "marker": {
        "color": ["#2C6496", "#2C6496", "#2C6496", "#2C6496", "#BDBDBD", "#BDBDBD", "#BDBDBD", "#BDBDBD", "#BDBDBD", "#BDBDBD"]
      },
      "text": ["£2.54", "£2.84", "£1.71", "£0.70", "£0", "£0", "£0", "£0", "£0", "£0"],
      "textposition": "auto",
      "insidetextfont": {
        "family": "Roboto Serif",
        "color": "white",
        "size": 10
      }
    }
  ],
  "layout": {
    "title": {
      "text": "Figure 1: Average annual gain by income decile (2026-27)",
      "font": {
        "family": "Roboto Serif",
        "size": 16
      },
      "x": 0,
      "xanchor": "left"
    },
    "yaxis": {
      "title": "Average annual gain (£)",
      "titlefont": {
        "family": "Roboto Serif"
      },
      "tickfont": {
        "family": "Roboto Serif"
      }
    },
    "xaxis": {
      "title": "Income decile",
      "titlefont": {
        "family": "Roboto Serif"
      },
      "tickfont": {
        "family": "Roboto Serif"
      }
    },
    "height": 450,
    "margin": {
      "l": 60,
      "r": 50,
      "b": 100,
      "t": 80,
      "pad": 4
    },
    "annotations": [
      {
        "x": 1,
        "y": -0.25,
        "xref": "paper",
        "yref": "paper",
        "text": "Source: PolicyEngine Scotland",
        "showarrow": false,
        "font": {
          "family": "Roboto Serif",
          "size": 10,
          "color": "#616161"
        }
      }
    ],
    "images": [
      {
        "source": "/assets/logos/policyengine/teal-square.png",
        "x": 1,
        "y": -0.20,
        "xref": "paper",
        "yref": "paper",
        "sizex": 0.1,
        "sizey": 0.1,
        "xanchor": "right",
        "yanchor": "bottom"
      }
    ],
    "plot_bgcolor": "white",
    "paper_bgcolor": "white"
  }
}
```

In relative terms, the first decile sees the largest proportional increase in income at 1.38%, followed by the second decile at 0.95%. The reform has no impact on households in the top six deciles, as families in these income groups are unlikely to qualify for the Scottish Child Payment.

```plotly
{
  "data": [
    {
      "x": ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"],
      "y": [1.38, 0.95, 0.46, 0.18, 0, 0, 0, 0, 0, 0],
      "type": "bar",
      "marker": {
        "color": ["#2C6496", "#2C6496", "#2C6496", "#2C6496", "#BDBDBD", "#BDBDBD", "#BDBDBD", "#BDBDBD", "#BDBDBD", "#BDBDBD"]
      },
      "text": ["1.38%", "0.95%", "0.46%", "0.18%", "0%", "0%", "0%", "0%", "0%", "0%"],
      "textposition": "auto",
      "insidetextfont": {
        "family": "Roboto Serif",
        "color": "white",
        "size": 10
      }
    }
  ],
  "layout": {
    "title": {
      "text": "Figure 2: Relative income gain by decile (2026-27)",
      "font": {
        "family": "Roboto Serif",
        "size": 16
      },
      "x": 0,
      "xanchor": "left"
    },
    "yaxis": {
      "title": "Relative income gain (%)",
      "titlefont": {
        "family": "Roboto Serif"
      },
      "tickfont": {
        "family": "Roboto Serif"
      },
      "tickformat": ".2f"
    },
    "xaxis": {
      "title": "Income decile",
      "titlefont": {
        "family": "Roboto Serif"
      },
      "tickfont": {
        "family": "Roboto Serif"
      }
    },
    "height": 450,
    "margin": {
      "l": 60,
      "r": 50,
      "b": 100,
      "t": 80,
      "pad": 4
    },
    "annotations": [
      {
        "x": 1,
        "y": -0.25,
        "xref": "paper",
        "yref": "paper",
        "text": "Source: PolicyEngine Scotland",
        "showarrow": false,
        "font": {
          "family": "Roboto Serif",
          "size": 10,
          "color": "#616161"
        }
      }
    ],
    "images": [
      {
        "source": "/assets/logos/policyengine/teal-square.png",
        "x": 1,
        "y": -0.20,
        "xref": "paper",
        "yref": "paper",
        "sizex": 0.1,
        "sizey": 0.1,
        "xanchor": "right",
        "yanchor": "bottom"
      }
    ],
    "plot_bgcolor": "white",
    "paper_bgcolor": "white"
  }
}
```

## Winners and losers

The baby boost creates no losers. In 2026-27, approximately 0.12% of the Scottish population gains from the reform, with the remaining 99.88% unaffected. This reflects the highly targeted nature of the policy, which only affects low-income families with babies under one year old.

| Outcome   | Share of population (%) |
| --------- | ----------------------- |
| Winners   | 0.12                    |
| Losers    | 0.00                    |
| Unchanged | 99.88                   |

Table 2: Distribution of outcomes (2026-27)

## Poverty impact

Due to the narrow targeting of the policy, the impact on overall poverty rates is modest. PolicyEngine estimates the baby boost would reduce the overall poverty rate by approximately 0.004 percentage points and the child poverty rate by approximately 0.01 percentage points in 2026-27.

While these aggregate impacts appear small, they reflect the policy's precise targeting at families with very young children. For the approximately 6,000 families who receive the baby boost, the additional £668 per year during their child's first year of life provides meaningful support during a period of high financial pressure.

## Impact by constituency

The impact of the baby boost varies across Scotland's 57 parliamentary constituencies. Figure 3 shows the constituencies with the highest relative income gains.

```plotly
{
  "data": [
    {
      "y": ["Edinburgh South", "Orkney and Shetland", "Gordon and Buchan", "Moray West, Nairn and Strathspey", "Dumfriesshire, Clydesdale and Tweeddale", "Bathgate and Linlithgow", "Glenrothes and Mid Fife", "Coatbridge and Bellshill", "Cowdenbeath and Kirkcaldy", "Alloa and Grangemouth"],
      "x": [3.03, 2.96, 2.73, 2.73, 2.64, 2.56, 2.54, 2.42, 2.41, 1.92],
      "type": "bar",
      "orientation": "h",
      "marker": {
        "color": "#2C6496"
      },
      "text": ["3.03%", "2.96%", "2.73%", "2.73%", "2.64%", "2.56%", "2.54%", "2.42%", "2.41%", "1.92%"],
      "textposition": "auto",
      "insidetextfont": {
        "family": "Roboto Serif",
        "color": "white",
        "size": 10
      }
    }
  ],
  "layout": {
    "title": {
      "text": "Figure 3: Top 10 constituencies by relative income gain (2026-27)",
      "font": {
        "family": "Roboto Serif",
        "size": 16
      },
      "x": 0,
      "xanchor": "left"
    },
    "xaxis": {
      "title": "Relative income gain (%)",
      "titlefont": {
        "family": "Roboto Serif"
      },
      "tickfont": {
        "family": "Roboto Serif"
      }
    },
    "yaxis": {
      "titlefont": {
        "family": "Roboto Serif"
      },
      "tickfont": {
        "family": "Roboto Serif"
      },
      "automargin": true
    },
    "height": 500,
    "margin": {
      "l": 220,
      "r": 50,
      "b": 100,
      "t": 80,
      "pad": 4
    },
    "annotations": [
      {
        "x": 1,
        "y": -0.20,
        "xref": "paper",
        "yref": "paper",
        "text": "Source: PolicyEngine Scotland",
        "showarrow": false,
        "font": {
          "family": "Roboto Serif",
          "size": 10,
          "color": "#616161"
        }
      }
    ],
    "images": [
      {
        "source": "/assets/logos/policyengine/teal-square.png",
        "x": 1,
        "y": -0.15,
        "xref": "paper",
        "yref": "paper",
        "sizex": 0.1,
        "sizey": 0.1,
        "xanchor": "right",
        "yanchor": "bottom"
      }
    ],
    "plot_bgcolor": "white",
    "paper_bgcolor": "white"
  }
}
```

Edinburgh South sees the largest relative gain at 3.03%, followed by Orkney and Shetland at 2.96%. The constituencies with the lowest relative gains are Glasgow North and Glasgow East, both at around 1.3%, though these areas still see meaningful support for eligible families.

In absolute terms, the average annual gain ranges from £7.32 in Aberdeen South to £11.90 in Edinburgh South.

## Conclusion

The Scottish Child Payment baby boost represents a targeted investment in families with very young children. At a cost of approximately £80 million per year, the policy provides an additional £668 annually to eligible families during their child's first year of life.

The reform is highly progressive, with all benefits flowing to the bottom four income deciles. While the aggregate poverty impact is modest due to the policy's precise targeting, the baby boost delivers meaningful support to around 6,000 families at a critical time in their children's development.

For more analysis of Scottish and UK policy reforms, visit [policyengine.org](https://policyengine.org) or explore our [Scotland economic outlook dashboard](https://policyengine.org/uk/research/scottish-budget-2026-27).
