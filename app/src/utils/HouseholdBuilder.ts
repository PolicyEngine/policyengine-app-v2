/**
 * HouseholdBuilder - Fluent API for constructing households in API v2 Alpha format
 *
 * This builder creates households with:
 * - Array-based entities with numeric IDs
 * - Flat variable values (year specified at top level)
 * - Entity relationships via person_{entity}_id fields
 *
 * Example usage:
 *   const builder = new HouseholdBuilder('policyengine_us', 2025);
 *   const aliceId = builder.addAdult({ name: 'Alice', age: 35, employment_income: 50000 });
 *   const bobId = builder.addChild({ name: 'Bob', age: 10 });
 *   const household = builder.build();
 */

import {
  getEntitiesForModel,
  Household,
  HouseholdBenunit,
  HouseholdFamily,
  HouseholdMaritalUnit,
  HouseholdPerson,
  HouseholdSpmUnit,
  HouseholdTaxUnit,
  HouseholdUnit,
  TaxBenefitModelName,
} from '@/types/ingredients/Household';

/**
 * Options for adding an adult
 */
export interface AddAdultOptions {
  name?: string;
  age: number;
  employment_income?: number;
  [key: string]: number | boolean | string | undefined;
}

/**
 * Options for adding a child
 */
export interface AddChildOptions {
  name?: string;
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

  // ID counters for each entity type
  private nextPersonId = 0;
  private nextTaxUnitId = 0;
  private nextFamilyId = 0;
  private nextSpmUnitId = 0;
  private nextMaritalUnitId = 0;
  private nextHouseholdId = 0;
  private nextBenunitId = 0;

  // Track the "default" entity IDs that all people are added to
  private defaultTaxUnitId: number | null = null;
  private defaultFamilyId: number | null = null;
  private defaultSpmUnitId: number | null = null;
  private defaultHouseholdId: number | null = null;
  private defaultBenunitId: number | null = null;

  // Track adult marital unit for US
  private adultMaritalUnitId: number | null = null;

  constructor(modelName: TaxBenefitModelName, year: number) {
    this.household = this.createEmptyHousehold(modelName, year);
  }

  /**
   * Create an empty household structure
   */
  private createEmptyHousehold(modelName: TaxBenefitModelName, year: number): Household {
    const household: Household = {
      tax_benefit_model_name: modelName,
      year,
      people: [],
    };

    // Initialize entity arrays based on model
    if (modelName === 'policyengine_us') {
      household.tax_unit = [];
      household.family = [];
      household.spm_unit = [];
      household.marital_unit = [];
      household.household = [];
    } else {
      // UK
      household.benunit = [];
      household.household = [];
    }

    return household;
  }

  /**
   * Load an existing household for modification
   */
  loadHousehold(household: Household): HouseholdBuilder {
    this.household = JSON.parse(JSON.stringify(household)); // Deep clone

    // Update ID counters based on existing data
    this.nextPersonId = this.getMaxId(household.people, 'person_id') + 1;
    if (household.tax_unit) {
      this.nextTaxUnitId = this.getMaxId(household.tax_unit, 'tax_unit_id') + 1;
    }
    if (household.family) {
      this.nextFamilyId = this.getMaxId(household.family, 'family_id') + 1;
    }
    if (household.spm_unit) {
      this.nextSpmUnitId = this.getMaxId(household.spm_unit, 'spm_unit_id') + 1;
    }
    if (household.marital_unit) {
      this.nextMaritalUnitId = this.getMaxId(household.marital_unit, 'marital_unit_id') + 1;
    }
    if (household.household) {
      this.nextHouseholdId = this.getMaxId(household.household, 'household_id') + 1;
    }
    if (household.benunit) {
      this.nextBenunitId = this.getMaxId(household.benunit, 'benunit_id') + 1;
    }

    return this;
  }

  /**
   * Get the maximum ID from an array of entities
   */
  private getMaxId<T extends Record<string, any>>(entities: T[], idField: string): number {
    if (entities.length === 0) return -1;
    return Math.max(...entities.map((e) => (e[idField] as number) ?? -1));
  }

  /**
   * Add an adult to the household
   * @returns The person_id of the added adult
   */
  addAdult(options: AddAdultOptions): number {
    const personId = this.nextPersonId++;

    const person: HouseholdPerson = {
      person_id: personId,
      name: options.name,
      age: options.age,
    };

    // Copy other variables
    for (const [key, value] of Object.entries(options)) {
      if (key !== 'name' && key !== 'age' && value !== undefined) {
        person[key] = value;
      }
    }

    // Add to appropriate entities based on model
    if (this.household.tax_benefit_model_name === 'policyengine_us') {
      this.addPersonToUSEntities(person, 'adult');
    } else {
      this.addPersonToUKEntities(person);
    }

    this.household.people.push(person);
    return personId;
  }

