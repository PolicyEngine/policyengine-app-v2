import { describe, expect, test } from 'vitest';
import {
  fetchV2HouseholdReport,
  householdRunFromV2Report,
  readSharedHouseholdReport,
  saveV2HouseholdReport,
  submitV2HouseholdReport,
  waitForV2HouseholdReport,
} from '@/api/v2HouseholdReports';
import { isV2ApiError } from '@/api/v2UserClient';
import {
  noWait,
  requestsFor,
  routedClient,
  V2_CALCULATION_POLICYENGINE_VERSION,
  V2_REFORM_POLICY_ID,
} from '@/tests/fixtures/api/v2HouseholdCalculationMocks';
import {
  failedHouseholdReportItem,
  householdReportItem,
  householdReportRoutes,
  reportResponse,
  SAVED_HOUSEHOLD_REPORT_NAME,
  sharedHouseholdReportItem,
  V2_HOUSEHOLD_REPORT_IDS,
} from '@/tests/fixtures/api/v2HouseholdReportMocks';
import {
  createTestApiContext,
  errorResponse,
  fetchCall,
  itemResponse,
  TEST_ACCESS_TOKEN,
} from '@/tests/fixtures/api/v2UserMocks';
import {
  STORED_V2_HOUSEHOLD_ID,
  storedV2Household,
  US_SINGLE_PARENT_CALCULATED_IN_V1_NAMES,
  US_SINGLE_PARENT_V2_BODY,
} from '@/tests/fixtures/models/household/v2DocumentCodecMocks';

const SUBMIT = 'POST /v2/reports';
const READ_REPORT = `GET /v2/reports/${V2_HOUSEHOLD_REPORT_IDS.REPORT}`;

describe('submitV2HouseholdReport', () => {
  test('given a stored household and a reform then a household report is created for both policies', async () => {
    // Given
    const { client, fetchMock } = routedClient({
      [SUBMIT]: () => reportResponse(householdReportItem('pending'), 201),
    });

    // When
    const item = await submitV2HouseholdReport(
      {
        countryId: 'us',
        householdId: STORED_V2_HOUSEHOLD_ID,
        baselinePolicyId: null,
        reformPolicyId: V2_REFORM_POLICY_ID,
      },
      client
    );

    // Then
    const [request] = requestsFor(fetchMock, SUBMIT);
    expect(new URL(request.url).searchParams.get('country_id')).toBe('us');
    expect(await request.json()).toEqual({
      kind: 'household',
      country_id: 'us',
      household_id: STORED_V2_HOUSEHOLD_ID,
      baseline: { policy_id: null },
      reform: { policy_id: V2_REFORM_POLICY_ID },
      add_missing_variables: true,
    });
    expect(item.id).toBe(V2_HOUSEHOLD_REPORT_IDS.REPORT);
  });

  test('given the same policy as baseline and reform then the report is baseline-only', async () => {
    // Given
    const { client, fetchMock } = routedClient({
      [SUBMIT]: () => reportResponse(householdReportItem('pending', { reform: false }), 201),
    });

    // When
    await submitV2HouseholdReport(
      {
        countryId: 'us',
        householdId: STORED_V2_HOUSEHOLD_ID,
        baselinePolicyId: null,
        reformPolicyId: null,
      },
      client
    );

    // Then
    const [request] = requestsFor(fetchMock, SUBMIT);
    expect(await request.json()).toMatchObject({
      baseline: { policy_id: null },
      reform: null,
      add_missing_variables: true,
    });
  });

  test("given a household report submitted and calculated then its run has the household's net income", async () => {
    // Given
    const { client } = routedClient(householdReportRoutes());
    const submitted = await submitV2HouseholdReport(
      {
        countryId: 'us',
        householdId: STORED_V2_HOUSEHOLD_ID,
        baselinePolicyId: null,
        reformPolicyId: V2_REFORM_POLICY_ID,
      },
      client
    );

    // When
    const calculated = await waitForV2HouseholdReport('us', submitted.id, { client, wait: noWait });

    // Then
    const run = householdRunFromV2Report(
      calculated,
      storedV2Household('us', US_SINGLE_PARENT_V2_BODY.household_data)
    );
    expect(run.netIncome).toEqual({ baseline: 12000, reform: 13500, change: 1500 });
  });

  test.each([
    [404, 'Policy 4b4b4b4b-4b4b-4b4b-8b4b-4b4b4b4b4b4b not found.'],
    [422, 'The household has no default year.'],
    [503, 'The simulation service is unavailable.'],
  ])(
    'given the Public API answers %s, "%s", then it rejects with that status and message',
    async (status, message) => {
      // Given
      const { client } = routedClient({ [SUBMIT]: () => errorResponse(status, message) });

      // When
      const error = await submitV2HouseholdReport(
        {
          countryId: 'us',
          householdId: STORED_V2_HOUSEHOLD_ID,
          baselinePolicyId: null,
          reformPolicyId: V2_REFORM_POLICY_ID,
        },
        client
      ).catch((rejection: unknown) => rejection);

      // Then
      expect(isV2ApiError(error, status)).toBe(true);
      expect((error as Error).message).toBe(message);
    }
  );
});

