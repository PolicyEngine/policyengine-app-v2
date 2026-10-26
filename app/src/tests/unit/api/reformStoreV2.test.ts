import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPublicApiClient } from '@/api/publicApi/client';
import {
  ApiReformStore,
  ApiV2ReformStore,
  createV2ReformPolicy,
  getReformStore,
  LocalStorageReformStore,
  parametersFromV2Policy,
} from '@/api/reformStore';
import { FOREVER } from '@/constants';
import {
  TEST_TAX_BENEFIT_MODEL_ID as V2_MODEL_ID,
  TEST_POLICYENGINE_VERSION as V2_POLICYENGINE_VERSION,
} from '@/tests/fixtures/api/publicApi/modelCatalogMocks';
import {
  ASSOCIATION_IDS,
  createTestApiContext,
  fetchCall,
  itemResponse,
  noContentResponse,
  okResponse,
  pageResponse,
  policyItem,
  TEST_API_BASE,
} from '@/tests/fixtures/api/v2UserMocks';
import type { Reform } from '@/types/ingredients/Reform';
import type { V2CatalogReference } from '@/types/metadata';

const CTC_AMOUNT = 'gov.irs.credits.ctc.amount.base[0].amount';
const CTC_PHASE_OUT = 'gov.irs.credits.ctc.phase_out.threshold';

const V2_POLICY_ID = 'a1b2c3d4-0000-4000-8000-000000000001';
const REPLACEMENT_V2_POLICY_ID = 'a1b2c3d4-0000-4000-8000-000000000002';
const LEGACY_ONLY_POLICY_ID = 95762;

const V2_PARAMETER_IDS = {
  CTC_AMOUNT: 'c0000000-0000-4000-8000-000000000001',
  CTC_PHASE_OUT: 'c0000000-0000-4000-8000-000000000002',
};

const CATALOG: V2CatalogReference = {
  policyengineVersion: V2_POLICYENGINE_VERSION,
  taxBenefitModelId: V2_MODEL_ID,
};

/** Each parameter's catalog ID, as the on-demand loads record them. */
const PARAMETER_IDS: Record<string, string> = {
  [CTC_AMOUNT]: V2_PARAMETER_IDS.CTC_AMOUNT,
  [CTC_PHASE_OUT]: V2_PARAMETER_IDS.CTC_PHASE_OUT,
};

/** Resolves catalog IDs as the store's caller does: loading them, then reading them. */
const resolveParameterIds = vi.fn(async (_countryId: string, names: readonly string[]) =>
  Object.fromEntries(
    names.filter((name) => PARAMETER_IDS[name]).map((name) => [name, PARAMETER_IDS[name]])
  )
);

const REFORM_INPUT: Omit<Reform, 'id' | 'createdAt' | 'updatedAt'> = {
  countryId: 'us',
  label: 'CTC to $3,600',
  parameters: [
    {
      name: CTC_AMOUNT,
      values: [{ startDate: '2026-01-01', endDate: FOREVER, value: 3600 }],
    },
  ],
  baseline: 'current-law',
  provenance: { source: 'manual' },
};

/** The v2 policy as GET /v2/policies/{id} returns it. */
function v2Policy(policyId = V2_POLICY_ID) {
  return {
    id: policyId,
    country_id: 'us',
    tax_benefit_model_id: V2_MODEL_ID,
    created_at: '2026-10-20T10:00:00Z',
    updated_at: '2026-10-20T10:00:00Z',
    parameter_values: [
      {
        id: 'b0000000-0000-4000-8000-000000000001',
        parameter_id: V2_PARAMETER_IDS.CTC_AMOUNT,
        parameter_name: CTC_AMOUNT,
        value: 3600,
        start_date: '2026-01-01T00:00:00Z',
        end_date: '2100-12-31T00:00:00Z',
      },
      {
        id: 'b0000000-0000-4000-8000-000000000002',
        parameter_id: V2_PARAMETER_IDS.CTC_PHASE_OUT,
        parameter_name: CTC_PHASE_OUT,
        value: 'Infinity',
        start_date: '2027-01-01T00:00:00Z',
        end_date: null,
      },
      {
        id: 'b0000000-0000-4000-8000-000000000003',
        parameter_id: V2_PARAMETER_IDS.CTC_PHASE_OUT,
        parameter_name: CTC_PHASE_OUT,
        value: 400000,
        start_date: '2026-01-01T00:00:00Z',
        end_date: '2026-12-31T00:00:00Z',
      },
    ],
  };
}

