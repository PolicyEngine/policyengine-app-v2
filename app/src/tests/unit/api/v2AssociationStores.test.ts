import { beforeEach, describe, expect, test } from 'vitest';
import { ApiHouseholdStore, LocalStorageHouseholdStore } from '@/api/householdAssociation';
import { ApiPolicyStore, LocalStoragePolicyStore } from '@/api/policyAssociation';
import {
  ApiReportStore,
  LocalStorageReportStore,
  type UserReportStore,
} from '@/api/reportAssociation';
import { ApiSimulationStore, LocalStorageSimulationStore } from '@/api/simulationAssociation';
import { MOCK_USER_ID } from '@/constants';
import { recordImportedIds, resolveImportedId } from '@/libs/auth/importedIds';
import {
  ASSOCIATION_IDS,
  createTestApiContext,
  errorResponse,
  fetchCall,
  householdItem,
  itemResponse,
  LEGACY_IDS,
  noContentResponse,
  pageResponse,
  PE_USER_ID,
  policyItem,
  reportItem,
  simulationItem,
  TEST_ACCESS_TOKEN,
  TIMESTAMPS,
} from '@/tests/fixtures/api/v2UserMocks';

beforeEach(() => {
  localStorage.clear();
});

describe('ApiPolicyStore', () => {
  test('given a new association then it posts the v1 policy id and name without a user id', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext('us');
    fetchMock.mockResolvedValue(itemResponse(policyItem({ name: 'CTC expansion' }), 201));
    const store = new ApiPolicyStore(context);

    // When
    const created = await store.create({
      userId: MOCK_USER_ID,
      policyId: String(LEGACY_IDS.POLICY),
      countryId: 'us',
      label: 'CTC expansion',
    });

    // Then
    const call = fetchCall(fetchMock);
    expect(call.method).toBe('POST');
    expect(call.path).toBe('/v2/user-policies');
    expect(call.query).toEqual({ country_id: 'us' });
    expect(call.headers.Authorization).toBe(`Bearer ${TEST_ACCESS_TOKEN}`);
    expect(call.body).toEqual({
      country_id: 'us',
      legacy_policy_id: LEGACY_IDS.POLICY,
      name: 'CTC expansion',
    });
    expect(created).toEqual({
      id: ASSOCIATION_IDS.POLICY,
      userId: PE_USER_ID,
      policyId: String(LEGACY_IDS.POLICY),
      countryId: 'us',
      label: 'CTC expansion',
      createdAt: TIMESTAMPS.CREATED,
      updatedAt: TIMESTAMPS.UPDATED,
      isCreated: true,
    });
  });

  test('given a non-numeric policy id then create refuses before calling the API', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    const store = new ApiPolicyStore(context);

    // When / Then
    await expect(
      store.create({ userId: MOCK_USER_ID, policyId: 'current-law', countryId: 'us' })
    ).rejects.toThrow(/no PolicyEngine API ID/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given rows then findByUser lists the country and skips rows without a v1 policy', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext('uk');
    fetchMock.mockResolvedValue(
      pageResponse([
        policyItem({ country_id: 'uk' }),
        policyItem({ id: 'v2-only', legacy_policy_id: null, policy_id: 'abc' }),
      ])
    );
    const store = new ApiPolicyStore(context);

    // When
    const policies = await store.findByUser(PE_USER_ID, 'uk');

    // Then
    expect(fetchCall(fetchMock).query).toMatchObject({ country_id: 'uk' });
    expect(policies.map((policy) => policy.id)).toEqual([ASSOCIATION_IDS.POLICY]);
  });

  test('given another country then findByUser returns nothing without a request', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext('us');
    const store = new ApiPolicyStore(context);

    // When
    const policies = await store.findByUser(PE_USER_ID, 'ca');

    // Then
    expect(policies).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given a v1 policy id then findById filters by legacy_policy_id', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(pageResponse([policyItem()]));
    const store = new ApiPolicyStore(context);

    // When
    const found = await store.findById(PE_USER_ID, String(LEGACY_IDS.POLICY));

    // Then
    expect(fetchCall(fetchMock).query).toEqual({
      country_id: 'us',
      legacy_policy_id: String(LEGACY_IDS.POLICY),
      limit: '1',
    });
    expect(found?.id).toBe(ASSOCIATION_IDS.POLICY);
  });

  test('given a rename and repoint then update patches only those fields', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(itemResponse(policyItem({ name: 'Renamed', legacy_policy_id: 7 })));
    const store = new ApiPolicyStore(context);

    // When
    const updated = await store.update(ASSOCIATION_IDS.POLICY, { label: 'Renamed', policyId: '7' });

    // Then
    const call = fetchCall(fetchMock);
    expect(call.method).toBe('PATCH');
    expect(call.path).toBe(`/v2/user-policies/${ASSOCIATION_IDS.POLICY}`);
    expect(call.body).toEqual({ name: 'Renamed', legacy_policy_id: 7 });
    expect(updated.policyId).toBe('7');
  });

  test('given an empty update then it reads the row instead of patching', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(itemResponse(policyItem()));
    const store = new ApiPolicyStore(context);

    // When
    await store.update(ASSOCIATION_IDS.POLICY, {});

    // Then
    expect(fetchCall(fetchMock).method).toBe('GET');
    expect(fetchCall(fetchMock).body).toBeUndefined();
  });

  test('given an imported local id then update targets its account row', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    recordImportedIds(PE_USER_ID, { 'sup-local1': ASSOCIATION_IDS.POLICY });
    fetchMock.mockResolvedValue(itemResponse(policyItem({ name: 'Renamed' })));
    const store = new ApiPolicyStore(context);

    // When
    await store.update('sup-local1', { label: 'Renamed' });

    // Then
    expect(fetchCall(fetchMock).path).toBe(`/v2/user-policies/${ASSOCIATION_IDS.POLICY}`);
  });

  test('given an unknown local id then update fails as not found without a request', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    const store = new ApiPolicyStore(context);

    // When / Then
    await expect(store.update('sup-unknown', { label: 'x' })).rejects.toMatchObject({
      status: 404,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given a local sup- id never imported then renaming it saves it to the account', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    const local = new LocalStoragePolicyStore();
    const localPolicy = await local.create({
      userId: MOCK_USER_ID,
      policyId: String(LEGACY_IDS.POLICY),
      countryId: 'us',
      label: 'Local policy',
    });
    fetchMock.mockResolvedValue(
      itemResponse(policyItem({ name: 'Renamed', client_ref: localPolicy.id! }), 201)
    );
    const store = new ApiPolicyStore(context, local);

    // When
    const renamed = await store.update(localPolicy.id!, { label: 'Renamed' });

    // Then
    expect(fetchCall(fetchMock).body).toEqual({
      country_id: 'us',
      legacy_policy_id: LEGACY_IDS.POLICY,
      name: 'Renamed',
      client_ref: localPolicy.id,
    });
    expect(renamed.id).toBe(ASSOCIATION_IDS.POLICY);
    expect(resolveImportedId(PE_USER_ID, localPolicy.id!)).toBe(ASSOCIATION_IDS.POLICY);
  });

  test("given a local sup- id never imported then deleting it deletes this browser's copy", async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    const local = new LocalStoragePolicyStore();
    const localPolicy = await local.create({
      userId: MOCK_USER_ID,
      policyId: String(LEGACY_IDS.POLICY),
      countryId: 'us',
    });
    const store = new ApiPolicyStore(context, local);

    // When
    await store.delete(localPolicy.id!);

    // Then
    expect(await local.findByUserPolicyId(localPolicy.id!)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given a delete then it sends DELETE and accepts 204', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(noContentResponse());
    const store = new ApiPolicyStore(context);

    // When
    await store.delete(ASSOCIATION_IDS.POLICY);

    // Then
    expect(fetchCall(fetchMock).method).toBe('DELETE');
    expect(fetchCall(fetchMock).query).toEqual({ country_id: 'us' });
  });
});