describe('fetchV2HouseholdReport', () => {
  test('given a household report ID then it is read in its country', async () => {
    // Given
    const { client, fetchMock } = routedClient({
      [READ_REPORT]: () => reportResponse(householdReportItem()),
    });

    // When
    const item = await fetchV2HouseholdReport('us', V2_HOUSEHOLD_REPORT_IDS.REPORT, client);

    // Then
    const [request] = requestsFor(fetchMock, READ_REPORT);
    expect(new URL(request.url).searchParams.get('country_id')).toBe('us');
    expect(item).toEqual(householdReportItem());
  });

  test('given the ID of an economy report then it is refused as not a household report', async () => {
    // Given
    const { client } = routedClient({
      [READ_REPORT]: () => reportResponse({ ...householdReportItem(), kind: 'economy' }),
    });

    // When
    const reading = fetchV2HouseholdReport('us', V2_HOUSEHOLD_REPORT_IDS.REPORT, client);

    // Then
    await expect(reading).rejects.toThrow('This report is not a household report.');
  });
});

describe('waitForV2HouseholdReport', () => {
  test('given a report still running then it is read until it succeeds', async () => {
    // Given
    const { client, fetchMock } = routedClient({
      [READ_REPORT]: [
        () => reportResponse(householdReportItem('pending')),
        () => reportResponse(householdReportItem('running')),
        () => reportResponse(householdReportItem()),
      ],
    });

    // When
    const item = await waitForV2HouseholdReport('us', V2_HOUSEHOLD_REPORT_IDS.REPORT, {
      client,
      wait: noWait,
    });

    // Then
    expect(item.status).toBe('succeeded');
    expect(requestsFor(fetchMock, READ_REPORT)).toHaveLength(3);
  });

  test('given a report whose calculation failed then it rejects with the reason', async () => {
    // Given
    const { client } = routedClient({
      [READ_REPORT]: () =>
        reportResponse(failedHouseholdReportItem('ctc_value cannot be negative')),
    });

    // When
    const waiting = waitForV2HouseholdReport('us', V2_HOUSEHOLD_REPORT_IDS.REPORT, {
      client,
      wait: noWait,
    });

    // Then
    await expect(waiting).rejects.toThrow('ctc_value cannot be negative');
  });

  test('given a report the simulation service could not run then it rejects, saying so', async () => {
    // Given
    const { client } = routedClient({
      [READ_REPORT]: () => reportResponse({ ...householdReportItem('not_run'), run: null }),
    });

    // When
    const waiting = waitForV2HouseholdReport('us', V2_HOUSEHOLD_REPORT_IDS.REPORT, {
      client,
      wait: noWait,
    });

    // Then
    await expect(waiting).rejects.toThrow(
      'The household report has not been calculated. Try again later.'
    );
  });
});

