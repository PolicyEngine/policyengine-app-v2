import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  countryIdToModelName,
  generateHouseholdId,
  HouseholdAdapter,
  modelNameToCountryId,
} from '@/adapters/HouseholdAdapter';
import { Household } from '@/types/ingredients/Household';
import { HouseholdMetadata } from '@/types/metadata/householdMetadata';

// Test constants
const TEST_HOUSEHOLD_ID = 'hh-12345';
const TEST_LABEL = 'Test household';
const TEST_YEAR = 2025;
const TEST_POLICY_ID = 'policy-123';
const TEST_DYNAMIC_ID = 'dynamic-456';

// Mock household data
const mockUSHousehold: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: TEST_YEAR,
  people: [
    {
      person_id: 0,
      age: 30,
      employment_income: 50000,
      person_tax_unit_id: 0,
      person_household_id: 0,
    },
    {
      person_id: 1,
      age: 28,
      employment_income: 45000,
      person_tax_unit_id: 0,
      person_household_id: 0,
    },
  ],
  tax_unit: [
    {
      tax_unit_id: 0,
      state_code: 'CA',
    },
  ],
  household: [
    {
      household_id: 0,
      state_fips: 6,
    },
  ],
};

const mockUKHousehold: Household = {
  tax_benefit_model_name: 'policyengine_uk',
  year: TEST_YEAR,
  people: [
    {
      person_id: 0,
      age: 35,
      employment_income: 30000,
      person_benunit_id: 0,
      person_household_id: 0,
    },
  ],
  benunit: [
    {
      benunit_id: 0,
      is_married: false,
    },
  ],
  household: [
    {
      household_id: 0,
      region: 'london',
    },
  ],
};

const mockUSHouseholdWithLabel: Household = {
  ...mockUSHousehold,
  id: TEST_HOUSEHOLD_ID,
  label: TEST_LABEL,
};

const mockUSHouseholdMetadata: HouseholdMetadata = {
  id: TEST_HOUSEHOLD_ID,
  household: mockUSHousehold,
  label: TEST_LABEL,
  created_at: '2025-01-15T10:00:00Z',
};

const mockUSHouseholdMetadataNoLabel: HouseholdMetadata = {
  id: TEST_HOUSEHOLD_ID,
  household: mockUSHousehold,
  label: null,
  created_at: '2025-01-15T10:00:00Z',
};

