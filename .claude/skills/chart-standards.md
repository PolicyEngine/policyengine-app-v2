# Chart and Visualization Standards

This skill ensures consistent chart styling across PolicyEngine visualizations using Plotly.js via `react-plotly.js`.

## Required Imports

```tsx
import type { Layout } from 'plotly.js';
import Plot from 'react-plotly.js';
import { colors } from '@/designTokens/colors';
import { spacing } from '@/designTokens/spacing';
import { ChartContainer } from '@/components/ChartContainer';
import { DEFAULT_CHART_CONFIG, getClampedChartHeight } from '@/utils/chartUtils';
```

## Chart Container Pattern

Always wrap charts in `ChartContainer` for consistent styling:

```tsx
<ChartContainer title={getChartTitle()} onDownloadCsv={handleDownloadCsv}>
  <Stack gap={spacing.sm}>
    <Plot
      data={chartData}
      layout={layout}
      config={DEFAULT_CHART_CONFIG}
      style={{ width: '100%', height: chartHeight }}
    />
    {description}
  </Stack>
</ChartContainer>
```

## Color Semantics

### Bar/Data Colors
| Scenario | Color Token | Hex |
|----------|-------------|-----|
| Positive change (gains, winners) | `colors.primary[500]` | `#319795` (teal) |
| Negative change (losses, losers) | `colors.gray[600]` | `#4B5563` |
| Neutral/baseline | `colors.gray[300]` | `#D1D5DB` |
| Error/warning states | `colors.error` | `#EF4444` |
| Success states | `colors.success` | `#22C55E` |

### Dynamic Color Assignment
```tsx
marker: {
  color: yArray.map((value) => (value < 0 ? colors.gray[600] : colors.primary[500])),
}
```

### Multi-Series Colors
Use the design system's series palette:
```tsx
import { chartColors } from '@policyengine/design-system/charts';

// Series order: teal, blue, dark teal, dark blue, gray
chartColors.series[0]  // Primary teal
chartColors.series[1]  // Blue accent
chartColors.series[2]  // Dark teal
chartColors.series[3]  // Dark blue
chartColors.series[4]  // Gray
```

## Chart Configuration

### Default Config (Always Use)
```tsx
import { DEFAULT_CHART_CONFIG } from '@/utils/chartUtils';

config={{
  ...DEFAULT_CHART_CONFIG,
  locale: localeCode(countryId),  // For currency/number formatting
}}
```

This provides:
- `displayModeBar: false` - Hides Plotly toolbar
- `responsive: true` - Enables responsive sizing

### Responsive Height
```tsx
import { useMediaQuery, useViewportSize } from '@mantine/hooks';
import { getClampedChartHeight } from '@/utils/chartUtils';

const mobile = useMediaQuery('(max-width: 768px)');
const { height: viewportHeight } = useViewportSize();
const chartHeight = getClampedChartHeight(viewportHeight, mobile);

// Use in style
style={{ width: '100%', height: chartHeight }}
```

## Standard Layout Properties

### Base Layout
```tsx
const layout = {
  xaxis: {
    title: { text: 'X Axis Label' },
    fixedrange: true,  // Disable zoom/pan
  },
  yaxis: {
    title: { text: 'Y Axis Label' },
    tickprefix: currencySymbol(countryId),  // For currency
    tickformat: ',.0f',  // Number format
    fixedrange: true,
  },
  showlegend: false,  // Or configure legend position
  margin: {
    t: 0,   // Top (usually 0, title is outside chart)
    b: 80,  // Bottom (for x-axis labels)
    l: 60,  // Left (for y-axis labels)
    r: 20,  // Right
  },
} as Partial<Layout>;
```

### Text on Bars (Uniform Text)
```tsx
uniformtext: {
  mode: 'hide' as const,  // Hide text that doesn't fit
  minsize: mobile ? 4 : 8,
},
```

### Legend Position (When Needed)
```tsx
legend: {
  orientation: 'h',
  yanchor: 'bottom',
  y: 1.02,
  xanchor: 'right',
  x: 1,
},
```

## Hover Templates

Use custom hover templates for rich tooltips:

```tsx
{
  customdata: xArray.map((x, i) => hoverMessage(x, yArray[i])),
  hovertemplate: '<b>Decile %{x}</b><br><br>%{customdata}<extra></extra>',
}
```

The `<extra></extra>` hides the trace name box.

## Chart Title Pattern

