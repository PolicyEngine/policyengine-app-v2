import type { Layout } from 'plotly.js';
import Plot from 'react-plotly.js';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { colors } from '@/designTokens/colors';

const MINI_HEIGHT = 150;

const MINI_LAYOUT_BASE: Partial<Layout> = {
  margin: { t: 5, b: 30, l: 40, r: 5 },
  showlegend: false,
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent',
  xaxis: { fixedrange: true },
  yaxis: { fixedrange: true },
};

const MINI_CONFIG = {
  displayModeBar: false,
  responsive: true,
  staticPlot: true,
};

interface MiniChartProps {
  output: SocietyWideReportOutput;
}

export function MiniBudgetaryChart({ output }: MiniChartProps) {
  const {
    tax_revenue_impact,
    state_tax_revenue_impact,
    benefit_spending_impact,
    budgetary_impact,
  } = output.budget;

  const federalTax = (tax_revenue_impact - state_tax_revenue_impact) / 1e9;
  const stateTax = state_tax_revenue_impact / 1e9;
  const benefits = -benefit_spending_impact / 1e9;
  const net = budgetary_impact / 1e9;

  const labels = ['Fed. taxes', 'State taxes', 'Benefits', 'Net'];
  const values = [federalTax, stateTax, benefits, net];

  return (
    <Plot
      data={[
        {
          x: labels,
          y: values,
          type: 'bar',
          marker: {
            color: values.map((v) => (v >= 0 ? colors.primary[500] : colors.gray[600])),
          },
        },
      ]}
      layout={{
        ...MINI_LAYOUT_BASE,
        yaxis: { ...MINI_LAYOUT_BASE.yaxis, title: { text: 'bn' } },
      }}
      config={MINI_CONFIG}
      style={{ width: '100%', height: MINI_HEIGHT }}
    />
  );
}

export function MiniInequalityChart({ output }: MiniChartProps) {
  const giniChange = output.inequality.gini.reform / output.inequality.gini.baseline - 1;
  const top10Change =
    output.inequality.top_10_pct_share.reform / output.inequality.top_10_pct_share.baseline - 1;
  const top1Change =
    output.inequality.top_1_pct_share.reform / output.inequality.top_1_pct_share.baseline - 1;

  const labels = ['Gini', 'Top 10%', 'Top 1%'];
  const values = [giniChange, top10Change, top1Change];

  return (
    <Plot
      data={[
        {
          x: labels,
          y: values,
          type: 'bar',
          marker: {
            color: values.map((v) => (v < 0 ? colors.primary[500] : colors.gray[600])),
          },
          text: values.map((v) => `${(v * 100).toFixed(1)}%`),
          textposition: 'outside' as const,
        },
      ]}
      layout={{
        ...MINI_LAYOUT_BASE,
        yaxis: { ...MINI_LAYOUT_BASE.yaxis, tickformat: '.1%' },
      }}
      config={MINI_CONFIG}
      style={{ width: '100%', height: MINI_HEIGHT }}
    />
  );
}

export function MiniPovertyChart({
  output,
  variant = 'regular',
}: MiniChartProps & { variant?: 'regular' | 'deep' }) {
  const povertyData = variant === 'deep' ? output.poverty.deep_poverty : output.poverty.poverty;

  const labels = ['Child', 'Adult', 'Senior', 'All'];
  const baseline = [
    povertyData.child.baseline,
    povertyData.adult.baseline,
    povertyData.senior.baseline,
    povertyData.all.baseline,
  ];
  const reform = [
    povertyData.child.reform,
    povertyData.adult.reform,
    povertyData.senior.reform,
    povertyData.all.reform,
  ];

  return (
    <Plot
      data={[
        {
          x: labels,
          y: baseline,
          type: 'bar',
          name: 'Baseline',
          marker: { color: colors.gray[400] },
        },
        {
          x: labels,
          y: reform,
          type: 'bar',
          name: 'Reform',
          marker: { color: colors.primary[500] },
        },
      ]}
      layout={{
        ...MINI_LAYOUT_BASE,
        barmode: 'group',
        yaxis: { ...MINI_LAYOUT_BASE.yaxis, tickformat: '.0%' },
      }}
      config={MINI_CONFIG}
      style={{ width: '100%', height: MINI_HEIGHT }}
    />
  );
}

export function MiniDistributionalChart({ output }: MiniChartProps) {
  const deciles = Object.keys(output.decile.relative).sort((a, b) => Number(a) - Number(b));
  const values = deciles.map((d) => output.decile.relative[d]);

  return (
    <Plot
      data={[
        {
          x: deciles.map((d) => `D${d}`),
          y: values,
          type: 'bar',
          marker: {
            color: values.map((v) => (v >= 0 ? colors.primary[500] : colors.gray[600])),
          },
        },
      ]}
      layout={{
        ...MINI_LAYOUT_BASE,
        yaxis: { ...MINI_LAYOUT_BASE.yaxis, tickformat: '.1%' },
      }}
      config={MINI_CONFIG}
      style={{ width: '100%', height: MINI_HEIGHT }}
    />
  );
}

export function MiniWinnersLosersChart({ output }: MiniChartProps) {
  const data = output.intra_decile.all;
  const winners = data['Gain more than 5%'] + data['Gain less than 5%'];
  const noChange = data['No change'];
  const losers = data['Lose more than 5%'] + data['Lose less than 5%'];

  return (
    <Plot
      data={[
        {
          x: [winners * 100],
          y: [''],
          type: 'bar',
          orientation: 'h',
          name: 'Gain',
          marker: { color: colors.primary[500] },
        },
        {
          x: [noChange * 100],
          y: [''],
          type: 'bar',
          orientation: 'h',
          name: 'No change',
          marker: { color: colors.gray[300] },
        },
        {
          x: [losers * 100],
          y: [''],
          type: 'bar',
          orientation: 'h',
          name: 'Lose',
          marker: { color: colors.gray[600] },
        },
      ]}
      layout={{
        ...MINI_LAYOUT_BASE,
        barmode: 'stack',
        showlegend: true,
        legend: { orientation: 'h', y: -0.3, x: 0.5, xanchor: 'center' },
        xaxis: { ...MINI_LAYOUT_BASE.xaxis, ticksuffix: '%', range: [0, 100] },
        yaxis: { ...MINI_LAYOUT_BASE.yaxis, visible: false },
        margin: { t: 5, b: 50, l: 5, r: 5 },
      }}
      config={MINI_CONFIG}
      style={{ width: '100%', height: MINI_HEIGHT }}
    />
  );
}
