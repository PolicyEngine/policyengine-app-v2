import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import SaveHouseholdForm from '@/components/flagship/household/SaveHouseholdForm';
import {
  EDITED_FAMILY_HOUSEHOLD,
  FAMILY_HOUSEHOLD,
  FAMILY_HOUSEHOLD_AS_STORED,
  FAMILY_LABEL,
  RETIRED_LABEL,
  routeRequests,
  SAVED_FAMILY,
  SAVED_HOUSEHOLD_IDS,
  userHouseholdItem,
  V2_HOUSEHOLD_IDS,
  v2HouseholdItem,
} from '@/tests/fixtures/api/savedHouseholdMocks';
import {
  createTestApiContext,
  errorResponse,
  itemResponse,
} from '@/tests/fixtures/api/v2UserMocks';

const mockSavedWork = vi.fn();
vi.mock('@/hooks/useFlagshipStores', () => ({
  useV3SavedWork: () => mockSavedWork(),
}));

function signedInSession() {
  const { fetchMock, context } = createTestApiContext('us');
  mockSavedWork.mockReturnValue({ account: context, scope: 'account:test' });
  return fetchMock;
}

function renderForm(props: Partial<React.ComponentProps<typeof SaveHouseholdForm>> = {}) {
  const onSaved = vi.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <SaveHouseholdForm household={FAMILY_HOUSEHOLD} onSaved={onSaved} {...props} />
    </QueryClientProvider>
  );
  return { onSaved };
}

const routedPaths = (requests: { method: string; path: string }[]) =>
  requests.map((request) => `${request.method} ${request.path}`);