Generate dynamic titles that describe the reform's impact:

```tsx
const getChartTitle = () => {
  const change = calculateChange();
  const signTerm = change > 0 ? 'increase' : 'decrease';

  if (change === 0) {
    return `This reform would have no effect on ${metric}`;
  }
  return `This reform would ${signTerm} ${metric} by ${formatValue(change)}`;
};
```

## CSV Export Pattern

Always provide CSV download functionality:

```tsx
import { downloadCsv } from '@/utils/chartUtils';

const handleDownloadCsv = () => {
  const csvData = Object.entries(dataObject).map(([key, value]) => [
    `Label ${key}`,
    value.toString(),
  ]);
  downloadCsv(csvData, 'descriptive-filename.csv');
};
```

## Description Pattern

Add explanatory text below charts:

```tsx
const description = (
  <Text size="sm" c="dimmed">
    PolicyEngine sorts households into ten equally-populated groups...
  </Text>
);
```

## Complete Chart Component Template

```tsx
import type { Layout } from 'plotly.js';
import Plot from 'react-plotly.js';
import { Stack, Text } from '@mantine/core';
import { useMediaQuery, useViewportSize } from '@mantine/hooks';
import { ChartContainer } from '@/components/ChartContainer';
import { colors } from '@/designTokens/colors';
import { spacing } from '@/designTokens/spacing';
import { DEFAULT_CHART_CONFIG, downloadCsv, getClampedChartHeight } from '@/utils/chartUtils';

interface Props {
  output: OutputType;
}

export default function ChartSubPage({ output }: Props) {
  const mobile = useMediaQuery('(max-width: 768px)');
  const countryId = useCurrentCountry();
  const { height: viewportHeight } = useViewportSize();
  const chartHeight = getClampedChartHeight(viewportHeight, mobile);

  // Extract and prepare data
  const xArray = Object.keys(output.data);
  const yArray = Object.values(output.data);

  // Generate title
  const getChartTitle = () => {
    // Dynamic title based on data
  };

  // CSV export
  const handleDownloadCsv = () => {
    const csvData = xArray.map((x, i) => [x, yArray[i].toString()]);
    downloadCsv(csvData, 'chart-name.csv');
  };

  // Chart data
  const chartData = [{
    x: xArray,
    y: yArray,
    type: 'bar' as const,
    marker: {
      color: yArray.map((v) => (v < 0 ? colors.gray[600] : colors.primary[500])),
    },
  }];

  // Layout
  const layout = {
    xaxis: { title: { text: 'X Label' }, fixedrange: true },
    yaxis: { title: { text: 'Y Label' }, fixedrange: true },
    showlegend: false,
    margin: { t: 0, b: 80, l: 60, r: 20 },
  } as Partial<Layout>;

  return (
    <ChartContainer title={getChartTitle()} onDownloadCsv={handleDownloadCsv}>
      <Stack gap={spacing.sm}>
        <Plot
          data={chartData}
          layout={layout}
          config={DEFAULT_CHART_CONFIG}
          style={{ width: '100%', height: chartHeight }}
        />
        <Text size="sm" c="dimmed">
          Explanatory description...
        </Text>
      </Stack>
    </ChartContainer>
  );
}
```

## Watermark (For Research/Blog Charts)

When charts need PolicyEngine branding (research posts, exported images):

```tsx
import { chartLogo } from '@policyengine/design-system/charts';

layout: {
  images: [chartLogo],
}
```

Logo source: `/assets/logos/policyengine/teal-square.png`

## Anti-Patterns

### Never Do This
```tsx
// WRONG - Hardcoded colors
marker: { color: '#319795' }
marker: { color: value > 0 ? 'green' : 'red' }

// WRONG - Hardcoded dimensions
style={{ height: 500 }}

// WRONG - Missing config
<Plot data={data} layout={layout} />

// WRONG - No container
<Plot ... />  // Charts should be in ChartContainer
```

### Always Do This
```tsx
// CORRECT - Token colors
marker: { color: colors.primary[500] }
marker: { color: value < 0 ? colors.gray[600] : colors.primary[500] }

// CORRECT - Responsive height
style={{ height: chartHeight }}

// CORRECT - With config
<Plot data={data} layout={layout} config={DEFAULT_CHART_CONFIG} />

// CORRECT - With container
<ChartContainer title={title} onDownloadCsv={handleCsv}>
  <Plot ... />
</ChartContainer>
```
