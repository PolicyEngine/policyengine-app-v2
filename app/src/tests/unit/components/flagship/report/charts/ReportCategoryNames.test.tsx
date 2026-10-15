import React from 'react';
import { render, screen } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import BudgetaryImpactSubPage from '@/components/flagship/report/charts/BudgetaryImpactSubPage';
import InequalityImpactSubPage from '@/components/flagship/report/charts/InequalityImpactSubPage';
import PovertyImpactByAgeSubPage from '@/components/flagship/report/charts/PovertyImpactByAgeSubPage';
import PovertyImpactByGenderSubPage from '@/components/flagship/report/charts/PovertyImpactByGenderSubPage';
import PovertyImpactByRaceSubPage from '@/components/flagship/report/charts/PovertyImpactByRaceSubPage';
import {
  REPORT_4332_BUDGET_LABELS,
  REPORT_4332_OUTPUT,
} from '@/tests/fixtures/components/flagship/report/charts/reportChartMocks';

/** A chart card's plot box on a 375px phone, and on a desktop. */
const PHONE_CARD = { width: 300, height: 220 };
const DESKTOP_CARD = { width: 700, height: 260 };
/** The estimated width of a character, as a share of its font size. */
const CHARACTER_WIDTH_SHARE = 0.6;

const size = vi.hoisted(() => ({ width: 300, height: 220 }));
const phone = vi.hoisted(() => ({ matches: true }));

vi.mock('@/hooks/useCurrentCountry', () => ({ useCurrentCountry: vi.fn(() => 'us') }));
vi.mock('@/hooks/useMediaQuery', () => ({ useMediaQuery: vi.fn(() => phone.matches) }));

// jsdom has no layout, so the container hands the chart a fixed size.
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

/** A text's estimated width at a font size, px. */
const textWidth = (text: string, fontSize: number) =>
  text.length * fontSize * CHARACTER_WIDTH_SHARE;

interface CategoryName {
  lines: string[];
  fontSize: number;
}

/** The names under the bars, each as its lines, and the plot's width. */
function categoryNames(container: HTMLElement): { plotWidth: number; names: CategoryName[] } {
  const axis = container.querySelector('.recharts-cartesian-axis-line[orientation="bottom"]');
  const plotWidth = Number(axis?.getAttribute('x2')) - Number(axis?.getAttribute('x1'));
  const ticks = Array.from(
    container.querySelectorAll('.recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value')
  );
  return {
    plotWidth,
    names: ticks.map((tick) => {
      const spans = Array.from(tick.querySelectorAll('tspan'));
      return {
        lines: (spans.length > 0 ? spans : [tick]).map((span) => span.textContent ?? ''),
        fontSize: Number(tick.getAttribute('font-size')) || 12,
      };
    }),
  };
}

/** Every bar has its name, and every line of it fits the bar's share of the plot. */
function expectEveryBarNamed(container: HTMLElement, expected: string[]) {
  const { plotWidth, names } = categoryNames(container);
  expect(names.map((name) => name.lines.join(' '))).toEqual(expected);
  const band = plotWidth / expected.length;
  for (const name of names) {
    for (const line of name.lines) {
      expect(textWidth(line, name.fontSize)).toBeLessThanOrEqual(band);
    }
  }
}

describe('report chart category names', () => {
  beforeEach(() => {
    size.width = PHONE_CARD.width;
    size.height = PHONE_CARD.height;
    phone.matches = true;
    // Recharts measures a name in a hidden span to drop names that would
    // touch; jsdom gives the span no size, so it gets the text's estimate.
    const original = HTMLElement.prototype.getBoundingClientRect;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement
    ) {
      if (this.id !== 'recharts_measurement_span') {
        return original.call(this);
      }
      const fontSize = Number.parseFloat(this.style.fontSize) || 12;
      const width = textWidth(this.textContent ?? '', fontSize);
      return {
        x: 0,
        y: 0,
        left: 0,
        top: 0,
        right: width,
        bottom: fontSize,
        width,
        height: fontSize,
      } as DOMRect;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('given a phone then the budget waterfall names its state and local bar', () => {
    // When
    const { container } = render(<BudgetaryImpactSubPage output={REPORT_4332_OUTPUT} fillHeight />);

    // Then
    expect(screen.getByText(REPORT_4332_BUDGET_LABELS[1])).toBeInTheDocument();
    expectEveryBarNamed(container, ['Federal taxes', 'State taxes', 'Net']);
  });

  test('given a phone then the inequality chart names all three measures', () => {
    // When
    const { container } = render(
      <InequalityImpactSubPage output={REPORT_4332_OUTPUT} compact trimAxisZeros fillHeight />
    );

    // Then
    expectEveryBarNamed(container, ['Gini index', 'Top 10%', 'Top 1%']);
  });

  test('given a phone then the poverty by race chart names every race', () => {
    // When
    const { container } = render(
      <PovertyImpactByRaceSubPage output={REPORT_4332_OUTPUT} compact fillHeight />
    );

    // Then
    expectEveryBarNamed(container, ['Black', 'Other', 'White', 'Hispanic', 'All']);
  });

  test('given a phone then the poverty by gender chart names every group', () => {
    // When
    const { container } = render(
      <PovertyImpactByGenderSubPage output={REPORT_4332_OUTPUT} compact fillHeight />
    );

    // Then
    expectEveryBarNamed(container, ['Male', 'Female', 'All']);
  });

  test('given the full poverty by age chart on a phone then every age group is named', () => {
    // When: the expanded chart, which is not compact.
    const { container } = render(
      <PovertyImpactByAgeSubPage output={REPORT_4332_OUTPUT} fillHeight />
    );

    // Then
    expectEveryBarNamed(container, ['Children', 'Adults', 'Seniors', 'All']);
  });

  test('given a desktop then the names show in full', () => {
    // Given
    size.width = DESKTOP_CARD.width;
    size.height = DESKTOP_CARD.height;
    phone.matches = false;

    // When
    const { container } = render(
      <InequalityImpactSubPage output={REPORT_4332_OUTPUT} compact trimAxisZeros fillHeight />
    );

    // Then
    expectEveryBarNamed(container, ['Gini index', 'Top 10% share', 'Top 1% share']);
  });
});
