// @vitest-environment node
// These requests carry an abort signal, which Node's Request accepts only from
// Node's own AbortController, not from jsdom's.
import { describe, expect, test } from 'vitest';
import { runV2FlagshipHousehold, v2PolicyIdFor } from '@/libs/flagship/v2HouseholdRun';
import {
  answerByPolicy,
  calculationResponse,
  failedCalculation,
  noWait,
  requestsFor,
  routedClient,
  runningCalculation,
  V2_CALCULATION_IDS,
  V2_CALCULATION_POLICYENGINE_VERSION,
  V2_REFORM_POLICY_ID,
  V2_SPM_CONFIG,
  V2_SPM_PROVENANCE,
} from '@/tests/fixtures/api/v2HouseholdCalculationMocks';
import { itemResponse } from '@/tests/fixtures/api/v2UserMocks';
import { REFORM_POLICY_ID } from '@/tests/fixtures/libs/flagship/householdRunMocks';
import {
  STORED_V2_HOUSEHOLD_ID,
  storedV2Household,
  US_SINGLE_PARENT,
  US_SINGLE_PARENT_CALCULATED_IN_V1_NAMES,
  US_SINGLE_PARENT_V2_BODY,
  V2_CODEC_YEAR,
} from '@/tests/fixtures/models/household/v2DocumentCodecMocks';

const STORE = 'POST /v2/households';
const SUBMIT = 'POST /v2/household-calculations';

function clientForSingleParent(submit = answerByPolicy(V2_REFORM_POLICY_ID)) {
  return routedClient({
    [STORE]: () =>
      itemResponse(storedV2Household('us', US_SINGLE_PARENT_V2_BODY.household_data), 201),
    [SUBMIT]: submit,
  });
}

async function submittedBodies(fetchMock: ReturnType<typeof routedClient>['fetchMock']) {
  return Promise.all(requestsFor(fetchMock, SUBMIT).map((request) => request.json()));
}

