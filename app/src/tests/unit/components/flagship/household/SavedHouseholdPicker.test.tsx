import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, within } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import SavedHouseholdPicker from '@/components/flagship/household/SavedHouseholdPicker';
import {
  FAMILY_HOUSEHOLD,
  FAMILY_LABEL,
  RETIRED_HOUSEHOLD,
  RETIRED_LABEL,
  routeRequests,
  SAVED_HOUSEHOLD_IDS,
  userHouseholdItem,
  V1_ONLY_LABEL,
  V2_HOUSEHOLD_IDS,
  v2HouseholdItem,
} from '@/tests/fixtures/api/savedHouseholdMocks';
import {
  createTestApiContext,
  errorResponse,
  itemResponse,
  pageResponse,
} from '@/tests/fixtures/api/v2UserMocks';

const mockSavedWork = vi.fn();
vi.mock('@/hooks/useFlagshipStores', () => ({
  useV3SavedWork: () => mockSavedWork(),
}));

function renderPicker(props: Partial<React.ComponentProps<typeof SavedHouseholdPicker>> = {}) {
  const onSelect = vi.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <SavedHouseholdPicker countryId="us" onSelect={onSelect} {...props} />
    </QueryClientProvider>
  );
  return { onSelect };
}

const retiredRow = userHouseholdItem({
  id: SAVED_HOUSEHOLD_IDS.RETIRED,
  household_id: V2_HOUSEHOLD_IDS.RETIRED,
  name: RETIRED_LABEL,
});

/** A session whose account lists these saved rows, and holds the family and the retired couple. */
function signedInWith(rows: unknown[]) {
  const { fetchMock, context } = createTestApiContext('us');
  mockSavedWork.mockReturnValue({ account: context, scope: 'account:test' });
  routeRequests(fetchMock, {
    'GET /v2/user-households': () => pageResponse(rows),
    [`GET /v2/households/${V2_HOUSEHOLD_IDS.FAMILY}`]: () =>
      itemResponse(v2HouseholdItem(FAMILY_HOUSEHOLD, V2_HOUSEHOLD_IDS.FAMILY)),
    [`GET /v2/households/${V2_HOUSEHOLD_IDS.RETIRED}`]: () =>
      itemResponse(v2HouseholdItem(RETIRED_HOUSEHOLD, V2_HOUSEHOLD_IDS.RETIRED)),
  });
}

describe('SavedHouseholdPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given saved households then each is offered by its label, with who it describes', async () => {
    signedInWith([userHouseholdItem(), retiredRow]);
    renderPicker();

    const list = await screen.findByRole('list', { name: 'Saved households' });
    expect(within(list).getByRole('button', { name: new RegExp(FAMILY_LABEL) })).toHaveTextContent(
      'Married · 2 children'
    );
    expect(within(list).getByRole('button', { name: new RegExp(RETIRED_LABEL) })).toHaveTextContent(
      'Married · no children'
    );
  });

  test('given a choice then the saved household is handed on with its household', async () => {
    const user = userEvent.setup();
    signedInWith([userHouseholdItem()]);
    const { onSelect } = renderPicker();

    await user.click(await screen.findByRole('button', { name: new RegExp(FAMILY_LABEL) }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0]).toMatchObject({
      id: SAVED_HOUSEHOLD_IDS.FAMILY,
      label: FAMILY_LABEL,
      householdId: V2_HOUSEHOLD_IDS.FAMILY,
    });
    expect(onSelect.mock.calls[0][0].household.toV1CreationPayload().data.people).toEqual(
      FAMILY_HOUSEHOLD.toV1CreationPayload().data.people
    );
  });

  test('given the saved household the builder holds then it is marked as chosen', async () => {
    signedInWith([userHouseholdItem(), retiredRow]);
    renderPicker({ selectedId: SAVED_HOUSEHOLD_IDS.RETIRED });

    expect(await screen.findByRole('button', { name: new RegExp(RETIRED_LABEL) })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: new RegExp(FAMILY_LABEL) })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  test('given the picker disabled then no saved household can be chosen', async () => {
    signedInWith([userHouseholdItem(), retiredRow]);
    renderPicker({ disabled: true });

    expect(await screen.findByRole('button', { name: new RegExp(FAMILY_LABEL) })).toBeDisabled();
    expect(screen.getByRole('button', { name: new RegExp(RETIRED_LABEL) })).toBeDisabled();
  });

  test('given a saved household that cannot open then it is listed, but cannot be chosen', async () => {
    signedInWith([
      userHouseholdItem({
        id: SAVED_HOUSEHOLD_IDS.V1_ONLY,
        household_id: null,
        legacy_household_id: 123,
        name: V1_ONLY_LABEL,
      }),
    ]);
    renderPicker();

    const option = await screen.findByRole('button', { name: new RegExp(V1_ONLY_LABEL) });
    expect(option).toBeDisabled();
    expect(option).toHaveTextContent('Cannot be opened here');
  });

  test('given a saved household without a label then it is offered as an untitled household', async () => {
    signedInWith([userHouseholdItem({ name: null })]);
    renderPicker();

    expect(await screen.findByRole('button', { name: /Untitled household/ })).toBeInTheDocument();
  });

  test('given none saved then it says so', async () => {
    signedInWith([]);
    renderPicker();

    expect(await screen.findByText('No saved households yet.')).toBeInTheDocument();
  });

  test('given the list fails to load then it says why', async () => {
    const { fetchMock, context } = createTestApiContext('us');
    mockSavedWork.mockReturnValue({ account: context, scope: 'account:test' });
    routeRequests(fetchMock, {
      'GET /v2/user-households': () => errorResponse(503, 'Saved work is temporarily unavailable.'),
    });
    renderPicker();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Your households could not be loaded. Saved work is temporarily unavailable.'
    );
  });

  test('given no accounts then it says saved households are not available', () => {
    mockSavedWork.mockReturnValue({ account: null, scope: 'browser' });
    renderPicker();

    expect(screen.getByText('Saved households are not available here.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