describe('SaveHouseholdForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given a label then the household is saved with it', async () => {
    const user = userEvent.setup();
    const requests = routeRequests(signedInSession(), {
      'POST /v2/households': () =>
        itemResponse(v2HouseholdItem(FAMILY_HOUSEHOLD, V2_HOUSEHOLD_IDS.FAMILY), 201),
      'POST /v2/user-households': () => itemResponse(userHouseholdItem(), 201),
    });
    const { onSaved } = renderForm();

    await user.type(screen.getByRole('textbox', { name: 'Household label' }), FAMILY_LABEL);
    await user.click(screen.getByRole('button', { name: 'Save household' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(routedPaths(requests)).toEqual(['POST /v2/households', 'POST /v2/user-households']);
    expect(requests[1].body.name).toBe(FAMILY_LABEL);
    expect(onSaved.mock.calls[0][0]).toMatchObject({ id: SAVED_HOUSEHOLD_IDS.FAMILY });
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
  });

  test('given an edited saved household then the edit is stored and the saved household points at it, keeping its id', async () => {
    const user = userEvent.setup();
    const requests = routeRequests(signedInSession(), {
      'POST /v2/households': () =>
        itemResponse(v2HouseholdItem(EDITED_FAMILY_HOUSEHOLD, V2_HOUSEHOLD_IDS.EDITED_FAMILY), 201),
      [`PATCH /v2/user-households/${SAVED_HOUSEHOLD_IDS.FAMILY}`]: () =>
        itemResponse(userHouseholdItem({ household_id: V2_HOUSEHOLD_IDS.EDITED_FAMILY })),
    });
    const { onSaved } = renderForm({ household: EDITED_FAMILY_HOUSEHOLD, saved: SAVED_FAMILY });

    expect(screen.getByRole('textbox', { name: 'Household label' })).toHaveValue(FAMILY_LABEL);
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(routedPaths(requests)).toEqual([
      'POST /v2/households',
      `PATCH /v2/user-households/${SAVED_HOUSEHOLD_IDS.FAMILY}`,
    ]);
    expect(requests[1].body).toEqual({ household_id: V2_HOUSEHOLD_IDS.EDITED_FAMILY });
    expect(onSaved.mock.calls[0][0]).toMatchObject({
      id: SAVED_HOUSEHOLD_IDS.FAMILY,
      householdId: V2_HOUSEHOLD_IDS.EDITED_FAMILY,
    });
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
  });

  test('given an edited saved household and a new label then one request saves both', async () => {
    const user = userEvent.setup();
    const requests = routeRequests(signedInSession(), {
      'POST /v2/households': () =>
        itemResponse(v2HouseholdItem(EDITED_FAMILY_HOUSEHOLD, V2_HOUSEHOLD_IDS.EDITED_FAMILY), 201),
      [`PATCH /v2/user-households/${SAVED_HOUSEHOLD_IDS.FAMILY}`]: () =>
        itemResponse(
          userHouseholdItem({ household_id: V2_HOUSEHOLD_IDS.EDITED_FAMILY, name: RETIRED_LABEL })
        ),
    });
    const { onSaved } = renderForm({ household: EDITED_FAMILY_HOUSEHOLD, saved: SAVED_FAMILY });

    const label = screen.getByRole('textbox', { name: 'Household label' });
    await user.clear(label);
    await user.type(label, RETIRED_LABEL);
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(requests[1].body).toEqual({
      household_id: V2_HOUSEHOLD_IDS.EDITED_FAMILY,
      name: RETIRED_LABEL,
    });
    expect(onSaved.mock.calls[0][0]).toMatchObject({ label: RETIRED_LABEL });
  });

  test('given the saved household cannot be pointed at the edit then it says the changes were not saved', async () => {
    const user = userEvent.setup();
    routeRequests(signedInSession(), {
      'POST /v2/households': () =>
        itemResponse(v2HouseholdItem(EDITED_FAMILY_HOUSEHOLD, V2_HOUSEHOLD_IDS.EDITED_FAMILY), 201),
      [`PATCH /v2/user-households/${SAVED_HOUSEHOLD_IDS.FAMILY}`]: () =>
        errorResponse(503, 'Saved work is temporarily unavailable.'),
    });
    const { onSaved } = renderForm({ household: EDITED_FAMILY_HOUSEHOLD, saved: SAVED_FAMILY });

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Your changes were not saved: Saved work is temporarily unavailable.'
    );
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('given only a new label for a saved household then only its name changes', async () => {
    const user = userEvent.setup();
    const requests = routeRequests(signedInSession(), {
      [`PATCH /v2/user-households/${SAVED_HOUSEHOLD_IDS.FAMILY}`]: () =>
        itemResponse(userHouseholdItem({ name: RETIRED_LABEL })),
    });
    const { onSaved } = renderForm({ household: SAVED_FAMILY.household, saved: SAVED_FAMILY });

    const label = screen.getByRole('textbox', { name: 'Household label' });
    await user.clear(label);
    await user.type(label, RETIRED_LABEL);
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(routedPaths(requests)).toEqual([
      `PATCH /v2/user-households/${SAVED_HOUSEHOLD_IDS.FAMILY}`,
    ]);
    expect(onSaved.mock.calls[0][0]).toMatchObject({
      id: SAVED_HOUSEHOLD_IDS.FAMILY,
      label: RETIRED_LABEL,
    });
  });

  test('given a saved household unchanged then there is nothing to save', () => {
    signedInSession();
    renderForm({ household: SAVED_FAMILY.household, saved: SAVED_FAMILY });

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  test('given the builder household and the same household as stored then there is nothing to save', () => {
    signedInSession();
    renderForm({
      household: FAMILY_HOUSEHOLD,
      saved: { ...SAVED_FAMILY, household: FAMILY_HOUSEHOLD_AS_STORED },
    });

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  test('given a failed save then it says why, and nothing is reported saved', async () => {
    const user = userEvent.setup();
    routeRequests(signedInSession(), {
      'POST /v2/households': () => errorResponse(503, 'V2 household persistence is unavailable'),
    });
    const { onSaved } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Save household' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'V2 household persistence is unavailable'
    );
    expect(onSaved).not.toHaveBeenCalled();
  });

  test('given no accounts then it says saved households are not available, with nothing to press', () => {
    mockSavedWork.mockReturnValue({ account: null, scope: 'browser' });
    renderForm();

    expect(screen.getByText('Saved households are not available here.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save household' })).not.toBeInTheDocument();
  });
});
