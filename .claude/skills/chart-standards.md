# Chart and Visualization Standards

This skill ensures consistent chart styling across PolicyEngine visualizations.

## Chart libraries

- **Recharts** (default) — used for all standard charts (bar, line, area, stacked bar)
- **Plotly** (exceptions only) — choropleth maps, hexagonal maps, waterfall charts, blog/notebook embedded JSON

## Recharts chart pattern

### Required imports

```tsx
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { colors } from "@/designTokens/colors";
import { spacing } from "@/designTokens/spacing";
import { ChartContainer } from "@/components/ChartContainer";
import {
  ChartWatermark,
  ImpactBarLabel,
  ImpactTooltip,
  TOOLTIP_STYLE,
} from "@/components/charts";
import {
  downloadCsv,
  getClampedChartHeight,
  RECHARTS_FONT_STYLE,
} from "@/utils/chartUtils";
```

### Chart container pattern

Always wrap charts in `ChartContainer` for consistent styling:

```tsx
<ChartContainer title={getChartTitle()} onDownloadCsv={handleDownloadCsv}>
  <Stack gap={spacing.sm}>
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 20, bottom: 30, left: 20 }}
      >
        <XAxis dataKey="name" style={RECHARTS_FONT_STYLE} />
        <YAxis style={RECHARTS_FONT_STYLE} />
        <Tooltip content={<ImpactTooltip />} />
        <Bar dataKey="value" label={<ImpactBarLabel data={chartData} />}>
          {chartData.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.value < 0 ? colors.gray[600] : colors.primary[500]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
    <ChartWatermark />
    {description}
  </Stack>
</ChartContainer>
```

### Shared chart components

Located in `app/src/components/charts/`:

| Component        | Purpose                             | Used by                                    |
| ---------------- | ----------------------------------- | ------------------------------------------ |
| `ChartWatermark` | PolicyEngine logo below chart       | All Recharts charts                        |
| `ImpactTooltip`  | Tooltip with bold name + hover text | Poverty, inequality, distributional charts |
| `ImpactBarLabel` | Formatted value above/below bars    | Poverty, inequality, distributional charts |
| `TOOLTIP_STYLE`  | Shared tooltip container CSS        | All Recharts custom tooltips               |

For charts with unique tooltip formats (earnings, MTR, winners/losers, historical), create a local tooltip component using `TOOLTIP_STYLE`:

```tsx
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div style={TOOLTIP_STYLE}>
      <p style={{ fontWeight: 600, margin: 0 }}>{data.name}</p>
      <p style={{ margin: "4px 0 0", fontSize: 13, whiteSpace: "pre-wrap" }}>
        {data.detail}
      </p>
    </div>
  );
}
```

### Recharts font style

Always apply `RECHARTS_FONT_STYLE` to axes for consistent typography:

```tsx
<XAxis dataKey="name" style={RECHARTS_FONT_STYLE} />
<YAxis style={RECHARTS_FONT_STYLE} tickFormatter={formatValue} />
```

### Responsive height

```tsx
import { useMediaQuery, useViewportSize } from "@mantine/hooks";
import { getClampedChartHeight } from "@/utils/chartUtils";

const mobile = useMediaQuery("(max-width: 768px)");
const { height: viewportHeight } = useViewportSize();
const chartHeight = getClampedChartHeight(viewportHeight, mobile);
```

## Color semantics

### Bar/data colors

| Scenario                         | Color Token           | Hex              |
| -------------------------------- | --------------------- | ---------------- |
| Positive change (gains, winners) | `colors.primary[500]` | `#319795` (teal) |
| Negative change (losses, losers) | `colors.gray[600]`    | `#4B5563`        |
| Neutral/baseline                 | `colors.gray[300]`    | `#D1D5DB`        |
| Error/warning states             | `colors.error`        | `#EF4444`        |
| Success states                   | `colors.success`      | `#22C55E`        |

### Dynamic color assignment (Recharts)

```tsx
import { Cell } from "recharts";

<Bar dataKey="value">
  {chartData.map((entry, i) => (
    <Cell
      key={i}
      fill={entry.value < 0 ? colors.gray[600] : colors.primary[500]}
    />
  ))}
</Bar>;
```