const V2_REFORM_ROW = policyItem({
  id: ASSOCIATION_IDS.REFORM,
  policy_id: V2_POLICY_ID,
  legacy_policy_id: null,
  name: 'CTC to $3,600',
  baseline: 'current-law',
  provenance: { source: 'manual', ref: null, confidence: null },
});

function v2Store(catalog: V2CatalogReference | null = CATALOG) {
  const { fetchMock, context } = createTestApiContext('us');
  const createPolicy = vi.fn().mockResolvedValue(V2_POLICY_ID);
  const fetchV2Policy = vi.fn().mockResolvedValue(v2Policy());
  const fetchPolicyJson = vi.fn().mockResolvedValue({
    [CTC_AMOUNT]: { '2026-01-01.2100-12-31': 3000 },
  });
  const store = new ApiV2ReformStore(context, {
    getV2Catalog: () => catalog,
    resolveParameterIds,
    createV2Policy: createPolicy,
    fetchV2Policy,
    fetchPolicyJson,
  });
  return { store, fetchMock, createPolicy, fetchV2Policy, fetchPolicyJson };
}

describe('createV2ReformPolicy', () => {
  it('given parameters then POST /v2/policies names catalog UUIDs at UTC midnight', async () => {
    // Given
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ item: v2Policy() }, 201));
    const client = createPublicApiClient({
      baseUrl: TEST_API_BASE,
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    const parameters = [
      ...REFORM_INPUT.parameters,
      {
        name: CTC_PHASE_OUT,
        values: [{ startDate: '2027-01-01', endDate: FOREVER, value: Infinity }],
      },
    ];

    // When
    const policyId = await createV2ReformPolicy(
      'us',
      parameters,
      CATALOG,
      PARAMETER_IDS,
      undefined,
      client
    );

    // Then
    expect(policyId).toBe(V2_POLICY_ID);
    const request = fetchMock.mock.calls[0][0] as Request;
    const url = new URL(request.url);
    expect(request.method).toBe('POST');
    expect(url.pathname).toBe('/v2/policies');
    expect(url.searchParams.get('country_id')).toBe('us');
    expect(url.searchParams.get('policyengine_version')).toBe(V2_POLICYENGINE_VERSION);
    expect(await request.json()).toEqual({
      country_id: 'us',
      tax_benefit_model_id: V2_MODEL_ID,
      parameter_values: [
        {
          parameter_id: V2_PARAMETER_IDS.CTC_AMOUNT,
          value: 3600,
          start_date: '2026-01-01T00:00:00Z',
          end_date: '2100-12-31T00:00:00Z',
        },
        {
          parameter_id: V2_PARAMETER_IDS.CTC_PHASE_OUT,
          value: 'Infinity',
          start_date: '2027-01-01T00:00:00Z',
          end_date: '2100-12-31T00:00:00Z',
        },
      ],
    });
  });

  it('given a parameter the catalog lacks then nothing is sent', async () => {
    // Given
    const fetchMock = vi.fn();
    const client = createPublicApiClient({
      baseUrl: TEST_API_BASE,
      fetchImpl: fetchMock as unknown as typeof fetch,
    });

    // When
    const creation = createV2ReformPolicy(
      'us',
      [{ name: 'gov.contrib.unlisted', values: REFORM_INPUT.parameters[0].values }],
      CATALOG,
      PARAMETER_IDS,
      undefined,
      client
    );

    // Then
    await expect(creation).rejects.toThrow('gov.contrib.unlisted');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('parametersFromV2Policy', () => {
  it('given a v2 policy then each parameter lists its dated values, oldest first', () => {
    expect(parametersFromV2Policy(v2Policy())).toEqual([
      {
        name: CTC_AMOUNT,
        values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 3600 }],
      },
      {
        name: CTC_PHASE_OUT,
        values: [
          { startDate: '2026-01-01', endDate: '2026-12-31', value: 400000 },
          { startDate: '2027-01-01', endDate: FOREVER, value: 'Infinity' },
        ],
      },
    ]);
  });
});

describe('ApiV2ReformStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('given a reform then its parameters become a v2 policy and the row links policy_id', async () => {
    // Given
    const { store, fetchMock, createPolicy } = v2Store();
    fetchMock.mockResolvedValue(itemResponse(V2_REFORM_ROW, 201));

    // When
    const created = await store.create(REFORM_INPUT);

    // Then
    expect(resolveParameterIds).toHaveBeenCalledWith('us', [CTC_AMOUNT]);
    expect(createPolicy).toHaveBeenCalledWith(
      'us',
      REFORM_INPUT.parameters,
      CATALOG,
      { [CTC_AMOUNT]: V2_PARAMETER_IDS.CTC_AMOUNT },
      undefined
    );
    const call = fetchCall(fetchMock);
    expect(call.path).toBe('/v2/user-policies');
    expect(call.body).toEqual({
      country_id: 'us',
      policy_id: V2_POLICY_ID,
      name: 'CTC to $3,600',
      baseline: 'current-law',
      provenance: { source: 'manual', ref: null, confidence: null },
    });
    expect(created).toMatchObject({
      id: ASSOCIATION_IDS.REFORM,
      policyId: V2_POLICY_ID,
      parameters: REFORM_INPUT.parameters,
    });
  });

  it('given a reform already on a v2 policy then no new policy is created', async () => {
    // Given
    const { store, fetchMock, createPolicy } = v2Store();
    fetchMock.mockResolvedValue(itemResponse(V2_REFORM_ROW, 201));

    // When
    await store.create({ ...REFORM_INPUT, policyId: V2_POLICY_ID });

    // Then
    expect(createPolicy).not.toHaveBeenCalled();
    expect(fetchCall(fetchMock).body.policy_id).toBe(V2_POLICY_ID);
  });

  it('given no v2 catalog loaded then saving fails before any request', async () => {
    // Given
    const { store, fetchMock, createPolicy } = v2Store(null);

    // When
    const creation = store.create(REFORM_INPUT);

    // Then
    await expect(creation).rejects.toThrow('model');
    expect(createPolicy).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('given saved rows then v2 rows read their policy and v1-only rows read the v1 policy', async () => {
    // Given
    const { store, fetchMock, fetchV2Policy, fetchPolicyJson } = v2Store();
    const legacyRow = policyItem({
      id: '66666666-6666-4666-8666-666666666666',
      policy_id: null,
      legacy_policy_id: LEGACY_ONLY_POLICY_ID,
      provenance: { source: 'bill', ref: 'HR-1', confidence: null },
      updated_at: '2026-10-01T00:00:00+00:00',
    });
    fetchMock.mockResolvedValue(
      pageResponse([
        V2_REFORM_ROW,
        legacyRow,
        policyItem({ id: 'legacy-builder', provenance: null }),
      ])
    );

    // When
    const reforms = await store.findMine('us');

    // Then
    expect(fetchV2Policy).toHaveBeenCalledWith('us', V2_POLICY_ID);
    expect(fetchPolicyJson).toHaveBeenCalledWith('us', String(LEGACY_ONLY_POLICY_ID));
    expect(reforms.map((reform) => [reform.id, reform.policyId])).toEqual([
      [ASSOCIATION_IDS.REFORM, V2_POLICY_ID],
      [legacyRow.id, String(LEGACY_ONLY_POLICY_ID)],
    ]);
    expect(reforms[0].parameters).toEqual(parametersFromV2Policy(v2Policy()));
    expect(reforms[1].parameters).toEqual([
      {
        name: CTC_AMOUNT,
        values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 3000 }],
      },
    ]);
  });

  it('given a row whose policy fails to load then it is listed without its changes', async () => {
    // Given
    const { store, fetchMock, fetchV2Policy } = v2Store();
    fetchV2Policy.mockRejectedValue(new Error('Policy not found'));
    fetchMock.mockResolvedValue(pageResponse([V2_REFORM_ROW]));

    // When
    const [reform] = await store.findMine('us');

    // Then
    expect(reform.parametersUnavailable).toBe(true);
    expect(reform.parameters).toEqual([]);
  });

  it('given changed parameters then a new v2 policy is created and the row is repointed', async () => {
    // Given
    const { store, fetchMock, createPolicy } = v2Store();
    createPolicy.mockResolvedValue(REPLACEMENT_V2_POLICY_ID);
    fetchMock.mockResolvedValue(
      itemResponse({ ...V2_REFORM_ROW, policy_id: REPLACEMENT_V2_POLICY_ID })
    );
    const changed = [
      { name: CTC_AMOUNT, values: [{ startDate: '2026-01-01', endDate: FOREVER, value: 4000 }] },
    ];

    // When
    const updated = await store.update(ASSOCIATION_IDS.REFORM, {
      parameters: changed,
      label: 'CTC to $4,000',
    });

    // Then
    const call = fetchCall(fetchMock);
    expect(call.method).toBe('PATCH');
    expect(call.path).toBe(`/v2/user-policies/${ASSOCIATION_IDS.REFORM}`);
    expect(call.body).toEqual({ name: 'CTC to $4,000', policy_id: REPLACEMENT_V2_POLICY_ID });
    expect(updated.policyId).toBe(REPLACEMENT_V2_POLICY_ID);
    expect(updated.parameters).toEqual(changed);
  });

  it('given only a new name then only the name is patched', async () => {
    // Given
    const { store, fetchMock, createPolicy } = v2Store();
    fetchMock.mockResolvedValue(itemResponse({ ...V2_REFORM_ROW, name: 'Renamed' }));

    // When
    await store.update(ASSOCIATION_IDS.REFORM, { label: 'Renamed' });

    // Then
    expect(createPolicy).not.toHaveBeenCalled();
    expect(fetchCall(fetchMock).body).toEqual({ name: 'Renamed' });
  });

  it('given a reform then deleting it removes only the row', async () => {
    // Given
    const { store, fetchMock } = v2Store();
    fetchMock.mockResolvedValue(noContentResponse());

    // When
    await store.delete(ASSOCIATION_IDS.REFORM);

    // Then
    const call = fetchCall(fetchMock);
    expect(call.method).toBe('DELETE');
    expect(call.path).toBe(`/v2/user-policies/${ASSOCIATION_IDS.REFORM}`);
  });
});

describe('getReformStore', () => {
  it('given an account then the routes decide between the v1 and v2 stores', () => {
    const { context } = createTestApiContext('us');

    expect(getReformStore(context, {}, 'v1')).toBeInstanceOf(ApiReformStore);
    expect(getReformStore(context, {}, 'v2')).toBeInstanceOf(ApiV2ReformStore);
  });

  it('given no account then reforms stay in this browser on either routes', () => {
    expect(getReformStore(null, {}, 'v1')).toBeInstanceOf(LocalStorageReformStore);
    expect(getReformStore(null, {}, 'v2')).toBeInstanceOf(LocalStorageReformStore);
  });

  it('given no routes then the store follows V3_API_ROUTES, which is v1 before the switch', () => {
    const { context } = createTestApiContext('us');

    expect(getReformStore(context)).toBeInstanceOf(ApiReformStore);
  });
});