describe('ApiHouseholdStore', () => {
  test('given a household then create posts legacy_household_id', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(itemResponse(householdItem({ name: 'Family of four' }), 201));
    const store = new ApiHouseholdStore(context);

    // When
    const created = await store.create({
      type: 'household',
      userId: MOCK_USER_ID,
      householdId: String(LEGACY_IDS.HOUSEHOLD),
      countryId: 'us',
      label: 'Family of four',
    });

    // Then
    expect(fetchCall(fetchMock).body).toEqual({
      country_id: 'us',
      legacy_household_id: LEGACY_IDS.HOUSEHOLD,
      name: 'Family of four',
    });
    expect(created).toMatchObject({
      type: 'household',
      id: ASSOCIATION_IDS.HOUSEHOLD,
      householdId: String(LEGACY_IDS.HOUSEHOLD),
      label: 'Family of four',
    });
  });

  test('given a replacement household then update repoints legacy_household_id', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(itemResponse(householdItem({ legacy_household_id: 456 })));
    const store = new ApiHouseholdStore(context);

    // When
    const updated = await store.update(ASSOCIATION_IDS.HOUSEHOLD, { householdId: '456' });

    // Then
    expect(fetchCall(fetchMock).body).toEqual({ legacy_household_id: 456 });
    expect(updated.householdId).toBe('456');
  });
});

