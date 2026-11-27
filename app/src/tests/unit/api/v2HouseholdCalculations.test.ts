// @vitest-environment node
// These requests carry an abort signal, which Node's Request accepts only from
// Node's own AbortController, not from jsdom's.
import { describe, expect, test, vi } from 'vitest';
import {
  calculateV2Household,
  V2HouseholdCalculationFailedError,
} from '@/api/v2HouseholdCalculations';
import { isV2ApiError } from '@/api/v2UserClient';
import {
  calculationItem,
  calculationResponse,
  EARNINGS_AXES,
  failedCalculation,
  noWait,
  readCalculation,
  requestsFor,
  routedClient,
  runningCalculation,
  SUBMIT_CALCULATION,
  submittedResponse,
  V2_CALCULATION_IDS,
  V2_REFORM_POLICY_ID,
  V2_STORED_HOUSEHOLD_ID,
} from '@/tests/fixtures/api/v2HouseholdCalculationMocks';
import { errorResponse } from '@/tests/fixtures/api/v2UserMocks';

const READ_BASELINE = readCalculation(V2_CALCULATION_IDS.BASELINE);

/** The household stored for these tests, calculated under current law. */
const CURRENT_LAW_REQUEST = {
  countryId: 'us',
  householdId: V2_STORED_HOUSEHOLD_ID,
  policyId: null,
} as const;

describe('calculateV2Household', () => {
  test('given a household, a policy, axes and missing variables then the calculation names each', async () => {
    // Given
    const { client, fetchMock } = routedClient({
      [SUBMIT_CALCULATION]: () => submittedResponse(runningCalculation()),
      [READ_BASELINE]: () => calculationResponse(calculationItem()),
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
    const [request] = requestsFor(fetchMock, SUBMIT_CALCULATION);
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
      [SUBMIT_CALCULATION]: () => submittedResponse(runningCalculation()),
      [READ_BASELINE]: () => calculationResponse(calculationItem()),
    });

    // When
    await calculateV2Household(CURRENT_LAW_REQUEST, { client, wait: noWait });

    // Then
    const [request] = requestsFor(fetchMock, SUBMIT_CALCULATION);
    expect(await request.json()).toEqual({
      country_id: 'us',
      household_id: V2_STORED_HOUSEHOLD_ID,
      policy_id: null,
      add_missing_variables: false,
    });
  });

  test('given a calculation still running then it is read until it succeeds, and returned with its output', async () => {
    // Given
    const { client, fetchMock } = routedClient({
      [SUBMIT_CALCULATION]: () => submittedResponse(runningCalculation({ status: 'pending' })),
      [READ_BASELINE]: [
        () => calculationResponse(runningCalculation()),
        () => calculationResponse(calculationItem()),
      ],
    });

    // When
    const calculation = await calculateV2Household(CURRENT_LAW_REQUEST, {
      client,
      wait: noWait,
    });

    // Then
    expect(requestsFor(fetchMock, READ_BASELINE)).toHaveLength(2);
    expect(calculation).toEqual(calculationItem());
  });

  test('given a submission that has already finished then the calculation is read once, without waiting', async () => {
    // Given: the submission names no result, even for a finished calculation
    const wait = vi.fn(noWait);
    const { client, fetchMock } = routedClient({
      [SUBMIT_CALCULATION]: () => submittedResponse(calculationItem()),
      [READ_BASELINE]: () => calculationResponse(calculationItem()),
    });

    // When
    const calculation = await calculateV2Household(CURRENT_LAW_REQUEST, { client, wait });

    // Then
    expect(calculation).toEqual(calculationItem());
    expect(requestsFor(fetchMock, READ_BASELINE)).toHaveLength(1);
    expect(wait).not.toHaveBeenCalled();
  });

  test('given a submission that has already finished and its first read fails with 503 then it is read again', async () => {
    // Given
    const { client, fetchMock } = routedClient({
      [SUBMIT_CALCULATION]: () => submittedResponse(calculationItem()),
      [READ_BASELINE]: [
        () => errorResponse(503, 'The simulation service is unavailable.'),
        () => calculationResponse(calculationItem()),
      ],
    });

    // When
    const calculation = await calculateV2Household(CURRENT_LAW_REQUEST, {
      client,
      wait: noWait,
    });

    // Then
    expect(calculation).toEqual(calculationItem());
    expect(requestsFor(fetchMock, READ_BASELINE)).toHaveLength(2);
  });

  test('given a calculation that fails then it rejects with the reason and code the simulation service gave', async () => {
    // Given
    const { client } = routedClient({
      [SUBMIT_CALCULATION]: () => submittedResponse(runningCalculation()),
      [READ_BASELINE]: () =>
        calculationResponse(failedCalculation('employment_income is negative')),
    });

    // When
    const calculation = calculateV2Household(CURRENT_LAW_REQUEST, { client, wait: noWait });

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
    'given API v1 answers %s, "%s", then it rejects with that status and message',
    async (status, message) => {
      // Given
      const { client } = routedClient({
        [SUBMIT_CALCULATION]: () => errorResponse(status, message),
      });

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
      [SUBMIT_CALCULATION]: () => submittedResponse(runningCalculation()),
      [READ_BASELINE]: () => calculationResponse(runningCalculation()),
    });
    const calculation = calculateV2Household(CURRENT_LAW_REQUEST, {
      client,
      pollIntervalMs: 60_000,
      signal: controller.signal,
    });
    await vi.waitFor(() => expect(requestsFor(fetchMock, SUBMIT_CALCULATION)).toHaveLength(1));

    // When
    controller.abort();

    // Then
    await expect(calculation).rejects.toMatchObject({ name: 'AbortError' });
    expect(requestsFor(fetchMock, READ_BASELINE)).toHaveLength(0);
  });

  test('given the wait aborted while the calculation is being read then that request is cancelled', async () => {
    // Given
    const controller = new AbortController();
    const { client, fetchMock } = routedClient({
      [SUBMIT_CALCULATION]: () => submittedResponse(runningCalculation()),
      [READ_BASELINE]: (request) =>
        new Promise<Response>((_resolve, reject) => {
          request.signal.addEventListener('abort', () =>
            reject(new DOMException('This operation was aborted', 'AbortError'))
          );
        }),
    });
    const calculation = calculateV2Household(CURRENT_LAW_REQUEST, {
      client,
      wait: noWait,
      signal: controller.signal,
    });
    await vi.waitFor(() => expect(requestsFor(fetchMock, READ_BASELINE)).toHaveLength(1));

    // When
    controller.abort();

    // Then
    await expect(calculation).rejects.toMatchObject({ name: 'AbortError' });
    expect(requestsFor(fetchMock, READ_BASELINE)[0].signal.aborted).toBe(true);
  });

  test('given a calculation that does not finish within the time limit then it stops waiting', async () => {
    // Given
    let clock = 0;
    const { client } = routedClient({
      [SUBMIT_CALCULATION]: () => submittedResponse(runningCalculation()),
      [READ_BASELINE]: () => calculationResponse(runningCalculation()),
    });

    // When
    const calculation = calculateV2Household(CURRENT_LAW_REQUEST, {
      client,
      timeLimitMs: 6000,
      now: () => clock,
      wait: async (milliseconds) => {
        clock += milliseconds;
      },
    });

    // Then
    await expect(calculation).rejects.toThrow('The household calculation timed out.');
  });
});