describe('householdRunFromV2Report', () => {
  test('given a succeeded report and its stored household then the run compares its households, in the v1 names', () => {
    // When
    const run = householdRunFromV2Report(
      householdReportItem(),
      storedV2Household('us', US_SINGLE_PARENT_V2_BODY.household_data)
    );

    // Then
    expect(run.householdId).toBe(STORED_V2_HOUSEHOLD_ID);
    expect(run.baseline).toEqual(US_SINGLE_PARENT_CALCULATED_IN_V1_NAMES);
    expect(run.netIncome).toEqual({ baseline: 12000, reform: 13500, change: 1500 });
    expect(run.provenance.reform.policyengineBundle).toEqual({
      policyengine_version: V2_CALCULATION_POLICYENGINE_VERSION,
    });
  });

  test('given a baseline-only report then the reform reads the baseline', () => {
    // When
    const run = householdRunFromV2Report(
      householdReportItem('succeeded', { reform: false }),
      storedV2Household('us', US_SINGLE_PARENT_V2_BODY.household_data)
    );

    // Then
    expect(run.reform).toEqual(run.baseline);
    expect(run.netIncome.change).toBe(0);
  });
});

describe('saveV2HouseholdReport', () => {
  test("given a household report then the account saves it under the user's name for it", async () => {
    // Given
    const { context, fetchMock } = createTestApiContext('us');
    fetchMock.mockResolvedValue(
      itemResponse({
        id: V2_HOUSEHOLD_REPORT_IDS.SAVED_REPORT,
        report_id: V2_HOUSEHOLD_REPORT_IDS.REPORT,
      })
    );

    // When
    const savedReportId = await saveV2HouseholdReport(context, {
      countryId: 'us',
      reportId: V2_HOUSEHOLD_REPORT_IDS.REPORT,
      name: SAVED_HOUSEHOLD_REPORT_NAME,
    });

    // Then
    const call = fetchCall(fetchMock);
    expect([call.method, call.path, call.query.country_id]).toEqual([
      'POST',
      '/v2/user-reports',
      'us',
    ]);
    expect(call.headers.Authorization).toBe(`Bearer ${TEST_ACCESS_TOKEN}`);
    expect(call.body).toEqual({
      country_id: 'us',
      report_id: V2_HOUSEHOLD_REPORT_IDS.REPORT,
      name: SAVED_HOUSEHOLD_REPORT_NAME,
    });
    expect(savedReportId).toBe(V2_HOUSEHOLD_REPORT_IDS.SAVED_REPORT);
  });
});

describe('readSharedHouseholdReport', () => {
  const READ_SHARED = `GET /v2/shared-reports/${V2_HOUSEHOLD_REPORT_IDS.SAVED_REPORT}`;

  test("given a saved report's link then it names the report and the owner's name for it", async () => {
    // Given
    const { client } = routedClient({
      [READ_SHARED]: () => itemResponse(sharedHouseholdReportItem()),
    });

    // When
    const shared = await readSharedHouseholdReport(
      'us',
      V2_HOUSEHOLD_REPORT_IDS.SAVED_REPORT,
      client
    );

    // Then
    expect(shared).toEqual({
      reportId: V2_HOUSEHOLD_REPORT_IDS.REPORT,
      name: SAVED_HOUSEHOLD_REPORT_NAME,
    });
  });

  test('given a link no saved report has then there is none', async () => {
    // Given
    const { client } = routedClient({
      [READ_SHARED]: () => errorResponse(404, 'Report not found.'),
    });

    // When
    const shared = await readSharedHouseholdReport(
      'us',
      V2_HOUSEHOLD_REPORT_IDS.SAVED_REPORT,
      client
    );

    // Then
    expect(shared).toBeNull();
  });

  test('given a saved report that names no v2 report then it is refused, saying so', async () => {
    // Given
    const { client } = routedClient({
      [READ_SHARED]: () => itemResponse(sharedHouseholdReportItem(null)),
    });

    // When
    const reading = readSharedHouseholdReport('us', V2_HOUSEHOLD_REPORT_IDS.SAVED_REPORT, client);

    // Then
    await expect(reading).rejects.toThrow('This saved report is not a household report.');
  });
});
