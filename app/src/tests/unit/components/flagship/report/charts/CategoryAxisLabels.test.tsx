import React from 'react';
import { render, waitFor } from '@test-utils';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import BudgetaryImpactSubPage from '@/components/flagship/report/charts/BudgetaryImpactSubPage';
import DeepPovertyImpactByAgeSubPage from '@/components/flagship/report/charts/DeepPovertyImpactByAgeSubPage';
import DeepPovertyImpactByGenderSubPage from '@/components/flagship/report/charts/DeepPovertyImpactByGenderSubPage';
import InequalityImpactSubPage from '@/components/flagship/report/charts/InequalityImpactSubPage';
import PovertyImpactByAgeSubPage from '@/components/flagship/report/charts/PovertyImpactByAgeSubPage';
import PovertyImpactByGenderSubPage from '@/components/flagship/report/charts/PovertyImpactByGenderSubPage';
import PovertyImpactByRaceSubPage from '@/components/flagship/report/charts/PovertyImpactByRaceSubPage';
import {
  PHONE_CHART_SIZE,
  REPORT_4332_OUTPUT,
} from '@/tests/fixtures/components/flagship/report/charts/reportChartMocks';

vi.mock('@/hooks/useCurrentCountry', () => ({ useCurrentCountry: vi.fn(() => 'us') }));

// jsdom has no layout, so the container hands the chart a phone card's size.
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactElement }) => (
      <div style={{ width: PHONE_CHART_SIZE.width, height: PHONE_CHART_SIZE.height }}>
        {React.cloneElement(children, PHONE_CHART_SIZE as any)}
      </div>
    ),
  };
});

/** Recharts measures tick text in this hidden span; jsdom gives it no size. */
const MEASUREMENT_SPAN_ID = 'recharts_measurement_span';
/** About the chart font's width per character at 12px. */
const CHARACTER_WIDTH = 7;

const measure = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect');

beforeAll(() => {
  // Text takes room, as in a browser, so Recharts can find ticks that crowd.
  measure.mockImplementation(function (this: HTMLElement) {
    const width =
      this.id === MEASUREMENT_SPAN_ID ? (this.textContent ?? '').length * CHARACTER_WIDTH : 0;
    const height = this.id === MEASUREMENT_SPAN_ID ? 14 : 0;
    return { width, height, top: 0, left: 0, right: width, bottom: height, x: 0, y: 0 } as DOMRect;
  });
});

afterAll(() => {
  measure.mockRestore();
});

/** Each x-axis label, its wrapped lines joined back with spaces. */
const categoryLabels = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll('.recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value')
  ).map((label) => {
    const lines = Array.from(label.querySelectorAll('tspan')).map((line) => line.textContent);
    return (lines.length > 0 ? lines.join(' ') : (label.textContent ?? '')).trim();
  });

describe('report bar charts at phone width', () => {
  test('given poverty by race then every group has its label', async () => {
    const { container } = render(<PovertyImpactByRaceSubPage output={REPORT_4332_OUTPUT} />);

    await waitFor(() =>
      expect(categoryLabels(container)).toEqual(['Black', 'Other', 'White', 'Hispanic', 'All'])
    );
  });

  test('given inequality then every measure has its label', async () => {
    const { container } = render(<InequalityImpactSubPage output={REPORT_4332_OUTPUT} />);

    await waitFor(() =>
      expect(categoryLabels(container)).toEqual(['Gini index', 'Top 10% share', 'Top 1% share'])
    );
  });

  test('given the budget waterfall then every bar has its label', async () => {
    const { container } = render(<BudgetaryImpactSubPage output={REPORT_4332_OUTPUT} />);

    await waitFor(() =>
      expect(categoryLabels(container)).toEqual([
        'Federal tax revenues',
        'State and local income tax revenues',
        'Net impact',
      ])
    );
  });

  test('given a label wider than its bar then it wraps by word under its own bar', async () => {
    const { container } = render(<BudgetaryImpactSubPage output={REPORT_4332_OUTPUT} />);

    await waitFor(() => {
      const state = Array.from(
        container.querySelectorAll(
          '.recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value'
        )
      ).find((label) => label.textContent?.startsWith('State'));
      expect(state?.querySelectorAll('tspan').length).toBeGreaterThan(1);
    });
  });

  test('given poverty by gender then every group has its label', async () => {
    const { container } = render(<PovertyImpactByGenderSubPage output={REPORT_4332_OUTPUT} />);

    await waitFor(() => expect(categoryLabels(container)).toEqual(['Male', 'Female', 'All']));
  });

  test('given deep poverty by gender then every group has its label', async () => {
    const { container } = render(<DeepPovertyImpactByGenderSubPage output={REPORT_4332_OUTPUT} />);

    await waitFor(() => expect(categoryLabels(container)).toEqual(['Male', 'Female', 'All']));
  });

  test('given poverty by age in the expanded view then every group has its label', async () => {
    const { container } = render(<PovertyImpactByAgeSubPage output={REPORT_4332_OUTPUT} />);

    await waitFor(() =>
      expect(categoryLabels(container)).toEqual([
        'Children',
        'Working-age adults',
        'Seniors',
        'All',
      ])
    );
  });

  test('given deep poverty by age in the expanded view then every group has its label', async () => {
    const { container } = render(<DeepPovertyImpactByAgeSubPage output={REPORT_4332_OUTPUT} />);

    await waitFor(() =>
      expect(categoryLabels(container)).toEqual([
        'Children',
        'Working-age adults',
        'Seniors',
        'All',
      ])
    );
  });

  test('given poverty by age in a card then the short labels still show', async () => {
    const { container } = render(
      <PovertyImpactByAgeSubPage output={REPORT_4332_OUTPUT} compact fillHeight />
    );

    await waitFor(() =>
      expect(categoryLabels(container)).toEqual(['Children', 'Adults', 'Seniors', 'All'])
    );
  });
});