## Hover text / tooltips

### Recharts tooltips

Use JSX tooltips with `white-space: pre-wrap` for line breaks. The `wordWrap` utility in `chartMessages.ts` returns `\n` characters.

```tsx
<p style={{ whiteSpace: "pre-wrap" }}>{data.hoverText}</p>
```

### Plotly hover templates (exceptions only)

For the remaining Plotly charts, convert `\n` to `<br>` at point of use:

```tsx
customdata: labels.map((x, i) =>
  hoverMessage(x, values[i]).replaceAll("\n", "<br>"),
);
```

## Chart title pattern

Generate dynamic titles that describe the reform's impact:

```tsx
const getChartTitle = () => {
  const change = calculateChange();
  const signTerm = change > 0 ? "increase" : "decrease";

  if (change === 0) {
    return `This reform would have no effect on ${metric}`;
  }
  return `This reform would ${signTerm} ${metric} by ${formatValue(change)}`;
};
```

## CSV export pattern

Always provide CSV download functionality:

```tsx
import { downloadCsv } from "@/utils/chartUtils";

const handleDownloadCsv = () => {
  const csvData = Object.entries(dataObject).map(([key, value]) => [
    `Label ${key}`,
    value.toString(),
  ]);
  downloadCsv(csvData, "descriptive-filename.csv");
};
```

## Description pattern

Add explanatory text below charts:

```tsx
const description = (
  <Text size="sm" c="dimmed">
    PolicyEngine sorts households into ten equally-populated groups...
  </Text>
);
```

## Plotly exceptions

These charts remain on Plotly (`react-plotly.js`):

| Chart                                 | Reason                                         |
| ------------------------------------- | ---------------------------------------------- |
| `USDistrictChoroplethMap.tsx`         | No Recharts geo support                        |
| `HexagonalMap.tsx`                    | Custom scatter with hex markers                |
| `BudgetaryImpactSubPage.tsx`          | Waterfall chart (no native Recharts waterfall) |
| `BudgetaryImpactByProgramSubPage.tsx` | Waterfall chart                                |
| `MarkdownFormatter.tsx`               | Blog posts embed native Plotly JSON            |
| `NotebookRenderer.tsx`                | Notebooks embed native Plotly JSON             |

For these files, continue using the Plotly patterns:

```tsx
import type { Layout } from "plotly.js";
import Plot from "react-plotly.js";
import {
  DEFAULT_CHART_CONFIG,
  getClampedChartHeight,
} from "@/utils/chartUtils";

<Plot
  data={chartData}
  layout={layout}
  config={DEFAULT_CHART_CONFIG}
  style={{ width: "100%", height: chartHeight }}
/>;
```

## Anti-patterns

```tsx
// WRONG - Hardcoded colors
fill="#319795"
fill={value > 0 ? 'green' : 'red'}

// CORRECT - Token colors
fill={colors.primary[500]}
fill={entry.value < 0 ? colors.gray[600] : colors.primary[500]}

// WRONG - Hardcoded dimensions
style={{ height: 500 }}

// CORRECT - Responsive height
<ResponsiveContainer width="100%" height={chartHeight}>

// WRONG - No container
<BarChart ... />

// CORRECT - With container
<ChartContainer title={title} onDownloadCsv={handleCsv}>
  <ResponsiveContainer ...>
    <BarChart ... />
  </ResponsiveContainer>
  <ChartWatermark />
</ChartContainer>

// WRONG - Using <br> in Recharts tooltip text
hoverText: message.replaceAll('\n', '<br>')

// CORRECT - Use \n with pre-wrap
<p style={{ whiteSpace: 'pre-wrap' }}>{data.hoverText}</p>

// WRONG - Inline tooltip styles
<div style={{ background: '#fff', border: '1px solid #E2E8F0', ... }}>

// CORRECT - Use shared TOOLTIP_STYLE
import { TOOLTIP_STYLE } from '@/components/charts';
<div style={TOOLTIP_STYLE}>
```
