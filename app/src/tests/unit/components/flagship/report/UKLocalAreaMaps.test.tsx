import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import { normalizeSocietyWideOutput } from '@/adapters/societyWideOutputNormalizer';
import UKLocalAreaMaps from '@/components/flagship/report/UKLocalAreaMaps';
import { LIST_SHAPE_UK_RESULT } from '@/tests/fixtures/adapters/societyWideOutputNormalizerMocks';
import { MOCK_UK_REPORT_OUTPUT_WITH_LA } from '@/tests/fixtures/pages/local-authority/localAuthorityComponentMocks';

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
});
