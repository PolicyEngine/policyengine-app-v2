import { describe, expect, test, vi } from 'vitest';
import {
  calculateV2Household,
  fetchV2Household,
  storeV2Household,
  V2HouseholdCalculationFailedError,
} from '@/api/v2HouseholdCalculations';
import { isV2ApiError } from '@/api/v2UserClient';
import {
  calculationItem,
  calculationOutput,
  calculationResponse,
  EARNINGS_AXES,
  failedCalculation,
  noWait,
  requestsFor,
  routedClient,
  runningCalculation,
  V2_CALCULATION_IDS,
  V2_REFORM_POLICY_ID,
  V2_STORED_HOUSEHOLD_ID,
} from '@/tests/fixtures/api/v2HouseholdCalculationMocks';
import { errorResponse, itemResponse } from '@/tests/fixtures/api/v2UserMocks';
import {
  storedV2Household,
  US_SINGLE_PARENT,
  US_SINGLE_PARENT_V2_BODY,
} from '@/tests/fixtures/models/household/v2DocumentCodecMocks';

const SUBMIT = 'POST /v2/household-calculations';
const READ_BASELINE = `GET /v2/household-calculations/${V2_CALCULATION_IDS.BASELINE}`;

describe('storeV2Household', () => {
  test('given a household then it is stored through POST /v2/households, and the stored record returned', async () => {
    // Given
    const stored = storedV2Household('us', US_SINGLE_PARENT_V2_BODY.household_data);
    const { client, fetchMock } = routedClient({
      'POST /v2/households': () => itemResponse(stored, 201),
    });

    // When
    const item = await storeV2Household(US_SINGLE_PARENT, client);

    // Then
    const [request] = requestsFor(fetchMock, 'POST /v2/households');
    expect(new URL(request.url).searchParams.get('country_id')).toBe('us');
    expect(await request.json()).toEqual(US_SINGLE_PARENT_V2_BODY);
    expect(item).toEqual(stored);
  });
});

describe('fetchV2Household', () => {
  test('given a stored household ID then it is read in its country', async () => {
    // Given
    const stored = storedV2Household('us', US_SINGLE_PARENT_V2_BODY.household_data);
    const { client, fetchMock } = routedClient({
      [`GET /v2/households/${stored.id}`]: () => itemResponse(stored),
    });

    // When
    const item = await fetchV2Household('us', stored.id, client);

    // Then
    const [request] = requestsFor(fetchMock, `GET /v2/households/${stored.id}`);
    expect(new URL(request.url).searchParams.get('country_id')).toBe('us');
    expect(item).toEqual(stored);
  });
});

