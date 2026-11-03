import { describe, expect, test } from 'vitest';
import { toAppCalculationData } from '@/components/flagship/report/household/HouseholdBreakdowns';
import { householdProgrammeChanges } from '@/libs/flagship/householdProgrammeChanges';
import type {
  HouseholdCalculationData,
  HouseholdCalculationOutput,
} from '@/types/calculation/household';
import type { MetadataState } from '@/types/metadata';

const YEAR = '2026';

/** The UK model's net income tree, as its metadata gives it: benefits and taxes are formula totals. */
const variable = (
  entity: string,
  label: string,
  parts: { adds?: string[]; subtracts?: string[] } = {}
) => ({ entity, label, adds: parts.adds ?? null, subtracts: parts.subtracts ?? null });

const METADATA = {
  entities: {
    person: { plural: 'people' },
    benunit: { plural: 'benunits' },
    household: { plural: 'households' },
  },
  parameters: {},
  variables: {
    household_net_income: variable('household', 'household net income', {
      adds: ['household_market_income', 'household_benefits'],
      subtracts: ['household_tax'],
    }),
    household_market_income: variable('household', 'household market income'),
    household_benefits: variable('household', 'household benefits'),
    household_tax: variable('household', 'household taxes'),
    energy_bills_rebate: variable('household', 'Energy Bills Rebate', {
      adds: ['ebr_council_tax_rebate', 'ebr_energy_bills_credit'],
    }),
    ebr_council_tax_rebate: variable('household', 'Council Tax Rebate (EBR)'),
    ebr_energy_bills_credit: variable('household', 'Energy bills credit (EBR)'),
    universal_credit: variable('benunit', 'Universal Credit'),
    income_tax: variable('person', 'Income Tax'),
    national_insurance: variable('person', 'National Insurance'),
  },
} as unknown as MetadataState;

/** A UK household's calculated amounts, per year. */
function household(amounts: {
  market?: number;
  rebate?: number;
  uc?: number;
  incomeTax?: number;
  otherBenefits?: number;
}): HouseholdCalculationOutput {
  const { market = 30000, rebate = 0, uc = 0, incomeTax = 3000, otherBenefits = 0 } = amounts;
  const year = (value: number) => ({ [YEAR]: value });
  const benefits = rebate + uc + otherBenefits;
  const data = {
    people: { you: { income_tax: year(incomeTax), national_insurance: year(1000) } },
    benunits: { 'your benefit unit': { universal_credit: year(uc) } },
    households: {
      'your household': {
        household_net_income: year(market + benefits - incomeTax - 1000),
        household_market_income: year(market),
        household_benefits: year(benefits),
        household_tax: year(incomeTax + 1000),
        energy_bills_rebate: year(rebate),
        ebr_council_tax_rebate: year(rebate),
        ebr_energy_bills_credit: year(0),
      },
    },
  };
  return {
    id: '1',
    countryId: 'uk',
    householdData: toAppCalculationData(data as unknown as HouseholdCalculationData),
  };
}

describe('householdProgrammeChanges', () => {
  test('given the UK energy rebate then the rebate itself is named, not benefits', () => {
    expect(
      householdProgrammeChanges(household({}), household({ rebate: 100 }), METADATA, YEAR)
    ).toEqual([
      {
        variable: 'ebr_council_tax_rebate',
        label: 'Council Tax Rebate (EBR)',
        change: 100,
        effect: 100,
      },
    ]);
  });

  test('given a tax and benefits that change then each is named, signed by net income, largest first', () => {
    const changes = householdProgrammeChanges(
      household({ uc: 300 }),
      household({ rebate: 100, uc: 312, incomeTax: 3040 }),
      METADATA,
      YEAR
    );

    expect(changes.map(({ label, effect }) => [label, effect])).toEqual([
      ['Council Tax Rebate (EBR)', 100],
      ['Income Tax', -40],
      ['Universal Credit', 12],
    ]);
    // A tax that rises: its amount goes up, net income down.
    expect(changes[1].change).toBe(40);
  });

  test('given a change the listed parts do not explain then the total itself is named', () => {
    expect(
      householdProgrammeChanges(household({}), household({ otherBenefits: 50 }), METADATA, YEAR)
    ).toEqual([
      { variable: 'household_benefits', label: 'Household benefits', change: 50, effect: 50 },
    ]);
  });

  test('given nothing changes then nothing is named', () => {
    expect(householdProgrammeChanges(household({}), household({}), METADATA, YEAR)).toEqual([]);
  });
});