describe('local-only household and simulation ids', () => {
  test('given a local suh- id never imported then renaming it saves it to the account', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    const local = new LocalStorageHouseholdStore();
    const localHousehold = await local.create({
      type: 'household',
      userId: MOCK_USER_ID,
      householdId: String(LEGACY_IDS.HOUSEHOLD),
      countryId: 'us',
      label: 'Local household',
    });
    fetchMock.mockResolvedValue(itemResponse(householdItem({ name: 'Renamed' }), 201));
    const store = new ApiHouseholdStore(context, local);

    // When
    await store.update(localHousehold.id!, { label: 'Renamed' });

    // Then
    expect(fetchCall(fetchMock).body).toMatchObject({
      legacy_household_id: LEGACY_IDS.HOUSEHOLD,
      client_ref: localHousehold.id,
    });
    expect(resolveImportedId(PE_USER_ID, localHousehold.id!)).toBe(ASSOCIATION_IDS.HOUSEHOLD);
  });

  test('given a local sus- id never imported then renaming it saves it to the account', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    const local = new LocalStorageSimulationStore();
    const localSimulation = await local.create({
      userId: MOCK_USER_ID,
      simulationId: String(LEGACY_IDS.SIMULATION),
      countryId: 'us',
      label: 'Local simulation',
    });
    fetchMock.mockResolvedValue(itemResponse(simulationItem({ name: 'Renamed' }), 201));
    const store = new ApiSimulationStore(context, local);

    // When
    await store.update(localSimulation.id!, { label: 'Renamed' });

    // Then
    expect(fetchCall(fetchMock).body).toMatchObject({
      legacy_simulation_id: LEGACY_IDS.SIMULATION,
      client_ref: localSimulation.id,
    });
    expect(resolveImportedId(PE_USER_ID, localSimulation.id!)).toBe(ASSOCIATION_IDS.SIMULATION);
  });
});

describe('ApiSimulationStore', () => {
  test('given a simulation then create posts legacy_simulation_id', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext('uk');
    fetchMock.mockResolvedValue(itemResponse(simulationItem({ country_id: 'uk' }), 201));
    const store = new ApiSimulationStore(context);

    // When
    await store.create({
      userId: MOCK_USER_ID,
      simulationId: String(LEGACY_IDS.SIMULATION),
      countryId: 'uk',
    });

    // Then
    const call = fetchCall(fetchMock);
    expect(call.path).toBe('/v2/user-simulations');
    expect(call.query).toEqual({ country_id: 'uk' });
    expect(call.body).toEqual({ country_id: 'uk', legacy_simulation_id: LEGACY_IDS.SIMULATION });
  });

  test('given rows then findByUser maps legacy ids to simulation ids', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(pageResponse([simulationItem({ name: 'Baseline' })]));
    const store = new ApiSimulationStore(context);

    // When
    const simulations = await store.findByUser(PE_USER_ID, 'us');

    // Then
    expect(simulations).toEqual([
      expect.objectContaining({
        id: ASSOCIATION_IDS.SIMULATION,
        userId: PE_USER_ID,
        simulationId: String(LEGACY_IDS.SIMULATION),
        label: 'Baseline',
      }),
    ]);
  });
});