describe('calculateV2Household', () => {
  test('given a household, a policy, axes and missing variables then the calculation names each', async () => {
    // Given
    const { client, fetchMock } = routedClient({
      [SUBMIT]: () => calculationResponse(calculationItem(), 202),
    });

    // When
    await calculateV2Household(
      {
        countryId: 'us',
        householdId: V2_STORED_HOUSEHOLD_ID,
        policyId: V2_REFORM_POLICY_ID,
        axes: EARNINGS_AXES,
        addMissingVariables: true,
      },
      { client, wait: noWait }
    );

    // Then
    const [request] = requestsFor(fetchMock, SUBMIT);
    expect(await request.json()).toEqual({
      country_id: 'us',
      household_id: V2_STORED_HOUSEHOLD_ID,
      policy_id: V2_REFORM_POLICY_ID,
      axes: EARNINGS_AXES,
      add_missing_variables: true,
    });
  });

  test('given current law then the calculation names no policy and no axes', async () => {
    // Given
    const { client, fetchMock } = routedClient({
      [SUBMIT]: () => calculationResponse(calculationItem(), 202),
    });

    // When
    await calculateV2Household(
      { countryId: 'us', householdId: V2_STORED_HOUSEHOLD_ID, policyId: null },
      { client, wait: noWait }
    );

    // Then
    const [request] = requestsFor(fetchMock, SUBMIT);
    expect(await request.json()).toEqual({
      country_id: 'us',
      household_id: V2_STORED_HOUSEHOLD_ID,
      policy_id: null,
      add_missing_variables: false,
    });
  });

  test('given a calculation still running then it is read until it succeeds, and its output returned', async () => {
    // Given
    const { client, fetchMock } = routedClient({
      [SUBMIT]: () => calculationResponse(runningCalculation({ status: 'pending' }), 202),
      [READ_BASELINE]: [
        () => calculationResponse(runningCalculation()),
        () => calculationResponse(calculationItem()),
      ],
    });

    // When
    const output = await calculateV2Household(
      { countryId: 'us', householdId: V2_STORED_HOUSEHOLD_ID, policyId: null },
      { client, wait: noWait }
    );

    // Then
    expect(requestsFor(fetchMock, READ_BASELINE)).toHaveLength(2);
    expect(output).toEqual(calculationOutput());
  });

  test('given a calculation that fails then it rejects with the reason the simulation service gave', async () => {
    // Given
    const { client } = routedClient({
      [SUBMIT]: () => calculationResponse(runningCalculation(), 202),
      [READ_BASELINE]: () =>
        calculationResponse(failedCalculation('employment_income is negative')),
    });

    // When
    const calculation = calculateV2Household(
      { countryId: 'us', householdId: V2_STORED_HOUSEHOLD_ID, policyId: null },
      { client, wait: noWait }
    );

    // Then
    await expect(calculation).rejects.toEqual(
      new V2HouseholdCalculationFailedError('employment_income is negative', 'calculation_failed')
    );
  });

  test.each([
    [404, 'Household 3a3a3a3a-3a3a-4a3a-8a3a-3a3a3a3a3a3a not found.'],
    [422, 'Country ca does not offer household calculations.'],
    [422, 'The household has no default year.'],
    [422, 'gov.irs.credits.ctc.amount is not a parameter of this catalog version.'],
    [503, 'The simulation service is unavailable.'],
  ])(
    'given the Public API answers %s, "%s", then it rejects with that status and message',
    async (status, message) => {
      // Given
      const { client } = routedClient({ [SUBMIT]: () => errorResponse(status, message) });

      // When
      const error = await calculateV2Household(
        { countryId: 'us', householdId: V2_STORED_HOUSEHOLD_ID, policyId: V2_REFORM_POLICY_ID },
        { client, wait: noWait }
      ).catch((rejection: unknown) => rejection);

      // Then
      expect(isV2ApiError(error, status)).toBe(true);
      expect((error as Error).message).toBe(message);
    }
  );

  test('given the wait aborted while the calculation runs then it reads the calculation no more', async () => {
    // Given
    const controller = new AbortController();
    const { client, fetchMock } = routedClient({
      [SUBMIT]: () => calculationResponse(runningCalculation(), 202),
      [READ_BASELINE]: () => calculationResponse(runningCalculation()),
    });
    const calculation = calculateV2Household(
      { countryId: 'us', householdId: V2_STORED_HOUSEHOLD_ID, policyId: null },
      { client, pollIntervalMs: 60_000, signal: controller.signal }
    );
    await vi.waitFor(() => expect(requestsFor(fetchMock, SUBMIT)).toHaveLength(1));

    // When
    controller.abort();

    // Then
    await expect(calculation).rejects.toMatchObject({ name: 'AbortError' });
    expect(requestsFor(fetchMock, READ_BASELINE)).toHaveLength(0);
  });

  test('given a calculation that does not finish within the time limit then it stops waiting', async () => {
    // Given
    let clock = 0;
    const { client } = routedClient({
      [SUBMIT]: () => calculationResponse(runningCalculation(), 202),
      [READ_BASELINE]: () => calculationResponse(runningCalculation()),
    });

    // When
    const calculation = calculateV2Household(
      { countryId: 'us', householdId: V2_STORED_HOUSEHOLD_ID, policyId: null },
      {
        client,
        timeLimitMs: 6000,
        now: () => clock,
        wait: async (milliseconds) => {
          clock += milliseconds;
        },
      }
    );

    // Then
    await expect(calculation).rejects.toThrow('The household calculation timed out.');
  });
});
