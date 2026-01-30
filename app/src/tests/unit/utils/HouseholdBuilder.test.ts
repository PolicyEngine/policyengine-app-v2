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
      expect(household.tax_unit).toEqual([]);
      expect(household.family).toEqual([]);
      expect(household.spm_unit).toEqual([]);
      expect(household.marital_unit).toEqual([]);
      expect(household.household).toEqual([]);
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
      expect(household.benunit).toEqual([]);
      expect(household.household).toEqual([]);
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
    test('given adult data when addAdult then adds person with correct ID', () => {
      // When
      const personId = builder.addAdult({ name: 'Alice', age: 35 });
      const household = builder.build();

      // Then
      expect(personId).toBe(0);
      expect(household.people).toHaveLength(1);
      expect(household.people[0].person_id).toBe(0);
      expect(household.people[0].name).toBe('Alice');
      expect(household.people[0].age).toBe(35);
    });

    test('given adult with variables when addAdult then includes variables', () => {
      // When
      builder.addAdult({ age: 35, employment_income: 50000 });
      const household = builder.build();

      // Then
      expect(household.people[0].employment_income).toBe(50000);
    });

    test('given US adult when addAdult then assigns to default entities', () => {
      // When
      builder.addAdult({ age: 35 });
      const household = builder.build();

      // Then
      const person = household.people[0];
      expect(person.person_tax_unit_id).toBe(0);
      expect(person.person_family_id).toBe(0);
      expect(person.person_spm_unit_id).toBe(0);
      expect(person.person_household_id).toBe(0);
      expect(person.person_marital_unit_id).toBe(0);

      // Verify entities were created
      expect(household.tax_unit).toHaveLength(1);
      expect(household.family).toHaveLength(1);
      expect(household.spm_unit).toHaveLength(1);
      expect(household.household).toHaveLength(1);
      expect(household.marital_unit).toHaveLength(1);
    });

    test('given UK adult when addAdult then assigns to UK entities', () => {
      // Given
      builder = new HouseholdBuilder(MODEL_UK, CURRENT_YEAR);

      // When
      builder.addAdult({ age: 35 });
      const household = builder.build();

      // Then
      const person = household.people[0];
      expect(person.person_benunit_id).toBe(0);
      expect(person.person_household_id).toBe(0);

      // Verify entities were created
      expect(household.benunit).toHaveLength(1);
      expect(household.household).toHaveLength(1);
    });

    test('given multiple adults when addAdult then all share same default entities', () => {
      // When
      builder.addAdult({ age: 35 });
      builder.addAdult({ age: 40 });
      const household = builder.build();

      // Then
      expect(household.people).toHaveLength(2);
      expect(household.people[0].person_tax_unit_id).toBe(0);
      expect(household.people[1].person_tax_unit_id).toBe(0);
      expect(household.people[0].person_household_id).toBe(0);
      expect(household.people[1].person_household_id).toBe(0);

      // Both adults share same marital unit
      expect(household.people[0].person_marital_unit_id).toBe(0);
      expect(household.people[1].person_marital_unit_id).toBe(0);
    });

    test('given sequential adds when addAdult then IDs increment', () => {
      // When
      const id1 = builder.addAdult({ age: 30 });
      const id2 = builder.addAdult({ age: 35 });
      const id3 = builder.addAdult({ age: 40 });

      // Then
      expect(id1).toBe(0);
      expect(id2).toBe(1);
      expect(id3).toBe(2);
    });
  });

  describe('addChild method', () => {
    test('given child data when addChild then adds person with correct ID', () => {
      // When
      const personId = builder.addChild({ name: 'Bob', age: 10 });
      const household = builder.build();

      // Then
      expect(personId).toBe(0);
      expect(household.people).toHaveLength(1);
      expect(household.people[0].person_id).toBe(0);
      expect(household.people[0].name).toBe('Bob');
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

    test('given US child when addChild then assigns to default entities', () => {
      // When
      builder.addChild({ age: 10 });
      const household = builder.build();

      // Then
      const person = household.people[0];
      expect(person.person_tax_unit_id).toBe(0);
      expect(person.person_family_id).toBe(0);
      expect(person.person_spm_unit_id).toBe(0);
      expect(person.person_household_id).toBe(0);
      expect(person.person_marital_unit_id).toBe(0);
    });

    test('given US child when addChild then gets own marital unit', () => {
      // When
      builder.addAdult({ age: 35 }); // Creates marital unit 0
      builder.addChild({ age: 10 }); // Should create marital unit 1
      const household = builder.build();

      // Then
      expect(household.people[0].person_marital_unit_id).toBe(0); // Adult
      expect(household.people[1].person_marital_unit_id).toBe(1); // Child
      expect(household.marital_unit).toHaveLength(2);
    });

    test('given multiple children when addChild then each gets own marital unit', () => {
      // When
      builder.addChild({ age: 10 });
      builder.addChild({ age: 8 });
      const household = builder.build();

      // Then
      expect(household.people[0].person_marital_unit_id).toBe(0);
      expect(household.people[1].person_marital_unit_id).toBe(1);
      expect(household.marital_unit).toHaveLength(2);
    });
  });

  describe('addChildren method', () => {
    test('given count of 1 when addChildren then adds single child with base name', () => {
      // When
      const childIds = builder.addChildren(1, { name: 'Child', age: 10 });
      const household = builder.build();

      // Then
      expect(childIds).toHaveLength(1);
      expect(childIds[0]).toBe(0);
      expect(household.people).toHaveLength(1);
      expect(household.people[0].name).toBe('Child');
    });

    test('given count of 3 when addChildren then adds numbered children', () => {
      // When
      const childIds = builder.addChildren(3, { name: 'Child', age: 10 });
      const household = builder.build();

      // Then
      expect(childIds).toHaveLength(3);
      expect(childIds).toEqual([0, 1, 2]);
      expect(household.people).toHaveLength(3);
      expect(household.people[0].name).toBe('Child 1');
      expect(household.people[1].name).toBe('Child 2');
      expect(household.people[2].name).toBe('Child 3');
    });

    test('given count of 3 without name when addChildren then adds unnamed children', () => {
      // When
      const childIds = builder.addChildren(3, { age: 10 });
      const household = builder.build();

      // Then
      expect(childIds).toHaveLength(3);
      expect(household.people).toHaveLength(3);
      expect(household.people[0].name).toBeUndefined();
      expect(household.people[1].name).toBeUndefined();
      expect(household.people[2].name).toBeUndefined();
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
      const id1 = builder.addAdult({ age: 30 });
      const id2 = builder.addAdult({ age: 35 });

      // When
      builder.removePerson(id1);
      const household = builder.build();

      // Then
      expect(household.people).toHaveLength(1);
      expect(household.people[0].person_id).toBe(id2);
    });

    test('given person not exists when removePerson then does nothing', () => {
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
      const id1 = builder.addAdult({ age: 30 });
      builder.removePerson(id1);

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
      const id = builder.addAdult({ name: 'Alice', age: 30 });

      // When
      const person = builder.getPerson(id);

      // Then
      expect(person).toBeDefined();
      expect(person?.name).toBe('Alice');
      expect(person?.age).toBe(30);
    });

    test('given person not exists when getPerson then returns undefined', () => {
      // When
      const person = builder.getPerson(999);

      // Then
      expect(person).toBeUndefined();
    });
  });

  describe('setPersonVariable method', () => {
    test('given person exists when setPersonVariable then sets variable', () => {
      // Given
      const id = builder.addAdult({ age: 30 });

      // When
      builder.setPersonVariable(id, 'employment_income', 50000);
      const household = builder.build();

      // Then
      expect(household.people[0].employment_income).toBe(50000);
    });

    test('given person not exists when setPersonVariable then throws error', () => {
      // When/Then
      expect(() => builder.setPersonVariable(999, 'employment_income', 50000)).toThrow(
        'Person with ID 999 not found'
      );
    });

    test('given existing variable when setPersonVariable then overwrites', () => {
      // Given
      const id = builder.addAdult({ age: 30, employment_income: 40000 });

      // When
      builder.setPersonVariable(id, 'employment_income', 60000);
      const household = builder.build();

      // Then
      expect(household.people[0].employment_income).toBe(60000);
    });

    test('given setPersonVariable when called then returns builder for chaining', () => {
      // Given
      const id = builder.addAdult({ age: 30 });

      // When
      const result = builder.setPersonVariable(id, 'employment_income', 50000);

      // Then
      expect(result).toBe(builder);
    });
  });

  describe('setTaxUnitVariable method', () => {
    test('given tax unit exists when setTaxUnitVariable then sets variable', () => {
      // Given
      builder.addAdult({ age: 30 });

      // When
      builder.setTaxUnitVariable(0, 'state_code', 'CA');
      const household = builder.build();

      // Then
      expect(household.tax_unit?.[0].state_code).toBe('CA');
    });

    test('given tax unit not exists when setTaxUnitVariable then throws error', () => {
      // When/Then
      expect(() => builder.setTaxUnitVariable(999, 'state_code', 'CA')).toThrow(
        'Tax unit with ID 999 not found'
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
      expect(household.tax_unit?.[0].state_code).toBe('CA');
      expect(household.household?.[0].state_fips).toBe(6);
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
      expect(household.household?.[0].region).toBe('LONDON');
    });

    test('given US household when setRegion then throws error', () => {
      // When/Then
      expect(() => builder.setRegion('LONDON')).toThrow(
        'setRegion is only valid for UK households'
      );
    });
  });

  describe('assignToTaxUnit method', () => {
    test('given person and tax unit exist when assignToTaxUnit then reassigns person', () => {
      // Given
      const id = builder.addAdult({ age: 30 });
      const newTaxUnitId = builder.addTaxUnit({});

      // When
      builder.assignToTaxUnit(id, newTaxUnitId);
      const household = builder.build();

      // Then
      expect(household.people[0].person_tax_unit_id).toBe(newTaxUnitId);
    });

    test('given person not exists when assignToTaxUnit then throws error', () => {
      // When/Then
      expect(() => builder.assignToTaxUnit(999, 0)).toThrow('Person with ID 999 not found');
    });
  });

  describe('loadHousehold method', () => {
    test('given existing household when loadHousehold then loads for modification', () => {
      // Given
      const existingHousehold: Household = {
        tax_benefit_model_name: MODEL_US,
        year: CURRENT_YEAR,
        people: [{ person_id: 0, age: 30 }],
        tax_unit: [{ tax_unit_id: 0 }],
        family: [{ family_id: 0 }],
        spm_unit: [{ spm_unit_id: 0 }],
        marital_unit: [{ marital_unit_id: 0 }],
        household: [{ household_id: 0 }],
      };

      // When
      builder.loadHousehold(existingHousehold);
      builder.addAdult({ age: 35 });
      const household = builder.build();

      // Then
      expect(household.people).toHaveLength(2);
      expect(household.people[0].age).toBe(30);
      expect(household.people[1].age).toBe(35);
      expect(household.people[1].person_id).toBe(1);
    });

    test('given loaded household when modified then original unchanged', () => {
      // Given
      const existingHousehold: Household = {
        tax_benefit_model_name: MODEL_US,
        year: CURRENT_YEAR,
        people: [{ person_id: 0, age: 30 }],
        tax_unit: [{ tax_unit_id: 0 }],
        family: [{ family_id: 0 }],
        spm_unit: [{ spm_unit_id: 0 }],
        marital_unit: [{ marital_unit_id: 0 }],
        household: [{ household_id: 0 }],
      };

      // When
      builder.loadHousehold(existingHousehold);
      builder.removePerson(0);
      builder.build();

      // Then
      expect(existingHousehold.people).toHaveLength(1);
    });

    test('given loaded household when adding people then IDs continue from max', () => {
      // Given
      const existingHousehold: Household = {
        tax_benefit_model_name: MODEL_US,
        year: CURRENT_YEAR,
        people: [
          { person_id: 0, age: 30 },
          { person_id: 5, age: 35 },
        ],
        tax_unit: [{ tax_unit_id: 2 }],
        family: [],
        spm_unit: [],
        marital_unit: [],
        household: [],
      };

      // When
      builder.loadHousehold(existingHousehold);
      const newId = builder.addAdult({ age: 40 });

      // Then
      expect(newId).toBe(6); // Max was 5, so next is 6
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
      const aliceId = builder.addAdult({ name: 'Alice', age: 35 });
      const bobId = builder.addAdult({ name: 'Bob', age: 40 });
      const childId = builder.addChild({ name: 'Charlie', age: 10 });

      const household = builder
        .setPersonVariable(aliceId, 'employment_income', 50000)
        .setPersonVariable(bobId, 'employment_income', 60000)
        .setState('CA', 6)
        .setLabel('Test Family')
        .build();

      // Then
      expect(household.people).toHaveLength(3);
      expect(household.people[0].employment_income).toBe(50000);
      expect(household.people[1].employment_income).toBe(60000);
      expect(household.tax_unit?.[0].state_code).toBe('CA');
      expect(household.household?.[0].state_fips).toBe(6);
      expect(household.label).toBe('Test Family');
    });
  });

  describe('entity ID management', () => {
    test('given US household when adding first adult then creates all default entities with ID 0', () => {
      // When
      builder.addAdult({ age: 30 });
      const household = builder.build();

      // Then
      expect(household.tax_unit?.[0].tax_unit_id).toBe(0);
      expect(household.family?.[0].family_id).toBe(0);
      expect(household.spm_unit?.[0].spm_unit_id).toBe(0);
      expect(household.marital_unit?.[0].marital_unit_id).toBe(0);
      expect(household.household?.[0].household_id).toBe(0);
    });

    test('given UK household when adding first adult then creates default entities with ID 0', () => {
      // Given
      builder = new HouseholdBuilder(MODEL_UK, CURRENT_YEAR);

      // When
      builder.addAdult({ age: 30 });
      const household = builder.build();

      // Then
      expect(household.benunit?.[0].benunit_id).toBe(0);
      expect(household.household?.[0].household_id).toBe(0);
    });

    test('given manually added entities when IDs used then do not conflict', () => {
      // When
      const customTaxUnitId = builder.addTaxUnit({ state_code: 'NY' });
      builder.addAdult({ age: 30 }); // Should create default tax unit with different ID
      const household = builder.build();

      // Then
      expect(household.tax_unit).toHaveLength(2);
      expect(household.tax_unit?.[0].tax_unit_id).toBe(0);
      expect(household.tax_unit?.[0].state_code).toBe('NY');
      expect(household.tax_unit?.[1].tax_unit_id).toBe(1);
    });
  });

  describe('factory functions', () => {
    describe('createSingleAdultUS', () => {
      test('given options when called then creates US household with one adult', () => {
        // When
        const household = createSingleAdultUS(CURRENT_YEAR, {
          name: 'Alice',
          age: 35,
          employment_income: 50000,
        });

        // Then
        expect(household.tax_benefit_model_name).toBe(MODEL_US);
        expect(household.year).toBe(CURRENT_YEAR);
        expect(household.people).toHaveLength(1);
        expect(household.people[0].name).toBe('Alice');
        expect(household.people[0].age).toBe(35);
        expect(household.people[0].employment_income).toBe(50000);
        expect(household.tax_unit).toHaveLength(1);
      });
    });

    describe('createSingleAdultUK', () => {
      test('given options when called then creates UK household with one adult', () => {
        // When
        const household = createSingleAdultUK(CURRENT_YEAR, {
          name: 'Alice',
          age: 35,
          employment_income: 50000,
        });

        // Then
        expect(household.tax_benefit_model_name).toBe(MODEL_UK);
        expect(household.year).toBe(CURRENT_YEAR);
        expect(household.people).toHaveLength(1);
        expect(household.people[0].name).toBe('Alice');
        expect(household.people[0].age).toBe(35);
        expect(household.benunit).toHaveLength(1);
        expect(household.tax_unit).toBeUndefined();
      });
    });

    describe('createCoupleUS', () => {
      test('given two adults when called then creates US household with couple', () => {
        // When
        const household = createCoupleUS(
          CURRENT_YEAR,
          { name: 'Alice', age: 35, employment_income: 50000 },
          { name: 'Bob', age: 40, employment_income: 60000 }
        );

        // Then
        expect(household.tax_benefit_model_name).toBe(MODEL_US);
        expect(household.year).toBe(CURRENT_YEAR);
        expect(household.people).toHaveLength(2);
        expect(household.people[0].name).toBe('Alice');
        expect(household.people[1].name).toBe('Bob');
        // Both should be in same tax unit
        expect(household.people[0].person_tax_unit_id).toBe(0);
        expect(household.people[1].person_tax_unit_id).toBe(0);
        // Both should share marital unit
        expect(household.people[0].person_marital_unit_id).toBe(0);
        expect(household.people[1].person_marital_unit_id).toBe(0);
      });
    });

    describe('createCoupleUK', () => {
      test('given two adults when called then creates UK household with couple', () => {
        // When
        const household = createCoupleUK(
          CURRENT_YEAR,
          { name: 'Alice', age: 35 },
          { name: 'Bob', age: 40 }
        );

        // Then
        expect(household.tax_benefit_model_name).toBe(MODEL_UK);
        expect(household.year).toBe(CURRENT_YEAR);
        expect(household.people).toHaveLength(2);
        expect(household.people[0].name).toBe('Alice');
        expect(household.people[1].name).toBe('Bob');
        // Both should be in same benunit
        expect(household.people[0].person_benunit_id).toBe(0);
        expect(household.people[1].person_benunit_id).toBe(0);
      });
    });
  });

  describe('complex household scenarios', () => {
    test('given family with parents and children when built then correct structure', () => {
      // When
      const parent1 = builder.addAdult({ name: 'Alice', age: 35 });
      const parent2 = builder.addAdult({ name: 'Bob', age: 40 });
      const child1 = builder.addChild({ name: 'Charlie', age: 10 });
      const child2 = builder.addChild({ name: 'Diana', age: 8 });
      const household = builder.build();

      // Then
      expect(household.people).toHaveLength(4);

      // All share same tax unit, family, spm unit, household
      expect(household.people.every((p) => p.person_tax_unit_id === 0)).toBe(true);
      expect(household.people.every((p) => p.person_family_id === 0)).toBe(true);
      expect(household.people.every((p) => p.person_spm_unit_id === 0)).toBe(true);
      expect(household.people.every((p) => p.person_household_id === 0)).toBe(true);

      // Adults share marital unit 0, children have their own
      expect(household.people[0].person_marital_unit_id).toBe(0); // Alice
      expect(household.people[1].person_marital_unit_id).toBe(0); // Bob
      expect(household.people[2].person_marital_unit_id).toBe(1); // Charlie
      expect(household.people[3].person_marital_unit_id).toBe(2); // Diana

      // Children are dependents
      expect(household.people[2].is_tax_unit_dependent).toBe(true);
      expect(household.people[3].is_tax_unit_dependent).toBe(true);
    });

    test('given multiple tax units when created then people can be assigned separately', () => {
      // When
      const taxUnit1 = builder.addTaxUnit({ state_code: 'CA' });
      const taxUnit2 = builder.addTaxUnit({ state_code: 'NY' });

      const person1 = builder.addAdult({ age: 30 });
      const person2 = builder.addAdult({ age: 35 });

      builder.assignToTaxUnit(person2, taxUnit2);
      const household = builder.build();

      // Then
      expect(household.tax_unit).toHaveLength(3); // 2 manual + 1 default from first adult
      expect(household.people[0].person_tax_unit_id).not.toBe(
        household.people[1].person_tax_unit_id
      );
    });
  });
});
