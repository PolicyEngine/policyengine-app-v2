import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { getBasicInputFields } from '@/libs/metadataUtils';
import { store } from '@/store';
import {
  clearV2CatalogVariables,
  seedV2CatalogVariables,
} from '@/tests/fixtures/api/publicApi/catalogVariablesStore';

describe('getBasicInputFields on the v2 routes: default fields from /v2/model-catalog, entities from the variables', () => {
  beforeEach(async () => {
    await seedV2CatalogVariables();
  });

  afterEach(() => {
    clearV2CatalogVariables();
  });

  test('given the model catalog and its variables then the default fields sit under their entities', () => {
    // When
    const fields = getBasicInputFields(store.getState());

    // Then
    expect(fields.person).toEqual(['age', 'employment_income']);
    expect(fields.household).toEqual([]);
  });
});
