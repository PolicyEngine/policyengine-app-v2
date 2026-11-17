import { vi, type Mock } from 'vitest';
import type { components } from '@/api/publicApi/schema';
import { v2ReformPolicyBody, type NewReform } from '@/api/reformStore';
import { FOREVER } from '@/constants';
import {
  TEST_POLICYENGINE_VERSION,
  TEST_TAX_BENEFIT_MODEL_ID,
} from '@/tests/fixtures/api/publicApi/modelCatalogMocks';
import { publicApiPathOf } from '@/tests/fixtures/api/publicApiRouteMocks';
import { itemResponse, pageResponse, policyItem } from '@/tests/fixtures/api/v2UserMocks';
import type { Reform } from '@/types/ingredients/Reform';
import type { V2CatalogReference } from '@/types/metadata';
import type { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';
import type { Parameter } from '@/types/subIngredients/parameter';
import type { UserPolicyItem } from '@/types/v2User';

type V2PolicyItem = components['schemas']['PolicyItem'];

/** How long a query's data counts as fresh in the app, as calculator-app's providers set it. */
export const APP_QUERY_STALE_TIME = 5 * 60 * 1000;

/** Longer ago than the app's stale time. */
export const LONGER_THAN_STALE_TIME = 6 * 60 * 1000;

/** The session scope tests run in: sign-in not configured, so saved work stays in this browser. */
export const BROWSER_SCOPE = 'browser';

/** Another session's scope: a signed-in account. */
export const OTHER_ACCOUNT_SCOPE = 'account:auth0|other-user';

export const EITC_MAX_PATH = 'gov.irs.credits.eitc.max';

/** When the reforms below were last saved, oldest first. */
export const SAVED_TIMES = {
  EARLIER: '2026-10-01T09:00:00.000Z',
  LATER: '2026-10-15T09:00:00.000Z',
  JUST_NOW: '2026-11-17T12:00:00.000Z',
} as const;

/** A saved reform that sets the EITC maximum from 2026 on. */
export function savedEitcReform(
  id: string,
  label: string,
  value: number,
  updatedAt: string,
  overrides: Partial<Reform> = {}
): Reform {
  return {
    id,
    countryId: 'us',
    label,
    policyId: null,
    parameters: [
      {
        name: EITC_MAX_PATH,
        values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value }],
      },
    ],
    baseline: 'current-law',
    provenance: { source: 'manual' },
    createdAt: SAVED_TIMES.EARLIER,
    updatedAt,
    ...overrides,
  };
}

/** The oldest saved reform. */
export const EARLIER_REFORM = savedEitcReform(
  'rf-earlier',
  'Earlier plan',
  700,
  SAVED_TIMES.EARLIER
);

/** A saved reform updated after the earlier one. */
export const LATER_REFORM = savedEitcReform('rf-later', 'Later plan', 800, SAVED_TIMES.LATER);

/** A reform the store has just created. */
export const NEW_REFORM = savedEitcReform('rf-new', 'New plan', 900, SAVED_TIMES.JUST_NOW, {
  createdAt: SAVED_TIMES.JUST_NOW,
});

/** The earlier reform as the store answers it just after an edit. */
export const EDITED_EARLIER_REFORM = savedEitcReform(
  'rf-earlier',
  'Earlier plan, edited',
  950,
  SAVED_TIMES.JUST_NOW
);

/** The two saved reforms as the store lists them: most recently updated first. */
export const SAVED_REFORMS = [LATER_REFORM, EARLIER_REFORM];

/** The account ID the API gives the nth saved-reform row it creates. */
export function accountRowId(rowNumber: number): string {
  return `77777777-7777-4777-8777-${String(rowNumber).padStart(12, '0')}`;
}

/**
 * A stand-in for `/v2/user-policies` behind `fetchMock`, as the Public API
 * answers it: it lists `rows`, adds a created row and changes a patched
 * one, each stamped with the current time.
 */
export function fakeUserPolicies(fetchMock: Mock, rows: UserPolicyItem[] = []) {
  fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
    const body = init.body ? JSON.parse(String(init.body)) : {};
    const now = new Date().toISOString();
    if (init.method === 'POST') {
      const row = policyItem({
        policy_id: null,
        legacy_policy_id: null,
        ...body,
        id: accountRowId(rows.length + 1),
        created_at: now,
        updated_at: now,
      });
      rows.push(row);
      return itemResponse(row, 201);
    }
    if (init.method === 'PATCH') {
      const rowId = decodeURIComponent(publicApiPathOf(url).split('/').at(-1)!);
      const index = rows.findIndex((row) => row.id === rowId);
      // Repointing a row at a v2 policy clears its v1 policy, as the API does.
      const repointed = body.policy_id ? { legacy_policy_id: null } : {};
      rows[index] = { ...rows[index], ...body, ...repointed, updated_at: now };
      return itemResponse(rows[index]);
    }
    return pageResponse(rows);
  });
  return rows;
}

