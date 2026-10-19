import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  compareHouseholds,
  plainHouseholdError,
  readHouseholdTotal,
  runFlagshipHouseholdPayload,
} from '@/libs/flagship/householdRun';
import { Household } from '@/models/Household';
import {
  BASELINE_POLICY_ID,
  BASELINE_RESULT,
  BASELINE_RUN_BUNDLE,
  calculationResponse,
  COUNTRY_WITHOUT_HOUSEHOLD_LINES,
  CREATED_HOUSEHOLD_ID,
  HOUSEHOLD_YEAR,
  householdResult,
  LOW_EARNER_BASELINE_RESULT,
  LOW_EARNER_REFORM_RESULT,
  NATIONAL_SPM_CONFIG,
  REFORM_POLICY_ID,
  REFORM_RESULT,
  REFORM_RESULT_LOSS,
  REFORM_RESULT_WITH_REMAINDER,
  REFORM_RUN_BUNDLE,
  UK_BASELINE_RESULT,
  UK_FAMILY_BASELINE_RESULT,
  UK_FAMILY_REFORM_RESULT,
  UK_REFORM_RESULT,
  US_COUPLE_WITH_CHILDREN_PAYLOAD,
} from '@/tests/fixtures/libs/flagship/householdRunMocks';
import { SPM_RECEIPT } from '@/tests/fixtures/spm/spmMocks';

const mockCreateHousehold = vi.fn();
const mockFetchHouseholdCalculation = vi.fn();

vi.mock('@/api/household', () => ({
  createHousehold: (...args: unknown[]) => mockCreateHousehold(...args),
}));
/** How each policy's calculation was made, as its response says it: nothing unless a test sets it. */
const mockCalculationProvenance = vi.fn();
vi.mock('@/api/householdCalculation', () => ({
  fetchHouseholdCalculationWithBundle: async (...args: unknown[]) =>
    calculationResponse(
      await mockFetchHouseholdCalculation(...args),
      mockCalculationProvenance(...args)
    ),
}));

describe('readHouseholdTotal', () => {
  test('given a variable in the API result then its year value is read', () => {
    expect(readHouseholdTotal(BASELINE_RESULT, 'tax_units', 'income_tax', HOUSEHOLD_YEAR)).toBe(
      3000
    );
  });

  test('given a variable the result lacks then nothing is read', () => {
    expect(readHouseholdTotal(BASELINE_RESULT, 'tax_units', 'flat_tax', HOUSEHOLD_YEAR)).toBeNull();
  });

  test('given a person variable then it sums across people', () => {
    expect(readHouseholdTotal(BASELINE_RESULT, 'people', 'age', HOUSEHOLD_YEAR)).toBe(60);
  });
});

