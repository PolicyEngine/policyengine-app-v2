import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { store } from '@/store';
import {
  clearV2CatalogVariables,
  seedV2CatalogVariables,
} from '@/tests/fixtures/api/publicApi/catalogVariablesStore';
import { getInputVariables } from '@/utils/VariableResolver';

describe('getInputVariables on the v2 variables', () => {
  beforeEach(async () => {
    await seedV2CatalogVariables();
  });

  afterEach(() => {
    clearV2CatalogVariables();
  });

  test('given v2 variables then the picker offers entered variables and hides hidden inputs', () => {
    // When
    const names = getInputVariables(store.getState().metadata).map((variable) => variable.name);

    // Then
    expect(names).toEqual(expect.arrayContaining(['age', 'employment_income', 'filing_status']));
    expect(names).not.toContain('medicaid_rating_area');
    expect(names).not.toContain('snap');
  });

  test('given an enum variable then the picker reads its value labels', () => {
    // When
    const filingStatus = getInputVariables(store.getState().metadata).find(
      (variable) => variable.name === 'filing_status'
    );

    // Then
    expect(filingStatus?.possibleValues).toEqual([
      { value: 'SINGLE', label: 'Single' },
      { value: 'JOINT', label: 2 },
    ]);
  });
});
