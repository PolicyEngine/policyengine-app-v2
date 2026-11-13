import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchBudgetWindow } from '@/api/budgetWindow';
import { createHousehold, fetchHouseholdById } from '@/api/household';
import { fetchHouseholdCalculation } from '@/api/householdCalculation';
import { fetchHouseholdVariation } from '@/api/householdVariation';
import { fetchMetadata } from '@/api/metadata';
import { createPolicy, fetchPolicyById } from '@/api/policy';
import { fetchCatalogParameters } from '@/api/publicApi/catalogParameters';
import { fetchCatalogVariables } from '@/api/publicApi/catalogVariables';
import { fetchV2ModelCatalogMetadata } from '@/api/publicApi/modelCatalog';
import { fetchParameterChildren } from '@/api/publicApi/parameterChildren';
import { fetchParameterSearchFile } from '@/api/publicApi/searchFile';
import { createV2ReformPolicy, fetchV2PolicyItem } from '@/api/reformStore';
import { createReport, fetchReportById, markReportCompleted } from '@/api/report';
import { fetchSharedReport } from '@/api/sharedReport';
import {
  createSimulation,
  fetchSimulationById,
  markSimulationError,
  updateSimulationOutput,
} from '@/api/simulation';
import {
  deleteFailedSocietyWideCalculation,
  fetchSocietyWideCalculation,
} from '@/api/societyWideCalculation';
import {
  changeAdminUserType,
  fetchAdminUser,
  fetchUserTypeChanges,
  searchAdminUsers,
} from '@/api/v2AdminUsers';
import { AccountAssociationRoutes } from '@/api/v2Associations';
import {
  acceptInvitation,
  createInvitation,
  listInvitations,
  resendInvitation,
  revokeInvitation,
} from '@/api/v2Invitations';
import { deleteMe, dismissTypeChange, exportMe, fetchMe, upgradeAccount } from '@/api/v2Me';
import { createV2UserClient } from '@/api/v2UserClient';
import { matchAllowedOperation, PUBLIC_API_ROUTE_PREFIX } from '@/libs/publicApiRoute/allowList';
import type { Report } from '@/types/ingredients/Report';
import type {
  HouseholdCreationPayload,
  PolicyCreationPayload,
  SimulationCreationPayload,
} from '@/types/payloads';

const SAVED_RECORD_ID = '3f2c8b62-4a43-4d4f-9a5c-0d1b8ad8b7e1';
const BROWSER_USER_ID = '9b0e4c1a-2f3d-4e5f-8a6b-7c8d9e0f1a2b';
const POLICYENGINE_VERSION = '3.9.0';
const ECONOMY_PARAMETERS = { region: 'us', time_period: '2026' };

const browserUserClient = () =>
  createV2UserClient({ credentials: { kind: 'unauthenticated', userId: BROWSER_USER_ID } });
const savedRecords = (path: string) =>
  new AccountAssociationRoutes<unknown>(
    { client: browserUserClient(), countryId: 'us' },
    path,
    'Saved record'
  );

interface SentRequest {
  readonly method: string;
  readonly url: string;
}

const sentRequests: SentRequest[] = [];

function recordRequest(input: RequestInfo | URL, init?: RequestInit): SentRequest {
  if (input instanceof Request) {
    return { method: input.method, url: input.url };
  }
  return { method: init?.method ?? 'GET', url: String(input) };
}

