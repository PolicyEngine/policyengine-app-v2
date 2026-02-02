import { beforeEach, describe, expect, test } from 'vitest';
import { Household } from '@/types/ingredients/Household';
import {
  createCoupleUK,
  createCoupleUS,
  createSingleAdultUK,
  createSingleAdultUS,
  HouseholdBuilder,
} from '@/utils/HouseholdBuilder';

// Test constants
const CURRENT_YEAR = 2025;
const MODEL_US = 'policyengine_us' as const;
const MODEL_UK = 'policyengine_uk' as const;

describe('HouseholdBuilder', () => {
  let builder: HouseholdBuilder;

  beforeEach(() => {
    builder = new HouseholdBuilder(MODEL_US, CURRENT_YEAR);
  });

  describe('constructor', () => {
    test('given US model when constructed then creates household with US entities', () => {
      // When
      const household = builder.build();

      // Then
      expect(household.tax_benefit_model_name).toBe(MODEL_US);
      expect(household.year).toBe(CURRENT_YEAR);
      expect(household.people).toEqual([]);
      expect(household.tax_unit).toEqual({});
      expect(household.family).toEqual({});
      expect(household.spm_unit).toEqual({});
      expect(household.marital_unit).toEqual({});
      expect(household.household).toEqual({});
      expect(household.benunit).toBeUndefined();
    });

    test('given UK model when constructed then creates household with UK entities', () => {
      // Given
      builder = new HouseholdBuilder(MODEL_UK, CURRENT_YEAR);

      // When
      const household = builder.build();

      // Then
      expect(household.tax_benefit_model_name).toBe(MODEL_UK);
      expect(household.year).toBe(CURRENT_YEAR);
      expect(household.people).toEqual([]);
      expect(household.benunit).toEqual({});
      expect(household.household).toEqual({});
      expect(household.tax_unit).toBeUndefined();
      expect(household.family).toBeUndefined();
      expect(household.spm_unit).toBeUndefined();
      expect(household.marital_unit).toBeUndefined();
    });
  });

  describe('build method', () => {
    test('given household with data when build then returns deep clone', () => {
      // Given
      builder.addAdult({ age: 30 });
      const household1 = builder.build();

      // When
      household1.people[0].age = 99;
      const household2 = builder.build();

      // Then
      expect(household2.people[0].age).toBe(30);
    });

    test('given multiple builds when called then each returns independent copy', () => {
      // Given
      builder.addAdult({ age: 30 });

      // When
      const household1 = builder.build();
      const household2 = builder.build();

      // Then
      expect(household1).not.toBe(household2);
      expect(household1).toEqual(household2);
    });
  });

  describe('addAdult method', () => {
    test('given adult data when addAdult then adds person with correct index', () => {
      // When
      const index = builder.addAdult({ age: 35 });
      const household = builder.build();

      // Then
      expect(index).toBe(0);
      expect(household.people).toHaveLength(1);
      expect(household.people[0].age).toBe(35);
    });

    test('given adult with variables when addAdult then includes variables', () => {
      // When
      builder.addAdult({ age: 35, employment_income: 50000 });
      const household = builder.build();

      // Then
      expect(household.people[0].employment_income).toBe(50000);
    });

    test('given multiple adults when addAdult then indices increment', () => {
      // When
      const index1 = builder.addAdult({ age: 30 });
      const index2 = builder.addAdult({ age: 35 });
      const index3 = builder.addAdult({ age: 40 });

      // Then
      expect(index1).toBe(0);
      expect(index2).toBe(1);
      expect(index3).toBe(2);
    });

    test('given adult when addAdult then person has no person_id field', () => {
      // When
      builder.addAdult({ age: 35 });
      const household = builder.build();

      // Then
      expect(household.people[0]).not.toHaveProperty('person_id');
      expect(household.people[0]).not.toHaveProperty('name');
      expect(household.people[0]).not.toHaveProperty('person_tax_unit_id');
      expect(household.people[0]).not.toHaveProperty('person_household_id');
    });
  });

  describe('addChild method', () => {
    test('given child data when addChild then adds person with correct index', () => {
      // When
      const index = builder.addChild({ age: 10 });
      const household = builder.build();

      // Then
      expect(index).toBe(0);
      expect(household.people).toHaveLength(1);
      expect(household.people[0].age).toBe(10);
    });

    test('given US child when addChild then sets dependent flag', () => {
      // When
      builder.addChild({ age: 10 });
      const household = builder.build();

      // Then
      expect(household.people[0].is_tax_unit_dependent).toBe(true);
    });

    test('given UK child when addChild then does not set dependent flag', () => {
      // Given
      builder = new HouseholdBuilder(MODEL_UK, CURRENT_YEAR);

      // When
      builder.addChild({ age: 10 });
      const household = builder.build();

      // Then
      expect(household.people[0].is_tax_unit_dependent).toBeUndefined();
    });

    test('given child when addChild then person has no person_id field', () => {
      // When
      builder.addChild({ age: 10 });
      const household = builder.build();

      // Then
      expect(household.people[0]).not.toHaveProperty('person_id');
      expect(household.people[0]).not.toHaveProperty('name');
      expect(household.people[0]).not.toHaveProperty('person_marital_unit_id');
    });
  });

  describe('addChildren method', () => {
    test('given count of 1 when addChildren then adds single child', () => {
      // When
      const childIndices = builder.addChildren(1, { age: 10 });
      const household = builder.build();

      // Then
      expect(childIndices).toHaveLength(1);
      expect(childIndices[0]).toBe(0);
      expect(household.people).toHaveLength(1);
    });

    test('given count of 3 when addChildren then adds all children', () => {
      // When
      const childIndices = builder.addChildren(3, { age: 10 });
      const household = builder.build();

      // Then
      expect(childIndices).toHaveLength(3);
      expect(childIndices).toEqual([0, 1, 2]);
      expect(household.people).toHaveLength(3);
    });

    test('given variables when addChildren then applies to all children', () => {
      // When
      builder.addChildren(2, { age: 10, employment_income: 1000 });
      const household = builder.build();

      // Then
      expect(household.people[0].employment_income).toBe(1000);
      expect(household.people[1].employment_income).toBe(1000);
    });
  });

  describe('removePerson method', () => {
    test('given person exists when removePerson then removes from household', () => {
      // Given
      const index1 = builder.addAdult({ age: 30 });
      builder.addAdult({ age: 35 });

      // When
      builder.removePerson(index1);
      const household = builder.build();

      // Then
      expect(household.people).toHaveLength(1);
      expect(household.people[0].age).toBe(35);
    });

    test('given invalid index when removePerson then does nothing', () => {
      // Given
      builder.addAdult({ age: 30 });

      // When
      builder.removePerson(999);
      const household = builder.build();

      // Then
      expect(household.people).toHaveLength(1);
    });

    test('given person removed when builder continues then can add new person', () => {
      // Given
      const index1 = builder.addAdult({ age: 30 });
      builder.removePerson(index1);

      // When
      builder.addAdult({ age: 35 });
      const household = builder.build();

      // Then
      expect(household.people).toHaveLength(1);
      expect(household.people[0].age).toBe(35);
    });
  });

  describe('getPerson method', () => {
    test('given person exists when getPerson then returns person', () => {
      // Given
      const index = builder.addAdult({ age: 30 });

      // When
      const person = builder.getPerson(index);

      // Then
      expect(person).toBeDefined();
      expect(person?.age).toBe(30);
    });

    test('given invalid index when getPerson then returns undefined', () => {
      // When
      const person = builder.getPerson(999);

      // Then
      expect(person).toBeUndefined();
    });
  });

  describe('setPersonVariable method', () => {
    test('given person exists when setPersonVariable then sets variable', () => {
      // Given
      const index = builder.addAdult({ age: 30 });

      // When
      builder.setPersonVariable(index, 'employment_income', 50000);
      const household = builder.build();

      // Then
      expect(household.people[0].employment_income).toBe(50000);
    });

    test('given invalid index when setPersonVariable then throws error', () => {
      // When/Then
      expect(() => builder.setPersonVariable(999, 'employment_income', 50000)).toThrow(
        'Person at index 999 not found'
      );
    });

    test('given existing variable when setPersonVariable then overwrites', () => {
      // Given
      const index = builder.addAdult({ age: 30, employment_income: 40000 });

      // When
      builder.setPersonVariable(index, 'employment_income', 60000);
      const household = builder.build();

      // Then
      expect(household.people[0].employment_income).toBe(60000);
    });

    test('given setPersonVariable when called then returns builder for chaining', () => {
      // Given
      const index = builder.addAdult({ age: 30 });

      // When
      const result = builder.setPersonVariable(index, 'employment_income', 50000);

      // Then
      expect(result).toBe(builder);
    });
  });

  describe('setEntityVariable method', () => {
    test('given tax_unit entity when setEntityVariable then sets variable', () => {
      // Given
      builder.addAdult({ age: 30 });

      // When
      builder.setEntityVariable('tax_unit', 'state_code', 'CA');
      const household = builder.build();

      // Then
      expect(household.tax_unit).toBeDefined();
      expect(household.tax_unit?.state_code).toBe('CA');
    });

    test('given household entity when setEntityVariable then sets variable', () => {
      // Given
      builder.addAdult({ age: 30 });

      // When
      builder.setEntityVariable('household', 'state_fips', 6);
      const household = builder.build();

      // Then
      expect(household.household).toBeDefined();
      expect(household.household?.state_fips).toBe(6);
    });

    test('given invalid entity when setEntityVariable then throws error', () => {
      // When/Then
      expect(() => builder.setEntityVariable('nonexistent', 'var', 'value')).toThrow(
        'Entity nonexistent not found or is not a dict'
      );
    });
  });

  describe('setState method', () => {
    test('given US household when setState then sets state on entities', () => {
      // Given
      builder.addAdult({ age: 30 });

      // When
      builder.setState('CA', 6);
      const household = builder.build();

      // Then
      expect(household.tax_unit?.state_code).toBe('CA');
      expect(household.household?.state_fips).toBe(6);
    });

    test('given UK household when setState then throws error', () => {
      // Given
      builder = new HouseholdBuilder(MODEL_UK, CURRENT_YEAR);

      // When/Then
      expect(() => builder.setState('CA', 6)).toThrow('setState is only valid for US households');
    });
  });

  describe('setRegion method', () => {
    test('given UK household when setRegion then sets region on household', () => {
      // Given
      builder = new HouseholdBuilder(MODEL_UK, CURRENT_YEAR);
      builder.addAdult({ age: 30 });

      // When
      builder.setRegion('LONDON');
      const household = builder.build();

      // Then
      expect(household.household?.region).toBe('LONDON');
    });

    test('given US household when setRegion then throws error', () => {
      // When/Then
      expect(() => builder.setRegion('LONDON')).toThrow(
        'setRegion is only valid for UK households'
      );
    });
  });

  describe('loadHousehold method', () => {
    test('given existing household when loadHousehold then loads for modification', () => {
      // Given
      const existingHousehold: Household = {
        tax_benefit_model_name: MODEL_US,
        year: CURRENT_YEAR,
        people: [{ age: 30 }],
        tax_unit: {},
        family: {},
        spm_unit: {},
        marital_unit: {},
        household: {},
      };

      // When
      builder.loadHousehold(existingHousehold);
      builder.addAdult({ age: 35 });
      const household = builder.build();

      // Then
      expect(household.people).toHaveLength(2);
      expect(household.people[0].age).toBe(30);
      expect(household.people[1].age).toBe(35);
    });

    test('given loaded household when modified then original unchanged', () => {
      // Given
      const existingHousehold: Household = {
        tax_benefit_model_name: MODEL_US,
        year: CURRENT_YEAR,
        people: [{ age: 30 }],
        tax_unit: {},
        family: {},
        spm_unit: {},
        marital_unit: {},
        household: {},
      };

      // When
      builder.loadHousehold(existingHousehold);
      builder.removePerson(0);
      builder.build();

      // Then
      expect(existingHousehold.people).toHaveLength(1);
    });
  });

  describe('setYear method', () => {
    test('given setYear when called then updates year', () => {
      // When
      builder.setYear(2026);
      const household = builder.build();

      // Then
      expect(household.year).toBe(2026);
    });
  });

  describe('setLabel method', () => {
    test('given setLabel when called then updates label', () => {
      // When
      builder.setLabel('Test Household');
      const household = builder.build();

      // Then
      expect(household.label).toBe('Test Household');
    });
  });

  describe('getPersonCount method', () => {
    test('given empty household when getPersonCount then returns 0', () => {
      // When
      const count = builder.getPersonCount();

      // Then
      expect(count).toBe(0);
    });

    test('given household with people when getPersonCount then returns count', () => {
      // Given
      builder.addAdult({ age: 30 });
      builder.addChild({ age: 10 });

      // When
      const count = builder.getPersonCount();

      // Then
      expect(count).toBe(2);
    });
  });

  describe('getHousehold method', () => {
    test('given household with data when getHousehold then returns current state', () => {
      // Given
      builder.addAdult({ age: 30 });

      // When
      const household = builder.getHousehold();

      // Then
      expect(household.people).toHaveLength(1);
    });

    test('given getHousehold when modified then affects builder state', () => {
      // Given
      builder.addAdult({ age: 30 });

      // When
      const household = builder.getHousehold();
      household.people[0].age = 99;
      const builtHousehold = builder.build();

      // Then
      expect(builtHousehold.people[0].age).toBe(99);
    });
  });

  describe('fluent API', () => {
    test('given chained operations when building then all apply correctly', () => {
      // When
      const adultIndex = builder.addAdult({ age: 35 });
      builder.addChild({ age: 10 });

      const household = builder
        .setPersonVariable(adultIndex, 'employment_income', 50000)
        .setState('CA', 6)
        .setLabel('Test Family')
        .build();

      // Then
      expect(household.people).toHaveLength(2);
      expect(household.people[0].employment_income).toBe(50000);
      expect(household.tax_unit?.state_code).toBe('CA');
      expect(household.household?.state_fips).toBe(6);
      expect(household.label).toBe('Test Family');
    });
  });

  describe('factory functions', () => {
    describe('createSingleAdultUS', () => {
      test('given options when called then creates US household with one adult', () => {
        // When
        const household = createSingleAdultUS(CURRENT_YEAR, {
          age: 35,
          employment_income: 50000,
        });

        // Then
        expect(household.tax_benefit_model_name).toBe(MODEL_US);
        expect(household.year).toBe(CURRENT_YEAR);
        expect(household.people).toHaveLength(1);
        expect(household.people[0].age).toBe(35);
        expect(household.people[0].employment_income).toBe(50000);
        expect(household.tax_unit).toBeDefined();
      });

      test('given options when called then person has no person_id', () => {
        // When
        const household = createSingleAdultUS(CURRENT_YEAR, { age: 35 });

        // Then
        expect(household.people[0]).not.toHaveProperty('person_id');
        expect(household.people[0]).not.toHaveProperty('name');
      });
    });

    describe('createSingleAdultUK', () => {
      test('given options when called then creates UK household with one adult', () => {
        // When
        const household = createSingleAdultUK(CURRENT_YEAR, {
          age: 35,
          employment_income: 50000,
        });

        // Then
        expect(household.tax_benefit_model_name).toBe(MODEL_UK);
        expect(household.year).toBe(CURRENT_YEAR);
        expect(household.people).toHaveLength(1);
        expect(household.people[0].age).toBe(35);
        expect(household.benunit).toBeDefined();
        expect(household.tax_unit).toBeUndefined();
      });
    });

    describe('createCoupleUS', () => {
      test('given two adults when called then creates US household with couple', () => {
        // When
        const household = createCoupleUS(
          CURRENT_YEAR,
          { age: 35, employment_income: 50000 },
          { age: 40, employment_income: 60000 }
        );

        // Then
        expect(household.tax_benefit_model_name).toBe(MODEL_US);
        expect(household.year).toBe(CURRENT_YEAR);
        expect(household.people).toHaveLength(2);
        expect(household.people[0].age).toBe(35);
        expect(household.people[1].age).toBe(40);
      });

      test('given couple when called then people have no person_id or membership fields', () => {
        // When
        const household = createCoupleUS(CURRENT_YEAR, { age: 35 }, { age: 40 });

        // Then
        expect(household.people[0]).not.toHaveProperty('person_id');
        expect(household.people[0]).not.toHaveProperty('person_tax_unit_id');
        expect(household.people[1]).not.toHaveProperty('person_id');
        expect(household.people[1]).not.toHaveProperty('person_marital_unit_id');
      });
    });

    describe('createCoupleUK', () => {
      test('given two adults when called then creates UK household with couple', () => {
        // When
        const household = createCoupleUK(CURRENT_YEAR, { age: 35 }, { age: 40 });

        // Then
        expect(household.tax_benefit_model_name).toBe(MODEL_UK);
        expect(household.year).toBe(CURRENT_YEAR);
        expect(household.people).toHaveLength(2);
        expect(household.people[0].age).toBe(35);
        expect(household.people[1].age).toBe(40);
      });
    });
  });

  describe('complex household scenarios', () => {
    test('given family with parents and children when built then correct structure', () => {
      // When
      builder.addAdult({ age: 35 });
      builder.addAdult({ age: 40 });
      builder.addChild({ age: 10 });
      builder.addChild({ age: 8 });
      const household = builder.build();

      // Then
      expect(household.people).toHaveLength(4);

      // Children are dependents
      expect(household.people[2].is_tax_unit_dependent).toBe(true);
      expect(household.people[3].is_tax_unit_dependent).toBe(true);

      // Adults are not dependents
      expect(household.people[0].is_tax_unit_dependent).toBeUndefined();
      expect(household.people[1].is_tax_unit_dependent).toBeUndefined();
    });

    test('given multiple people when built then entities are single dicts', () => {
      // When
      builder.addAdult({ age: 30 });
      builder.addAdult({ age: 35 });
      builder.addChild({ age: 10 });
      const household = builder.build();

      // Then
      expect(household.tax_unit).toBeDefined();
      expect(household.household).toBeDefined();
      expect(Array.isArray(household.tax_unit)).toBe(false);
      expect(Array.isArray(household.household)).toBe(false);
      expect(typeof household.tax_unit).toBe('object');
      expect(typeof household.household).toBe('object');
    });

    test('given entity variables when set then stored on single dict', () => {
      // When
      builder.addAdult({ age: 30 });
      builder.setEntityVariable('tax_unit', 'state_code', 'CA');
      builder.setEntityVariable('household', 'state_fips', 6);
      const household = builder.build();

      // Then
      expect(household.tax_unit?.state_code).toBe('CA');
      expect(household.household?.state_fips).toBe(6);
    });
  });

  describe('v2 Alpha format compliance', () => {
    test('given household when built then people have no id fields', () => {
      // When
      builder.addAdult({ age: 30 });
      builder.addChild({ age: 10 });
      const household = builder.build();

      // Then
      household.people.forEach((person) => {
        expect(person).not.toHaveProperty('person_id');
        expect(person).not.toHaveProperty('name');
        expect(person).not.toHaveProperty('person_tax_unit_id');
        expect(person).not.toHaveProperty('person_family_id');
        expect(person).not.toHaveProperty('person_spm_unit_id');
        expect(person).not.toHaveProperty('person_marital_unit_id');
        expect(person).not.toHaveProperty('person_household_id');
        expect(person).not.toHaveProperty('person_benunit_id');
      });
    });

    test('given US household when built then entities are dicts not arrays', () => {
      // When
      builder.addAdult({ age: 30 });
      const household = builder.build();

      // Then
      expect(Array.isArray(household.tax_unit)).toBe(false);
      expect(Array.isArray(household.family)).toBe(false);
      expect(Array.isArray(household.spm_unit)).toBe(false);
      expect(Array.isArray(household.marital_unit)).toBe(false);
      expect(Array.isArray(household.household)).toBe(false);
    });

    test('given UK household when built then entities are dicts not arrays', () => {
      // Given
      builder = new HouseholdBuilder(MODEL_UK, CURRENT_YEAR);

      // When
      builder.addAdult({ age: 30 });
      const household = builder.build();

      // Then
      expect(Array.isArray(household.benunit)).toBe(false);
      expect(Array.isArray(household.household)).toBe(false);
    });

    test('given empty household when built then entities are empty dicts', () => {
      // When
      const household = builder.build();

      // Then
      expect(household.tax_unit).toEqual({});
      expect(household.family).toEqual({});
      expect(household.spm_unit).toEqual({});
      expect(household.marital_unit).toEqual({});
      expect(household.household).toEqual({});
    });
  });
});
