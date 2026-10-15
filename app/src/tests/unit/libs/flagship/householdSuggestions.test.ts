import { describe, expect, test } from 'vitest';
import { suggestedHouseholdInputs } from '@/libs/flagship/householdSuggestions';
import type { ParameterDependencyMap } from '@/libs/flagship/parameterDependencies';

const MAP = {
  generatedAt: '',
  model: {} as ParameterDependencyMap['model'],
  variablesCalculated: 0,
  variablesFailed: 0,
  readers: { 'gov.usda.snap.emergency_allotment': ['snap_emergency_allotment'] },
  consumers: {
    snap_emergency_allotment: ['snap'],
    snap_normal_allotment: ['snap_emergency_allotment'],
    snap_net_income: ['snap_normal_allotment'],
    housing_cost: ['snap_net_income'],
    rent: ['housing_cost'],
    childcare_expenses: ['snap_net_income'],
    household_weight: ['snap_net_income'],
    snap_reported: ['snap_net_income'],
    takes_up_snap_if_eligible: ['snap_net_income'],
    employment_income: ['snap_net_income', 'income_tax'],
    snap: ['household_benefits'],
    household_benefits: ['household_net_income'],
    capital_gains: ['household_net_income'],
  },
} as unknown as ParameterDependencyMap;

const INPUTS = new Set([
  'rent',
  'childcare_expenses',
  'employment_income',
  'capital_gains',
  'household_weight',
  'snap_reported',
  'takes_up_snap_if_eligible',
]);

describe('suggestedHouseholdInputs', () => {
  test('given a SNAP parameter then the inputs SNAP reads lead, nearest first', () => {
    expect(
      suggestedHouseholdInputs(['gov.usda.snap.emergency_allotment.allowed'], MAP, INPUTS)
    ).toEqual(['childcare_expenses', 'employment_income', 'rent']);
  });

  test('given inputs only downstream of the change then they are not suggested', () => {
    expect(
      suggestedHouseholdInputs(['gov.usda.snap.emergency_allotment.allowed'], MAP, INPUTS)
    ).not.toContain('capital_gains');
  });

  test('given weights, reported amounts and take-up inputs then they are not suggested', () => {
    const suggested = suggestedHouseholdInputs(
      ['gov.usda.snap.emergency_allotment.allowed'],
      MAP,
      INPUTS
    );
    expect(suggested).not.toContain('household_weight');
    expect(suggested).not.toContain('snap_reported');
    expect(suggested).not.toContain('takes_up_snap_if_eligible');
  });

  test('given a parameter the map does not trace then nothing is suggested', () => {
    expect(suggestedHouseholdInputs(['gov.irs.unknown'], MAP, INPUTS)).toEqual([]);
  });

  test('given a limit then only that many are suggested', () => {
    expect(
      suggestedHouseholdInputs(['gov.usda.snap.emergency_allotment.allowed'], MAP, INPUTS, 1)
    ).toEqual(['childcare_expenses']);
  });
});
