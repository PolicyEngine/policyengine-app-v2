import { useSelector } from 'react-redux';
import { Bar, BarChart, Label, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { ChartContainer } from '@/components/ChartContainer';
import { TOOLTIP_STYLE } from '@/components/charts';
import { Stack, Text } from '@/components/ui';
import { colors } from '@/designTokens/colors';
import { spacing } from '@/designTokens/spacing';
import { typography } from '@/designTokens/typography';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import type { RootState } from '@/store';
import { RECHARTS_FONT_STYLE } from '@/utils/chartUtils';
import { formatPercent } from '@/utils/formatters';
import { regionName } from '@/utils/impactChartUtils';

interface Props {
  output: SocietyWideReportOutput;
}

// Category definitions and styling
const CATEGORIES = [
  'Gain more than 5%',
  'Gain less than 5%',
  'No change',
  'Lose less than 5%',
  'Lose more than 5%',
] as const;

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

function WinnersLosersTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) {
    return null;
  }
  const decileLabel = label === 'All' ? 'All households' : `Decile ${label}`;
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

export default function WinnersLosersWealthDecileSubPage({ output }: Props) {
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);

  // Extract data
  const deciles = output.intra_wealth_decile?.deciles || {};
  const all = output.intra_wealth_decile?.all || {
    'Gain more than 5%': 0,
    'Gain less than 5%': 0,
    'No change': 0,
    'Lose less than 5%': 0,
    'Lose more than 5%': 0,
  };
  const decileNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Transform data for Recharts
  const decileData = decileNumbers.map((decile) => ({
    name: decile.toString(),
    ...Object.fromEntries(CATEGORIES.map((cat) => [cat, (deciles as any)[cat]?.[decile - 1] || 0])),
  }));

  const allData = [
    {
      name: 'All',
      ...Object.fromEntries(CATEGORIES.map((cat) => [cat, all[cat]])),
    },
  ];

  // Compute tight chart heights
  const allBarHeight = 42;
  const gapHeight = 8;
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

  return (
    <ChartContainer title={getChartTitle()} downloadFilename="winners-losers-wealth-decile.svg">
      <Stack gap="sm">
        <div style={{ display: 'flex' }}>
          {/* Chart area */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            {/* "All" bar */}
            <div style={{ height: allBarHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={allData}
                  stackOffset="expand"
                  barSize={BAR_SIZE}
                  margin={{ top: 8, right: 10, bottom: 0, left: 40 }}
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
                    wrapperStyle={{ zIndex: 1000 }}
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
            </div>
            <div style={{ height: gapHeight }} />

            {/* Decile bars — tight spacing */}
            <div style={{ height: decileHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={decileData}
                  stackOffset="expand"
                  barSize={BAR_SIZE}
                  barCategoryGap={1}
                  margin={{ top: 0, right: 10, bottom: 40, left: 40 }}
                >
                  <XAxis
                    type="number"
                    tick={RECHARTS_FONT_STYLE}
                    tickLine={false}
                    tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                  >
                    <Label
                      value="Population share"
                      position="bottom"
                      offset={20}
                      style={RECHARTS_FONT_STYLE}
                    />
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
                      value="Wealth decile"
                      angle={-90}
                      position="insideLeft"
                      style={{ textAnchor: 'middle', ...RECHARTS_FONT_STYLE }}
                    />
                  </YAxis>
                  <Tooltip
                    content={<WinnersLosersTooltip />}
                    allowEscapeViewBox={{ x: true, y: true }}
                    offset={20}
                    wrapperStyle={{ zIndex: 1000 }}
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
            </div>
          </div>

          {/* Legend — right side */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 8,
              paddingLeft: 16,
              paddingRight: 8,
              flexShrink: 0,
            }}
          >
            {CATEGORIES.map((cat) => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 12,
                    height: 12,
                    borderRadius: 2,
                    backgroundColor: COLOR_MAP[cat],
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: typography.fontSize.xs,
                    color: colors.gray[500],
                    whiteSpace: 'nowrap',
                  }}
                >
                  {LEGEND_TEXT_MAP[cat]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Text size="sm" c="dimmed">
          The chart shows the distribution of winners and losers from the reform, grouped by wealth
          decile. Wealth deciles contain an equal number of people (ranked by wealth).
        </Text>
      </Stack>
    </ChartContainer>
  );
}