describe('compareHouseholds', () => {
  test('given a federal tax cut then net income and the tax line both show it', () => {
    const impact = compareHouseholds(BASELINE_RESULT, REFORM_RESULT, HOUSEHOLD_YEAR, 'us');

    expect(impact.netIncome).toEqual({ baseline: 72000, reform: 73000, change: 1000 });
    expect(impact.components).toEqual([
      {
        id: 'federal_income_tax',
        label: 'Federal income tax',
        baseline: 3000,
        reform: 2000,
        change: -1000,
        effect: 1000,
      },
    ]);
  });

  test('given a bigger Child Tax Credit then the credit is listed and unchanged ones are not', () => {
    const impact = compareHouseholds(BASELINE_RESULT, REFORM_RESULT, HOUSEHOLD_YEAR, 'us');

    expect(impact.programs.map((line) => [line.label, line.change])).toEqual([
      ['Child Tax Credit', 1000],
    ]);
  });

  test('given a bigger gross Child Tax Credit the household cannot claim then no credit is listed', () => {
    const impact = compareHouseholds(
      LOW_EARNER_BASELINE_RESULT,
      LOW_EARNER_REFORM_RESULT,
      HOUSEHOLD_YEAR,
      'us'
    );

    expect(impact.netIncome.change).toBe(0);
    expect(impact.programs).toEqual([]);
  });

  test('given a Child Tax Credit then the line is the credit received, not the gross amount', () => {
    const impact = compareHouseholds(
      LOW_EARNER_BASELINE_RESULT,
      householdResult({
        netIncome: 22375,
        incomeTax: 0,
        stateIncomeTax: 0,
        ctcValue: 1500,
        grossCtc: 6000,
      }),
      HOUSEHOLD_YEAR,
      'us'
    );

    expect(impact.programs).toEqual([
      {
        id: 'ctc_value',
        label: 'Child Tax Credit',
        baseline: 1125,
        reform: 1500,
        change: 375,
        effect: 375,
      },
    ]);
  });

  test('given net income moving beyond the listed parts then the rest is "Other"', () => {
    const impact = compareHouseholds(
      BASELINE_RESULT,
      REFORM_RESULT_WITH_REMAINDER,
      HOUSEHOLD_YEAR,
      'us'
    );

    expect(impact.components.at(-1)).toEqual({
      id: 'other',
      label: 'Other',
      baseline: null,
      reform: null,
      change: 40,
      effect: 40,
    });
  });

  test('given a tax rise and a benefit cut then both read as losses', () => {
    const impact = compareHouseholds(BASELINE_RESULT, REFORM_RESULT_LOSS, HOUSEHOLD_YEAR, 'us');

    expect(impact.netIncome.change).toBe(-900);
    expect(impact.components.map((line) => [line.id, line.effect])).toEqual([
      ['state_income_tax', -600],
      ['benefits', -300],
    ]);
    expect(impact.programs.map((line) => [line.label, line.change])).toEqual([['SNAP', -300]]);
  });

  test('given the same result twice then nothing changes', () => {
    const impact = compareHouseholds(BASELINE_RESULT, BASELINE_RESULT, HOUSEHOLD_YEAR, 'us');

    expect(impact.netIncome.change).toBe(0);
    expect(impact.components).toEqual([]);
    expect(impact.programs).toEqual([]);
  });

  test('given a result without net income then the comparison fails, not reads as no change', () => {
    const missing = householdResult({ netIncome: 0, incomeTax: 3000, stateIncomeTax: 2500 });
    delete (missing.households as Record<string, Record<string, unknown>>)['your household']
      .household_net_income;

    expect(() => compareHouseholds(BASELINE_RESULT, missing, HOUSEHOLD_YEAR, 'us')).toThrow(
      `The result has no net income for ${HOUSEHOLD_YEAR}.`
    );
    expect(() => compareHouseholds(missing, BASELINE_RESULT, HOUSEHOLD_YEAR, 'us')).toThrow();
  });

  test('given a country without household result lines then the comparison fails, not reads as the US', () => {
    expect(() =>
      compareHouseholds(
        BASELINE_RESULT,
        REFORM_RESULT,
        HOUSEHOLD_YEAR,
        COUNTRY_WITHOUT_HOUSEHOLD_LINES
      )
    ).toThrow(`Household results are not available for ${COUNTRY_WITHOUT_HOUSEHOLD_LINES}.`);
  });
});

