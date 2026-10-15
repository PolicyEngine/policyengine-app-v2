import React from 'react';
import { render, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import DeepPovertyImpactByAgeSubPage from '@/components/flagship/report/charts/DeepPovertyImpactByAgeSubPage';
import DistributionalImpactIncomeRelativeSubPage from '@/components/flagship/report/charts/DistributionalImpactIncomeRelativeSubPage';
import InequalityImpactSubPage from '@/components/flagship/report/charts/InequalityImpactSubPage';
import PovertyImpactByAgeSubPage from '@/components/flagship/report/charts/PovertyImpactByAgeSubPage';
import PovertyImpactByRaceSubPage from '@/components/flagship/report/charts/PovertyImpactByRaceSubPage';
import {
  NO_SENIORS_IN_DEEP_POVERTY,
  REPORT_4332_OUTPUT,
  withDeepPovertyByAge,
  withInequalityChanges,
  withPovertyByAgeChanges,
  withRacePoverty,
} from '@/tests/fixtures/components/flagship/report/charts/reportChartMocks';

const size = vi.hoisted(() => ({ width: 700, height: 260 }));

vi.mock('@/hooks/useCurrentCountry', () => ({ useCurrentCountry: vi.fn(() => 'us') }));

// jsdom has no layout, so the container hands the chart a fixed size; bars
// draw at once, since Recharts shows bar labels only once bars stop growing.
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    Bar: (props: React.ComponentProps<typeof actual.Bar>) => (
      <actual.Bar {...props} isAnimationActive={false} />
    ),
    ResponsiveContainer: ({ children }: { children: React.ReactElement }) => (
      <div style={{ width: size.width, height: size.height }}>
        {React.cloneElement(children, { width: size.width, height: size.height } as any)}
      </div>
    ),
  };
});

/** Labels show once the chart has measured its plot. */
const LABELS_SHOWN = { timeout: 3000 };
/** A label's text reaches about this share of its font size above its baseline. */
const CAP_HEIGHT_SHARE = 0.75;

interface ValueLabel {
  text: string;
  x: number;
  y: number;
  fontSize: number;
}

const valueLabels = (container: HTMLElement): ValueLabel[] =>
  Array.from(container.querySelectorAll('.recharts-label-list text')).map((label) => ({
    text: label.textContent ?? '',
    x: Number(label.getAttribute('x')),
    y: Number(label.getAttribute('y')),
    fontSize: Number(label.getAttribute('font-size')),
  }));

/** The plot's top and bottom edges, from the value axis's line. */
function plotEdges(container: HTMLElement) {
  const axis = container.querySelector('.recharts-cartesian-axis-line[orientation="left"]');
  return { top: Number(axis?.getAttribute('y1')), bottom: Number(axis?.getAttribute('y2')) };
}

function expectLabelsInsidePlot(container: HTMLElement) {
  const { top, bottom } = plotEdges(container);
  const labels = valueLabels(container);
  expect(labels.length).toBeGreaterThan(0);
  for (const label of labels) {
    expect(label.y - label.fontSize * CAP_HEIGHT_SHARE).toBeGreaterThanOrEqual(top - 0.5);
    // Room for the baseline's descenders above the x-axis and its category labels.
    expect(label.y + 3).toBeLessThanOrEqual(bottom);
  }
}

