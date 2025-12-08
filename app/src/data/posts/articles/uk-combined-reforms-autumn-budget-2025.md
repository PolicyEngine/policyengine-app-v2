## Introduction

In the [November 2025 Autumn Budget](https://www.gov.uk/government/collections/budget-2025), Chancellor Rachel Reeves announced a package of tax and benefit reforms. This analysis examines the combined economic impacts of nine key measures using PolicyEngine's microsimulation model. Some measures increase household incomes (such as repealing the two-child limit and freezing fuel duty), while others reduce incomes through higher taxes (such as increased rates on dividends, savings, and property income).

This report presents the combined effect of all nine policies enacted simultaneously. For individual policy effects and stacked (cumulative) effects, see our [UK Autumn Budget 2025 analysis dashboard](https://www.policyengine.org/uk/autumn-budget-2025). For our analysis of the OBR's November 2025 economic projections, see our [separate report](/uk/research/obr-november-2025-projections). Below, we first describe the nine reforms, then present revenue impacts, distributional effects by income decile, winners and losers analysis, constituency-level impacts, and effects on inequality and poverty rates.

### The reforms

**Two-child limit repeal**: The two-child limit restricts Universal Credit and Child Tax Credit payments to a maximum number of children per family. Removing this limit allows families to claim child-related benefit payments for all children without a cap. The Government estimates this will reduce child poverty by 450,000 by 2029-30. See our [research report](/uk/research/uk-two-child-limit) for details.

**Fuel duty freeze extension**: The baseline assumes the 5p cut ends on 22 March 2026, returning the rate to 57.95p, followed by RPI uprating from April 2026. The announced policy maintains the freeze at 52.95p until September 2026, then implements a staggered reversal with increases of 1p, 2p, and 2p over three-month periods, reaching 57.95p by March 2027. Both then apply annual RPI uprating. See our [research report](/uk/research/fuel-duty-freeze) for details.

**Rail fares freeze**: Freezes regulated rail fares in England for one year from March 2026 - the first freeze in 30 years. Without the freeze, fares would have increased by 5.8% under the RPI formula. The Government estimates this will save passengers £600 million in 2026-27, with commuters on expensive routes saving over £300 per year. See our [research report](/uk/research/rail-fares-freeze-2025) for details.

**Threshold freeze extension**: This policy extends the freeze on income tax thresholds from 2027-28 to 2030-31. The personal allowance remains frozen at £12,570, the higher-rate threshold at £50,270, and the additional-rate threshold at £125,140. The NICs secondary threshold is also frozen. By 2030-31, the [OBR](https://obr.uk/efo/economic-and-fiscal-outlook-november-2025/) estimates this will bring 5.2 million additional individuals into paying income tax.

**Dividend tax increase (+2pp)**: Increases dividend tax rates by 2 percentage points from April 2026. Basic rate: 8.75% to 10.75%, Higher rate: 33.75% to 35.75%. The additional rate remains at 39.35%. The [OBR](https://obr.uk/efo/economic-and-fiscal-outlook-november-2025/) estimates this will raise £1.0-1.1bn annually from 2027-28.

**Savings income tax increase (+2pp)**: Increases savings income tax rates by 2 percentage points from April 2027. Basic: 20% to 22%, Higher: 40% to 42%, Additional: 45% to 47%. The [OBR](https://obr.uk/efo/economic-and-fiscal-outlook-november-2025/) estimates this will raise £0.5bn annually from 2028-29.

**Property income tax increase (+2pp)**: Increases property income tax rates by 2 percentage points from April 2027. Basic: 20% to 22%, Higher: 40% to 42%, Additional: 45% to 47%. The [OBR](https://obr.uk/efo/economic-and-fiscal-outlook-november-2025/) estimates this will raise £0.4-0.6bn annually from 2028-29.

**Freeze student loan repayment thresholds**: Freezes the Plan 2 student loan repayment threshold at £29,385 for three years from April 2027, instead of allowing RPI uprating. This means graduates start repaying at a lower real income level, increasing repayments. The [OBR](https://obr.uk/efo/economic-and-fiscal-outlook-november-2025/) estimates this raises £255-355m annually from 2027-30.

**Salary sacrifice cap**: Caps National Insurance-free salary sacrifice pension contributions at £2,000 per year from April 2029. Contributions above this threshold become subject to employee and employer NICs. PolicyEngine estimates this will raise £3.3bn in 2029-30, assuming employers spread costs and employees maintain pension contributions. The [OBR](https://obr.uk/efo/economic-and-fiscal-outlook-november-2025/) estimates £4.9bn (static) or £4.7bn (post-behavioural). See our [research report](/uk/research/uk-salary-sacrifice-cap) for details.

## Economic impacts

### Revenue impact

We [estimate](https://gist.github.com/vahid-ahmadi/fc0c26d94572224cd97d1538d999b5ee) the combined revenue impact of all nine reforms across fiscal years. Table 1 shows our estimates.

**Table 1: Combined revenue impact (£ billion)**

| Measure                           | 2026-27  | 2027-28  | 2028-29  | 2029-30  | 2030-31  |
| --------------------------------- | -------- | -------- | -------- | -------- | -------- |
| Combined total | -6.62 | -4.55 | 0.47 | 8.09 | 12.35 |

The combined reforms transition from a net cost to the exchequer in 2026-27 to a net revenue raiser by 2028-29. In the initial years, the costs of repealing the two-child limit (approximately £2.50bn annually) and the fuel duty freeze exceed revenue from other measures. As the threshold freeze extension, tax increases on investment income, and the salary sacrifice cap (effective from 2029) take effect, the package becomes revenue-positive. By 2030-31, the combined reforms raise an estimated £12.35 billion.

### Distributional impact

Figure 1 [shows](https://gist.github.com/vahid-ahmadi/fc0c26d94572224cd97d1538d999b5ee) the average change in household income (£/year) by income decile from the combined reforms.

**Figure 1: Average change in household income by income decile (£/year)**

```plotly
{
  "data": [
    {
      "x": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      "y": [669.91, 1139.47, 440.08, 363.70, 211.78, 152.68, 140.49, 183.43, 164.73, 169.94],
      "type": "bar",
      "marker": {"color": ["#2C6496", "#2C6496", "#2C6496", "#2C6496", "#2C6496", "#2C6496", "#2C6496", "#2C6496", "#2C6496", "#2C6496"]},
      "hovertemplate": "Decile %{x}<br>Change: £%{y:,.2f}<extra></extra>",
      "text": ["£669.91", "£1,139.47", "£440.08", "£363.70", "£211.78", "£152.68", "£140.49", "£183.43", "£164.73", "£169.94"],
      "textposition": "outside",
      "textfont": {"family": "Roboto Serif", "size": 10}
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
      "title": "Average change in household income (£/year)",
      "titlefont": {"family": "Roboto Serif"},
      "tickfont": {"family": "Roboto Serif"},
      "tickprefix": "£",
      "showgrid": true,
      "gridcolor": "#e0e0e0",
      "range": [-2200, 1600],
      "zeroline": true,
      "zerolinecolor": "#333",
      "zerolinewidth": 2
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
      "x": 0.2,
      "len": 0.6,
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
        "y": [669.91, 1139.47, 440.08, 363.70, 211.78, 152.68, 140.49, 183.43, 164.73, 169.94],
        "text": ["£669.91", "£1,139.47", "£440.08", "£363.70", "£211.78", "£152.68", "£140.49", "£183.43", "£164.73", "£169.94"],
        "marker": {"color": ["#2C6496", "#2C6496", "#2C6496", "#2C6496", "#2C6496", "#2C6496", "#2C6496", "#2C6496", "#2C6496", "#2C6496"]}
      }]
    },
    {
      "name": "2027-28",
      "data": [{
        "y": [655.31, 1155.52, 441.83, 309.15, 146.06, 91.15, 54.48, 72.93, 56.04, 59.78],
        "text": ["£655.31", "£1,155.52", "£441.83", "£309.15", "£146.06", "£91.15", "£54.48", "£72.93", "£56.04", "£59.78"],
        "marker": {"color": ["#2C6496", "#2C6496", "#2C6496", "#2C6496", "#2C6496", "#2C6496", "#2C6496", "#2C6496", "#2C6496", "#2C6496"]}
      }]
    },
    {
      "name": "2028-29",
      "data": [{
        "y": [458.42, 1446.00, 338.39, 283.08, 39.22, -36.66, -156.03, -179.41, -290.87, -504.81],
        "text": ["£458.42", "£1,446.00", "£338.39", "£283.08", "£39.22", "-£36.66", "-£156.03", "-£179.41", "-£290.87", "-£504.81"],
        "marker": {"color": ["#2C6496", "#2C6496", "#2C6496", "#2C6496", "#2C6496", "#616161", "#616161", "#616161", "#616161", "#616161"]}
      }]
    },
    {
      "name": "2029-30",
      "data": [{
        "y": [441.86, 1434.73, 176.43, 216.17, -180.77, -231.89, -416.12, -526.88, -1028.16, -1448.99],
        "text": ["£441.86", "£1,434.73", "£176.43", "£216.17", "-£180.77", "-£231.89", "-£416.12", "-£526.88", "-£1,028.16", "-£1,448.99"],
        "marker": {"color": ["#2C6496", "#2C6496", "#2C6496", "#2C6496", "#616161", "#616161", "#616161", "#616161", "#616161", "#616161"]}
      }]
    },
    {
      "name": "2030-31",
      "data": [{
        "y": [466.71, 1343.23, 235.79, 58.70, -201.97, -350.20, -576.17, -766.52, -1327.66, -1873.95],
        "text": ["£466.71", "£1,343.23", "£235.79", "£58.70", "-£201.97", "-£350.20", "-£576.17", "-£766.52", "-£1,327.66", "-£1,873.95"],
        "marker": {"color": ["#2C6496", "#2C6496", "#2C6496", "#2C6496", "#616161", "#616161", "#616161", "#616161", "#616161", "#616161"]}
      }]
    }
  ]
}
```

The distributional pattern shifts over the forecast period. In 2026-27, all deciles gain on average, with the second decile recording the largest gain (£1,139.47/year). By 2030-31, the bottom four deciles continue to gain (ranging from £58.70 to £1,343.23), while the top six deciles experience losses, with the tenth decile losing £1,873.95 on average. The two-child limit repeal increases incomes for lower-income households, while the threshold freeze, investment income tax increases, and salary sacrifice cap reduce incomes for higher earners.

### Winners and losers

Figure 2 [shows](https://gist.github.com/vahid-ahmadi/fc0c26d94572224cd97d1538d999b5ee) the distribution of impacts across the population, categorising people by the magnitude of income changes they experience.

**Figure 2: Population share by income change from combined reforms**

```plotly
{
  "data": [
    {
      "name": "Gain more than 5%",
      "type": "bar",
      "orientation": "h",
      "x": [8.76, null, 4.21, 5.82, 4.86, 3.83, 5.66, 5.66, 11.15, 10.45, 22.95, 13.35],
      "y": ["All", " ", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"],
      "marker": {"color": "#2C6496"},
      "text": ["8.76%", "", "4.21%", "5.82%", "4.86%", "3.83%", "5.66%", "5.66%", "11.15%", "10.45%", "22.95%", "13.35%"],
      "textposition": "inside",
      "textfont": {"color": "white", "size": 11},
      "hovertemplate": "%{y}<br>Gain more than 5%: %{x:.2f}%<extra></extra>",
      "showlegend": true
    },
    {
      "name": "Gain less than 5%",
      "type": "bar",
      "orientation": "h",
      "x": [43.68, null, 42.60, 47.48, 53.58, 50.19, 49.12, 50.85, 38.88, 36.49, 33.49, 33.45],
      "y": ["All", " ", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"],
      "marker": {"color": "#C5D3E8"},
      "text": ["43.68%", "", "42.60%", "47.48%", "53.58%", "50.19%", "49.12%", "50.85%", "38.88%", "36.49%", "33.49%", "33.45%"],
      "textposition": "inside",
      "textfont": {"color": "#333", "size": 11},
      "hovertemplate": "%{y}<br>Gain less than 5%: %{x:.2f}%<extra></extra>",
      "showlegend": true
    },
    {
      "name": "No change",
      "type": "bar",
      "orientation": "h",
      "x": [47.55, null, 53.19, 46.70, 41.56, 45.98, 45.22, 43.49, 49.98, 53.06, 43.56, 53.20],
      "y": ["All", " ", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"],
      "marker": {"color": "#F0F0F0"},
      "text": ["47.55%", "", "53.19%", "46.70%", "41.56%", "45.98%", "45.22%", "43.49%", "49.98%", "53.06%", "43.56%", "53.20%"],
      "textposition": "inside",
      "textfont": {"color": "#333", "size": 11},
      "hovertemplate": "%{y}<br>No change: %{x:.2f}%<extra></extra>",
      "showlegend": true
    },
    {
      "name": "Lose less than 5%",
      "type": "bar",
      "orientation": "h",
      "x": [0.00, null, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
      "y": ["All", " ", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"],
      "marker": {"color": "#FACBCB"},
      "text": ["", "", "", "", "", "", "", "", "", "", "", ""],
      "textposition": "inside",
      "textfont": {"color": "#333", "size": 11},
      "hovertemplate": "%{y}<br>Lose less than 5%: %{x:.2f}%<extra></extra>",
      "showlegend": true
    },
    {
      "name": "Lose more than 5%",
      "type": "bar",
      "orientation": "h",
      "x": [0.00, null, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
      "y": ["All", " ", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"],
      "marker": {"color": "#B71C1C"},
      "text": ["", "", "", "", "", "", "", "", "", "", "", ""],
      "textposition": "inside",
      "textfont": {"color": "white", "size": 11},
      "hovertemplate": "%{y}<br>Lose more than 5%: %{x:.2f}%<extra></extra>",
      "showlegend": true
    }
  ],
  "layout": {
    "barmode": "stack",
    "xaxis": {
      "title": {"text": "Population share", "font": {"family": "Roboto Serif", "size": 14}},
      "tickfont": {"family": "Roboto Serif", "size": 12},
      "showgrid": true,
      "gridcolor": "#e0e0e0",
      "range": [0, 100],
      "tickformat": ".0f",
      "ticksuffix": "%"
    },
    "yaxis": {
      "title": {"text": "Income decile", "font": {"family": "Roboto Serif", "size": 14}},
      "tickfont": {"family": "Roboto Serif", "size": 12},
      "categoryorder": "array",
      "categoryarray": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", " ", "All"],
      "type": "category",
      "automargin": true
    },
    "height": 650,
    "margin": {"l": 80, "r": 50, "b": 120, "t": 100, "pad": 4},
    "plot_bgcolor": "white",
    "paper_bgcolor": "white",
    "font": {"family": "Roboto Serif"},
    "legend": {
      "orientation": "h",
      "yanchor": "top",
      "y": -0.15,
      "xanchor": "center",
      "x": 0.5,
      "font": {"family": "Roboto Serif", "size": 10},
      "traceorder": "normal",
      "entrywidth": 100
    },
    "updatemenus": [{
      "buttons": [{
        "args": [null, {"frame": {"duration": 1500, "redraw": true}, "fromcurrent": true, "transition": {"duration": 800}}],
        "label": "Play",
        "method": "animate"
      }],
      "direction": "left",
      "pad": {"r": 10, "t": 10},
      "showactive": false,
      "type": "buttons",
      "x": 0.05,
      "xanchor": "left",
      "y": 1.2,
      "yanchor": "middle"
    }],
    "sliders": [{
      "active": 0,
      "yanchor": "middle",
      "xanchor": "center",
      "currentvalue": {"visible": false},
      "transition": {"duration": 800},
      "pad": {"b": 10, "t": 50, "l": 80},
      "len": 0.7,
      "x": 0.45,
      "y": 1.2,
      "steps": [
        {"args": [["2026-27"], {"frame": {"duration": 800, "redraw": true}, "mode": "immediate"}], "label": "2026-27", "method": "animate"},
        {"args": [["2027-28"], {"frame": {"duration": 800, "redraw": true}, "mode": "immediate"}], "label": "2027-28", "method": "animate"},
        {"args": [["2028-29"], {"frame": {"duration": 800, "redraw": true}, "mode": "immediate"}], "label": "2028-29", "method": "animate"},
        {"args": [["2029-30"], {"frame": {"duration": 800, "redraw": true}, "mode": "immediate"}], "label": "2029-30", "method": "animate"},
        {"args": [["2030-31"], {"frame": {"duration": 800, "redraw": true}, "mode": "immediate"}], "label": "2030-31", "method": "animate"}
      ]
    }],
    "images": [{
      "source": "/assets/logos/policyengine/teal-square.svg",
      "x": 1, "y": -0.15,
      "xref": "paper", "yref": "paper",
      "sizex": 0.08, "sizey": 0.08,
      "xanchor": "right", "yanchor": "top"
    }]
  },
  "frames": [
    {
      "name": "2026-27",
      "data": [
        {"x": [8.76, null, 4.21, 5.82, 4.86, 3.83, 5.66, 5.66, 11.15, 10.45, 22.95, 13.35], "text": ["8.76%", "", "4.21%", "5.82%", "4.86%", "3.83%", "5.66%", "5.66%", "11.15%", "10.45%", "22.95%", "13.35%"]},
        {"x": [43.68, null, 42.60, 47.48, 53.58, 50.19, 49.12, 50.85, 38.88, 36.49, 33.49, 33.45], "text": ["43.68%", "", "42.60%", "47.48%", "53.58%", "50.19%", "49.12%", "50.85%", "38.88%", "36.49%", "33.49%", "33.45%"]},
        {"x": [47.55, null, 53.19, 46.70, 41.56, 45.98, 45.22, 43.49, 49.98, 53.06, 43.56, 53.20], "text": ["47.55%", "", "53.19%", "46.70%", "41.56%", "45.98%", "45.22%", "43.49%", "49.98%", "53.06%", "43.56%", "53.20%"]},
        {"x": [0.00, null, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00], "text": ["", "", "", "", "", "", "", "", "", "", "", ""]},
        {"x": [0.00, null, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00], "text": ["", "", "", "", "", "", "", "", "", "", "", ""]}
      ]
    },
    {
      "name": "2027-28",
      "data": [
        {"x": [8.26, null, 3.74, 5.45, 4.74, 3.28, 5.04, 5.83, 9.98, 10.65, 22.07, 12.12], "text": ["8.26%", "", "3.74%", "5.45%", "4.74%", "3.28%", "5.04%", "5.83%", "9.98%", "10.65%", "22.07%", "12.12%"]},
        {"x": [42.50, null, 41.25, 44.35, 51.01, 46.65, 47.80, 47.69, 40.99, 35.67, 34.00, 35.06], "text": ["42.50%", "", "41.25%", "44.35%", "51.01%", "46.65%", "47.80%", "47.69%", "40.99%", "35.67%", "34.00%", "35.06%"]},
        {"x": [45.49, null, 49.55, 41.30, 36.29, 43.56, 41.75, 44.85, 48.33, 53.28, 43.75, 52.83], "text": ["45.49%", "", "49.55%", "41.30%", "36.29%", "43.56%", "41.75%", "44.85%", "48.33%", "53.28%", "43.75%", "52.83%"]},
        {"x": [3.73, null, 5.46, 8.83, 7.95, 6.50, 5.41, 1.64, 0.63, 0.39, 0.18, 0.00], "text": ["3.73%", "", "5.46%", "8.83%", "7.95%", "6.50%", "5.41%", "1.64%", "0.63%", "0.39%", "0.18%", ""]},
        {"x": [0.02, null, 0.00, 0.07, 0.00, 0.00, 0.00, 0.00, 0.08, 0.00, 0.01, 0.00], "text": ["", "", "", "", "", "", "", "", "", "", "", ""]}
      ]
    },
    {
      "name": "2028-29",
      "data": [
        {"x": [6.66, null, 1.81, 0.89, 2.84, 2.17, 3.18, 4.89, 8.53, 8.43, 24.28, 10.24], "text": ["6.66%", "", "1.81%", "0.89%", "2.84%", "2.17%", "3.18%", "4.89%", "8.53%", "8.43%", "24.28%", "10.24%"]},
        {"x": [12.83, null, 2.77, 3.32, 9.15, 10.94, 12.31, 13.29, 16.86, 13.73, 22.07, 24.93], "text": ["12.83%", "", "2.77%", "3.32%", "9.15%", "10.94%", "12.31%", "13.29%", "16.86%", "13.73%", "22.07%", "24.93%"]},
        {"x": [8.71, null, 0.83, 0.38, 1.51, 2.92, 4.36, 5.64, 7.02, 11.36, 14.63, 40.71], "text": ["8.71%", "", "0.83%", "0.38%", "1.51%", "2.92%", "4.36%", "5.64%", "7.02%", "11.36%", "14.63%", "40.71%"]},
        {"x": [69.76, null, 91.94, 90.77, 84.66, 81.87, 78.35, 75.30, 64.66, 64.96, 37.87, 23.38], "text": ["69.76%", "", "91.94%", "90.77%", "84.66%", "81.87%", "78.35%", "75.30%", "64.66%", "64.96%", "37.87%", "23.38%"]},
        {"x": [2.03, null, 2.64, 4.64, 1.83, 2.10, 1.80, 0.88, 2.92, 1.52, 1.15, 0.74], "text": ["2.03%", "", "2.64%", "4.64%", "1.83%", "2.10%", "1.80%", "0.88%", "2.92%", "1.52%", "1.15%", "0.74%"]}
      ]
    },
    {
      "name": "2029-30",
      "data": [
        {"x": [4.68, null, 0.00, 0.01, 0.16, 0.17, 0.65, 1.39, 7.08, 6.95, 22.24, 8.93], "text": ["4.68%", "", "", "", "", "", "0.65%", "1.39%", "7.08%", "6.95%", "22.24%", "8.93%"]},
        {"x": [6.35, null, 0.16, 0.20, 2.87, 2.66, 6.89, 3.17, 7.41, 5.79, 13.18, 22.42], "text": ["6.35%", "", "", "", "2.87%", "2.66%", "6.89%", "3.17%", "7.41%", "5.79%", "13.18%", "22.42%"]},
        {"x": [7.11, null, 0.31, 0.14, 0.93, 1.03, 3.76, 3.84, 5.82, 8.59, 12.06, 36.57], "text": ["7.11%", "", "", "", "0.93%", "1.03%", "3.76%", "3.84%", "5.82%", "8.59%", "12.06%", "36.57%"]},
        {"x": [77.09, null, 93.44, 91.74, 90.56, 91.84, 83.98, 87.21, 74.06, 75.09, 48.97, 30.10], "text": ["77.09%", "", "93.44%", "91.74%", "90.56%", "91.84%", "83.98%", "87.21%", "74.06%", "75.09%", "48.97%", "30.10%"]},
        {"x": [4.78, null, 6.09, 7.90, 5.47, 4.29, 4.72, 4.39, 5.63, 3.57, 3.55, 1.97], "text": ["4.78%", "", "6.09%", "7.90%", "5.47%", "4.29%", "4.72%", "4.39%", "5.63%", "3.57%", "3.55%", "1.97%"]}
      ]
    },
    {
      "name": "2030-31",
      "data": [
        {"x": [4.71, null, 0.00, 0.01, 0.09, 0.15, 0.48, 2.52, 5.36, 8.64, 20.86, 9.85], "text": ["4.71%", "", "", "", "", "", "", "2.52%", "5.36%", "8.64%", "20.86%", "9.85%"]},
        {"x": [6.32, null, 0.16, 0.26, 3.04, 2.94, 6.44, 2.83, 6.82, 5.95, 13.27, 22.78], "text": ["6.32%", "", "", "", "3.04%", "2.94%", "6.44%", "2.83%", "6.82%", "5.95%", "13.27%", "22.78%"]},
        {"x": [6.82, null, 0.32, 0.14, 0.98, 1.04, 3.77, 4.22, 3.65, 8.31, 11.31, 36.37], "text": ["6.82%", "", "", "", "0.98%", "1.04%", "3.77%", "4.22%", "3.65%", "8.31%", "11.31%", "36.37%"]},
        {"x": [76.68, null, 91.18, 90.93, 89.29, 91.32, 84.16, 85.14, 78.16, 73.36, 50.40, 29.04], "text": ["76.68%", "", "91.18%", "90.93%", "89.29%", "91.32%", "84.16%", "85.14%", "78.16%", "73.36%", "50.40%", "29.04%"]},
        {"x": [5.47, null, 8.34, 8.66, 6.59, 4.56, 5.15, 5.29, 6.01, 3.74, 4.16, 1.95], "text": ["5.47%", "", "8.34%", "8.66%", "6.59%", "4.56%", "5.15%", "5.29%", "6.01%", "3.74%", "4.16%", "1.95%"]}
      ]
    }
  ]
}
```

In 2026-27, over half the population either gains or sees no change, with no losers. By 2030-31, 82.15% of the population experiences losses (76.68% lose less than 5%, 5.47% lose more than 5%), while 11.03% gain. The lowest deciles maintain the highest share of gainers throughout, with 20.86% of the second decile gaining more than 5% in 2030-31. The top decile sees 99.52% experiencing income losses by 2030-31.

### Constituency impact

Figure 3 [shows](https://gist.github.com/vahid-ahmadi/fc0c26d94572224cd97d1538d999b5ee) the average net income change across UK parliamentary constituencies from the combined reforms.

**Figure 3: Average net income change by constituency**

<iframe src="/assets/posts/uk-combined-reforms-autumn-budget-2025/constituency_map.html" width="100%" height="600" frameborder="0"></iframe>

In 2026-27, all constituencies gain on average, with the largest gains in Birmingham Yardley (+£267.35), Bradford East (+£260.53), and Barking (+£257.45). In 2027-28, gains reduce but remain positive across all constituencies. By 2028-29, the pattern becomes mixed: constituencies with higher concentrations of families with children continue to show gains, while others begin to show losses as tax increases take effect. In 2029-30, most constituencies show net losses as the salary sacrifice cap is introduced. By 2030-31, all constituencies show net losses on average, with the largest losses in constituencies in London and the South East.

### Inequality impact

Table 2 [shows](https://gist.github.com/vahid-ahmadi/fc0c26d94572224cd97d1538d999b5ee) the impact of the combined reforms on income inequality as measured by the Gini coefficient.

**Table 2: Inequality impact of combined reforms**

| Fiscal year | Gini change |
| ----------- | ----------- |
| 2026-27     | -0.76%      |
| 2027-28     | -0.65%      |
| 2028-29     | -0.70%      |
| 2029-30     | -0.78%      |
| 2030-31     | -0.78%      |

The combined reforms reduce income inequality in all years analysed. The Gini coefficient falls by 0.65-0.78% across the forecast period. The reduction is largest in 2029-30 and 2030-31 when the salary sacrifice cap takes effect.

### Poverty impact

Figure 4 [shows](https://gist.github.com/vahid-ahmadi/fc0c26d94572224cd97d1538d999b5ee) the impact of the combined reforms on poverty rates.

**Figure 4: Change in poverty rates (pp)**

```plotly
{
  "data": [
    {
      "x": ["Overall<br>(BHC)", "Overall<br>(AHC)", "Child<br>(BHC)", "Child<br>(AHC)", "Working-age<br>(BHC)", "Pensioner<br>(BHC)"],
      "y": [-0.69, -1.02, -2.30, -3.51, -0.34, 0.00],
      "type": "bar",
      "marker": {"color": ["#2C6496", "#2C6496", "#2C6496", "#2C6496", "#2C6496", "#616161"]},
      "hovertemplate": "%{x}<br>Change: %{y:+.2f}pp<extra></extra>",
      "text": ["-0.69pp", "-1.02pp", "-2.30pp", "-3.51pp", "-0.34pp", "0.00pp"],
      "textposition": "outside",
      "textfont": {"family": "Roboto Serif", "size": 11}
    }
  ],
  "layout": {
    "xaxis": {
      "title": "Poverty measure",
      "titlefont": {"family": "Roboto Serif"},
      "tickfont": {"family": "Roboto Serif", "size": 10},
      "showgrid": false
    },
    "yaxis": {
      "title": "Change in poverty rate (pp)",
      "titlefont": {"family": "Roboto Serif"},
      "tickfont": {"family": "Roboto Serif"},
      "ticksuffix": "pp",
      "showgrid": true,
      "gridcolor": "#e0e0e0",
      "range": [-5, 1],
      "zeroline": true,
      "zerolinecolor": "#333",
      "zerolinewidth": 2
    },
    "height": 500,
    "margin": {"l": 80, "r": 50, "b": 120, "t": 100, "pad": 4},
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
      "x": 0.2,
      "len": 0.6,
      "y": 1.15,
      "yanchor": "bottom",
      "currentvalue": {"visible": false},
      "font": {"family": "Roboto Serif"}
    }],
    "images": [
      {
        "source": "https://raw.githubusercontent.com/PolicyEngine/policyengine-app-v2/main/app/public/assets/logos/policyengine/teal.png",
        "x": 1,
        "y": -0.2,
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
        "y": [-0.69, -1.02, -2.30, -3.51, -0.34, 0.00],
        "text": ["-0.69pp", "-1.02pp", "-2.30pp", "-3.51pp", "-0.34pp", "0.00pp"],
        "marker": {"color": ["#2C6496", "#2C6496", "#2C6496", "#2C6496", "#2C6496", "#616161"]}
      }]
    },
    {
      "name": "2027-28",
      "data": [{
        "y": [-0.69, -1.05, -2.31, -3.59, -0.33, 0.00],
        "text": ["-0.69pp", "-1.05pp", "-2.31pp", "-3.59pp", "-0.33pp", "0.00pp"],
        "marker": {"color": ["#2C6496", "#2C6496", "#2C6496", "#2C6496", "#2C6496", "#616161"]}
      }]
    },
    {
      "name": "2028-29",
      "data": [{
        "y": [-0.74, -0.99, -2.50, -3.46, -0.37, 0.08],
        "text": ["-0.74pp", "-0.99pp", "-2.50pp", "-3.46pp", "-0.37pp", "0.08pp"],
        "marker": {"color": ["#2C6496", "#2C6496", "#2C6496", "#2C6496", "#2C6496", "#616161"]}
      }]
    },
    {
      "name": "2029-30",
      "data": [{
        "y": [-0.73, -0.94, -2.47, -3.35, -0.36, 0.05],
        "text": ["-0.73pp", "-0.94pp", "-2.47pp", "-3.35pp", "-0.36pp", "0.05pp"],
        "marker": {"color": ["#2C6496", "#2C6496", "#2C6496", "#2C6496", "#2C6496", "#616161"]}
      }]
    },
    {
      "name": "2030-31",
      "data": [{
        "y": [-0.81, -1.02, -2.88, -3.77, -0.37, 0.14],
        "text": ["-0.81pp", "-1.02pp", "-2.88pp", "-3.77pp", "-0.37pp", "0.14pp"],
        "marker": {"color": ["#2C6496", "#2C6496", "#2C6496", "#2C6496", "#2C6496", "#616161"]}
      }]
    }
  ]
}
```

The combined reforms reduce child poverty throughout the forecast period. The child poverty rate (after housing costs) falls by 3.35 to 3.77 percentage points across all years, a reduction of 11.81-13.12%. Overall poverty (BHC) falls by 0.69 to 0.81 percentage points, while working-age adult poverty falls by 0.33 to 0.37 percentage points. Pensioner poverty increases slightly, by up to 0.14 percentage points by 2030-31.

## Conclusion

PolicyEngine estimates that the combined Autumn Budget 2025 reforms cost £6.62 billion in 2026-27, transitioning to raising £12.35 billion by 2030-31. The bottom four income deciles gain on average in every year, while the top six deciles experience losses by 2030-31. The reforms reduce income inequality by 0.65-0.78% as measured by the Gini coefficient and reduce the overall poverty rate by 0.69-0.81 percentage points.

The child poverty rate (after housing costs) falls by 3.35-3.77 percentage points. The salary sacrifice cap, extended threshold freeze, and investment income tax increases contribute to the revenue raised from higher earners.

Explore our [UK Autumn Budget 2025 analysis dashboard](https://www.policyengine.org/uk/autumn-budget-2025) to view individual policy impacts, stacked effects, and detailed breakdowns by income decile, constituency, and household type.