describe('compareHouseholds for the UK', () => {
  test('given an Income Tax cut then Income Tax is the one changed part', () => {
    const impact = compareHouseholds(UK_BASELINE_RESULT, UK_REFORM_RESULT, HOUSEHOLD_YEAR, 'uk');

    expect(impact.netIncome).toEqual({ baseline: 24939.55, reform: 25439.55, change: 500 });
    expect(impact.components).toEqual([
      {
        id: 'income_tax',
        label: 'Income Tax',
        baseline: 3486,
        reform: 2986,
        change: -500,
        effect: 500,
      },
    ]);
    expect(impact.programs).toEqual([]);
  });

  test('given more Universal Credit and Council Tax Reduction then each benefit lists, and Benefits counts them once', () => {
    const impact = compareHouseholds(
      UK_FAMILY_BASELINE_RESULT,
      UK_FAMILY_REFORM_RESULT,
      HOUSEHOLD_YEAR,
      'uk'
    );

    expect(impact.netIncome.change).toBeCloseTo(900);
    // The gross bill does not move, so no "Other" makes up a double count.
    expect(impact.components.map((line) => [line.label, Math.round(line.effect)])).toEqual([
      ['Benefits', 900],
    ]);
    expect(impact.programs.map((line) => [line.label, Math.round(line.change)])).toEqual([
      ['Universal Credit', 600],
      ['Council Tax Reduction', 300],
    ]);
  });

  test('given a UK result then no US line is read', () => {
    const impact = compareHouseholds(UK_BASELINE_RESULT, UK_REFORM_RESULT, HOUSEHOLD_YEAR, 'uk');

    expect(impact.components.map((line) => line.id)).not.toContain('federal_income_tax');
  });

  test('given a benefit unit total then it is read from the benefit units', () => {
    expect(
      readHouseholdTotal(UK_FAMILY_BASELINE_RESULT, 'benunits', 'universal_credit', HOUSEHOLD_YEAR)
    ).toBe(19911.06);
  });
});

describe('runFlagshipHouseholdPayload for the UK', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateHousehold.mockResolvedValue({ result: { household_id: CREATED_HOUSEHOLD_ID } });
    mockFetchHouseholdCalculation.mockImplementation(
      async (_country: string, _household: string, policyId: string) =>
        policyId === BASELINE_POLICY_ID ? UK_BASELINE_RESULT : UK_REFORM_RESULT
    );
  });

  test('given a UK household then it is calculated by the UK API, with UK lines', async () => {
    const payload = Household.starter('uk', HOUSEHOLD_YEAR).toV1CreationPayload();

    const run = await runFlagshipHouseholdPayload({
      year: HOUSEHOLD_YEAR,
      payload,
      baselinePolicyId: BASELINE_POLICY_ID,
      reformPolicyId: REFORM_POLICY_ID,
    });

    expect(mockCreateHousehold).toHaveBeenCalledWith(payload);
    expect(mockFetchHouseholdCalculation.mock.calls).toEqual([
      ['uk', String(CREATED_HOUSEHOLD_ID), BASELINE_POLICY_ID],
      ['uk', String(CREATED_HOUSEHOLD_ID), REFORM_POLICY_ID],
    ]);
    expect(run.netIncome.change).toBe(500);
    expect(run.components.map((line) => line.label)).toEqual(['Income Tax']);
  });
});