// Each Public API call the calculator makes from the browser, by the module
// that makes it, with the method and Public API path it sends.
const PUBLIC_API_CALLS: ReadonlyArray<[string, () => Promise<unknown>, string, string]> = [
  ['country metadata', () => fetchMetadata('us'), 'GET', '/us/metadata'],
  ['a household', () => fetchHouseholdById('us', '12345'), 'GET', '/us/household/12345'],
  [
    'a new household',
    () => createHousehold({ country_id: 'us', data: {} } as unknown as HouseholdCreationPayload),
    'POST',
    '/us/household',
  ],
  [
    'a household under a policy',
    () => fetchHouseholdCalculation('uk', '12345', '2'),
    'GET',
    '/uk/household/12345/policy/2',
  ],
  [
    'a household calculation with variations',
    () => fetchHouseholdVariation('us', {}, {}),
    'POST',
    '/us/calculate-full',
  ],
  ['a policy', () => fetchPolicyById('us', '98765'), 'GET', '/us/policy/98765'],
  [
    'a new policy',
    () => createPolicy('us', { data: {} } as unknown as PolicyCreationPayload),
    'POST',
    '/us/policy',
  ],
  ['a simulation', () => fetchSimulationById('us', '4321'), 'GET', '/us/simulation/4321'],
  [
    'a new simulation',
    () =>
      createSimulation('us', {
        population_id: '12345',
        population_type: 'household',
        policy_id: 2,
      } satisfies SimulationCreationPayload),
    'POST',
    '/us/simulation',
  ],
  [
    "a simulation's output",
    () => updateSimulationOutput('us', '4321', {}),
    'PATCH',
    '/us/simulation',
  ],
  ["a simulation's failure", () => markSimulationError('us', '4321'), 'PATCH', '/us/simulation'],
  ['a report', () => fetchReportById('uk', '777'), 'GET', '/uk/report/777'],
  [
    'a new report',
    () => createReport('uk', { simulation_1_id: 1, simulation_2_id: 2, year: '2026' }),
    'POST',
    '/uk/report',
  ],
  [
    "a report's output",
    () =>
      markReportCompleted('uk', '777', {
        id: '777',
        countryId: 'uk',
        year: '2026',
        apiVersion: null,
        simulationIds: [],
        status: 'complete',
        output: null,
      } satisfies Report),
    'PATCH',
    '/uk/report',
  ],
  [
    'an economy comparison',
    () => fetchSocietyWideCalculation('us', '98765', '2', ECONOMY_PARAMETERS),
    'GET',
    '/us/economy/98765/over/2',
  ],
  [
    "an economy comparison's stored failure",
    () => deleteFailedSocietyWideCalculation('us', '98765', '2', ECONOMY_PARAMETERS),
    'DELETE',
    '/us/economy/98765/over/2',
  ],
  [
    'a budget-window economy comparison',
    () => fetchBudgetWindow('us', '98765', '2', { region: 'us', startYear: 2026, windowSize: 10 }),
    'GET',
    '/us/economy/98765/over/2/budget-window',
  ],
  ['the model catalog', () => fetchV2ModelCatalogMetadata('us'), 'GET', '/v2/model-catalog'],
  [
    'catalog parameters',
    () => fetchCatalogParameters('us', POLICYENGINE_VERSION, ['gov.irs.credits.ctc.amount']),
    'GET',
    '/v2/model-catalog/parameters',
  ],
  [
    'catalog variables',
    () => fetchCatalogVariables('us', POLICYENGINE_VERSION),
    'GET',
    '/v2/model-catalog/variables',
  ],
  [
    'parameter children',
    () => fetchParameterChildren('us', POLICYENGINE_VERSION, 'gov'),
    'GET',
    '/v2/parameters/children',
  ],
  [
    'the parameter search file',
    () => fetchParameterSearchFile('us', POLICYENGINE_VERSION),
    'GET',
    '/v2/parameters/search-file',
  ],
  [
    'a new v2 policy',
    () =>
      createV2ReformPolicy(
        'us',
        [],
        { policyengineVersion: POLICYENGINE_VERSION, taxBenefitModelId: 'policyengine-us' },
        {}
      ),
    'POST',
    '/v2/policies',
  ],
  [
    'a v2 policy',
    () => fetchV2PolicyItem('us', SAVED_RECORD_ID),
    'GET',
    `/v2/policies/${SAVED_RECORD_ID}`,
  ],
  ['the account', () => fetchMe(browserUserClient(), 'us'), 'GET', '/v2/me'],
  [
    'the admin user search',
    () => searchAdminUsers(browserUserClient(), { email: 'ada', offset: 0, limit: 25 }),
    'GET',
    '/v2/admin/users',
  ],
  [
    'an admin user',
    () => fetchAdminUser(browserUserClient(), SAVED_RECORD_ID),
    'GET',
    `/v2/admin/users/${SAVED_RECORD_ID}`,
  ],
  [
    "an admin's change of a user's type",
    () =>
      changeAdminUserType(browserUserClient(), SAVED_RECORD_ID, {
        userType: 'author',
        expectedUserType: 'standard',
      }),
    'PATCH',
    `/v2/admin/users/${SAVED_RECORD_ID}`,
  ],
  [
    "a user's type changes",
    () => fetchUserTypeChanges(browserUserClient(), SAVED_RECORD_ID),
    'GET',
    `/v2/admin/users/${SAVED_RECORD_ID}/user-type-changes`,
  ],
  [
    'the pending invitations',
    () => listInvitations(browserUserClient()),
    'GET',
    '/v2/admin/invitations',
  ],
  [
    'an invitation',
    () => createInvitation(browserUserClient(), { email: 'grace@example.org', userType: 'author' }),
    'POST',
    '/v2/admin/invitations',
  ],
  [
    "an invitation's resend",
    () => resendInvitation(browserUserClient(), SAVED_RECORD_ID),
    'POST',
    `/v2/admin/invitations/${SAVED_RECORD_ID}/resend`,
  ],
  [
    "an invitation's revocation",
    () => revokeInvitation(browserUserClient(), SAVED_RECORD_ID),
    'DELETE',
    `/v2/admin/invitations/${SAVED_RECORD_ID}`,
  ],
  [
    "an invitation's acceptance",
    () => acceptInvitation(browserUserClient(), 'us', 'invitation-token'),
    'POST',
    '/v2/me/invitations/accept',
  ],
  [
    "a type change's dismissal",
    () => dismissTypeChange(browserUserClient(), 'us', SAVED_RECORD_ID),
    'POST',
    `/v2/me/type-changes/${SAVED_RECORD_ID}/dismiss`,
  ],
  ['the account export', () => exportMe(browserUserClient(), 'us'), 'GET', '/v2/me/export'],
  ['the account deletion', () => deleteMe(browserUserClient(), 'us'), 'DELETE', '/v2/me'],
  [
    'the account upgrade',
    () => upgradeAccount(browserUserClient(), 'us', BROWSER_USER_ID),
    'POST',
    '/v2/me/upgrade',
  ],
  [
    'a shared report',
    () => fetchSharedReport('us', SAVED_RECORD_ID),
    'GET',
    `/v2/shared-reports/${SAVED_RECORD_ID}`,
  ],
  ['the saved reports', () => savedRecords('user-reports').list(), 'GET', '/v2/user-reports'],
  [
    'a new saved report',
    () => savedRecords('user-reports').create({ country_id: 'us' }),
    'POST',
    '/v2/user-reports',
  ],
  [
    'a saved report update',
    () => savedRecords('user-reports').patch(SAVED_RECORD_ID, { label: 'Renamed' }),
    'PATCH',
    `/v2/user-reports/${SAVED_RECORD_ID}`,
  ],
  [
    'a saved report',
    () => savedRecords('user-reports').get(SAVED_RECORD_ID),
    'GET',
    `/v2/user-reports/${SAVED_RECORD_ID}`,
  ],
  ['the saved policies', () => savedRecords('user-policies').list(), 'GET', '/v2/user-policies'],
  [
    'a new saved policy',
    () => savedRecords('user-policies').create({ country_id: 'us' }),
    'POST',
    '/v2/user-policies',
  ],
  [
    'a saved policy update',
    () => savedRecords('user-policies').patch(SAVED_RECORD_ID, { label: 'Renamed' }),
    'PATCH',
    `/v2/user-policies/${SAVED_RECORD_ID}`,
  ],
  [
    'a saved policy',
    () => savedRecords('user-policies').get(SAVED_RECORD_ID),
    'GET',
    `/v2/user-policies/${SAVED_RECORD_ID}`,
  ],
  [
    'a saved policy deletion',
    () => savedRecords('user-policies').delete(SAVED_RECORD_ID),
    'DELETE',
    `/v2/user-policies/${SAVED_RECORD_ID}`,
  ],
  [
    'the first matching saved household',
    () => savedRecords('user-households').findFirst({ household_id: '12345' }),
    'GET',
    '/v2/user-households',
  ],
  [
    'a new saved household',
    () => savedRecords('user-households').create({ country_id: 'us' }),
    'POST',
    '/v2/user-households',
  ],
];

beforeEach(() => {
  sentRequests.length = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      sentRequests.push(recordRequest(input, init));
      return Response.json({ status: 'ok', message: null, result: {} });
    })
  );
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('the Public API calls the calculator makes from the browser', () => {
  test.each(PUBLIC_API_CALLS)(
    'given %s then the browser sends it to the same-origin route, which forwards it',
    async (_label, sendCall, expectedMethod, expectedPublicApiPath) => {
      // When
      await sendCall().catch(() => undefined);

      // Then
      expect(sentRequests.length).toBeGreaterThan(0);
      const [firstRequest] = sentRequests;
      const requestUrl = new URL(firstRequest.url, window.location.origin);
      expect(requestUrl.origin).toBe(window.location.origin);
      expect(firstRequest.method).toBe(expectedMethod);
      expect(requestUrl.pathname).toBe(`${PUBLIC_API_ROUTE_PREFIX}${expectedPublicApiPath}`);
      expect(
        matchAllowedOperation(
          firstRequest.method,
          requestUrl.pathname.slice(PUBLIC_API_ROUTE_PREFIX.length)
        )
      ).not.toBeNull();
    }
  );
});
