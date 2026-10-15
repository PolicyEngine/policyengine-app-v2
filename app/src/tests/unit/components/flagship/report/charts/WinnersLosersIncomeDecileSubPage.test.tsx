import React from 'react';
import { render, screen } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import WinnersLosersIncomeDecileSubPage, {
  WinnersLosersTooltip,
} from '@/components/flagship/report/charts/WinnersLosersIncomeDecileSubPage';
import { REPORT_4332_OUTPUT } from '@/tests/fixtures/components/flagship/report/charts/reportChartMocks';
import { downloadChartAsSvg } from '@/utils/chartUtils';

const PAYLOAD = [{ dataKey: 'Gain less than 5%', value: 0.141, fill: '#319795' }];
/** The card's plot width at desktop, and a chart's height before its box clips it. */
const CHART_WIDTH = 546;
const CHART_HEIGHT = 153;

vi.mock('@/hooks/useCurrentCountry', () => ({ useCurrentCountry: vi.fn(() => 'us') }));

// jsdom has no layout: each chart draws at a fixed size, and its box clips it.
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactElement }) =>
      React.cloneElement(children, { width: CHART_WIDTH, height: CHART_HEIGHT } as any),
  };
});

/** An element's size: its own width and height, clipped by every box around it with a fixed height. */
function layoutRect(this: Element): DOMRect {
  const own = (name: 'width' | 'height') => {
    const attribute = Number.parseFloat(this.getAttribute(name) ?? '');
    const style = Number.parseFloat((this as HTMLElement).style?.[name] ?? '');
    return Number.isFinite(attribute) ? attribute : Number.isFinite(style) ? style : 0;
  };
  let height = own('height');
  for (let box = this.parentElement; box; box = box.parentElement) {
    if (/^\d+(\.\d+)?px$/.test(box.style.height)) {
      height = Math.min(height, Number.parseFloat(box.style.height));
    }
  }
  const width = own('width');
  return { x: 0, y: 0, left: 0, top: 0, right: width, bottom: height, width, height } as DOMRect;
}

/** The SVG file the card's download makes from the rendered chart. */
async function exportedSvg(container: HTMLElement): Promise<Document> {
  let blob: Blob | undefined;
  // jsdom has no object URLs: the file is caught as it is handed over.
  Object.assign(URL, {
    createObjectURL: (value: Blob) => {
      blob = value;
      return 'blob:chart';
    },
    revokeObjectURL: () => undefined,
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  downloadChartAsSvg(container, { title: 'Winners and losers', filename: 'winners.svg' });
  expect(blob).toBeDefined();
  const text = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsText(blob!);
  });
  return new DOMParser().parseFromString(text, 'image/svg+xml');
}

describe('WinnersLosersTooltip', () => {
  test('given the All row then it names everyone the shares count: people', () => {
    render(<WinnersLosersTooltip active payload={PAYLOAD} label="All" />);

    expect(screen.getByText('All people')).toBeInTheDocument();
    expect(screen.queryByText('All households')).not.toBeInTheDocument();
  });

  test('given a decile row then it names the decile', () => {
    render(<WinnersLosersTooltip active payload={PAYLOAD} label="3" />);

    expect(screen.getByText('Decile 3')).toBeInTheDocument();
  });
});

describe('WinnersLosersIncomeDecileSubPage download', () => {
  beforeEach(() => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(layoutRect);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('given the compact card then the SVG keeps the All row and the legend', async () => {
    // Given: the card's compact chart, its All row 28px tall.
    const { container } = render(
      <WinnersLosersIncomeDecileSubPage output={REPORT_4332_OUTPUT} compact fillHeight />
    );

    // When
    const svg = await exportedSvg(container);

    // Then
    const texts = Array.from(svg.querySelectorAll('text')).map((text) => text.textContent);
    expect(texts).toContain('All');
    expect(texts).toEqual(
      expect.arrayContaining([
        'Gain more than 5%',
        'Gain less than 5%',
        'No change',
        'Loss less than 5%',
        'Loss more than 5%',
      ])
    );
  });
});
