import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  buildHouseholdPayload,
  compareHouseholds,
  defaultHouseholdInput,
  describeHouseholdInput,
  isValidHouseholdInput,
  plainHouseholdError,
  readHouseholdTotal,
  runFlagshipHousehold,
  stateFromRegion,
} from '@/libs/flagship/householdRun';
import {
  BASELINE_POLICY_ID,
  BASELINE_RESULT,
  CREATED_HOUSEHOLD_ID,
  HOUSEHOLD_YEAR,
  householdResult,
  LOW_EARNER_BASELINE_RESULT,
  LOW_EARNER_REFORM_RESULT,
  MARRIED_TWO_CHILDREN,
  REFORM_POLICY_ID,
  REFORM_RESULT,
  REFORM_RESULT_LOSS,
  REFORM_RESULT_WITH_REMAINDER,
} from '@/tests/fixtures/libs/flagship/householdRunMocks';

const mockCreateHousehold = vi.fn();
const mockFetchHouseholdCalculation = vi.fn();

vi.mock('@/api/household', () => ({
  createHousehold: (...args: unknown[]) => mockCreateHousehold(...args),
}));
vi.mock('@/api/householdCalculation', () => ({
  fetchHouseholdCalculation: (...args: unknown[]) => mockFetchHouseholdCalculation(...args),
}));

describe('defaultHouseholdInput', () => {
  test('given a nationwide report then the household is single, childless, in California', () => {
    expect(defaultHouseholdInput()).toEqual({
      state: 'CA',
      married: false,
      childAges: [],
      earnings: 50000,
      partnerEarnings: 0,
      headAge: 30,
      partnerAge: 30,
    });
  });

  test('given ages, other income, rent and child care then each reaches the household', () => {
    const payload = buildHouseholdPayload(
      {
        ...defaultHouseholdInput(),
        married: true,
        headAge: 67,
        partnerAge: 64,
        otherIncome: {
          head: { social_security_retirement: 24000 },
          partner: { taxable_pension_income: 12000 },
        },
        rent: 18000,
        childcare: 9000,
      },
      '2026'
    );

    const text = JSON.stringify(payload);
    expect(text).toContain('"social_security_retirement":{"2026":24000}');
    expect(text).toContain('"taxable_pension_income":{"2026":12000}');
    expect(text).toContain('"rent":{"2026":18000}');
    expect(text).toContain('"spm_unit_pre_subsidy_childcare_expenses":{"2026":9000}');
    expect(text).toContain('"age":{"2026":67}');
    expect(text).toContain('"age":{"2026":64}');
  });

  test('given an adult under 18 or a negative amount then the household cannot run', () => {
    expect(isValidHouseholdInput({ ...defaultHouseholdInput(), headAge: 16 })).toBe(false);
    expect(isValidHouseholdInput({ ...defaultHouseholdInput(), rent: -5 })).toBe(false);
  });

  test("given a state or district report then the household starts in that report's state", () => {
    expect(defaultHouseholdInput('state/ny').state).toBe('NY');
    expect(defaultHouseholdInput('congressional_district/TX-07').state).toBe('TX');
  });

  test('given a region that is not a state then no state is read from it', () => {
    expect(stateFromRegion('us')).toBeUndefined();
    expect(stateFromRegion('state/zz')).toBeUndefined();
  });
});

describe('isValidHouseholdInput', () => {
  test('given the default household then it can run', () => {
    expect(isValidHouseholdInput(defaultHouseholdInput())).toBe(true);
  });

  test('given negative or missing earnings or an adult child then it cannot run', () => {
    const base = defaultHouseholdInput();
    expect(isValidHouseholdInput({ ...base, earnings: -1 })).toBe(false);
    expect(isValidHouseholdInput({ ...base, earnings: Number.NaN })).toBe(false);
    expect(isValidHouseholdInput({ ...base, childAges: [18] })).toBe(false);
    expect(isValidHouseholdInput({ ...base, childAges: [2.5] })).toBe(false);
  });

  test("given a single household then the partner's earnings are not read", () => {
    expect(isValidHouseholdInput({ ...defaultHouseholdInput(), partnerEarnings: Number.NaN })).toBe(
      true
    );
  });
});

