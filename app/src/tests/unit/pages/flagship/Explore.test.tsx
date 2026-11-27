import { renderWithCountry, screen, userEvent } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useAppLocation } from '@/contexts/LocationContext';
import { clearDraftReform, getDraftReform } from '@/libs/draftReform';
import { setExploreEnabled } from '@/libs/featureFlags';
import ExplorePage from '@/pages/flagship/Explore.page';
import { BASELINE_FIXTURE } from '@/tests/fixtures/libs/flagship/explore/baselineFixtures';

const ready = <T,>(data: T) => ({ data, error: null, refetch: vi.fn() });

vi.mock('@/hooks/useExploreData', () => ({
  useExploreData: () => ({ baseline: ready(BASELINE_FIXTURE), states: ready([]) }),
}));

// The model draws with WebGL; its stand-in offers the same choice as a button.
vi.mock('@/components/flagship/explore/ReliefModel', () => ({
  default: ({ onSelect, flat }: { onSelect: (code: string | null) => void; flat: boolean }) => (
    <button type="button" onClick={() => onSelect('OH')}>
      {flat ? 'Model: flat' : 'Model: Ohio'}
    </button>
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

  test('given the nation then the statement shows the states combined, beside the Census rate', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'United States', level: 1 })
    ).toBeInTheDocument();
    // Ohio 10.6% of 11.8M people and California 15.4% of 39M.
    expect(screen.getByText('14.3%')).toBeInTheDocument();
    expect(screen.getByText(/All states combined/)).toBeInTheDocument();
    expect(screen.getByText(/The Census Bureau measures 12.9%/)).toBeInTheDocument();
    expect(screen.getByText(/placeholders, not model output/)).toBeInTheDocument();
  });

  test('given a state picked on the model then the link, the heading and the rank name it', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Model: Ohio' }));

    expect(screen.getByRole('heading', { name: 'Ohio', level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText('Location')).toHaveTextContent('/us/explore?region=state/oh');
    expect(screen.getByText('10.6%', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText(/2nd highest of 2 states/)).toBeInTheDocument();
  });

  test('given a state picked in the row of states then the page goes to it', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'California: 15.4%' }));

    expect(screen.getByLabelText('Location')).toHaveTextContent('/us/explore?region=state/ca');
  });

  test('given a district link then the page shows its state and says districts are not shown', async () => {
    renderPage('/us/explore?region=congressional_district/OH-09');

    expect(await screen.findByRole('heading', { name: 'Ohio', level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Congressional districts are not shown yet/)).toBeInTheDocument();
  });

  test('given another measure from the menu then the statement and the link follow it', async () => {
    const user = userEvent.setup();
    renderPage('/us/explore?region=state/oh');

    await user.click(await screen.findByRole('button', { name: /Change the measure/ }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Children' }));

    expect(screen.getByRole('button', { name: /Poverty, Children/ })).toBeInTheDocument();
    expect(screen.getByLabelText('Location')).toHaveTextContent(
      '/us/explore?metric=child_poverty&region=state/oh'
    );
    expect(screen.getByText(/of children are in poverty/)).toBeInTheDocument();
  });

  test('given the measure menu then it names the measures not shown yet, with the reason', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /Change the measure/ }));

    expect(await screen.findByText('Not shown yet')).toBeInTheDocument();
    expect(screen.getByText('Poverty: Seniors')).toBeInTheDocument();
    expect(screen.queryByRole('menuitemradio', { name: 'Seniors' })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: /SSI.*US only/ })).toBeInTheDocument();
  });

  test('given a measure with no state values then the model lies flat and the page says why', async () => {
    renderPage('/us/explore?metric=receipt_ssi&region=state/oh');

    expect(
      await screen.findByRole('heading', { name: 'United States', level: 1 })
    ).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Model: flat' })).toBeInTheDocument();
    expect(screen.getByText('No state values for this measure yet')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'States, highest to lowest' })).toBeNull();
  });

  test('given build a reform then Build opens with the place in the draft', async () => {
    const user = userEvent.setup();
    renderPage('/us/explore?region=state/oh');

    await user.click(await screen.findByRole('button', { name: 'Build a reform for Ohio' }));

    expect(screen.getByLabelText('Location')).toHaveTextContent('/us/build');
    expect(getDraftReform()?.population).toEqual({ scope: 'national', region: 'state/oh' });
  });

  test('given a rule that changes the measure then Build opens at that rule, for the place', async () => {
    const user = userEvent.setup();
    renderPage('/us/explore?region=state/oh');

    await user.click(await screen.findByRole('button', { name: /Raise the SNAP maximum benefit/ }));

    expect(screen.getByLabelText('Location')).toHaveTextContent(
      '/us/build?q=snap%20maximum%20allotment'
    );
    expect(getDraftReform()?.population).toEqual({ scope: 'national', region: 'state/oh' });
  });

  test('given a program from the menu then the card shows the reach of each program', async () => {
    const user = userEvent.setup();
    renderPage('/us/explore?region=state/oh');

    await user.click(await screen.findByRole('button', { name: /Change the measure/ }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'SNAP' }));

    expect(screen.getByLabelText('Location')).toHaveTextContent('metric=receipt_snap');
    expect(screen.getByRole('region', { name: 'Reach of each program' })).toBeInTheDocument();
  });

  test('given the flag off then the page sends the user to Build', async () => {
    setExploreEnabled(false);
    renderPage();

    expect(await screen.findByLabelText('Location')).toHaveTextContent('/us/build');
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });
});