describe('ApiReportStore', () => {
  test('given a report then create posts legacy_report_id (no caller-chosen id)', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(itemResponse(reportItem({ name: 'Saved report' }), 201));
    const store = new ApiReportStore(context);

    // When
    const created = await store.create({
      userId: MOCK_USER_ID,
      reportId: String(LEGACY_IDS.REPORT),
      countryId: 'us',
      label: 'Saved report',
    });

    // Then
    expect((store as UserReportStore).createWithId).toBeUndefined();
    expect(fetchCall(fetchMock).body).toEqual({
      country_id: 'us',
      legacy_report_id: LEGACY_IDS.REPORT,
      name: 'Saved report',
    });
    expect(created.id).toBe(ASSOCIATION_IDS.REPORT);
    expect(created.reportId).toBe(String(LEGACY_IDS.REPORT));
  });

  test('given an association uuid then findByUserReportId reads that row', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(itemResponse(reportItem()));
    const store = new ApiReportStore(context);

    // When
    const found = await store.findByUserReportId(ASSOCIATION_IDS.REPORT);

    // Then
    expect(fetchCall(fetchMock).path).toBe(`/v2/user-reports/${ASSOCIATION_IDS.REPORT}`);
    expect(found?.reportId).toBe(String(LEGACY_IDS.REPORT));
  });

  test("given another user's row then findByUserReportId returns null", async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(errorResponse(404, 'Not found'));
    const store = new ApiReportStore(context);

    // When
    const found = await store.findByUserReportId(ASSOCIATION_IDS.REPORT);

    // Then
    expect(found).toBeNull();
  });

  test('given an imported sur- id then findByUserReportId resolves to the account row', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    recordImportedIds(PE_USER_ID, { 'sur-old1': ASSOCIATION_IDS.REPORT });
    fetchMock.mockResolvedValue(itemResponse(reportItem()));
    const store = new ApiReportStore(context);

    // When
    const found = await store.findByUserReportId('sur-old1');

    // Then
    expect(fetchCall(fetchMock).path).toBe(`/v2/user-reports/${ASSOCIATION_IDS.REPORT}`);
    expect(found?.id).toBe(ASSOCIATION_IDS.REPORT);
  });

  test('given an id imported by a different user then it is not resolved for this user', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext('us', PE_USER_ID);
    recordImportedIds('another-user', { 'sur-old1': ASSOCIATION_IDS.REPORT });
    const store = new ApiReportStore(context);

    // When
    const found = await store.findByUserReportId('sur-old1');

    // Then
    expect(found).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given a local sur- id never imported then it is read from this browser', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    const local = new LocalStorageReportStore();
    const localReport = await local.create({
      userId: MOCK_USER_ID,
      reportId: '42',
      countryId: 'us',
      label: 'Local report',
    });
    const store = new ApiReportStore(context, local);

    // When
    const found = await store.findByUserReportId(localReport.id);

    // Then
    expect(found?.label).toBe('Local report');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given a local sur- id never imported then renaming it saves it to the account', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    const local = new LocalStorageReportStore();
    const localReport = await local.create({
      userId: MOCK_USER_ID,
      reportId: '42',
      countryId: 'us',
      label: 'Local report',
    });
    fetchMock.mockResolvedValue(
      itemResponse(
        reportItem({ legacy_report_id: 42, name: 'Renamed', client_ref: localReport.id }),
        201
      )
    );
    const store = new ApiReportStore(context, local);

    // When
    const renamed = await store.update(localReport.id, { label: 'Renamed' });

    // Then
    const call = fetchCall(fetchMock);
    expect(call.method).toBe('POST');
    expect(call.body).toEqual({
      country_id: 'us',
      legacy_report_id: 42,
      name: 'Renamed',
      client_ref: localReport.id,
    });
    expect(renamed.id).toBe(ASSOCIATION_IDS.REPORT);
    expect(resolveImportedId(PE_USER_ID, localReport.id)).toBe(ASSOCIATION_IDS.REPORT);
    expect((await local.findByUserReportId(localReport.id))?.label).toBe('Local report');
  });

  test('given a replaced base report then update repoints legacy_report_id', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(itemResponse(reportItem({ legacy_report_id: 999 })));
    const store = new ApiReportStore(context);

    // When
    const updated = await store.update(ASSOCIATION_IDS.REPORT, { reportId: '999' });

    // Then
    expect(fetchCall(fetchMock).body).toEqual({ legacy_report_id: 999 });
    expect(updated.reportId).toBe('999');
  });

  test('given a v1 report id then findById filters by legacy_report_id', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(pageResponse([]));
    const store = new ApiReportStore(context);

    // When
    const found = await store.findById(PE_USER_ID, String(LEGACY_IDS.REPORT));

    // Then
    expect(found).toBeNull();
    expect(fetchCall(fetchMock).query).toMatchObject({
      legacy_report_id: String(LEGACY_IDS.REPORT),
    });
  });
});
