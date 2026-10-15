import { useSelector } from 'react-redux';
import { Bar, BarChart, Label, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { ChartContainer } from '@/components/ChartContainer';
import { TOOLTIP_STYLE } from '@/components/charts';
import ChartExplanation from '@/components/flagship/report/ChartExplanation';
import { measureTextWidth } from '@/components/flagship/report/charts/barLayout';
import { Stack, Text } from '@/components/ui';
import { colors } from '@/designTokens/colors';
import { spacing } from '@/designTokens/spacing';
import { typography } from '@/designTokens/typography';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import {
  WINNERS_LOSERS_CATEGORIES as CATEGORIES,
  getWinnersLosersCsvRows,
} from '@/pages/report-output/distributional-impact/distributionalChartUtils';
import type { RootState } from '@/store';
import { CHART_EXPORT_KEEP, RECHARTS_FONT_STYLE } from '@/utils/chartUtils';
import { formatPercent } from '@/utils/formatters';
import { regionName } from '@/utils/impactChartUtils';

interface Props {
  output: SocietyWideReportOutput;
  chartHeight?: number;
  fillHeight?: boolean;
  compact?: boolean;
}

const COLOR_MAP: Record<string, string> = {
  'Gain more than 5%': colors.primary[700],
  'Gain less than 5%': colors.primary.alpha[60],
  'No change': colors.gray[200],
  'Lose less than 5%': colors.gray[400],
  'Lose more than 5%': colors.gray[600],
};

const LEGEND_TEXT_MAP: Record<string, string> = {
  'Gain more than 5%': 'Gain more than 5%',
  'Gain less than 5%': 'Gain less than 5%',
  'No change': 'No change',
  'Lose less than 5%': 'Loss less than 5%',
  'Lose more than 5%': 'Loss more than 5%',
};

const BAR_SIZE = 18;
/** The legend: a 12px swatch, its name 8px on, rows 8px apart. */
const LEGEND_SWATCH = 12;
const LEGEND_TEXT_GAP = 8;
const LEGEND_ROW_GAP = 8;
const LEGEND_ROW = LEGEND_SWATCH + LEGEND_ROW_GAP;
const LEGEND_FONT_SIZE = 12;
const TOOLTIP_POSITION = { x: 72, y: 0 };
const TOOLTIP_WRAPPER_STYLE = {
  zIndex: 1000,
  pointerEvents: 'none' as const,
  maxWidth: 'min(280px, calc(100vw - 32px))',
};

/** A row's outcome shares on hover. The shares count people, so "All" is everyone. */
export function WinnersLosersTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) {
    return null;
  }
  const decileLabel = label === 'All' ? 'All people' : `Decile ${label}`;
  return (
    <div style={TOOLTIP_STYLE}>
      <p style={{ fontWeight: typography.fontWeight.semibold, margin: 0 }}>{decileLabel}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ margin: '2px 0', fontSize: typography.fontSize.sm }}>
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              backgroundColor: p.fill,
              borderRadius: spacing.radius.chip,
              marginRight: 6,
              verticalAlign: 'middle',
            }}
          />
          {LEGEND_TEXT_MAP[p.dataKey]}: {(p.value * 100).toFixed(1)}%
        </p>
      ))}
    </div>
  );
}

