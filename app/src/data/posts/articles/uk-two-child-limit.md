Chancellor Rachel Reeves [announced](https://www.gov.uk/government/news/chancellor-announces-autumn-budget-2025) in the November 2025 Budget that the government will remove the two-child benefit cap from April 2026. The cap, introduced in 2017, prevents parents from claiming Universal Credit or Child Tax Credit for more than two children born after April 2017. The OBR estimates that [560,000 families](https://obr.uk/efo/economic-and-fiscal-outlook-november-2025/) will benefit from this change by 2029-30.

In this analysis, we examine the impact of removing the two-child limit on household incomes, government spending, income distribution, poverty rates, income inequality, and geographic variation across parliamentary constituencies.

## Household impact

The reform will increase Universal Credit or Child Tax Credit payments for affected families by removing the restriction on child elements. For a sample household of two parents with three children aged 3, 5, and 7 in 2026-27, Figure 1 [shows](https://legacy.policyengine.org/uk/household?focus=householdOutput.earnings&reform=93219&region=uk&timePeriod=2026&baseline=1&uk_local_areas_beta=true&household=56008) how household net income changes across different employment income levels.

**Figure 1: Household net income by employment income**

```plotly
{
  "data": [
    {
      "hovertemplate": "Employment income=%{x}<br>Net income=%{y}<extra></extra>",
      "legendgroup": "Reform",
      "line": {"color": "#2C6496", "dash": "dot"},
      "mode": "lines",
      "name": "Reform",
      "orientation": "v",
      "showlegend": true,
      "x": [0.0, 2244.8979492188, 4489.7958984375, 6734.6943359375, 8979.591796875, 11224.490234375, 13469.3876953125, 15714.287109375, 17959.185546875, 20204.083984375, 22448.98046875, 24693.876953125, 26938.775390625, 29183.67578125, 31428.57421875, 33673.46875, 35918.3671875, 38163.26953125, 40408.16796875, 42653.06640625, 44897.9609375, 47142.859375, 49387.75390625, 51632.65234375, 53877.55078125, 56122.44921875, 58367.34375, 60612.2421875, 62857.140625, 65102.0390625, 67346.9375, 69591.8359375, 71836.734375, 74081.6328125, 76326.53125, 78571.4296875, 80816.328125, 83061.2265625, 85306.125, 87551.0234375, 89795.921875, 92040.8125, 94285.7109375, 96530.609375, 98775.5078125, 101020.40625, 103265.3046875, 105510.203125, 107755.1015625, 110000.0],
      "y": [25215.0, 27460.0, 29705.0, 31950.0, 33914.0, 34924.0, 35902.0, 36662.0, 37389.0, 38117.0, 38844.0, 39571.0, 40299.0, 41026.0, 41753.0, 42481.0, 43208.0, 43935.0, 44663.0, 45390.0, 46117.0, 46845.0, 47572.0, 48100.0, 48686.0, 49737.0, 51039.0, 52241.0, 53179.0, 54116.0, 55054.0, 55991.0, 56928.0, 57866.0, 58803.0, 59741.0, 60811.0, 62113.0, 63415.0, 64717.0, 66019.0, 67321.0, 68623.0, 69925.0, 71227.0, 72325.0, 73178.0, 74031.0, 74884.0, 75737.0],
      "type": "scatter"
    },
    {
      "hovertemplate": "Employment income=%{x}<br>Net income=%{y}<extra></extra>",
      "legendgroup": "Baseline",
      "line": {"color": "#808080", "dash": "solid"},
      "mode": "lines",
      "name": "Baseline",
      "orientation": "v",
      "showlegend": true,
      "x": [0.0, 2244.8979492188, 4489.7958984375, 6734.6943359375, 8979.591796875, 11224.490234375, 13469.3876953125, 15714.287109375, 17959.185546875, 20204.083984375, 22448.98046875, 24693.876953125, 26938.775390625, 29183.67578125, 31428.57421875, 33673.46875, 35918.3671875, 38163.26953125, 40408.16796875, 42653.06640625, 44897.9609375, 47142.859375, 49387.75390625, 51632.65234375, 53877.55078125, 56122.44921875, 58367.34375, 60612.2421875, 62857.140625, 65102.0390625, 67346.9375, 69591.8359375, 71836.734375, 74081.6328125, 76326.53125, 78571.4296875, 80816.328125, 83061.2265625, 85306.125, 87551.0234375, 89795.921875, 92040.8125, 94285.7109375, 96530.609375, 98775.5078125, 101020.40625, 103265.3046875, 105510.203125, 107755.1015625, 110000.0],
      "y": [21590.0, 23835.0, 26080.0, 28325.0, 30289.0, 31299.0, 32277.0, 33036.0, 33764.0, 34491.0, 35219.0, 35946.0, 36673.0, 37401.0, 38128.0, 38855.0, 39583.0, 40310.0, 41037.0, 41765.0, 42727.0, 44343.0, 45959.0, 47133.0, 48435.0, 49737.0, 51039.0, 52241.0, 53179.0, 54116.0, 55054.0, 55991.0, 56928.0, 57866.0, 58803.0, 59741.0, 60811.0, 62113.0, 63415.0, 64717.0, 66019.0, 67321.0, 68623.0, 69925.0, 71227.0, 72325.0, 73178.0, 74031.0, 74884.0, 75737.0],
      "type": "scatter"
    }
  ],
  "layout": {
    "xaxis": {
      "title": {"text": "Household head employment income"},
      "tickprefix": "£",
      "tickformat": ",.0f",
      "gridcolor": "#D3D3D3",
      "griddash": "dash",
      "showgrid": true,
      "zerolinecolor": "#D3D3D3"
    },
    "yaxis": {
      "title": {"text": "Household net income"},
      "tickprefix": "£",
      "tickformat": ",.0f",
      "gridcolor": "#D3D3D3",
      "griddash": "dash",
      "showgrid": true,
      "zerolinecolor": "#D3D3D3"
    },
    "legend": {"title": {"text": ""}, "tracegroupgap": 0, "orientation": "h", "x": 0.5, "xanchor": "center", "y": 1.15, "yanchor": "top"},
    "margin": {"t": 120, "b": 120, "l": 120, "r": 120},
    "font": {"family": "Roboto Serif", "color": "black"},
    "height": 600,
    "width": 800,
    "plot_bgcolor": "#F4F4F4",
    "paper_bgcolor": "#F4F4F4",
    "images": [
      {
        "sizex": 0.15,
        "sizey": 0.15,
        "source": "https://raw.githubusercontent.com/PolicyEngine/policyengine-app-v2/main/app/public/assets/logos/policyengine/teal.png",
        "x": 1.1,
        "xanchor": "right",
        "xref": "paper",
        "y": -0.2,
        "yanchor": "bottom",
        "yref": "paper"
      }
    ]
  }
}
```

At lower income ranges, the reform delivers larger increases in household net income due to higher Universal Credit entitlements when the two-child limit is removed. As employment income rises, Universal Credit tapers off under both scenarios, reducing the relative benefit of the reform.

## Budgetary impact

PolicyEngine estimates that removing the two-child limit will cost £2.9 billion in 2026-27, rising to £3.6 billion by 2029-30. The Office for Budget Responsibility (OBR) estimates lower costs of £2.3 billion in 2026-27, rising to £3.0 billion by 2029-30. The cost increases over time as more children are born after April 2017, when the cap was introduced, making fewer families eligible for transitional protection.

The OBR estimates that 560,000 families will gain from this policy by 2029-30, with an average increase in their Universal Credit award of £5,310 per year. The government estimates this measure will reduce child poverty by 450,000 by 2029-30. See the Appendix for a comparison of cost estimates from different organisations across years.

## Distributional impact

By income decile, removing the two-child limit will provide the largest relative benefits to lower-income households. The second income decile would see the largest increase in household income, reaching 2.59% by 2029-30. Figure 2 shows the relative change in household income by decile, with a year slider to see how the impact evolves from 2026-27 to 2029-30.

**Figure 2: Relative change in household income by income decile**

```plotly
{
  "data": [
    {
      "x": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      "y": [1.1959776, 1.8391298, 0.4812252, 0.35359052, 0.11665296, 0.045929383, 0.0073350216, 0.0000073353062, 0, 0],
      "type": "bar",
      "marker": {"color": "#2C6496"},
      "hovertemplate": "Decile %{x}<br>Change: +%{y:.2f}%<extra></extra>",
      "text": ["+1.20%", "+1.84%", "+0.48%", "+0.35%", "+0.12%", "+0.05%", "+0.01%", "+0.00%", "+0.00%", "+0.00%"],
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
      "range": [0, 3]
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
        {"label": "2029-30", "method": "animate", "args": [["2029-30"], {"frame": {"duration": 0, "redraw": true}, "mode": "immediate"}]}
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
        "y": [1.1959776, 1.8391298, 0.4812252, 0.35359052, 0.11665296, 0.045929383, 0.0073350216, 0.0000073353062, 0, 0],
        "text": ["+1.20%", "+1.84%", "+0.48%", "+0.35%", "+0.12%", "+0.05%", "+0.01%", "+0.00%", "+0.00%", "+0.00%"]
      }]
    },
    {
      "name": "2027-28",
      "data": [{
        "y": [1.2528068, 1.968357, 0.51096624, 0.3697631, 0.11421897, 0.05568646, 0.0075182994, 0.000007653903, 0, 0],
        "text": ["+1.25%", "+1.97%", "+0.51%", "+0.37%", "+0.11%", "+0.06%", "+0.01%", "+0.00%", "+0.00%", "+0.00%"]
      }]
    },
    {
      "name": "2028-29",
      "data": [{
        "y": [0.9840634, 2.4671202, 0.49848422, 0.43908167, 0.11204429, 0.06115094, 0.007567913, 0.00000831717, 0, 0],
        "text": ["+0.98%", "+2.47%", "+0.50%", "+0.44%", "+0.11%", "+0.06%", "+0.01%", "+0.00%", "+0.00%", "+0.00%"]
      }]
    },
    {
      "name": "2029-30",
      "data": [{
        "y": [0.99413264, 2.588859, 0.50424, 0.52330637, 0.050979566, 0.06634871, 0.007651947, 0.000009246044, 0, 0],
        "text": ["+0.99%", "+2.59%", "+0.50%", "+0.52%", "+0.05%", "+0.07%", "+0.01%", "+0.00%", "+0.00%", "+0.00%"]
      }]
    }
  ]
}
```

In 2026-27, the second decile sees the largest relative gain at 1.84%, followed by the first decile at 1.20%. The benefits decline sharply for higher deciles, with deciles 5-10 seeing gains of 0.12% or less. By 2029-30, the second decile's gain increases to 2.59% as more children become eligible for the reformed policy.

Figure 3 shows the absolute change in household income (in £ per year) by income decile. The second decile sees the largest absolute gains, reaching £632.36 per year by 2029-30.

**Figure 3: Absolute change in household income by income decile (£/year)**

```plotly
{
  "data": [
    {
      "x": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      "y": [194.74147, 444.26904, 140.0342, 110.11041, 40.757065, 18.248802, 3.438594, 0.0038774062, 0, 0],
      "type": "bar",
      "marker": {"color": "#319795"},
      "hovertemplate": "Decile %{x}<br>Change: £%{y:.2f}<extra></extra>",
      "text": ["£194.74", "£444.27", "£140.03", "£110.11", "£40.76", "£18.25", "£3.44", "£0.00", "£0.00", "£0.00"],
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
      "range": [0, 700]
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
        {"label": "2029-30", "method": "animate", "args": [["2029-30"], {"frame": {"duration": 0, "redraw": true}, "mode": "immediate"}]}
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
        "y": [194.74147, 444.26904, 140.0342, 110.11041, 40.757065, 18.248802, 3.438594, 0.0038774062, 0, 0],
        "text": ["£194.74", "£444.27", "£140.03", "£110.11", "£40.76", "£18.25", "£3.44", "£0.00", "£0.00", "£0.00"]
      }]
    },
    {
      "name": "2027-28",
      "data": [{
        "y": [204.51341, 475.8099, 147.7673, 119.19162, 40.017685, 22.271862, 3.5440817, 0.004082778, 0, 0],
        "text": ["£204.51", "£475.81", "£147.77", "£119.19", "£40.02", "£22.27", "£3.54", "£0.00", "£0.00", "£0.00"]
      }]
    },
    {
      "name": "2028-29",
      "data": [{
        "y": [160.61665, 596.02576, 145.55849, 143.56012, 39.68743, 24.168938, 3.6592896, 0.004459857, 0, 0],
        "text": ["£160.62", "£596.03", "£145.56", "£143.56", "£39.69", "£24.17", "£3.66", "£0.00", "£0.00", "£0.00"]
      }]
    },
    {
      "name": "2029-30",
      "data": [{
        "y": [162.87468, 632.3566, 147.75372, 174.25859, 18.166265, 26.402033, 3.7323763, 0.004979466, 0, 0],
        "text": ["£162.87", "£632.36", "£147.75", "£174.26", "£18.17", "£26.40", "£3.73", "£0.00", "£0.00", "£0.00"]
      }]
    }
  ]
}
```

In 2026-27, the second decile receives an average gain of £444.27 per year, while the first decile gains £194.74. These amounts grow over time: by 2029-30, the second decile's gain reaches £632.36 and the fourth decile's gain increases from £110.11 to £174.26 per year. Upper deciles see negligible absolute gains.

### Winners and losers

Figure 4 [shows](https://gist.github.com/vahid-ahmadi/0a9613b9857d03a50c71bbb8c1630555) that 4.4% of the population will see income gains from removing the two-child limit, with the largest share of winners concentrated in the lowest income deciles. The lowest income decile sees 9.5% of people gain income, with 8.7% gaining more than 5% and 0.8% gaining less than 5%. The second decile sees 18.4% gain, with 16.9% gaining more than 5%. Use the year slider to see how these shares evolve over time.

**Figure 4: Population share by income change**

```plotly
{
  "data": [
    {
      "name": "Gain more than 5%",
      "type": "bar",
      "orientation": "h",
      "x": [8.7, 16.9, 6.9, 5.0, 1.9, 0.1, 0.0, 0.0, 0.0, 0.0, null, 3.9],
      "y": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "", "All"],
      "marker": {"color": "#2C6496"},
      "text": ["9%", "17%", "7%", "5%", "2%", "", "", "", "", "", "", "4%"],
      "textposition": "inside",
      "textfont": {"color": "white", "size": 12, "family": "Roboto Serif"},
      "hovertemplate": "%{y}<br>Gain more than 5%: %{x:.1f}%<extra></extra>"
    },
    {
      "name": "Gain less than 5%",
      "type": "bar",
      "orientation": "h",
      "x": [0.8, 1.5, 0.2, 0.9, 0.1, 1.6, 0.2, 0.0, 0.0, 0.0, null, 0.5],
      "y": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "", "All"],
      "marker": {"color": "#809ac2"},
      "text": ["", "", "", "", "", "", "", "", "", "", "", ""],
      "textposition": "inside",
      "textfont": {"color": "white", "size": 12, "family": "Roboto Serif"},
      "hovertemplate": "%{y}<br>Gain less than 5%: %{x:.1f}%<extra></extra>"
    },
    {
      "name": "No change",
      "type": "bar",
      "orientation": "h",
      "x": [90.5, 81.6, 92.8, 94.1, 98.0, 98.3, 99.8, 100.0, 100.0, 100.0, null, 95.5],
      "y": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "", "All"],
      "marker": {"color": "#DCDCDC"},
      "text": ["90%", "82%", "92%", "94%", "98%", "98%", "100%", "100%", "100%", "100%", "", "95%"],
      "textposition": "outside",
      "textfont": {"color": "#333", "size": 12, "family": "Roboto Serif"},
      "hovertemplate": "%{y}<br>No change: %{x:.1f}%<extra></extra>"
    },
    {
      "name": "Loss less than 5%",
      "type": "bar",
      "orientation": "h",
      "x": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null, 0],
      "y": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "", "All"],
      "marker": {"color": "#AAAAAA"},
      "hovertemplate": "%{y}<br>Loss less than 5%: %{x:.1f}%<extra></extra>"
    },
    {
      "name": "Loss more than 5%",
      "type": "bar",
      "orientation": "h",
      "x": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null, 0],
      "y": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "", "All"],
      "marker": {"color": "#616161"},
      "hovertemplate": "%{y}<br>Loss more than 5%: %{x:.1f}%<extra></extra>"
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
    "margin": {"l": 80, "r": 180, "b": 100, "t": 120, "pad": 4},
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
    "updatemenus": [{
      "type": "buttons",
      "showactive": false,
      "x": 0.0,
      "y": 1.12,
      "xanchor": "left",
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
        {"label": "2029-30", "method": "animate", "args": [["2029-30"], {"frame": {"duration": 0, "redraw": true}, "mode": "immediate"}]}
      ],
      "x": 0.15,
      "len": 0.7,
      "y": 1.08,
      "yanchor": "bottom",
      "currentvalue": {"visible": false},
      "font": {"family": "Roboto Serif"}
    }],
    "images": [
      {
        "source": "https://raw.githubusercontent.com/PolicyEngine/policyengine-app-v2/main/app/public/assets/logos/policyengine/teal.png",
        "x": 1,
        "y": -0.22,
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
      "data": [
        {"x": [8.7, 16.9, 6.9, 5.0, 1.9, 0.1, 0.0, 0.0, 0.0, 0.0, null, 3.9], "text": ["9%", "17%", "7%", "5%", "2%", "", "", "", "", "", "", "4%"]},
        {"x": [0.8, 1.5, 0.2, 0.9, 0.1, 1.6, 0.2, 0.0, 0.0, 0.0, null, 0.5]},
        {"x": [90.5, 81.6, 92.8, 94.1, 98.0, 98.3, 99.8, 100.0, 100.0, 100.0, null, 95.5], "text": ["90%", "82%", "92%", "94%", "98%", "98%", "100%", "100%", "100%", "100%", "", "95%"]},
        {"x": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null, 0]},
        {"x": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null, 0]}
      ]
    },
    {
      "name": "2027-28",
      "data": [
        {"x": [8.3, 17.0, 7.1, 5.1, 1.8, 0.1, 0.0, 0.0, 0.0, 0.0, null, 3.9], "text": ["8%", "17%", "7%", "5%", "2%", "", "", "", "", "", "", "4%"]},
        {"x": [1.2, 1.3, 0.3, 0.9, 0.1, 1.6, 0.2, 0.0, 0.0, 0.0, null, 0.6]},
        {"x": [90.5, 81.7, 92.6, 93.9, 98.1, 98.2, 99.8, 100.0, 100.0, 100.0, null, 95.5], "text": ["91%", "82%", "93%", "94%", "98%", "98%", "100%", "100%", "100%", "100%", "", "95%"]},
        {"x": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null, 0]},
        {"x": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null, 0]}
      ]
    },
    {
      "name": "2028-29",
      "data": [
        {"x": [7.3, 19.7, 6.6, 6.5, 1.6, 0.1, 0.0, 0.0, 0.0, 0.0, null, 4.1], "text": ["7%", "20%", "7%", "7%", "2%", "", "", "", "", "", "", "4%"]},
        {"x": [0.8, 1.4, 0.3, 0.4, 0.1, 1.6, 0.2, 0.0, 0.0, 0.0, null, 0.5]},
        {"x": [91.9, 78.9, 93.1, 93.0, 98.2, 98.3, 99.8, 100.0, 100.0, 100.0, null, 95.4], "text": ["92%", "79%", "93%", "93%", "98%", "98%", "100%", "100%", "100%", "100%", "", "95%"]},
        {"x": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null, 0]},
        {"x": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null, 0]}
      ]
    },
    {
      "name": "2029-30",
      "data": [
        {"x": [6.8, 20.3, 6.6, 7.3, 0.9, 0.1, 0.0, 0.0, 0.0, 0.0, null, 4.2], "text": ["7%", "20%", "7%", "7%", "", "", "", "", "", "", "", "4%"]},
        {"x": [0.5, 1.6, 0.4, 0.4, 0.1, 1.6, 0.2, 0.0, 0.0, 0.0, null, 0.5]},
        {"x": [92.6, 78.1, 93.0, 92.2, 99.0, 98.3, 99.8, 100.0, 100.0, 100.0, null, 95.3], "text": ["93%", "78%", "93%", "92%", "99%", "98%", "100%", "100%", "100%", "100%", "", "95%"]},
        {"x": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null, 0]},
        {"x": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null, 0]}
      ]
    }
  ]
}
```

## Poverty impact

By age group, removing the two-child limit will [reduce](https://gist.github.com/vahid-ahmadi/b3802dd91df3b5363b4b7b6037c0a8d5) poverty rates most for children across all years. Tables 1 and 2 show the percentage change in poverty rates for absolute and relative poverty measures, both before housing costs (BHC) and after housing costs (AHC).

**Table 1: Change in absolute poverty rates**

| Year    | Children (BHC) | Children (AHC) | All (BHC) | All (AHC) |
| ------- | -------------- | -------------- | --------- | --------- |
| 2026-27 | -13.5%         | -13.1%         | -6.6%     | -6.5%     |
| 2027-28 | -13.6%         | -13.3%         | -6.6%     | -6.6%     |
| 2028-29 | -14.4%         | -13.0%         | -7.1%     | -6.5%     |
| 2029-30 | -13.8%         | -13.0%         | -6.7%     | -6.5%     |

**Table 2: Change in relative poverty rates**

| Year    | Children (BHC) | Children (AHC) | All (BHC) | All (AHC) |
| ------- | -------------- | -------------- | --------- | --------- |
| 2026-27 | -14.5%         | -6.0%          | -6.9%     | -2.7%     |
| 2027-28 | -14.1%         | -5.7%          | -6.3%     | -2.6%     |
| 2028-29 | -17.3%         | -6.1%          | -8.4%     | -2.7%     |
| 2029-30 | -17.6%         | -6.9%          | -8.5%     | -3.5%     |

Absolute poverty decreases by 13-14% for children and 6-7% overall. Relative poverty (BHC) decreases by 14-18% for children and 6-9% overall.

## Inequality impact

Removing the two-child limit will [reduce](https://gist.github.com/vahid-ahmadi/0a9613b9857d03a50c71bbb8c1630555) income inequality across all years. The Gini index would fall by 0.55% in 2026-27, increasing to 0.61% by 2029-30 as more children become eligible for the reformed policy.

| Year    | Gini index change |
| ------- | ----------------- |
| 2026-27 | -0.55%            |
| 2027-28 | -0.57%            |
| 2028-29 | -0.60%            |
| 2029-30 | -0.61%            |

## Constituency impact

The impact of removing the two-child limit [varies](https://legacy.policyengine.org/uk/policy?focus=policyOutput.constituencies.relative&reform=93219&region=uk&timePeriod=2026&baseline=1&uk_local_areas_beta=true&household=56008) across parliamentary constituencies, as shown in Figure 5.

**Figure 5: Relative income change by parliamentary constituency**

<iframe src="/assets/posts/uk-two-child-limit/constituency_map_two-child-limit.html" width="100%" height="600" frameborder="0"></iframe>

The constituencies experiencing the largest average income gains include Belfast North (£243.47), Bradford East (£218.77), Birmingham Yardley (£209.33), Bradford West (£207.96), and West Tyrone (£205.92). The constituencies with the smallest gains include Dumfries and Galloway (£21.49), Orkney and Shetland (£22.25), and Glasgow East (£26.36).

## Conclusion

PolicyEngine estimates that removing the two-child benefit limit will cost £2.9 billion in 2026-27, rising to £3.6 billion by 2029-30. The reform would reduce absolute child poverty (before housing costs) by 13.5% and overall poverty by 6.6% in 2026-27. The OBR estimates a lower cost of £2.3 billion in 2026-27, rising to £3.0 billion by 2029-30, benefiting 560,000 families and reducing child poverty by 450,000.

We invite you to explore the [UK Autumn Budget 2025 analysis dashboard](https://www.policyengine.org/uk/autumn-budget-2025) to explore revenue and distributional impacts across income deciles, constituencies, and household types.

## Appendix: Cost estimates by organisation and year

The following table compares cost estimates for abolishing the two-child limit from different organisations.

| Year              | PolicyEngine                                                                                                                             | OBR (static) | OBR (post-behavioural) | IFS        | JRF        | Resolution Foundation |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ---------------------- | ---------- | ---------- | --------------------- |
| 2024-25           | —                                                                                                                                        | —            | —                      | —          | —          | £2.5bn                |
| 2025-26           | —                                                                                                                                        | —            | —                      | —          | £2.7bn[^1] | —                     |
| 2026-27           | [£2.9bn](https://legacy.policyengine.org/uk/policy?focus=policyOutput.policyBreakdown&reform=93219&region=uk&timePeriod=2026&baseline=1) | £2.1bn       | £2.3bn                 | —          | —          | —                     |
| 2027-28           | [£3.1bn](https://legacy.policyengine.org/uk/policy?focus=policyOutput.policyBreakdown&reform=93219&region=uk&timePeriod=2027&baseline=1) | £2.2bn       | £2.5bn                 | —          | —          | —                     |
| 2028-29           | [£3.4bn](https://legacy.policyengine.org/uk/policy?focus=policyOutput.policyBreakdown&reform=93219&region=uk&timePeriod=2028&baseline=1) | £2.4bn       | £2.7bn                 | —          | —          | —                     |
| 2029-30           | [£3.6bn](https://legacy.policyengine.org/uk/policy?focus=policyOutput.policyBreakdown&reform=93219&region=uk&timePeriod=2029&baseline=1) | £2.7bn       | £3.0bn                 | —          | £2.8bn[^2] | —                     |
| 2030-31           | —                                                                                                                                        | £2.8bn       | £3.1bn                 | —          | —          | —                     |
| Long run          | —                                                                                                                                        | —            | —                      | £2.5bn[^3] | —          | —                     |
| Full coverage[^4] | —                                                                                                                                        | —            | —                      | —          | —          | £3.6bn                |

[^1]: JRF estimate includes both two-child limit and benefit cap removal. Source: JRF analysis using IPPR tax-benefit model (Parkes et al 2025). JRF's earlier estimate from May 2025 showed £2.0bn for two-child limit only in 2025/26

[^2]: JRF estimate for two-child limit only. JRF's earlier estimate from May 2025 also showed £2.8bn for 2029/30

[^3]: IFS estimate from October 2024 report "Child poverty: trends and policy options". Would cost £3.3bn if household benefit cap also removed

[^4]: Full coverage expected around 2035 when all children potentially affected

Sources:

- PolicyEngine: This analysis
- OBR: [Economic and Fiscal Outlook November 2025](https://obr.uk/efo/economic-and-fiscal-outlook-november-2025/)
- IFS: [The two-child limit: poverty, incentives and cost](https://ifs.org.uk/articles/two-child-limit-poverty-incentives-and-cost)
- JRF: [Getting the child poverty strategy we need](https://www.ippr.org/articles/getting-the-child-poverty-strategy-we-need) (IPPR/JRF collaboration), [Two policies to boost family living standards and reduce child poverty](https://www.jrf.org.uk/child-poverty/two-policies-to-boost-family-living-standards-and-reduce-child-poverty), and [Three policies to reduce child poverty this parliament](https://www.jrf.org.uk/child-poverty/three-policies-to-reduce-child-poverty-this-parliament)
- Resolution Foundation: [Catastrophic caps](https://www.resolutionfoundation.org/publications/catastophic-caps/)