describe('report bar charts', () => {
  beforeEach(() => {
    size.width = 700;
    size.height = 260;
  });

  test('given report 4332 inequality then the lowest bar label sits above the x-axis', async () => {
    const { container } = render(
      <InequalityImpactSubPage output={REPORT_4332_OUTPUT} compact trimAxisZeros fillHeight />
    );

    const label = await screen.findByText('-0.0013%', undefined, LABELS_SHOWN);

    expect(Number(label.getAttribute('y')) + 3).toBeLessThanOrEqual(plotEdges(container).bottom);
    expectLabelsInsidePlot(container);
  });

  test('given mixed inequality changes then labels sit above rises and below falls, inside the plot', async () => {
    const output = withInequalityChanges(REPORT_4332_OUTPUT, {
      gini: 0.021,
      top10: -0.034,
      top1: 0.002,
    });

    const { container } = render(
      <InequalityImpactSubPage output={output} compact trimAxisZeros fillHeight />
    );

    await screen.findByText('-3.4%', undefined, LABELS_SHOWN);
    const labels = valueLabels(container);
    const rise = labels.find((label) => label.text === '+2.1%');
    const fall = labels.find((label) => label.text === '-3.4%');
    expect(rise && fall && rise.y < fall.y).toBe(true);
    expectLabelsInsidePlot(container);
  });

  test('given report 4332 poverty by age then every label sits below its bar, inside the plot', async () => {
    size.width = 340;
    size.height = 170;

    const { container } = render(
      <PovertyImpactByAgeSubPage output={REPORT_4332_OUTPUT} compact fillHeight />
    );

    await screen.findByText('-0.5%', undefined, LABELS_SHOWN);
    expect(valueLabels(container).map((label) => label.text)).toEqual([
      '-0.5%',
      '-0.2%',
      '0.0%',
      '-0.2%',
    ]);
    expectLabelsInsidePlot(container);
  });

  test('given large mixed poverty changes then every label still fits inside the plot', async () => {
    size.width = 340;
    size.height = 170;
    const output = withPovertyByAgeChanges(REPORT_4332_OUTPUT, {
      child: -0.31,
      adult: 0.04,
      senior: 0.12,
      all: -0.08,
    });

    const { container } = render(<PovertyImpactByAgeSubPage output={output} compact fillHeight />);

    await screen.findByText('-31.0%', undefined, LABELS_SHOWN);
    expectLabelsInsidePlot(container);
  });

  test('given report 4332 poverty by race then quarter-step ticks are not rounded away', async () => {
    size.width = 340;
    size.height = 170;

    const { container } = render(
      <PovertyImpactByRaceSubPage output={REPORT_4332_OUTPUT} compact fillHeight />
    );

    await screen.findByText('-0.8%', undefined, LABELS_SHOWN);
    const ticks = Array.from(
      container.querySelectorAll('.recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value')
    ).map((tick) => tick.textContent);
    expect(ticks).toContain('-0.25%');
    expectLabelsInsidePlot(container);
  });

  test('given a group with no baseline rate then it reads n/a and every other bar keeps its label', async () => {
    // Given: no seniors in deep poverty, before or after, as in report 4302.
    const output = withDeepPovertyByAge(REPORT_4332_OUTPUT, NO_SENIORS_IN_DEEP_POVERTY);

    // When
    const { container } = render(
      <DeepPovertyImpactByAgeSubPage output={output} compact fillHeight />
    );

    // Then: one label a bar, in order, with All's own value on All.
    await screen.findByText('-3.3%', undefined, LABELS_SHOWN);
    const labels = valueLabels(container);
    expect(labels.map((label) => label.text)).toEqual(['-5.0%', '-3.3%', 'n/a', '-4.0%']);
    expect(labels.map((label) => label.x)).toEqual(
      [...labels.map((label) => label.x)].sort((a, b) => a - b)
    );
    const ticks = Array.from(
      container.querySelectorAll('.recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value')
    );
    const allTick = ticks.find((tick) => tick.textContent === 'All');
    expect(Number(allTick?.getAttribute('x'))).toBeCloseTo(labels[3].x, 0);
  });

  test('given a race with no baseline poverty that the reform raises then its bar reads n/a', async () => {
    // Given: no one of another race in poverty before the reform, some after.
    size.width = 340;
    size.height = 170;
    const output = withRacePoverty(REPORT_4332_OUTPUT, 'other', { baseline: 0, reform: 0.01 });

    // When
    const { container } = render(<PovertyImpactByRaceSubPage output={output} compact fillHeight />);

    // Then
    await screen.findByText('-0.8%', undefined, LABELS_SHOWN);
    const texts = valueLabels(container).map((label) => label.text);
    expect(texts).toHaveLength(5);
    expect(texts[1]).toBe('n/a');
    expect(texts.join(' ')).not.toMatch(/NaN|∞/);
  });

  test('given a short chart then the value axis title shortens to fit the plot', () => {
    size.width = 340;
    size.height = 150;

    render(<DeepPovertyImpactByAgeSubPage output={REPORT_4332_OUTPUT} compact fillHeight />);

    expect(screen.getByText('Change (%)')).toBeInTheDocument();
    expect(screen.queryByText('Deep poverty change (%)')).not.toBeInTheDocument();
  });

  test('given ten decile labels in a narrow chart then no two labels overlap', () => {
    size.width = 340;
    size.height = 190;

    const { container } = render(
      <DistributionalImpactIncomeRelativeSubPage output={REPORT_4332_OUTPUT} compact fillHeight />
    );

    const labels = valueLabels(container);
    expect(labels.length).toBeGreaterThan(0);
    // Each label's estimated box: 0.6em per character, one font size tall.
    const boxes = labels.map((label) => {
      const halfWidth = (label.text.length * label.fontSize * 0.6) / 2;
      return {
        left: label.x - halfWidth,
        right: label.x + halfWidth,
        top: label.y - label.fontSize,
        bottom: label.y,
      };
    });
    boxes.forEach((a, i) =>
      boxes.slice(i + 1).forEach((b) => {
        const apart =
          a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top;
        expect(apart).toBe(true);
      })
    );
    expectLabelsInsidePlot(container);
  });
});
