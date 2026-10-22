import { render, screen, userEvent, within } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import { normalizeSocietyWideOutput } from '@/adapters/societyWideOutputNormalizer';
import UKLocalAreaMaps, {
  areaNation,
  ukAreaDetailFigures,
} from '@/components/flagship/report/UKLocalAreaMaps';
import { LIST_SHAPE_UK_RESULT } from '@/tests/fixtures/adapters/societyWideOutputNormalizerMocks';
import {
  UK_LOCAL_AREAS_OUTPUT,
  UK_LOCAL_AREAS_OUTPUT_NO_CODES,
  UK_WIDE_REGION,
  WALES_REGION,
} from '@/tests/fixtures/components/flagship/report/ukLocalAreaMapsMocks';
import { NATIONAL_OUTPUT_WITHOUT_AREAS } from '@/tests/fixtures/components/flagship/report/ukLocalAreaSectionMocks';
import { NORMALIZED_BREAKDOWN } from '@/tests/fixtures/hooks/useUKLocalAreaBreakdownMocks';
import {
  MOCK_UK_REPORT_OUTPUT_NO_LA_FIELD,
  MOCK_UK_REPORT_OUTPUT_WITH_LA,
} from '@/tests/fixtures/pages/local-authority/localAuthorityComponentMocks';

function hexagon(container: HTMLElement, name: string): Element {
  return container.querySelector(`[data-area-id="${name}"]`)!;
}

