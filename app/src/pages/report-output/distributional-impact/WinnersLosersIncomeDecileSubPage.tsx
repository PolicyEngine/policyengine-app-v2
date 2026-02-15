import { useSelector } from 'react-redux';
import { Bar, BarChart, Label, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Stack, Text } from '@mantine/core';
import { useMediaQuery, useViewportSize } from '@mantine/hooks';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { ChartContainer } from '@/components/ChartContainer';
import { TOOLTIP_STYLE } from '@/components/charts';
import { colors } from '@/designTokens/colors';
import { spacing } from '@/designTokens/spacing';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import type { RootState } from '@/store';
import { downloadCsv, getClampedChartHeight, RECHARTS_FONT_STYLE } from '@/utils/chartUtils';
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

function WinnersLosersTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) {
    return null;
  }
  const decileLabel = label === 'All' ? 'All households' : `Decile ${label}`;
  return (
    <div style={TOOLTIP_STYLE}>
      <p style={{ fontWeight: 600, margin: 0 }}>{decileLabel}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ margin: '2px 0', fontSize: 13 }}>
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              backgroundColor: p.fill,
              borderRadius: 2,
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

export default function WinnersLosersIncomeDecileSubPage({ output }: Props) {
  const mobile = useMediaQuery('(max-width: 768px)');
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);
  const { height: viewportHeight } = useViewportSize();
  const chartHeight = getClampedChartHeight(viewportHeight, mobile);

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

  // CSV export handler
  const handleDownloadCsv = () => {
    const header = ['Decile', ...CATEGORIES];
    const rows = [
      ...decileNumbers.map((d) => [
        d.toString(),
        ...CATEGORIES.map((cat) => deciles[cat][d - 1].toString()),
      ]),
      ['All', ...CATEGORIES.map((cat) => all[cat].toString())],
    ];
    downloadCsv([header, ...rows], 'winners-losers-income-decile.csv');
  };

  // Description text
  const description = (
    <Text size="sm" c="dimmed">
      PolicyEngine sorts households into ten equally-populated groups according to their baseline{' '}
      {countryId === 'uk' ? 'equivalised' : 'equivalized'} household net income.
    </Text>
  );

  return (
    <ChartContainer title={getChartTitle()} onDownloadCsv={handleDownloadCsv}>
      <Stack gap={spacing.sm}>
        <Stack gap={0}>
          {/* All households - small chart */}
          <ResponsiveContainer width="100%" height={60}>
            <BarChart
              layout="vertical"
              data={allData}
              stackOffset="expand"
              margin={{ top: 5, right: 20, bottom: 0, left: 40 }}
            >
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" tick={RECHARTS_FONT_STYLE} width={40} />
              <Tooltip
                content={<WinnersLosersTooltip />}
                allowEscapeViewBox={{ x: true, y: true }}
                offset={20}
                wrapperStyle={{ zIndex: 1000 }}
              />
              {CATEGORIES.map((cat) => (
                <Bar key={cat} dataKey={cat} stackId="a" fill={COLOR_MAP[cat]} />
              ))}
            </BarChart>
          </ResponsiveContainer>

          {/* Decile breakdown */}
          <ResponsiveContainer width="100%" height={chartHeight - 80}>
            <BarChart
              layout="vertical"
              data={decileData}
              stackOffset="expand"
              margin={{ top: 0, right: 20, bottom: 40, left: 40 }}
            >
              <XAxis
                type="number"
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                tick={RECHARTS_FONT_STYLE}
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
                wrapperStyle={{ zIndex: 1000 }}
              />
              <Legend
                verticalAlign="top"
                formatter={(value: string) => LEGEND_TEXT_MAP[value] || value}
              />
              {CATEGORIES.map((cat) => (
                <Bar key={cat} dataKey={cat} stackId="a" fill={COLOR_MAP[cat]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Stack>

        {description}
      </Stack>
    </ChartContainer>
  );
}
