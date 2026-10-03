import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { LocalStorageHouseholdStore } from '@/api/householdAssociation';
import { UK_CLAIMANT_OR_PARTNER_VARIABLE } from '@/models/Household';
import HouseholdBuilderView from '@/pathways/report/views/population/HouseholdBuilderView';
import {
  BUILDER_PEOPLE,
  CREATED_HOUSEHOLD_ID,
  mockCreatedHouseholdResponse,
  ROLE_TEST_YEAR,
  singleParentWithAdultDependant,
  UK_METADATA_WITH_CLAIMANT_ROLES,
  UK_METADATA_WITHOUT_CLAIMANT_ROLES,
  ukBuilderMetadata,
} from '@/tests/fixtures/models/builderClaimantRolesMocks';
import type { MetadataState } from '@/types/metadata';

let mockMetadata: MetadataState = ukBuilderMetadata(UK_METADATA_WITH_CLAIMANT_ROLES);

vi.mock('react-redux', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-redux')>()),
  useSelector: (selector: (state: any) => unknown) => selector({ metadata: mockMetadata }),
}));
vi.mock('@/hooks/useReportYear', () => ({ useReportYear: () => ROLE_TEST_YEAR }));

const mockFetch = vi.fn();

function renderUKBuilder(onSubmitSuccess = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const household = singleParentWithAdultDependant().withLabel('Lone parent and adult child');
  render(
    <QueryClientProvider client={client}>
      <HouseholdBuilderView
        population={{ type: 'household', household, geography: null, label: household.label }}
        countryId="uk"
        onSubmitSuccess={onSubmitSuccess}
      />
    </QueryClientProvider>,
    'uk'
  );
  return client;
}

async function saveAndReadPeople(onSubmitSuccess = vi.fn()) {
  const client = renderUKBuilder(onSubmitSuccess);
  const save = screen.getByRole('button', { name: 'Save household' });
  await waitFor(() => expect(save).toBeEnabled());
  await userEvent.click(save);
  await waitFor(() => expect(onSubmitSuccess).toHaveBeenCalled());
  client.clear();
  const [url, request] = mockFetch.mock.calls[0];
  expect(url).toMatch(/\/uk\/household$/);
  return JSON.parse(request.body).data.people;
}

describe('UK household builder claimant roles through the builder view', () => {
  beforeEach(() => {
    mockMetadata = ukBuilderMetadata(UK_METADATA_WITH_CLAIMANT_ROLES);
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    mockFetch.mockImplementation(async () => mockCreatedHouseholdResponse());
    vi.spyOn(LocalStorageHouseholdStore.prototype, 'create').mockImplementation(
      async (association) => ({ ...association, id: 'uk-association' }) as any
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test('given a lone parent with a dependant aged 25 then the builder shows them as single', async () => {
    renderUKBuilder();

    expect(await screen.findByText('Single')).toBeInTheDocument();
    expect(screen.queryByText('Married')).not.toBeInTheDocument();
  });

  test('given the model defines claimant roles then saving sends a single claimant', async () => {
    const onSubmitSuccess = vi.fn();
    const people = await saveAndReadPeople(onSubmitSuccess);

    expect(people[BUILDER_PEOPLE.YOU][UK_CLAIMANT_OR_PARTNER_VARIABLE]).toEqual({
      [ROLE_TEST_YEAR]: true,
    });
    expect(people[BUILDER_PEOPLE.FIRST_DEPENDANT][UK_CLAIMANT_OR_PARTNER_VARIABLE]).toEqual({
      [ROLE_TEST_YEAR]: false,
    });
    const [householdId, savedHousehold] = onSubmitSuccess.mock.calls[0];
    expect(householdId).toBe(CREATED_HOUSEHOLD_ID);
    expect(savedHousehold.toV1CreationPayload().data.people).toEqual(people);
  });

  test('given the model predates claimant roles then saving sends the household unchanged', async () => {
    mockMetadata = ukBuilderMetadata(UK_METADATA_WITHOUT_CLAIMANT_ROLES);

    const people = await saveAndReadPeople();

    expect(people).toEqual(singleParentWithAdultDependant().toV1CreationPayload().data.people);
    expect(JSON.stringify(people)).not.toContain(UK_CLAIMANT_OR_PARTNER_VARIABLE);
  });
});