describe('UKLocalAreaMaps', () => {
  test('given a UK report then it opens on the constituency map', () => {
    render(<UKLocalAreaMaps output={MOCK_UK_REPORT_OUTPUT_WITH_LA} />, 'uk');

    expect(screen.getByRole('tab', { name: 'Constituencies', selected: true })).toBeInTheDocument();
    expect(
      screen.getByText('Absolute household income change by constituency')
    ).toBeInTheDocument();
  });

  test('given local authorities chosen then it shows the local authority map', async () => {
    const user = userEvent.setup();
    render(<UKLocalAreaMaps output={MOCK_UK_REPORT_OUTPUT_WITH_LA} />, 'uk');

    await user.click(screen.getByRole('tab', { name: 'Local authorities' }));

    expect(
      screen.getByText('Absolute household income change by local authority')
    ).toBeInTheDocument();
  });

  test('given the map switched then one event names the area, and the open one sends nothing', async () => {
    const user = userEvent.setup();
    const gtag = vi.fn();
    window.gtag = gtag;
    render(<UKLocalAreaMaps output={MOCK_UK_REPORT_OUTPUT_WITH_LA} />, 'uk');

    await user.click(screen.getByRole('tab', { name: 'Constituencies' }));
    await user.click(screen.getByRole('tab', { name: 'Local authorities' }));

    expect(gtag.mock.calls).toEqual([
      ['event', 'local_area_map_toggled', { country_id: 'uk', area: 'local_authorities' }],
    ]);
    delete window.gtag;
  });

  test('given a result in the API list shape then both maps have data', async () => {
    const user = userEvent.setup();
    const output = normalizeSocietyWideOutput({
      ...MOCK_UK_REPORT_OUTPUT_WITH_LA,
      constituency_impact: LIST_SHAPE_UK_RESULT.constituency_impact,
      local_authority_impact: LIST_SHAPE_UK_RESULT.local_authority_impact,
    } as unknown as typeof MOCK_UK_REPORT_OUTPUT_WITH_LA);
    render(<UKLocalAreaMaps output={output} />, 'uk');

    expect(screen.queryByText('No constituency data available')).not.toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Local authorities' }));
    expect(screen.queryByText('No local authority data available')).not.toBeInTheDocument();
  });

  test('given no local authority data then the card says so', async () => {
    const user = userEvent.setup();
    render(<UKLocalAreaMaps output={UK_LOCAL_AREAS_OUTPUT_NO_CODES} />, 'uk');

    await user.click(screen.getByRole('tab', { name: 'Local authorities' }));

    expect(screen.getByText('No local authority data available')).toBeInTheDocument();
  });

  test('given a hexagon clicked then its details show with the nation and pound and percent changes', async () => {
    const user = userEvent.setup();
    const { container } = render(<UKLocalAreaMaps output={UK_LOCAL_AREAS_OUTPUT} />, 'uk');

    await user.click(hexagon(container, 'Clwyd East'));

    const details = screen.getByRole('region', { name: 'Clwyd East details' });
    expect(within(details).getByText('Wales')).toBeInTheDocument();
    expect(within(details).getByText('Average household income change')).toBeInTheDocument();
    expect(within(details).getByText('-£355')).toBeInTheDocument();
    expect(within(details).getByText('Relative household income change')).toBeInTheDocument();
    expect(within(details).getByText('-1.3%')).toBeInTheDocument();
    expect(hexagon(container, 'Clwyd East')).toHaveAttribute('data-selected', 'true');
  });

  test('given the selected hexagon clicked again then its details close', async () => {
    const user = userEvent.setup();
    const { container } = render(<UKLocalAreaMaps output={UK_LOCAL_AREAS_OUTPUT} />, 'uk');

    await user.click(hexagon(container, 'Gower'));
    await user.click(hexagon(container, 'Gower'));

    expect(screen.queryByRole('region', { name: 'Gower details' })).not.toBeInTheDocument();
    expect(container.querySelector('[data-selected]')).not.toBeInTheDocument();
  });

  test('given a ranked area clicked then its details show and its row is pressed', async () => {
    const user = userEvent.setup();
    const { container } = render(<UKLocalAreaMaps output={UK_LOCAL_AREAS_OUTPUT} />, 'uk');

    await user.click(screen.getByRole('button', { name: 'Show details for Gower' }));

    expect(screen.getByRole('region', { name: 'Gower details' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show details for Gower' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(hexagon(container, 'Gower')).toHaveAttribute('data-selected', 'true');
  });

  test('given details open then Escape or the close button clears them', async () => {
    const user = userEvent.setup();
    render(<UKLocalAreaMaps output={UK_LOCAL_AREAS_OUTPUT} />, 'uk');

    await user.click(screen.getByRole('button', { name: 'Show details for Gower' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('region', { name: 'Gower details' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show details for Gower' }));
    await user.click(screen.getByRole('button', { name: 'Close constituency details' }));
    expect(screen.queryByRole('region', { name: 'Gower details' })).not.toBeInTheDocument();
  });

  test('given an area found by name then its details show', async () => {
    const user = userEvent.setup();
    render(<UKLocalAreaMaps output={UK_LOCAL_AREAS_OUTPUT} />, 'uk');

    await user.click(screen.getByRole('button', { name: /find a constituency/i }));
    await user.keyboard('Monmouth');
    await user.keyboard('{Enter}');

    expect(screen.getByRole('region', { name: 'Monmouthshire details' })).toBeInTheDocument();
  });

  test('given the area kind switched then the selection clears', async () => {
    const user = userEvent.setup();
    const { container } = render(<UKLocalAreaMaps output={UK_LOCAL_AREAS_OUTPUT} />, 'uk');

    await user.click(hexagon(container, 'Gower'));
    await user.click(screen.getByRole('tab', { name: 'Local authorities' }));

    expect(screen.queryByRole('region', { name: /details/ })).not.toBeInTheDocument();
    await user.click(hexagon(container, 'Cardiff'));
    expect(screen.getByRole('region', { name: 'Cardiff details' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Close local authority details' })
    ).toBeInTheDocument();
  });

  test('given relative mode then the rankings show percentages', async () => {
    const user = userEvent.setup();
    render(<UKLocalAreaMaps output={UK_LOCAL_AREAS_OUTPUT} />, 'uk');

    await user.click(screen.getByRole('tab', { name: 'Relative' }));

    expect(
      screen.getByText('Relative household income change by constituency')
    ).toBeInTheDocument();
    const gower = screen.getByRole('button', { name: 'Show details for Gower' });
    expect(within(gower).getByText('0.7%')).toBeInTheDocument();
  });

  test('given a Wales report without codes then the details name Wales from the region', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <UKLocalAreaMaps output={UK_LOCAL_AREAS_OUTPUT_NO_CODES} region={WALES_REGION} />,
      'uk'
    );

    await user.click(hexagon(container, 'Gower'));

    const details = screen.getByRole('region', { name: 'Gower details' });
    expect(within(details).getByText('Wales')).toBeInTheDocument();
  });

  test('given the hex map then its logo has padding clear of the frame', () => {
    const { container } = render(<UKLocalAreaMaps output={UK_LOCAL_AREAS_OUTPUT} />, 'uk');

    expect(container.querySelector('img')!.parentElement!.style.padding).toBe('4px 8px');
  });
});

describe('UKLocalAreaMaps map controls and legend', () => {
  function legendTicks(container: HTMLElement): string[] {
    return [...container.querySelectorAll('svg text')].map((text) => text.textContent ?? '');
  }

  test('given absolute mode then the legend reads in pounds', () => {
    const { container } = render(<UKLocalAreaMaps output={UK_LOCAL_AREAS_OUTPUT} />, 'uk');

    const ticks = legendTicks(container);
    expect(ticks).toContain('£0');
    expect(ticks.every((tick) => tick.includes('£'))).toBe(true);
  });

  test('given relative mode then the legend reads in percentages', async () => {
    const user = userEvent.setup();
    const { container } = render(<UKLocalAreaMaps output={UK_LOCAL_AREAS_OUTPUT} />, 'uk');

    await user.click(screen.getByRole('tab', { name: 'Relative' }));

    const ticks = legendTicks(container);
    expect(ticks).toContain('0.0%');
    expect(ticks).toContain('1.3%');
    expect(ticks.every((tick) => tick.endsWith('%'))).toBe(true);
  });

  test('given the map zoomed in then a hexagon click still shows its details', async () => {
    const user = userEvent.setup();
    const { container } = render(<UKLocalAreaMaps output={UK_LOCAL_AREAS_OUTPUT} />, 'uk');

    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    await user.click(hexagon(container, 'Gower'));

    expect(screen.getByRole('region', { name: 'Gower details' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset view' })).toBeInTheDocument();
  });
});

describe('areaNation', () => {
  const area = {
    x: 0,
    y: 0,
    average_household_income_change: 0,
    relative_household_income_change: 0,
  };

  test('given ONS codes then each names its nation', () => {
    expect(areaNation({ ...area, code: 'E14001063' })).toBe('England');
    expect(areaNation({ ...area, code: 'W07000081' })).toBe('Wales');
    expect(areaNation({ ...area, code: 'S14000021' })).toBe('Scotland');
    expect(areaNation({ ...area, code: 'N06000001' })).toBe('Northern Ireland');
  });

  test('given no code then the region names the nation, and a UK-wide region names none', () => {
    expect(areaNation(area, WALES_REGION)).toBe('Wales');
    expect(areaNation(area, UK_WIDE_REGION)).toBeNull();
    expect(areaNation(area)).toBeNull();
  });
});

describe('ukAreaDetailFigures', () => {
  test('given a change that rounds to zero then it reads zero with no minus', () => {
    const figures = ukAreaDetailFigures({
      x: 0,
      y: 0,
      average_household_income_change: -0.4,
      relative_household_income_change: -0,
    });

    expect(figures.map((figure) => figure.value)).toEqual(['£0', '0.0%']);
  });
});

describe('UKLocalAreaMaps disclosure-controlled areas', () => {
  const breakdownOutput = {
    ...NATIONAL_OUTPUT_WITHOUT_AREAS,
    constituency_impact: NORMALIZED_BREAKDOWN.constituency_impact,
    local_authority_impact: NORMALIZED_BREAKDOWN.local_authority_impact,
  } as typeof NATIONAL_OUTPUT_WITHOUT_AREAS;
  const approximateConstituency =
    NORMALIZED_BREAKDOWN.constituency_impact.by_constituency['East Kilbride and Strathaven'];

  test('given withheld areas then each map says how many of its areas were not published', async () => {
    const user = userEvent.setup();
    render(
      <UKLocalAreaMaps
        output={breakdownOutput}
        region={UK_WIDE_REGION}
        withheld={{ constituency: { withheld: 12, total: 650 }, local_authority: null }}
      />,
      'uk'
    );

    expect(screen.getByText(/^12 of 650 constituencies are not shown\./)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Local authorities' }));

    expect(
      screen.getByText(/^Local authorities whose estimates fail the survey data’s disclosure rules/)
    ).toBeInTheDocument();
  });

  test('given every area withheld then the map says so with its count', () => {
    render(
      <UKLocalAreaMaps
        output={
          {
            ...breakdownOutput,
            constituency_impact: { by_constituency: {} },
          } as typeof breakdownOutput
        }
        region={UK_WIDE_REGION}
        withheld={{ constituency: { withheld: 650, total: 650 }, local_authority: null }}
      />,
      'uk'
    );

    expect(screen.getByText(/^650 of 650 constituencies are not shown\./)).toBeInTheDocument();
  });

  test('given an approximate area then the map notes it and its details mark it with its 90% ranges', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <UKLocalAreaMaps output={breakdownOutput} region={UK_WIDE_REGION} />,
      'uk'
    );
    expect(screen.getByText(/^1 constituency is approximate:/)).toBeInTheDocument();

    await user.click(hexagon(container, 'East Kilbride and Strathaven'));

    const details = screen.getByRole('region', { name: 'East Kilbride and Strathaven details' });
    expect(within(details).getByText('Approximate')).toBeInTheDocument();
    expect(within(details).getByText('£40 to £210')).toBeInTheDocument();
  });

  test('given an approximate area then its detail figures add the estimate tier and both 90% ranges', () => {
    const figures = ukAreaDetailFigures(approximateConstituency);

    expect(figures).toEqual([
      { label: 'Average household income change', value: '£120' },
      { label: 'Average household income change, 90% range', value: '£40 to £210' },
      { label: 'Relative household income change', value: '0.40%' },
      { label: 'Relative household income change, 90% range', value: '0.10% to 0.70%' },
      { label: 'Estimate', value: 'Approximate' },
    ]);
  });
});

describe('UKLocalAreaMaps missing levels', () => {
  test('given a level the result does not hold then the map shows the content given for it', async () => {
    const user = userEvent.setup();
    render(
      <UKLocalAreaMaps
        output={MOCK_UK_REPORT_OUTPUT_NO_LA_FIELD as any}
        missingLevelContent={<p>Compute these areas</p>}
      />,
      'uk'
    );
    expect(screen.queryByText('Compute these areas')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Local authorities' }));

    expect(screen.getByText('Compute these areas')).toBeInTheDocument();
    expect(screen.queryByText('No local authority data available')).not.toBeInTheDocument();
  });

  test('given a level computed with no areas left then it says there is no data, not the content for a missing level', async () => {
    const user = userEvent.setup();
    render(
      <UKLocalAreaMaps
        output={{
          ...MOCK_UK_REPORT_OUTPUT_WITH_LA,
          local_authority_impact: { by_local_authority: {} },
        }}
        missingLevelContent={<p>Compute these areas</p>}
      />,
      'uk'
    );

    await user.click(screen.getByRole('tab', { name: 'Local authorities' }));

    expect(screen.getByText('No local authority data available')).toBeInTheDocument();
    expect(screen.queryByText('Compute these areas')).not.toBeInTheDocument();
  });
});
