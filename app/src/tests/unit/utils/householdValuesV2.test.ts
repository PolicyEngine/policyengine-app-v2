import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { store } from '@/store';
import {
  clearV2CatalogVariables,
  seedV2CatalogVariables,
} from '@/tests/fixtures/api/publicApi/catalogVariablesStore';
import { formatVariableValue } from '@/utils/householdValues';

describe('formatVariableValue on the v2 variables', () => {
  beforeEach(async () => {
    await seedV2CatalogVariables();
  });

  afterEach(() => {
    clearV2CatalogVariables();
  });

  test('given units then the breakdown formats currencies and rates as on v1', () => {
    // Given
    const { variables } = store.getState().metadata;

    // Then
    expect(formatVariableValue(variables.employment_income, 30000)).toBe('$30,000');
    expect(formatVariableValue(variables.marginal_tax_rate, 0.25)).toBe('25%');
    expect(formatVariableValue(variables.undescribed_income, 1200)).toBe('1,200');
  });
});