describe('runFlagshipHouseholdPayload', () => {
  const runArgs = {
    year: HOUSEHOLD_YEAR,
    payload: US_COUPLE_WITH_CHILDREN_PAYLOAD,
    baselinePolicyId: BASELINE_POLICY_ID,
    reformPolicyId: REFORM_POLICY_ID,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCalculationProvenance.mockReset();
    mockCreateHousehold.mockResolvedValue({ result: { household_id: CREATED_HOUSEHOLD_ID } });
    mockFetchHouseholdCalculation.mockImplementation(
      async (_country: string, _household: string, policyId: string) =>
        policyId === BASELINE_POLICY_ID ? BASELINE_RESULT : REFORM_RESULT
    );
  });

  test('given a household then it is created once and calculated under both policies', async () => {
    const run = await runFlagshipHouseholdPayload(runArgs);

    expect(mockCreateHousehold).toHaveBeenCalledWith(US_COUPLE_WITH_CHILDREN_PAYLOAD);
    expect(mockFetchHouseholdCalculation.mock.calls).toEqual([
      ['us', String(CREATED_HOUSEHOLD_ID), BASELINE_POLICY_ID],
      ['us', String(CREATED_HOUSEHOLD_ID), REFORM_POLICY_ID],
    ]);
    expect(run.householdId).toBe(String(CREATED_HOUSEHOLD_ID));
    expect(run.netIncome.change).toBe(1000);
    // Each calculated household is kept for the v2 breakdowns.
    expect(run.baseline).toBe(BASELINE_RESULT);
    expect(run.reform).toBe(REFORM_RESULT);
  });

  test('given the same policy as baseline and reform then it is calculated once', async () => {
    const run = await runFlagshipHouseholdPayload({
      ...runArgs,
      reformPolicyId: BASELINE_POLICY_ID,
    });

    expect(mockFetchHouseholdCalculation).toHaveBeenCalledTimes(1);
    expect(run.netIncome.change).toBe(0);
  });

  test('given each response names its .py bundle and SPM provenance then the run keeps them per policy', async () => {
    mockCalculationProvenance.mockImplementation(
      (_country: string, _household: string, policyId: string) => ({
        policyengine_bundle:
          policyId === BASELINE_POLICY_ID ? BASELINE_RUN_BUNDLE : REFORM_RUN_BUNDLE,
        spm_config: NATIONAL_SPM_CONFIG,
        spm_provenance: SPM_RECEIPT,
      })
    );

    const run = await runFlagshipHouseholdPayload(runArgs);

    expect(run.provenance).toEqual({
      baseline: {
        policyengineBundle: BASELINE_RUN_BUNDLE,
        spmConfig: NATIONAL_SPM_CONFIG,
        spmProvenance: SPM_RECEIPT,
      },
      reform: {
        policyengineBundle: REFORM_RUN_BUNDLE,
        spmConfig: NATIONAL_SPM_CONFIG,
        spmProvenance: SPM_RECEIPT,
      },
    });
  });

  test('given one calculation for both policies then the reform reads its provenance', async () => {
    mockCalculationProvenance.mockReturnValue({ policyengine_bundle: BASELINE_RUN_BUNDLE });

    const run = await runFlagshipHouseholdPayload({
      ...runArgs,
      reformPolicyId: BASELINE_POLICY_ID,
    });

    expect(run.provenance.reform).toEqual(run.provenance.baseline);
    expect(run.provenance.reform.policyengineBundle).toEqual(BASELINE_RUN_BUNDLE);
  });

  test('given responses without a bundle or SPM provenance then the run says none, not a guess', async () => {
    const run = await runFlagshipHouseholdPayload(runArgs);

    expect(run.provenance.baseline).toEqual({ policyengineBundle: null });
    expect(run.provenance.reform).toEqual({ policyengineBundle: null });
  });

  test('given a calculation failure then the run fails with it', async () => {
    mockFetchHouseholdCalculation.mockRejectedValue(new Error('Household calculation failed'));

    await expect(runFlagshipHouseholdPayload(runArgs)).rejects.toThrow(
      'Household calculation failed'
    );
  });

  test('given a timeout or a network failure then the run fails in plain words', async () => {
    mockFetchHouseholdCalculation.mockRejectedValue(
      new Error('Household calculation timed out after 50 seconds (client-side timeout)')
    );
    await expect(runFlagshipHouseholdPayload(runArgs)).rejects.toThrow(
      'The calculation took too long.'
    );

    mockCreateHousehold.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(runFlagshipHouseholdPayload(runArgs)).rejects.toThrow(
      'Could not reach PolicyEngine. Check your connection.'
    );
  });
});

describe('plainHouseholdError', () => {
  test('given an API error then its own message is kept', () => {
    const error = new Error('Invalid state_name');

    expect(plainHouseholdError(error)).toBe(error);
  });

  test('given a network failure then the original error is its cause', () => {
    const error = new TypeError('Load failed');

    expect(plainHouseholdError(error).cause).toBe(error);
  });
});
