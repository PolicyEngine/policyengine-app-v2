import React from 'react';
import { render, screen } from '@test-utils';
import { describe, expect, it, vi } from 'vitest';
import { WaterfallChart } from '@/components/charts/WaterfallChart';
import { computeWaterfallData, getWaterfallDomain } from '@/components/charts/waterfallUtils';

// Mock ResponsiveContainer — jsdom has no layout engine so it renders 0-width.
// We need to pass width/height to the child BarChart so it actually renders.
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({
      children,
      height,
    }: {
      children: React.ReactElement;
      height: number;
    }) => (
      <div style={{ width: 500, height: height || 400 }}>
        {React.cloneElement(children, { width: 500, height: height || 400 } as any)}
      </div>
    ),
  };
});

const fmt = (v: number) => `$${v}`;

function makeTestData() {
  const items = [
    { name: 'Revenue', value: 10 },
    { name: 'Costs', value: -3 },
    { name: 'Total', value: 7, isTotal: true },
  ];
  const data = computeWaterfallData(items, fmt);
  const yDomain = getWaterfallDomain(data);
  return { data, yDomain };
}

const positiveFill = '#00897B';
const negativeFill = '#757575';

function fillColor(d: { value: number }) {
  return d.value >= 0 ? positiveFill : negativeFill;
}

describe('WaterfallChart', () => {
  it('renders a Recharts BarChart', () => {
    const { data, yDomain } = makeTestData();

    const { container } = render(
      <WaterfallChart data={data} yDomain={yDomain} height={400} fillColor={fillColor} />
    );

    // Recharts BarChart renders an SVG with class recharts-wrapper or an svg element
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders X-axis labels for each datum', () => {
    const { data, yDomain } = makeTestData();

    render(<WaterfallChart data={data} yDomain={yDomain} height={400} fillColor={fillColor} />);

    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Costs')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('renders a Y-axis label when provided', () => {
    const { data, yDomain } = makeTestData();

    render(
      <WaterfallChart
        data={data}
        yDomain={yDomain}
        height={400}
        fillColor={fillColor}
        yAxisLabel="Impact (bn)"
      />
    );

    expect(screen.getByText('Impact (bn)')).toBeInTheDocument();
  });

  it('renders the PolicyEngine watermark', () => {
    const { data, yDomain } = makeTestData();

    const { container } = render(
      <WaterfallChart data={data} yDomain={yDomain} height={400} fillColor={fillColor} />
    );

    const watermark = container.querySelector('img[src*="policyengine"]');
    expect(watermark).toBeInTheDocument();
  });
});