  /**
   * Add a child to the household
   * @returns The person_id of the added child
   */
  addChild(options: AddChildOptions): number {
    const personId = this.nextPersonId++;

    const person: HouseholdPerson = {
      person_id: personId,
      name: options.name,
      age: options.age,
    };

    // Copy other variables
    for (const [key, value] of Object.entries(options)) {
      if (key !== 'name' && key !== 'age' && value !== undefined) {
        person[key] = value;
      }
    }

    // Add US-specific child defaults
    if (this.household.tax_benefit_model_name === 'policyengine_us') {
      person.is_tax_unit_dependent = true;
      this.addPersonToUSEntities(person, 'child');
    } else {
      this.addPersonToUKEntities(person);
    }

    this.household.people.push(person);
    return personId;
  }

  /**
   * Add multiple children with the same age
   */
  addChildren(count: number, options: AddChildOptions): number[] {
    const childIds: number[] = [];
    for (let i = 0; i < count; i++) {
      const name = options.name
        ? count === 1
          ? options.name
          : `${options.name} ${i + 1}`
        : undefined;
      childIds.push(this.addChild({ ...options, name }));
    }
    return childIds;
  }

  /**
   * Add a person to US-specific entities
   */
  private addPersonToUSEntities(person: HouseholdPerson, personType: 'adult' | 'child'): void {
    // Ensure default tax unit exists
    if (this.defaultTaxUnitId === null) {
      this.defaultTaxUnitId = this.addTaxUnit({});
    }
    person.person_tax_unit_id = this.defaultTaxUnitId;

    // Ensure default family exists
    if (this.defaultFamilyId === null) {
      this.defaultFamilyId = this.addFamily({});
    }
    person.person_family_id = this.defaultFamilyId;

    // Ensure default SPM unit exists
    if (this.defaultSpmUnitId === null) {
      this.defaultSpmUnitId = this.addSpmUnit({});
    }
    person.person_spm_unit_id = this.defaultSpmUnitId;

    // Ensure default household exists
    if (this.defaultHouseholdId === null) {
      this.defaultHouseholdId = this.addHouseholdUnit({});
    }
    person.person_household_id = this.defaultHouseholdId;

    // Handle marital units - adults share one, children get their own
    if (personType === 'adult') {
      if (this.adultMaritalUnitId === null) {
        this.adultMaritalUnitId = this.addMaritalUnit({});
      }
      person.person_marital_unit_id = this.adultMaritalUnitId;
    } else {
      // Children get their own marital unit
      const childMaritalUnitId = this.addMaritalUnit({});
      person.person_marital_unit_id = childMaritalUnitId;
    }
  }

  /**
   * Add a person to UK-specific entities
   */
  private addPersonToUKEntities(person: HouseholdPerson): void {
    // Ensure default benefit unit exists
    if (this.defaultBenunitId === null) {
      this.defaultBenunitId = this.addBenunit({});
    }
    person.person_benunit_id = this.defaultBenunitId;

    // Ensure default household exists
    if (this.defaultHouseholdId === null) {
      this.defaultHouseholdId = this.addHouseholdUnit({});
    }
    person.person_household_id = this.defaultHouseholdId;
  }

  /**
   * Add a tax unit (US)
   * @returns The tax_unit_id
   */
  addTaxUnit(variables: EntityVariables = {}): number {
    if (!this.household.tax_unit) {
      this.household.tax_unit = [];
    }
    const id = this.nextTaxUnitId++;
    this.household.tax_unit.push({ tax_unit_id: id, ...variables });
    return id;
  }

  /**
   * Add a family (US)
   * @returns The family_id
   */
  addFamily(variables: EntityVariables = {}): number {
    if (!this.household.family) {
      this.household.family = [];
    }
    const id = this.nextFamilyId++;
    this.household.family.push({ family_id: id, ...variables });
    return id;
  }

  /**
   * Add an SPM unit (US)
   * @returns The spm_unit_id
   */
  addSpmUnit(variables: EntityVariables = {}): number {
    if (!this.household.spm_unit) {
      this.household.spm_unit = [];
    }
    const id = this.nextSpmUnitId++;
    this.household.spm_unit.push({ spm_unit_id: id, ...variables });
    return id;
  }