describe('HouseholdAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fromMetadata', () => {
    test('given household metadata with label then extracts household and adds id and label', () => {
      const result = HouseholdAdapter.fromMetadata(mockUSHouseholdMetadata);

      expect(result).toEqual({
        ...mockUSHousehold,
        id: TEST_HOUSEHOLD_ID,
        label: TEST_LABEL,
      });
    });

    test('given household metadata without label then extracts household and adds id only', () => {
      const result = HouseholdAdapter.fromMetadata(mockUSHouseholdMetadataNoLabel);

      expect(result).toEqual({
        ...mockUSHousehold,
        id: TEST_HOUSEHOLD_ID,
        label: undefined,
      });
    });

    test('given household metadata with null label then extracts household with undefined label', () => {
      const metadata: HouseholdMetadata = {
        id: TEST_HOUSEHOLD_ID,
        household: mockUSHousehold,
        label: null,
      };

      const result = HouseholdAdapter.fromMetadata(metadata);

      expect(result.label).toBeUndefined();
    });

    test('given UK household metadata then extracts household correctly', () => {
      const metadata: HouseholdMetadata = {
        id: 'uk-household-1',
        household: mockUKHousehold,
        label: 'UK test',
      };

      const result = HouseholdAdapter.fromMetadata(metadata);

      expect(result).toEqual({
        ...mockUKHousehold,
        id: 'uk-household-1',
        label: 'UK test',
      });
      expect(result.benunit).toBeDefined();
      expect(result.tax_unit).toBeUndefined();
    });

    test('given household with all US entity types then preserves all entities', () => {
      const householdWithAllEntities: Household = {
        tax_benefit_model_name: 'policyengine_us',
        year: TEST_YEAR,
        people: [{ person_id: 0, age: 30 }],
        tax_unit: [{ tax_unit_id: 0 }],
        family: [{ family_id: 0 }],
        spm_unit: [{ spm_unit_id: 0 }],
        marital_unit: [{ marital_unit_id: 0 }],
        household: [{ household_id: 0 }],
      };

      const metadata: HouseholdMetadata = {
        id: 'test-id',
        household: householdWithAllEntities,
      };

      const result = HouseholdAdapter.fromMetadata(metadata);

      expect(result.tax_unit).toBeDefined();
      expect(result.family).toBeDefined();
      expect(result.spm_unit).toBeDefined();
      expect(result.marital_unit).toBeDefined();
      expect(result.household).toBeDefined();
    });
  });

  describe('toMetadata', () => {
    test('given household with id and label then creates metadata and strips id and label from household', () => {
      const result = HouseholdAdapter.toMetadata(mockUSHouseholdWithLabel);

      expect(result.id).toBe(TEST_HOUSEHOLD_ID);
      expect(result.label).toBe(TEST_LABEL);
      expect(result.household).toEqual(mockUSHousehold);
      expect(result.household).not.toHaveProperty('id');
      expect(result.household).not.toHaveProperty('label');
      expect(result.created_at).toBeDefined();
    });

    test('given household without id then generates new id', () => {
      const result = HouseholdAdapter.toMetadata(mockUSHousehold);

      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^hh-\d+-[a-z0-9]+$/);
      expect(result.household).toEqual(mockUSHousehold);
    });

    test('given household with custom id parameter then uses provided id', () => {
      const customId = 'custom-hh-id';
      const result = HouseholdAdapter.toMetadata(mockUSHousehold, customId);

      expect(result.id).toBe(customId);
      expect(result.household).toEqual(mockUSHousehold);
    });

    test('given household without label then metadata label is undefined', () => {
      const result = HouseholdAdapter.toMetadata(mockUSHousehold);

      expect(result.label).toBeUndefined();
    });

    test('given household then sets created_at timestamp', () => {
      const beforeTime = new Date();
      const result = HouseholdAdapter.toMetadata(mockUSHousehold);
      const afterTime = new Date();

      expect(result.created_at).toBeDefined();
      const resultTime = new Date(result.created_at!);
      expect(resultTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(resultTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    test('given UK household then creates metadata correctly', () => {
      const ukHouseholdWithLabel = { ...mockUKHousehold, label: 'UK Test' };
      const result = HouseholdAdapter.toMetadata(ukHouseholdWithLabel);

      expect(result.household.tax_benefit_model_name).toBe('policyengine_uk');
      expect(result.household.benunit).toBeDefined();
      expect(result.label).toBe('UK Test');
    });

    test('given household with all entity types then preserves all in metadata', () => {
      const householdWithAllEntities: Household = {
        tax_benefit_model_name: 'policyengine_us',
        year: TEST_YEAR,
        people: [{ person_id: 0 }],
        tax_unit: [{ tax_unit_id: 0 }],
        family: [{ family_id: 0 }],
        spm_unit: [{ spm_unit_id: 0 }],
        marital_unit: [{ marital_unit_id: 0 }],
        household: [{ household_id: 0 }],
      };

      const result = HouseholdAdapter.toMetadata(householdWithAllEntities);

      expect(result.household.tax_unit).toBeDefined();
      expect(result.household.family).toBeDefined();
      expect(result.household.spm_unit).toBeDefined();
      expect(result.household.marital_unit).toBeDefined();
      expect(result.household.household).toBeDefined();
    });
  });

  describe('toCalculatePayload', () => {
    test('given household without policy or dynamic ids then creates basic payload', () => {
      const result = HouseholdAdapter.toCalculatePayload(mockUSHousehold);

      expect(result).toEqual({
        tax_benefit_model_name: 'policyengine_us',
        year: TEST_YEAR,
        people: mockUSHousehold.people,
        tax_unit: mockUSHousehold.tax_unit,
        household: mockUSHousehold.household,
      });
      expect(result.policy_id).toBeUndefined();
      expect(result.dynamic_id).toBeUndefined();
    });

    test('given household with policy id then includes policy_id in payload', () => {
      const result = HouseholdAdapter.toCalculatePayload(mockUSHousehold, TEST_POLICY_ID);

      expect(result.policy_id).toBe(TEST_POLICY_ID);
      expect(result.dynamic_id).toBeUndefined();
    });

    test('given household with policy and dynamic ids then includes both in payload', () => {
      const result = HouseholdAdapter.toCalculatePayload(
        mockUSHousehold,
        TEST_POLICY_ID,
        TEST_DYNAMIC_ID
      );

      expect(result.policy_id).toBe(TEST_POLICY_ID);
      expect(result.dynamic_id).toBe(TEST_DYNAMIC_ID);
    });

    test('given household with only dynamic id then includes dynamic_id', () => {
      const result = HouseholdAdapter.toCalculatePayload(
        mockUSHousehold,
        undefined,
        TEST_DYNAMIC_ID
      );

      expect(result.policy_id).toBeUndefined();
      expect(result.dynamic_id).toBe(TEST_DYNAMIC_ID);
    });

    test('given UK household then creates UK payload', () => {
      const result = HouseholdAdapter.toCalculatePayload(mockUKHousehold);

      expect(result.tax_benefit_model_name).toBe('policyengine_uk');
      expect(result.benunit).toBeDefined();
      expect(result.tax_unit).toBeUndefined();
    });

    test('given household with id and label then excludes them from payload', () => {
      const result = HouseholdAdapter.toCalculatePayload(mockUSHouseholdWithLabel);

      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('label');
    });

    test('given household with all entity types then includes all in payload', () => {
      const householdWithAllEntities: Household = {
        tax_benefit_model_name: 'policyengine_us',
        year: TEST_YEAR,
        people: [{ person_id: 0 }],
        tax_unit: [{ tax_unit_id: 0 }],
        family: [{ family_id: 0 }],
        spm_unit: [{ spm_unit_id: 0 }],
        marital_unit: [{ marital_unit_id: 0 }],
        household: [{ household_id: 0 }],
      };

      const result = HouseholdAdapter.toCalculatePayload(householdWithAllEntities);

      expect(result.tax_unit).toBeDefined();
      expect(result.family).toBeDefined();
      expect(result.spm_unit).toBeDefined();
      expect(result.marital_unit).toBeDefined();
      expect(result.household).toBeDefined();
    });

    test('given household with undefined entity types then excludes them from payload', () => {
      const minimalHousehold: Household = {
        tax_benefit_model_name: 'policyengine_us',
        year: TEST_YEAR,
        people: [{ person_id: 0 }],
      };

      const result = HouseholdAdapter.toCalculatePayload(minimalHousehold);

      expect(result.people).toBeDefined();
      expect(result.tax_unit).toBeUndefined();
      expect(result.family).toBeUndefined();
      expect(result.spm_unit).toBeUndefined();
      expect(result.marital_unit).toBeUndefined();
    });
  });

  describe('getCountryId', () => {
    test('given US household then returns us', () => {
      const result = HouseholdAdapter.getCountryId(mockUSHousehold);

      expect(result).toBe('us');
    });

    test('given UK household then returns uk', () => {
      const result = HouseholdAdapter.getCountryId(mockUKHousehold);

      expect(result).toBe('uk');
    });
  });

  describe('isUS', () => {
    test('given US household then returns true', () => {
      const result = HouseholdAdapter.isUS(mockUSHousehold);

      expect(result).toBe(true);
    });

    test('given UK household then returns false', () => {
      const result = HouseholdAdapter.isUS(mockUKHousehold);

      expect(result).toBe(false);
    });
  });

  describe('isUK', () => {
    test('given UK household then returns true', () => {
      const result = HouseholdAdapter.isUK(mockUKHousehold);

      expect(result).toBe(true);
    });

    test('given US household then returns false', () => {
      const result = HouseholdAdapter.isUK(mockUSHousehold);

      expect(result).toBe(false);
    });
  });
});

describe('countryIdToModelName', () => {
  test('given us then returns policyengine_us', () => {
    const result = countryIdToModelName('us');

    expect(result).toBe('policyengine_us');
  });

  test('given uk then returns policyengine_uk', () => {
    const result = countryIdToModelName('uk');

    expect(result).toBe('policyengine_uk');
  });

  test('given ca then defaults to policyengine_us', () => {
    const result = countryIdToModelName('ca' as any);

    expect(result).toBe('policyengine_us');
  });
});

describe('modelNameToCountryId', () => {
  test('given policyengine_us then returns us', () => {
    const result = modelNameToCountryId('policyengine_us');

    expect(result).toBe('us');
  });

  test('given policyengine_uk then returns uk', () => {
    const result = modelNameToCountryId('policyengine_uk');

    expect(result).toBe('uk');
  });
});

describe('generateHouseholdId', () => {
  test('given no parameters then generates id with correct format', () => {
    const result = generateHouseholdId();

    expect(result).toMatch(/^hh-\d+-[a-z0-9]+$/);
  });

  test('given multiple calls then generates unique ids', () => {
    const id1 = generateHouseholdId();
    const id2 = generateHouseholdId();

    expect(id1).not.toBe(id2);
  });

  test('given call then id starts with hh- prefix', () => {
    const result = generateHouseholdId();

    expect(result.startsWith('hh-')).toBe(true);
  });

  test('given call then id contains timestamp', () => {
    const beforeTime = Date.now();
    const result = generateHouseholdId();
    const afterTime = Date.now();

    const timestampMatch = result.match(/^hh-(\d+)-/);
    expect(timestampMatch).not.toBeNull();

    const timestamp = parseInt(timestampMatch![1], 10);
    expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
    expect(timestamp).toBeLessThanOrEqual(afterTime);
  });
});