export default function WinnersLosersIncomeDecileSubPage({
  output,
  chartHeight: _chartHeight,
  fillHeight = false,
  compact = false,
}: Props) {
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);

  // Extract data
  const deciles = output.intra_decile.deciles;
  const all = output.intra_decile.all;
  const decileNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Transform data for Recharts
  const decileData = decileNumbers.map((decile) => ({
    name: decile.toString(),
    ...Object.fromEntries(CATEGORIES.map((cat) => [cat, deciles[cat][decile - 1]])),
  }));

  const allData = [
    {
      name: 'All',
      ...Object.fromEntries(CATEGORIES.map((cat) => [cat, all[cat]])),
    },
  ];

  // Compute tight chart heights
  const allBarHeight = compact ? 28 : 42;
  const gapHeight = compact ? 4 : 8;
  const decileHeight = decileData.length * (BAR_SIZE + 1) + 50;

  // Generate chart title
  const getChartTitle = () => {
    const totalAhead = all['Gain more than 5%'] + all['Gain less than 5%'];
    const totalBehind = all['Lose more than 5%'] + all['Lose less than 5%'];
    const percent = (n: number) => formatPercent(n, countryId, { maximumFractionDigits: 0 });
    const totalAheadTerm = percent(totalAhead);
    const totalBehindTerm = percent(totalBehind);
    const objectTerm = 'the net income';
    const region = regionName(metadata);
    const regionPhrase = region ? ` in ${region}` : '';

    if (totalAhead > 0 && totalBehind > 0) {
      return `This reform would increase ${objectTerm} for ${totalAheadTerm} of the population${regionPhrase} and decrease it for ${totalBehindTerm}`;
    }
    if (totalAhead > 0) {
      return `This reform would increase ${objectTerm} for ${totalAheadTerm} of the population${regionPhrase}`;
    }
    if (totalBehind > 0) {
      return `This reform would decrease ${objectTerm} for ${totalBehindTerm} of the population${regionPhrase}`;
    }
    return `This reform would have no effect on ${objectTerm} for the population${regionPhrase}`;
  };

  // Description text
  const description = (
    <Text size="sm" c="dimmed">
      PolicyEngine sorts households into ten equally-populated groups according to their baseline{' '}
      {countryId === 'uk' ? 'equivalised' : 'equivalized'} household net income.
    </Text>
  );

  const allBarChart = (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        layout="vertical"
        data={allData}
        stackOffset="expand"
        barSize={BAR_SIZE}
        // The same left edge as the deciles below, so "All" lines up with them.
        margin={{ top: 8, right: 10, bottom: 0, left: compact ? 10 : 40 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          tick={RECHARTS_FONT_STYLE}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip
          content={<WinnersLosersTooltip />}
          allowEscapeViewBox={{ x: true, y: true }}
          offset={20}
          position={TOOLTIP_POSITION}
          wrapperStyle={TOOLTIP_WRAPPER_STYLE}
        />
        {CATEGORIES.map((cat) => (
          <Bar
            key={cat}
            dataKey={cat}
            stackId="a"
            fill={COLOR_MAP[cat]}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );

  const decileBarChart = (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        layout="vertical"
        // Decile 10 on top, 1 at the bottom: the income ladder reads upward.
        data={[...decileData].reverse()}
        stackOffset="expand"
        barSize={BAR_SIZE}
        barCategoryGap={1}
        margin={{ top: 0, right: 10, bottom: compact ? 0 : 40, left: compact ? 10 : 40 }}
      >
        <XAxis
          type="number"
          tick={RECHARTS_FONT_STYLE}
          tickLine={false}
          tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
        >
          {!compact && (
            <Label
              value="Population share"
              position="bottom"
              offset={20}
              style={RECHARTS_FONT_STYLE}
            />
          )}
        </XAxis>
        <YAxis
          type="category"
          dataKey="name"
          tick={RECHARTS_FONT_STYLE}
          tickLine={false}
          width={40}
          interval={0}
        >
          <Label
            value="Income decile"
            angle={-90}
            position="insideLeft"
            style={{ textAnchor: 'middle', ...RECHARTS_FONT_STYLE }}
          />
        </YAxis>
        <Tooltip
          content={<WinnersLosersTooltip />}
          allowEscapeViewBox={{ x: true, y: true }}
          offset={20}
          position={TOOLTIP_POSITION}
          wrapperStyle={TOOLTIP_WRAPPER_STYLE}
        />
        {CATEGORIES.map((cat) => (
          <Bar
            key={cat}
            dataKey={cat}
            stackId="a"
            fill={COLOR_MAP[cat]}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );

  // Drawn in SVG, so the chart's download keeps the key to its colors. A
  // few pixels spare keep a name whole if the font loads wider than measured.
  const legendWidth =
    LEGEND_SWATCH +
    LEGEND_TEXT_GAP +
    4 +
    Math.ceil(
      Math.max(...CATEGORIES.map((cat) => measureTextWidth(LEGEND_TEXT_MAP[cat], LEGEND_FONT_SIZE)))
    );
  const legend = (
    <div
      {...CHART_EXPORT_KEEP}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        paddingLeft: 16,
        paddingRight: 8,
        flexShrink: 0,
      }}
    >
      <svg
        width={legendWidth}
        height={CATEGORIES.length * LEGEND_ROW - LEGEND_ROW_GAP}
        aria-label="Legend"
      >
        {CATEGORIES.map((cat, index) => (
          <g key={cat} transform={`translate(0, ${index * LEGEND_ROW})`}>
            <rect width={LEGEND_SWATCH} height={LEGEND_SWATCH} rx={2} fill={COLOR_MAP[cat]} />
            <text
              x={LEGEND_SWATCH + LEGEND_TEXT_GAP}
              y={LEGEND_SWATCH / 2}
              dominantBaseline="central"
              fontSize={LEGEND_FONT_SIZE}
              fontFamily={typography.fontFamily.primary}
              fill={colors.gray[500]}
            >
              {LEGEND_TEXT_MAP[cat]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );

  if (fillHeight) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            {/* Kept by the download at its short compact height. */}
            <div {...CHART_EXPORT_KEEP} style={{ height: allBarHeight, flexShrink: 0 }}>
              {allBarChart}
            </div>
            <div style={{ height: gapHeight, flexShrink: 0 }} />
            <div style={{ flex: 1, minHeight: 0 }}>{decileBarChart}</div>
          </div>
          {legend}
        </div>
        <div style={{ flexShrink: 0 }}>
          <ChartExplanation compact={compact}>{description}</ChartExplanation>
        </div>
      </div>
    );
  }

  return (
    <ChartContainer
      title={getChartTitle()}
      downloadFilename="winners-losers-income-decile.svg"
      csvFilename="winners-losers-income-decile.csv"
      csvData={getWinnersLosersCsvRows(output)}
    >
      <Stack gap="sm">
        <div style={{ display: 'flex' }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <div {...CHART_EXPORT_KEEP} style={{ height: allBarHeight }}>
              {allBarChart}
            </div>
            <div style={{ height: gapHeight }} />
            <div style={{ height: decileHeight }}>{decileBarChart}</div>
          </div>
          {legend}
        </div>
        {description}
      </Stack>
    </ChartContainer>
  );
}