describe('buildHouseholdPayload', () => {
  test('given a married couple with two children then every person carries the year', () => {
    const payload = buildHouseholdPayload(MARRIED_TWO_CHILDREN, HOUSEHOLD_YEAR);
    const people = payload.data.people;

    expect(payload.country_id).toBe('us');
    // The API reads the year to calculate from "you"'s age.
    expect(people.you.age).toEqual({ [HOUSEHOLD_YEAR]: 30 });
    expect(people.you.employment_income).toEqual({ [HOUSEHOLD_YEAR]: 60000 });
    expect(people['your partner'].employment_income).toEqual({ [HOUSEHOLD_YEAR]: 25000 });
    expect(people['your first dependent'].age).toEqual({ [HOUSEHOLD_YEAR]: 4 });
    expect(people['your second dependent'].age).toEqual({ [HOUSEHOLD_YEAR]: 12 });
    expect(people['your second dependent'].is_tax_unit_dependent).toEqual({
      [HOUSEHOLD_YEAR]: true,
    });
  });

  test('given a state then the household lives there', () => {
    const payload = buildHouseholdPayload(MARRIED_TWO_CHILDREN, HOUSEHOLD_YEAR);

    expect(payload.data.households?.['your household'].state_name).toEqual({
      [HOUSEHOLD_YEAR]: 'NY',
    });
    expect(payload.data.marital_units?.['your marital unit'].members).toEqual([
      'you',
      'your partner',
    ]);
  });

  test('given a single adult then the household has one person', () => {
    const payload = buildHouseholdPayload(defaultHouseholdInput(), HOUSEHOLD_YEAR);

    expect(Object.keys(payload.data.people)).toEqual(['you']);
    expect(payload.data.tax_units?.['your tax unit'].members).toEqual(['you']);
  });
});

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
    const impact = compareHouseholds(BASELINE_RESULT, REFORM_RESULT, HOUSEHOLD_YEAR);

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
    const impact = compareHouseholds(BASELINE_RESULT, REFORM_RESULT, HOUSEHOLD_YEAR);

    expect(impact.programs.map((line) => [line.label, line.change])).toEqual([
      ['Child Tax Credit', 1000],
    ]);
  });

  test('given a bigger gross Child Tax Credit the household cannot claim then no credit is listed', () => {
    const impact = compareHouseholds(
      LOW_EARNER_BASELINE_RESULT,
      LOW_EARNER_REFORM_RESULT,
      HOUSEHOLD_YEAR
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
      HOUSEHOLD_YEAR
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
    const impact = compareHouseholds(BASELINE_RESULT, REFORM_RESULT_WITH_REMAINDER, HOUSEHOLD_YEAR);

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
    const impact = compareHouseholds(BASELINE_RESULT, REFORM_RESULT_LOSS, HOUSEHOLD_YEAR);

    expect(impact.netIncome.change).toBe(-900);
    expect(impact.components.map((line) => [line.id, line.effect])).toEqual([
      ['state_income_tax', -600],
      ['benefits', -300],
    ]);
    expect(impact.programs.map((line) => [line.label, line.change])).toEqual([['SNAP', -300]]);
  });

  test('given the same result twice then nothing changes', () => {
    const impact = compareHouseholds(BASELINE_RESULT, BASELINE_RESULT, HOUSEHOLD_YEAR);

    expect(impact.netIncome.change).toBe(0);
    expect(impact.components).toEqual([]);
    expect(impact.programs).toEqual([]);
  });

  test('given a result without net income then the comparison fails, not reads as no change', () => {
    const missing = householdResult({ netIncome: 0, incomeTax: 3000, stateIncomeTax: 2500 });
    delete (missing.households as Record<string, Record<string, unknown>>)['your household']
      .household_net_income;

    expect(() => compareHouseholds(BASELINE_RESULT, missing, HOUSEHOLD_YEAR)).toThrow(
      `The result has no net income for ${HOUSEHOLD_YEAR}.`
    );
    expect(() => compareHouseholds(missing, BASELINE_RESULT, HOUSEHOLD_YEAR)).toThrow();
  });
});

