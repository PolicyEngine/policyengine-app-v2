import type { FlagshipHouseholdInput } from '@/libs/flagship/householdRun';
import type { HouseholdCalculationData } from '@/types/calculation/household';

export const HOUSEHOLD_YEAR = '2026';
export const BASELINE_POLICY_ID = '2';
/** A report's own baseline policy, in place of current law. */
export const CUSTOM_BASELINE_POLICY_ID = '45678';
export const REFORM_POLICY_ID = '98765';
export const CREATED_HOUSEHOLD_ID = 54321;

export const MARRIED_TWO_CHILDREN: FlagshipHouseholdInput = {
  state: 'NY',
  married: true,
  childAges: [4, 12],
  earnings: 60000,
  partnerEarnings: 25000,
};

interface ResultValues {
  netIncome: number;
  incomeTax: number;
  stateIncomeTax: number;
  payrollTax?: number;
  selfEmploymentTax?: number;
  benefits?: number;
  /** The Child Tax Credit received (`ctc_value`). */
  ctcValue?: number;
  /** The gross Child Tax Credit entitlement (`ctc`); the received credit when unset. */
  grossCtc?: number;
  eitc?: number;
  snap?: number;
}

const at = (value: number | string) => ({ [HOUSEHOLD_YEAR]: value });

/**
 * A calculated household as the v1 API returns it: snake-case group keys,
 * each variable keyed by year, two adults in one tax unit.
 */
export function householdResult({
  netIncome,
  incomeTax,
  stateIncomeTax,
  payrollTax = 6500,
  selfEmploymentTax = 0,
  benefits = 0,
  ctcValue = 0,
  grossCtc = ctcValue,
  eitc = 0,
  snap = 0,
}: ResultValues): HouseholdCalculationData {
  return {
    people: {
      you: { age: at(30), self_employment_tax: at(selfEmploymentTax), ssi: at(0) },
      'your partner': { age: at(30), self_employment_tax: at(0), ssi: at(0) },
    },
    households: {
      'your household': {
        members: ['you', 'your partner'],
        household_net_income: at(netIncome),
        household_benefits: at(benefits),
        state_name: at('NY'),
      },
    },
    tax_units: {
      'your tax unit': {
        members: ['you', 'your partner'],
        income_tax: at(incomeTax),
        state_income_tax: at(stateIncomeTax),
        local_income_tax: at(0),
        employee_payroll_tax: at(payrollTax),
        ctc: at(grossCtc),
        ctc_value: at(ctcValue),
        eitc: at(eitc),
      },
    },
    spm_units: {
      'your household': { members: ['you', 'your partner'], snap: at(snap) },
    },
  } as unknown as HouseholdCalculationData;
}

export const BASELINE_RESULT = householdResult({
  netIncome: 72000,
  incomeTax: 3000,
  stateIncomeTax: 2500,
  ctcValue: 4400,
  benefits: 1200,
  snap: 1200,
});

/** A bigger Child Tax Credit: $1,000 less federal income tax. */
export const REFORM_RESULT = householdResult({
  netIncome: 73000,
  incomeTax: 2000,
  stateIncomeTax: 2500,
  ctcValue: 5400,
  benefits: 1200,
  snap: 1200,
});

/** The federal tax change plus $40 more net income from nothing listed. */
export const REFORM_RESULT_WITH_REMAINDER = householdResult({
  netIncome: 73040,
  incomeTax: 2000,
  stateIncomeTax: 2500,
  ctcValue: 5400,
  benefits: 1200,
  snap: 1200,
});

/** A loss for the household: $600 more state income tax and $300 less SNAP. */
export const REFORM_RESULT_LOSS = householdResult({
  netIncome: 71100,
  incomeTax: 3000,
  stateIncomeTax: 3100,
  ctcValue: 4400,
  benefits: 900,
  snap: 900,
});

/**
 * A low-earning single parent of two: the gross Child Tax Credit is
 * $4,400, but only $1,125 of it is refundable on $10,000 of earnings.
 */
export const LOW_EARNER_BASELINE_RESULT = householdResult({
  netIncome: 22000,
  incomeTax: 0,
  stateIncomeTax: 0,
  ctcValue: 1125,
  grossCtc: 4400,
});

/** A bigger credit that the household cannot claim: only the gross amount moves. */
export const LOW_EARNER_REFORM_RESULT = householdResult({
  netIncome: 22000,
  incomeTax: 0,
  stateIncomeTax: 0,
  ctcValue: 1125,
  grossCtc: 6000,
});