describe('runV2FlagshipHousehold', () => {
  test('given a household and a reform then it is stored once and calculated under each policy, with every variable', async () => {
    // Given
    const { client, fetchMock } = clientForSingleParent();

    // When
    await runV2FlagshipHousehold(
      {
        year: V2_CODEC_YEAR,
        household: US_SINGLE_PARENT,
        baselinePolicyId: null,
        reformPolicyId: V2_REFORM_POLICY_ID,
      },
      { client, wait: noWait }
    );

    // Then
    expect(requestsFor(fetchMock, STORE)).toHaveLength(1);
    expect(await submittedBodies(fetchMock)).toEqual([
      {
        country_id: 'us',
        household_id: STORED_V2_HOUSEHOLD_ID,
        policy_id: null,
        add_missing_variables: true,
      },
      {
        country_id: 'us',
        household_id: STORED_V2_HOUSEHOLD_ID,
        policy_id: V2_REFORM_POLICY_ID,
        add_missing_variables: true,
      },
    ]);
  });

  test('given both calculations then the run compares them, in the v1 names, for the stored household', async () => {
    // Given
    const { client } = clientForSingleParent();

    // When
    const run = await runV2FlagshipHousehold(
      {
        year: V2_CODEC_YEAR,
        household: US_SINGLE_PARENT,
        baselinePolicyId: null,
        reformPolicyId: V2_REFORM_POLICY_ID,
      },
      { client, wait: noWait }
    );

    // Then
    expect(run.householdId).toBe(STORED_V2_HOUSEHOLD_ID);
    expect(run.baseline).toEqual(US_SINGLE_PARENT_CALCULATED_IN_V1_NAMES);
    expect(run.netIncome).toEqual({ baseline: 12000, reform: 13500, change: 1500 });
    expect(run.programs.map((program) => [program.id, program.change])).toEqual([['eitc', 1500]]);
  });

  test('given the same policy as baseline and reform then one calculation serves both', async () => {
    // Given
    const { client, fetchMock } = clientForSingleParent();

    // When
    const run = await runV2FlagshipHousehold(
      {
        year: V2_CODEC_YEAR,
        household: US_SINGLE_PARENT,
        baselinePolicyId: null,
        reformPolicyId: null,
      },
      { client, wait: noWait }
    );

    // Then
    expect(requestsFor(fetchMock, SUBMIT)).toHaveLength(1);
    expect(run.reform).toEqual(run.baseline);
    expect(run.netIncome.change).toBe(0);
  });

  test('given a US calculation then each policy keeps its SPM settings and receipt and its .py version', async () => {
    // Given
    const { client } = clientForSingleParent();

    // When
    const run = await runV2FlagshipHousehold(
      {
        year: V2_CODEC_YEAR,
        household: US_SINGLE_PARENT,
        baselinePolicyId: null,
        reformPolicyId: V2_REFORM_POLICY_ID,
      },
      { client, wait: noWait }
    );

    // Then
    expect(run.provenance.reform).toEqual({
      policyengineBundle: { policyengine_version: V2_CALCULATION_POLICYENGINE_VERSION },
      spmConfig: V2_SPM_CONFIG,
      spmProvenance: V2_SPM_PROVENANCE,
    });
  });

  test('given a calculation that fails then the run fails with the reason', async () => {
    // Given
    const { client } = clientForSingleParent(() =>
      calculationResponse(failedCalculation('The household has a negative age.'), 202)
    );

    // When
    const run = runV2FlagshipHousehold(
      {
        year: V2_CODEC_YEAR,
        household: US_SINGLE_PARENT,
        baselinePolicyId: null,
        reformPolicyId: V2_REFORM_POLICY_ID,
      },
      { client, wait: noWait }
    );

    // Then
    await expect(run).rejects.toThrow('The household has a negative age.');
  });

  test("given one policy's calculation fails then the other's is no longer read", async () => {
    // Given
    const readBaseline = `GET /v2/household-calculations/${V2_CALCULATION_IDS.BASELINE}`;
    const { client, fetchMock } = routedClient({
      [STORE]: () =>
        itemResponse(storedV2Household('us', US_SINGLE_PARENT_V2_BODY.household_data), 201),
      [SUBMIT]: async (request) => {
        const { policy_id: policyId } = (await request.clone().json()) as {
          policy_id: string | null;
        };
        return calculationResponse(
          policyId === V2_REFORM_POLICY_ID
            ? failedCalculation('The reform changes a parameter this version lacks.')
            : runningCalculation(),
          202
        );
      },
      [readBaseline]: () => calculationResponse(runningCalculation()),
    });

    // When
    await expect(
      runV2FlagshipHousehold(
        {
          year: V2_CODEC_YEAR,
          household: US_SINGLE_PARENT,
          baselinePolicyId: null,
          reformPolicyId: V2_REFORM_POLICY_ID,
        },
        { client, pollIntervalMs: 5 }
      )
    ).rejects.toThrow('The reform changes a parameter this version lacks.');
    const readsAtFailure = requestsFor(fetchMock, readBaseline).length;
    await new Promise((resolve) => {
      setTimeout(resolve, 60);
    });

    // Then
    expect(requestsFor(fetchMock, readBaseline)).toHaveLength(readsAtFailure);
  });

  test('given the Public API cannot be reached then the run fails in plain words', async () => {
    // Given
    const { client } = routedClient({
      [STORE]: () => Promise.reject(new TypeError('Failed to fetch')),
    });

    // When
    const run = runV2FlagshipHousehold(
      {
        year: V2_CODEC_YEAR,
        household: US_SINGLE_PARENT,
        baselinePolicyId: null,
        reformPolicyId: V2_REFORM_POLICY_ID,
      },
      { client, wait: noWait }
    );

    // Then
    await expect(run).rejects.toThrow('Could not reach PolicyEngine. Check your connection.');
  });

  test('given a household whose inputs are in another year then nothing is sent', async () => {
    // Given
    const { client, fetchMock } = clientForSingleParent();

    // When
    const run = runV2FlagshipHousehold(
      {
        year: '2027',
        household: US_SINGLE_PARENT,
        baselinePolicyId: null,
        reformPolicyId: V2_REFORM_POLICY_ID,
      },
      { client, wait: noWait }
    );

    // Then
    await expect(run).rejects.toThrow('The household is set up for 2026, not 2027.');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('v2PolicyIdFor', () => {
  /** The catalog's current-law policy, as the model catalog names it. */
  const CURRENT_LAW_ID = 2;

  test.each([
    ["the catalog's current-law ID", String(CURRENT_LAW_ID)],
    ['no policy', undefined],
    ['an empty ID', ''],
  ])('given %s then the calculation is for current law', (_case, policyId) => {
    expect(v2PolicyIdFor(policyId, CURRENT_LAW_ID)).toBeNull();
  });

  test('given a v2 policy ID then the calculation names it', () => {
    expect(v2PolicyIdFor(V2_REFORM_POLICY_ID, CURRENT_LAW_ID)).toBe(V2_REFORM_POLICY_ID);
  });

  test('given a policy known only by its v1 number then it is refused, saying why', () => {
    expect(() => v2PolicyIdFor(REFORM_POLICY_ID, CURRENT_LAW_ID)).toThrow(
      `Policy ${REFORM_POLICY_ID} is a v1 policy, which the v2 household calculations cannot use.`
    );
  });
});