describe('runFlagshipHousehold', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateHousehold.mockResolvedValue({ result: { household_id: CREATED_HOUSEHOLD_ID } });
    mockFetchHouseholdCalculation.mockImplementation(
      async (_country: string, _household: string, policyId: string) =>
        policyId === BASELINE_POLICY_ID ? BASELINE_RESULT : REFORM_RESULT
    );
  });

  test('given a household then it is created once and calculated under both policies', async () => {
    const run = await runFlagshipHousehold({
      year: HOUSEHOLD_YEAR,
      input: MARRIED_TWO_CHILDREN,
      baselinePolicyId: BASELINE_POLICY_ID,
      reformPolicyId: REFORM_POLICY_ID,
    });

    expect(mockCreateHousehold).toHaveBeenCalledWith(
      buildHouseholdPayload(MARRIED_TWO_CHILDREN, HOUSEHOLD_YEAR)
    );
    expect(mockFetchHouseholdCalculation.mock.calls).toEqual([
      ['us', String(CREATED_HOUSEHOLD_ID), BASELINE_POLICY_ID],
      ['us', String(CREATED_HOUSEHOLD_ID), REFORM_POLICY_ID],
    ]);
    expect(run.householdId).toBe(String(CREATED_HOUSEHOLD_ID));
    expect(run.netIncome.change).toBe(1000);
  });

  test('given the same policy as baseline and reform then it is calculated once', async () => {
    const run = await runFlagshipHousehold({
      year: HOUSEHOLD_YEAR,
      input: MARRIED_TWO_CHILDREN,
      baselinePolicyId: BASELINE_POLICY_ID,
      reformPolicyId: BASELINE_POLICY_ID,
    });

    expect(mockFetchHouseholdCalculation).toHaveBeenCalledTimes(1);
    expect(run.netIncome.change).toBe(0);
  });

  test('given a calculation failure then the run fails with it', async () => {
    mockFetchHouseholdCalculation.mockRejectedValue(new Error('Household calculation failed'));

    await expect(
      runFlagshipHousehold({
        year: HOUSEHOLD_YEAR,
        input: MARRIED_TWO_CHILDREN,
        baselinePolicyId: BASELINE_POLICY_ID,
        reformPolicyId: REFORM_POLICY_ID,
      })
    ).rejects.toThrow('Household calculation failed');
  });

  test('given a timeout or a network failure then the run fails in plain words', async () => {
    const args = {
      year: HOUSEHOLD_YEAR,
      input: MARRIED_TWO_CHILDREN,
      baselinePolicyId: BASELINE_POLICY_ID,
      reformPolicyId: REFORM_POLICY_ID,
    };
    mockFetchHouseholdCalculation.mockRejectedValue(
      new Error('Household calculation timed out after 50 seconds (client-side timeout)')
    );
    await expect(runFlagshipHousehold(args)).rejects.toThrow('The calculation took too long.');

    mockCreateHousehold.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(runFlagshipHousehold(args)).rejects.toThrow(
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

describe('describeHouseholdInput', () => {
  test('given a household then it reads as one short line', () => {
    expect(describeHouseholdInput(MARRIED_TWO_CHILDREN)).toBe(
      'Married · 2 children · $60,000 and $25,000 earnings · New York'
    );
    expect(describeHouseholdInput(defaultHouseholdInput())).toBe(
      'Single · no children · $50,000 earnings · California'
    );
  });
});
