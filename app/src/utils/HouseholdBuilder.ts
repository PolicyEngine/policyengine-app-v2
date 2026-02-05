/**
 * HouseholdBuilder - Fluent API for constructing households in API v2 Alpha storage format
 *
 * This builder creates households matching the API v2 Alpha HouseholdCreate (storage format):
 * - People are plain variable dicts (no person_id, name, or membership fields)
 * - Entity groups are single flat dicts (one entity per type)
 * - The API generates IDs and membership server-side
 * - People are identified by array index
 *
 * Note: The /household/calculate endpoint uses arrays for entity groups. The conversion
 * from single dicts to arrays happens in householdToCalculatePayload().
 *
 * Example usage:
 *   const builder = new HouseholdBuilder('policyengine_us', 2025);
 *   builder.addAdult({ age: 35, employment_income: 50000 });
 *   builder.addChild({ age: 10 });
 *   const household = builder.build();
 */

import { Household, HouseholdPerson, TaxBenefitModelName } from '@/types/ingredients/Household';

/**
 * Options for adding an adult
 */
export interface AddAdultOptions {
  age: number;
  employment_income?: number;
  [key: string]: number | boolean | string | undefined;
}

/**
 * Options for adding a child
 */
export interface AddChildOptions {
  age: number;
  [key: string]: number | boolean | string | undefined;
}

/**
 * Options for entity-level variables
 */
export interface EntityVariables {
  [key: string]: number | boolean | string | undefined;
}

/**
 * Utility class for building Household structures in API v2 Alpha format
 */
export class HouseholdBuilder {
  private household: Household;

  constructor(modelName: TaxBenefitModelName, year: number) {
    this.household = this.createEmptyHousehold(modelName, year);
  }

  /**
   * Create an empty household structure with single-dict entities
   */
  private createEmptyHousehold(modelName: TaxBenefitModelName, year: number): Household {
    const household: Household = {
      tax_benefit_model_name: modelName,
      year,
      people: [],
    };

    // Initialize entity dicts based on model
    if (modelName === 'policyengine_us') {
      household.tax_unit = {};
      household.family = {};
      household.spm_unit = {};
      household.marital_unit = {};
      household.household = {};
    } else {
      // UK
      household.benunit = {};
      household.household = {};
    }

    return household;
  }

  /**
   * Load an existing household for modification
   */
  loadHousehold(household: Household): HouseholdBuilder {
    this.household = JSON.parse(JSON.stringify(household)); // Deep clone
    return this;
  }

  /**
   * Add an adult to the household
   * @returns The array index of the added adult
   */
  addAdult(options: AddAdultOptions): number {
    const person: HouseholdPerson = {
      age: options.age,
    };

    // Copy other variables
    for (const [key, value] of Object.entries(options)) {
      if (key !== 'age' && value !== undefined) {
        person[key] = value;
      }
    }

    this.household.people.push(person);
    return this.household.people.length - 1;
  }

  /**
   * Add a child/dependent to the household
   * For US: sets is_tax_unit_dependent = true
   * @returns The array index of the added child
   */
  addChild(options: AddChildOptions): number {
    const person: HouseholdPerson = {
      age: options.age,
    };

    // Copy other variables
    for (const [key, value] of Object.entries(options)) {
      if (key !== 'age' && value !== undefined) {
        person[key] = value;
      }
    }

    // Add US-specific child defaults
    if (this.household.tax_benefit_model_name === 'policyengine_us') {
      person.is_tax_unit_dependent = true;
    }

    this.household.people.push(person);
    return this.household.people.length - 1;
  }

  /**
   * Add multiple children with the same age
   */
  addChildren(count: number, options: AddChildOptions): number[] {
    const childIndices: number[] = [];
    for (let i = 0; i < count; i++) {
      childIndices.push(this.addChild({ ...options }));
    }
    return childIndices;
  }

  /**
   * Remove a person from the household by array index
   */
  removePerson(index: number): HouseholdBuilder {
    if (index >= 0 && index < this.household.people.length) {
      this.household.people.splice(index, 1);
    }
    return this;
  }

  /**
   * Get a person by array index
   */
  getPerson(index: number): HouseholdPerson | undefined {
    return this.household.people[index];
  }

  /**
   * Set a variable on a person by array index
   */
  setPersonVariable(
    index: number,
    variableName: string,
    value: number | boolean | string
  ): HouseholdBuilder {
    const person = this.household.people[index];
    if (!person) {
      throw new Error(`Person at index ${index} not found`);
    }
    person[variableName] = value;
    return this;
  }

  /**
   * Set a variable on an entity dict
   */
  setEntityVariable(
    entityType: string,
    variableName: string,
    value: number | boolean | string
  ): HouseholdBuilder {
    const entity = this.household[entityType as keyof Household] as Record<string, any> | undefined;
    if (!entity || typeof entity !== 'object' || Array.isArray(entity)) {
      throw new Error(`Entity ${entityType} not found or is not an object`);
    }
    entity[variableName] = value;
    return this;
  }

  /**
   * Set the state for US households
   */
  setState(stateCode: string, stateFips: number): HouseholdBuilder {
    if (this.household.tax_benefit_model_name !== 'policyengine_us') {
      throw new Error('setState is only valid for US households');
    }

    // Set on tax unit dict
    if (this.household.tax_unit) {
      this.household.tax_unit.state_code = stateCode;
    }

    // Set on household dict
    if (this.household.household) {
      this.household.household.state_fips = stateFips;
    }

    return this;
  }

  /**
   * Set the region for UK households
   */
  setRegion(region: string): HouseholdBuilder {
    if (this.household.tax_benefit_model_name !== 'policyengine_uk') {
      throw new Error('setRegion is only valid for UK households');
    }

    if (this.household.household) {
      this.household.household.region = region;
    }

    return this;
  }

  /**
   * Set the simulation year
   */
  setYear(year: number): HouseholdBuilder {
    this.household.year = year;
    return this;
  }

  /**
   * Set the display label
   */
  setLabel(label: string): HouseholdBuilder {
    this.household.label = label;
    return this;
  }

  /**
   * Get the number of people in the household
   */
  getPersonCount(): number {
    return this.household.people.length;
  }

  /**
   * Build and return a deep clone of the household
   */
  build(): Household {
    return JSON.parse(JSON.stringify(this.household));
  }

  /**
   * Get the current household (not cloned)
   */
  getHousehold(): Household {
    return this.household;
  }
}

// ============================================================================
// Factory functions for common household patterns
// ============================================================================

/**
 * Create a single adult US household
 */
export function createSingleAdultUS(year: number, options: AddAdultOptions): Household {
  const builder = new HouseholdBuilder('policyengine_us', year);
  builder.addAdult(options);
  return builder.build();
}

/**
 * Create a single adult UK household
 */
export function createSingleAdultUK(year: number, options: AddAdultOptions): Household {
  const builder = new HouseholdBuilder('policyengine_uk', year);
  builder.addAdult(options);
  return builder.build();
}

/**
 * Create a couple US household
 */
export function createCoupleUS(
  year: number,
  adult1: AddAdultOptions,
  adult2: AddAdultOptions
): Household {
  const builder = new HouseholdBuilder('policyengine_us', year);
  builder.addAdult(adult1);
  builder.addAdult(adult2);
  return builder.build();
}

/**
 * Create a couple UK household
 */
export function createCoupleUK(
  year: number,
  adult1: AddAdultOptions,
  adult2: AddAdultOptions
): Household {
  const builder = new HouseholdBuilder('policyengine_uk', year);
  builder.addAdult(adult1);
  builder.addAdult(adult2);
  return builder.build();
}
