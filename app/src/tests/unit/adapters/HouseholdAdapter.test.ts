import { describe, test, expect, vi, beforeEach } from 'vitest';
import { HouseholdAdapter } from '@/adapters/HouseholdAdapter';
import { store } from '@/store';
import {
  mockEntityMetadata,
  mockHouseholdMetadata,
  mockHouseholdMetadataWithUnknownEntity,
  mockHouseholdData,
  mockHouseholdDataWithMultipleEntities,
  mockEmptyHouseholdData,
  mockHouseholdDataWithUnknownEntity,
} from '@/tests/fixtures/adapters/HouseholdAdapterMocks';

vi.mock('@/store', () => ({
  store: {
    getState: vi.fn(),
  },
}));

describe('HouseholdAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    (store.getState as any).mockReturnValue({
      metadata: {
        entities: mockEntityMetadata,
      },
    });
  });

  describe('fromAPI', () => {
    test('given valid household metadata from API then converts to internal Household format', () => {
      const result = HouseholdAdapter.fromAPI(mockHouseholdMetadata);
      
      expect(result).toEqual({
        id: 12345,
        countryId: 'us',
        householdData: {
          people: mockHouseholdMetadata.household_json.people,
          taxUnits: mockHouseholdMetadata.household_json.tax_units,
          maritalUnits: mockHouseholdMetadata.household_json.marital_units,
          spmUnits: mockHouseholdMetadata.household_json.spm_units,
          households: mockHouseholdMetadata.household_json.households,
        },
      });
    });

    test('given API response with snake_case entities then converts all to camelCase', () => {
      const metadata = {
        id: 123,
        country_id: 'uk',
        household_json: {
          people: { person1: { age: { 2024: 30 } } },
          tax_units: { unit1: { members: ['person1'] } },
          marital_units: { unit1: { members: ['person1'] } },
        },
      };

      const result = HouseholdAdapter.fromAPI(metadata as any);
      
      expect(result.householdData).toHaveProperty('taxUnits');
      expect(result.householdData).toHaveProperty('maritalUnits');
      expect(result.householdData.taxUnits).toEqual(metadata.household_json.tax_units);
      expect(result.householdData.maritalUnits).toEqual(metadata.household_json.marital_units);
    });

    test('given entity not in metadata then logs warning but includes it anyway', () => {
      const result = HouseholdAdapter.fromAPI(mockHouseholdMetadataWithUnknownEntity);
      
      expect(console.warn).toHaveBeenCalledWith(
        'Entity "unknown_entity" not found in metadata, including anyway'
      );
      expect(result.householdData).toHaveProperty('unknownEntity');
      expect(result.householdData.unknownEntity).toEqual(
        mockHouseholdMetadataWithUnknownEntity.household_json.unknown_entity
      );
    });

    test('given people entity then always includes it without validation', () => {
      const metadata = {
        id: 456,
        country_id: 'us',
        household_json: {
          people: {
            person1: { age: { 2024: 25 } },
            person2: { age: { 2024: 30 } },
          },
        },
      };

      const result = HouseholdAdapter.fromAPI(metadata as any);
      
      expect(result.householdData.people).toEqual(metadata.household_json.people);
      expect(console.warn).not.toHaveBeenCalled();
    });

    test('given empty household_json except people then returns only people', () => {
      const metadata = {
        id: 789,
        country_id: 'ca',
        household_json: {
          people: {},
        },
      };

      const result = HouseholdAdapter.fromAPI(metadata as any);
      
      expect(result).toEqual({
        id: 789,
        countryId: 'ca',
        householdData: {
          people: {},
        },
      });
    });
  });

  describe('toCreationPayload', () => {
    test('given household data then creates proper payload structure', () => {
      const result = HouseholdAdapter.toCreationPayload(mockHouseholdData, 'us');
      
      expect(result).toEqual({
        country_id: 'us',
        data: {
          people: mockHouseholdData.people,
          tax_units: mockHouseholdData.taxUnits,
          marital_units: mockHouseholdData.maritalUnits,
        },
      });
    });

    test('given household data with tax_units then converts to snake_case in payload', () => {
      const householdData = {
        people: { person1: { age: { 2024: 30 } } },
        taxUnits: { unit1: { members: ['person1'] } },
      };

      const result = HouseholdAdapter.toCreationPayload(householdData as any, 'uk');
      
      expect(result.data).toHaveProperty('tax_units');
      expect(result.data.tax_units).toEqual(householdData.taxUnits);
    });

    test('given camelCase taxUnits then converts to tax_units in payload', () => {
      const householdData = {
        people: {},
        taxUnits: { unit1: { head: 'person1' } },
      };

      const result = HouseholdAdapter.toCreationPayload(householdData as any, 'us');
      
      expect(result.data).toHaveProperty('tax_units');
      expect(result.data).not.toHaveProperty('taxUnits');
    });

    test('given household data with multiple entities then payload includes all entities', () => {
      const result = HouseholdAdapter.toCreationPayload(
        mockHouseholdDataWithMultipleEntities,
        'us'
      );
      
      expect(result.data).toHaveProperty('people');
      expect(result.data).toHaveProperty('tax_units');
      expect(result.data).toHaveProperty('marital_units');
      expect(result.data).toHaveProperty('spm_units');
    });

    test('given empty household data then creates minimal payload with only people', () => {
      const result = HouseholdAdapter.toCreationPayload(mockEmptyHouseholdData, 'ca');
      
      expect(result).toEqual({
        country_id: 'ca',
        data: {
          people: {},
        },
      });
    });

    test('given entity not in metadata then toCreationPayload logs warning and uses snake_case', () => {
      const result = HouseholdAdapter.toCreationPayload(
        mockHouseholdDataWithUnknownEntity,
        'uk'
      );
      
      expect(console.warn).toHaveBeenCalledWith(
        'Entity "customEntity" not found in metadata, using snake_case "custom_entity"'
      );
      expect(result.data).toHaveProperty('custom_entity');
      expect(result.data.custom_entity).toEqual(mockHouseholdDataWithUnknownEntity.customEntity);
    });

    test('given people entity then treats it as special case without conversion', () => {
      const householdData = {
        people: {
          person1: { age: { 2024: 40 } },
          person2: { age: { 2024: 35 } },
        },
      };

      const result = HouseholdAdapter.toCreationPayload(householdData as any, 'us');
      
      expect(result.data.people).toEqual(householdData.people);
      expect(console.warn).not.toHaveBeenCalled();
    });

    test('given entity with matching plural in metadata then uses metadata plural form', () => {
      const householdData = {
        people: {},
        maritalUnits: { unit1: { members: ['person1', 'person2'] } },
      };

      const result = HouseholdAdapter.toCreationPayload(householdData as any, 'uk');
      
      expect(result.data).toHaveProperty('marital_units');
      expect(result.data.marital_units).toEqual(householdData.maritalUnits);
    });
  });

  describe('Edge cases and error handling', () => {
    test('given metadata with no entities then still processes people', () => {
      (store.getState as any).mockReturnValue({
        metadata: { entities: {} },
      });

      const metadata = {
        id: 999,
        country_id: 'us',
        household_json: {
          people: { person1: { age: { 2024: 50 } } },
        },
      };

      const result = HouseholdAdapter.fromAPI(metadata as any);
      
      expect(result.householdData.people).toEqual(metadata.household_json.people);
    });

    test('given undefined metadata entities then handles gracefully', () => {
      (store.getState as any).mockReturnValue({
        metadata: {},
      });

      const metadata = {
        id: 111,
        country_id: 'ca',
        household_json: {
          people: { person1: {} },
          tax_units: { unit1: {} },
        },
      };

      const result = HouseholdAdapter.fromAPI(metadata as any);
      
      expect(result.householdData.people).toBeDefined();
      expect(console.warn).toHaveBeenCalled();
    });

    test('given complex nested snake_case then converts correctly to camelCase', () => {
      const metadata = {
        id: 222,
        country_id: 'uk',
        household_json: {
          people: {},
          very_long_entity_name: { data: 'test' },
        },
      };

      const result = HouseholdAdapter.fromAPI(metadata as any);
      
      expect(result.householdData).toHaveProperty('veryLongEntityName');
      expect(result.householdData.veryLongEntityName).toEqual({ data: 'test' });
    });

    test('given complex camelCase then converts correctly to snake_case', () => {
      const householdData = {
        people: {},
        veryLongEntityName: { data: 'test' },
      };

      const result = HouseholdAdapter.toCreationPayload(householdData as any, 'us');
      
      expect(result.data).toHaveProperty('very_long_entity_name');
      expect(result.data.very_long_entity_name).toEqual({ data: 'test' });
    });
  });
});