  /**
   * Add a marital unit (US)
   * @returns The marital_unit_id
   */
  addMaritalUnit(variables: EntityVariables = {}): number {
    if (!this.household.marital_unit) {
      this.household.marital_unit = [];
    }
    const id = this.nextMaritalUnitId++;
    this.household.marital_unit.push({ marital_unit_id: id, ...variables });
    return id;
  }

  /**
   * Add a household unit
   * @returns The household_id
   */
  addHouseholdUnit(variables: EntityVariables = {}): number {
    if (!this.household.household) {
      this.household.household = [];
    }
    const id = this.nextHouseholdId++;
    this.household.household.push({ household_id: id, ...variables });
    return id;
  }

  /**
   * Add a benefit unit (UK)
   * @returns The benunit_id
   */
  addBenunit(variables: EntityVariables = {}): number {
    if (!this.household.benunit) {
      this.household.benunit = [];
    }
    const id = this.nextBenunitId++;
    this.household.benunit.push({ benunit_id: id, ...variables });
    return id;
  }

  /**
   * Remove a person from the household by ID
   */
  removePerson(personId: number): HouseholdBuilder {
    const index = this.household.people.findIndex((p) => p.person_id === personId);
    if (index !== -1) {
      this.household.people.splice(index, 1);
    }
    return this;
  }

  /**
   * Get a person by ID
   */
  getPerson(personId: number): HouseholdPerson | undefined {
    return this.household.people.find((p) => p.person_id === personId);
  }

  /**
   * Set a variable on a person
   */
  setPersonVariable(
    personId: number,
    variableName: string,
    value: number | boolean | string
  ): HouseholdBuilder {
    const person = this.getPerson(personId);
    if (!person) {
      throw new Error(`Person with ID ${personId} not found`);
    }
    person[variableName] = value;
    return this;
  }

  /**
   * Set a variable on a tax unit
   */
  setTaxUnitVariable(
    taxUnitId: number,
    variableName: string,
    value: number | boolean | string
  ): HouseholdBuilder {
    const taxUnit = this.household.tax_unit?.find((t) => t.tax_unit_id === taxUnitId);
    if (!taxUnit) {
      throw new Error(`Tax unit with ID ${taxUnitId} not found`);
    }
    taxUnit[variableName] = value;
    return this;
  }

  /**
   * Set a variable on a household unit
   */
  setHouseholdUnitVariable(
    householdId: number,
    variableName: string,
    value: number | boolean | string
  ): HouseholdBuilder {
    const unit = this.household.household?.find((h) => h.household_id === householdId);
    if (!unit) {
      throw new Error(`Household unit with ID ${householdId} not found`);
    }
    unit[variableName] = value;
    return this;
  }

  /**
   * Set the state for US households
   */
  setState(stateCode: string, stateFips: number): HouseholdBuilder {
    if (this.household.tax_benefit_model_name !== 'policyengine_us') {
      throw new Error('setState is only valid for US households');
    }

    // Set on tax unit
    if (this.household.tax_unit && this.household.tax_unit.length > 0) {
      this.household.tax_unit[0].state_code = stateCode;
    }

    // Set on household unit
    if (this.household.household && this.household.household.length > 0) {
      this.household.household[0].state_fips = stateFips;
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

    if (this.household.household && this.household.household.length > 0) {
      this.household.household[0].region = region;
    }

    return this;
  }

  /**
   * Assign a person to a different tax unit (US)
   */
  assignToTaxUnit(personId: number, taxUnitId: number): HouseholdBuilder {
    const person = this.getPerson(personId);
    if (!person) {
      throw new Error(`Person with ID ${personId} not found`);
    }
    person.person_tax_unit_id = taxUnitId;
    return this;
  }

  /**
   * Assign a person to a different family (US)
   */
  assignToFamily(personId: number, familyId: number): HouseholdBuilder {
    const person = this.getPerson(personId);
    if (!person) {
      throw new Error(`Person with ID ${personId} not found`);
    }
    person.person_family_id = familyId;
    return this;
  }

  /**
   * Assign a person to a different benefit unit (UK)
   */
  assignToBenunit(personId: number, benunitId: number): HouseholdBuilder {
    const person = this.getPerson(personId);
    if (!person) {
      throw new Error(`Person with ID ${personId} not found`);
    }
    person.person_benunit_id = benunitId;
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