/**
 * The Public API's v1 policies, saved and read: `createPolicy` (as
 * `@/api/policy` sends it) keeps the request's parameter map under a new
 * ID, and `fetchPolicy` answers it, as `GET /{country}/policy/{id}` does.
 */
export function fakeV1PolicyApi(firstPolicyId: number) {
  const policies = new Map<string, Record<string, Record<string, unknown>>>();
  let nextPolicyId = firstPolicyId;
  return {
    createPolicy: vi.fn(
      async (_countryId: string, request: { data: Record<string, Record<string, unknown>> }) => {
        const policyId = nextPolicyId++;
        policies.set(String(policyId), request.data);
        return { result: { policy_id: policyId } };
      }
    ),
    fetchPolicy: vi.fn(async (_countryId: string, policyId: string) => {
      const policyJson = policies.get(policyId);
      if (!policyJson) {
        throw new Error(`Policy ${policyId} not found`);
      }
      return { policy_json: policyJson, missing_parameters: [] };
    }),
  };
}

/**
 * The Public API's v2 policies, saved and read: `createV2Policy` builds the
 * `POST /v2/policies` body as the store sends it and keeps its dated values
 * under the next of `policyIds`; `fetchV2Policy` answers them, each named
 * by its parameter, as `GET /v2/policies/{id}` does.
 */
export function fakeV2PolicyApi(policyIds: string[]) {
  const policies = new Map<string, V2PolicyItem['parameter_values']>();
  const unusedIds = [...policyIds];
  return {
    createV2Policy: vi.fn(
      async (
        countryId: string,
        parameters: Parameter[],
        catalog: V2CatalogReference,
        parameterIds: Record<string, string>,
        metadata?: ParameterMetadataCollection
      ) => {
        const body = v2ReformPolicyBody(countryId, parameters, catalog, parameterIds, metadata);
        const namesById = Object.fromEntries(
          Object.entries(parameterIds).map(([name, parameterId]) => [parameterId, name])
        );
        const policyId = unusedIds.shift()!;
        policies.set(
          policyId,
          body.parameter_values.map((parameterValue, index) => ({
            id: `${policyId}-${index}`,
            parameter_id: parameterValue.parameter_id,
            parameter_name: namesById[parameterValue.parameter_id],
            value: parameterValue.value,
            start_date: parameterValue.start_date,
            end_date: parameterValue.end_date ?? null,
          }))
        );
        return policyId;
      }
    ),
    fetchV2Policy: vi.fn(
      async (countryId: string, policyId: string): Promise<V2PolicyItem> => ({
        id: policyId,
        country_id: countryId,
        tax_benefit_model_id: V2_TEST_CATALOG.taxBenefitModelId,
        created_at: SAVED_TIMES.EARLIER,
        updated_at: SAVED_TIMES.EARLIER,
        missing_parameters: [],
        parameter_values: policies.get(policyId) ?? [],
      })
    ),
  };
}

/** A loaded v2 catalog version, for saving v2 policies. */
export const V2_TEST_CATALOG: V2CatalogReference = {
  policyengineVersion: TEST_POLICYENGINE_VERSION,
  taxBenefitModelId: TEST_TAX_BENEFIT_MODEL_ID,
};

/** A catalog ID for each named parameter, as the on-demand loads record them. */
export async function resolveTestParameterIds(
  _countryId: string,
  names: readonly string[]
): Promise<Record<string, string>> {
  return Object.fromEntries(names.map((name) => [name, `${name}#id`]));
}

/** The Child Tax Credit base amount, a second parameter for reforms that set two. */
export const CTC_BASE_PATH = 'gov.irs.credits.ctc.amount.base[0].amount';

/**
 * A new reform as a draft saves it: the EITC maximum at `eitcMaximum` from
 * 2026 on, and a phased Child Tax Credit (2,500 in 2026, 3,000 from 2027).
 */
export function twoParameterReformInput(label: string, eitcMaximum: number): NewReform {
  return {
    countryId: 'us',
    label,
    parameters: [
      {
        name: EITC_MAX_PATH,
        values: [{ startDate: '2026-01-01', endDate: FOREVER, value: eitcMaximum }],
      },
      {
        name: CTC_BASE_PATH,
        values: [
          { startDate: '2026-01-01', endDate: '2026-12-31', value: 2500 },
          { startDate: '2027-01-01', endDate: FOREVER, value: 3000 },
        ],
      },
    ],
    baseline: 'current-law',
    provenance: { source: 'manual' },
  };
}
