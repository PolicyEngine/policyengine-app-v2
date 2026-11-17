import { renderWithCountry, screen, userEvent } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useAppLocation } from '@/contexts/LocationContext';
import { clearDraftReform, getDraftReform } from '@/libs/draftReform';
import { setExploreEnabled } from '@/libs/featureFlags';
import ExplorePage from '@/pages/flagship/Explore.page';
import { BASELINE_FIXTURE } from '@/tests/fixtures/libs/flagship/explore/baselineFixtures';

const ready = <T,>(data: T) => ({ data, error: null, refetch: vi.fn() });

vi.mock('@/hooks/useExploreData', () => ({
  useExploreData: () => ({
    baseline: ready(BASELINE_FIXTURE),
    states: ready([]),
    districts: ready([]),
  }),
}));

// The map draws SVG shapes; its stand-in offers the same choices as buttons.
vi.mock('@/components/flagship/explore/ExploreMap', () => ({
  default: ({ onSelect }: { onSelect: (region: string) => void }) => (
    <div>
      <button type="button" onClick={() => onSelect('state/oh')}>
        Map: Ohio
      </button>
      <button type="button" onClick={() => onSelect('congressional_district/OH-09')}>
        Map: OH-09
      </button>
    </div>
  ),
}));

function Where() {
  const { pathname, search } = useAppLocation();
  return <output aria-label="Location">{`${pathname}${search}`}</output>;
}

function renderPage(path = '/us/explore') {
  return renderWithCountry(
    <>
      <ExplorePage />
      <Where />
    </>,
    'us',
    path
  );
}

describe('ExplorePage', () => {
  beforeEach(() => {
    setExploreEnabled(true);
  });

  afterEach(() => {
    setExploreEnabled(false);
    clearDraftReform();
  });

  test('given the nation then the card shows the US rate, the Census rate and the preview note', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Where things stand across the United States' })
    ).toBeInTheDocument();
    expect(screen.getByText('12.9%')).toBeInTheDocument();
    expect(screen.getByText(/Census Bureau, 2024: 12.9%/)).toBeInTheDocument();
    expect(screen.getByText(/placeholders, not model output/)).toBeInTheDocument();
  });

  test('given a state picked on the map then the link and the heading name it', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Map: Ohio' }));

    expect(screen.getByRole('heading', { name: 'Where things stand in Ohio' })).toBeInTheDocument();
    expect(screen.getByLabelText('Location')).toHaveTextContent('/us/explore?region=state/oh');
    expect(screen.getByText('United States: 12.9%')).toBeInTheDocument();
  });

  test('given a district then the card says its values have a wide margin', async () => {
    renderPage('/us/explore?region=congressional_district/OH-09');

    expect(await screen.findByText(/fewer survey households/)).toBeInTheDocument();
  });

  test('given another measure then the pills and the link follow it', async () => {
    const user = userEvent.setup();
    renderPage('/us/explore?region=state/oh');

    await user.click(await screen.findByRole('radio', { name: 'Child poverty' }));

    expect(screen.getByRole('radio', { name: 'Child poverty' })).toBeChecked();
    expect(screen.getByLabelText('Location')).toHaveTextContent(
      '/us/explore?metric=child_poverty&region=state/oh'
    );
    expect(screen.getByText('11.5%')).toBeInTheDocument();
  });

  test('given model a change then Build opens with the place in the draft', async () => {
    const user = userEvent.setup();
    renderPage('/us/explore?region=state/oh');

    await user.click(await screen.findByRole('button', { name: /Model a policy change for Ohio/ }));

    expect(screen.getByLabelText('Location')).toHaveTextContent('/us/build');
    expect(getDraftReform()?.population).toEqual({ scope: 'national', region: 'state/oh' });
  });

  test('given a program then Build opens searching for it', async () => {
    const user = userEvent.setup();
    renderPage('/us/explore?region=congressional_district/OH-09');

    await user.click(await screen.findByRole('button', { name: 'SNAP' }));

    expect(screen.getByLabelText('Location')).toHaveTextContent('/us/build?q=SNAP');
    expect(getDraftReform()?.population.region).toBe('congressional_district/OH-09');
  });

  test('given the flag off then the page sends the user to Build', async () => {
    setExploreEnabled(false);
    renderPage();

    expect(await screen.findByLabelText('Location')).toHaveTextContent('/us/build');
    expect(screen.queryByRole('heading', { name: /Where things stand/ })).not.toBeInTheDocument();
  });
});
