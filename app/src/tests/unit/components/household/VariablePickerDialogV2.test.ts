import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { inputKind } from '@/components/household/VariablePickerDialog';
import { store } from '@/store';
import {
  clearV2CatalogVariables,
  seedV2CatalogVariables,
} from '@/tests/fixtures/api/publicApi/catalogVariablesStore';
import { getInputVariables } from '@/utils/VariableResolver';

describe('inputKind on the v2 variables', () => {
  beforeEach(async () => {
    await seedV2CatalogVariables();
  });

  afterEach(() => {
    clearV2CatalogVariables();
  });

  test('given units and periods then the picker describes each input as on v1', () => {
    // Given
    const inputs = new Map(
      getInputVariables(store.getState().metadata).map((variable) => [variable.name, variable])
    );

    // Then
    expect(inputKind(inputs.get('employment_income')!)).toBe('Dollars per year');
    expect(inputKind(inputs.get('rent')!)).toBe('Dollars per month');
    expect(inputKind(inputs.get('age')!)).toBe('Number');
  });

  test('given no unit or period then the picker describes the input as v1 does a variable without them', () => {
    // Given
    const undescribed = getInputVariables(store.getState().metadata).find(
      (variable) => variable.name === 'undescribed_income'
    );

    // Then
    expect(inputKind(undescribed!)).toBe('Number');
  });
});
