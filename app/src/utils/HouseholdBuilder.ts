import { countryIds } from '@/libs/countries';
import {
  Household,
  HouseholdData,
  HouseholdGroupEntity,
  HouseholdPerson,
} from '@/types/ingredients/Household';

// Country-specific default entities
const COUNTRY_DEFAULT_ENTITIES = {
  us: ['people', 'families', 'taxUnits', 'spmUnits', 'households', 'maritalUnits'],
  uk: ['people', 'benunits', 'households'],
  ca: ['people', 'households'],
  ng: ['people', 'households'],
  il: ['people', 'households'],
} as const;

// Country-specific strategies for marital status
const MARITAL_STATUS_STRATEGIES = {
  us: (householdData: HouseholdData, person1Key: string, person2Key: string) => {
    // For US, create a marital unit
    if (!householdData.maritalUnits) {
      householdData.maritalUnits = {};
    }
    const maritalUnitKey = 'your marital unit';
    (householdData.maritalUnits as Record<string, HouseholdGroupEntity>)[maritalUnitKey] = {
      members: [person1Key, person2Key],
    };
  },
  uk: () => {
    // For UK, we might handle this differently, e.g., in benefit units
    // For now, no specific marital unit handling
  },
  ca: () => {
    // For Canada, handle as needed
  },
  ng: () => {
    // For Nigeria, handle as needed
  },
  il: () => {
    // For Israel, handle as needed
  },
};

/**
 * Utility class for building and modifying Household structures
 * Provides a fluent API for common household operations
 * Country-aware with specific strategies for each country
 */
export class HouseholdBuilder {
  private household: Household;
  private currentYear: string;

  constructor(countryId: (typeof countryIds)[number], currentYear: string) {
    // Validate year format
    if (!/^\d{4}$/.test(currentYear)) {
      throw new Error('currentYear must be a four-digit year string');
    }

    this.currentYear = currentYear;
    this.household = this.createEmptyHousehold(countryId);
  }

  /**
   * Load an existing household for modification
   */
  loadHousehold(household: Household): HouseholdBuilder {
    this.household = JSON.parse(JSON.stringify(household)); // Deep clone
    return this;
  }

  /**
   * Create an empty household structure with country-specific entities
   */
  private createEmptyHousehold(countryId: (typeof countryIds)[number]): Household {
    const householdData: HouseholdData = {
      people: {},
    };

    // Add country-specific default entities
    const defaultEntities = COUNTRY_DEFAULT_ENTITIES[countryId] || ['people', 'households'];

    for (const entity of defaultEntities) {
      if (entity !== 'people') {
        householdData[entity] = {};
      }
    }

    return {
      countryId,
      householdData,
    };
  }

  /**
   * Add an adult to the household
   */
  addAdult(name: string, age: number, variables?: Record<string, any>): string {
    const personKey = name;
    const person: HouseholdPerson = {
      age: { [this.currentYear]: age },
      ...this.expandVariables(variables),
    };

    // Add person to people collection
    this.household.householdData.people[personKey] = person;

    // Apply country-specific defaults for adults
    this.applyCountrySpecificPersonDefaults(personKey, 'adult');

    return personKey;
  }

  /**
   * Add a child to the household
   */
  addChild(
    name: string,
    age: number,
    _parentIds: string[],
    variables?: Record<string, any>
  ): string {
    const childKey = name;
    const child: HouseholdPerson = {
      age: { [this.currentYear]: age },
      ...this.expandVariables(variables),
    };

    // Add country-specific child defaults
    if (this.household.countryId === 'us') {
      child.is_tax_unit_dependent = { [this.currentYear]: true };
    }

    // Add child to people collection
    this.household.householdData.people[childKey] = child;

    // Apply country-specific defaults for children
    this.applyCountrySpecificPersonDefaults(childKey, 'child');

    return childKey;
  }

  /**
   * Expand variables to have year-based values
   */
  private expandVariables(variables?: Record<string, any>): Record<string, any> {
    if (!variables) {
      return {};
    }

    const expanded: Record<string, any> = {};
    for (const [key, value] of Object.entries(variables)) {
      // If the value is already an object with year keys, use it as-is
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        expanded[key] = value;
      } else {
        // Otherwise, wrap it in a year-based object
        expanded[key] = { [this.currentYear]: value };
      }
    }
    return expanded;
  }

  /**
   * Apply country-specific defaults when adding a person
   */
  private applyCountrySpecificPersonDefaults(
    personKey: string,
    personType: 'adult' | 'child'
  ): void {
    const countryId = this.household.countryId;

    switch (countryId) {
      case 'us':
        // Add person to all US entities
        this.ensureUSDefaults(personKey, personType);
        break;
      case 'uk':
        // Add person to default benefit unit and household
        this.ensureUKDefaults(personKey);
        break;
      default:
        // Add person to default household
        this.ensureDefaultHousehold(personKey);
        break;
    }
  }

  /**
   * Ensure US-specific defaults - adds person to all required US entities
   */
  private ensureUSDefaults(personKey: string, personType: 'adult' | 'child'): void {
    // Ensure default tax unit exists and add person
    if (!this.household.householdData.taxUnits) {
      this.household.householdData.taxUnits = {};
    }
    const taxUnits = this.household.householdData.taxUnits as Record<string, HouseholdGroupEntity>;
    if (Object.keys(taxUnits).length === 0) {
      taxUnits['your tax unit'] = { members: [] };
    }
    const firstTaxUnit = Object.values(taxUnits)[0];
    if (!firstTaxUnit.members.includes(personKey)) {
      firstTaxUnit.members.push(personKey);
    }

    // Ensure default family exists and add person
    if (!this.household.householdData.families) {
      this.household.householdData.families = {};
    }
    const families = this.household.householdData.families as Record<string, HouseholdGroupEntity>;
    if (Object.keys(families).length === 0) {
      families['your family'] = { members: [] };
    }
    const firstFamily = Object.values(families)[0];
    if (!firstFamily.members.includes(personKey)) {
      firstFamily.members.push(personKey);
    }

    // Ensure default SPM unit exists and add person
    if (!this.household.householdData.spmUnits) {
      this.household.householdData.spmUnits = {};
    }
    const spmUnits = this.household.householdData.spmUnits as Record<string, HouseholdGroupEntity>;
    if (Object.keys(spmUnits).length === 0) {
      spmUnits['your household'] = { members: [] };
    }
    const firstSpmUnit = Object.values(spmUnits)[0];
    if (!firstSpmUnit.members.includes(personKey)) {
      firstSpmUnit.members.push(personKey);
    }

    // Handle marital units - adults share one, children get their own
    if (!this.household.householdData.maritalUnits) {
      this.household.householdData.maritalUnits = {};
    }
    const maritalUnits = this.household.householdData.maritalUnits as Record<
      string,
      HouseholdGroupEntity
    >;

    if (personType === 'adult') {
      // Adults share "your marital unit"
      if (!maritalUnits['your marital unit']) {
        maritalUnits['your marital unit'] = { members: [] };
      }
      if (!maritalUnits['your marital unit'].members.includes(personKey)) {
        maritalUnits['your marital unit'].members.push(personKey);
      }
    } else {
      // Children get their own marital unit
      const childMaritalUnitKey = `${personKey}'s marital unit`;
      const childCount = Object.keys(maritalUnits).filter((k) =>
        k.includes("'s marital unit")
      ).length;
      maritalUnits[childMaritalUnitKey] = {
        members: [personKey],
        marital_unit_id: { [this.currentYear]: childCount + 1 },
      };
    }

    // Ensure default household exists
    this.ensureDefaultHousehold(personKey);
  }

  /**
   * Ensure UK-specific defaults
   */
  private ensureUKDefaults(personKey: string): void {
    // Ensure default benefit unit exists
    if (!this.household.householdData.benunits) {
      this.household.householdData.benunits = {};
    }
    const benunits = this.household.householdData.benunits as Record<string, HouseholdGroupEntity>;
    if (Object.keys(benunits).length === 0) {
      benunits['your benefit unit'] = { members: [] };
    }
    // Add person to first benefit unit
    const firstBenunit = Object.values(benunits)[0];
    if (!firstBenunit.members.includes(personKey)) {
      firstBenunit.members.push(personKey);
    }

    // Ensure default household exists
    this.ensureDefaultHousehold(personKey);
  }

  /**
   * Ensure default household exists and add person to it
   */
  private ensureDefaultHousehold(personKey: string): void {
    if (!this.household.householdData.households) {
      this.household.householdData.households = {};
    }
    const households = this.household.householdData.households as Record<
      string,
      HouseholdGroupEntity
    >;
    if (Object.keys(households).length === 0) {
      households['your household'] = { members: [] };
    }
    // Add person to first household
    const firstHousehold = Object.values(households)[0];
    if (!firstHousehold.members.includes(personKey)) {
      firstHousehold.members.push(personKey);
    }
  }

  /**
   * Add multiple children with the same settings
   */
  addChildren(
    baseName: string,
    count: number,
    age: number,
    parentIds: string[],
    variables?: Record<string, any>
  ): string[] {
    const childKeys: string[] = [];
    for (let i = 0; i < count; i++) {
      const name = count === 1 ? baseName : `${baseName} ${i + 1}`;
      childKeys.push(this.addChild(name, age, parentIds, variables));
    }
    return childKeys;
  }

  /**
   * Remove a person from the household
   */
  removePerson(personKey: string): HouseholdBuilder {
    // Remove from people
    delete this.household.householdData.people[personKey];

    // Remove from all groups
    this.removeFromAllGroups(personKey);

    return this;
  }

  /**
   * Set marital status between two people using country-specific strategy
   */
  setMaritalStatus(person1Key: string, person2Key: string): HouseholdBuilder {
    const strategy = MARITAL_STATUS_STRATEGIES[this.household.countryId];
    if (strategy) {
      strategy(this.household.householdData, person1Key, person2Key);
    }
    return this;
  }

  /**
   * Assign a person to a group entity
   */
  assignToGroupEntity(personKey: string, entityName: string, groupKey: string): HouseholdBuilder {
    // Ensure the entity type exists
    if (!this.household.householdData[entityName]) {
      this.household.householdData[entityName] = {};
    }

    const entities = this.household.householdData[entityName] as Record<
      string,
      HouseholdGroupEntity
    >;

    // Create group if doesn't exist
    if (!entities[groupKey]) {
      entities[groupKey] = {
        members: [],
      };
    }

    // Add person to group if not already present
    if (!entities[groupKey].members.includes(personKey)) {
      entities[groupKey].members.push(personKey);
    }

    return this;
  }

  /**
   * Set a variable for a person
   */
  setPersonVariable(personKey: string, variableName: string, value: any): HouseholdBuilder {
    const person = this.household.householdData.people[personKey];
    if (!person) {
      throw new Error(`Person ${personKey} not found`);
    }

    // If value is already year-keyed, use as-is
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      person[variableName] = value;
    } else {
      // Otherwise wrap in year object
      person[variableName] = { [this.currentYear]: value };
    }

    return this;
  }

  /**
   * Set a variable for a group entity
   */
  setGroupVariable(
    entityName: string,
    groupKey: string,
    variableName: string,
    value: any
  ): HouseholdBuilder {
    const entities = this.household.householdData[entityName] as Record<
      string,
      HouseholdGroupEntity
    >;
    if (!entities || !entities[groupKey]) {
      throw new Error(`Group ${groupKey} not found in ${entityName}`);
    }

    // If value is already year-keyed, use as-is
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      entities[groupKey][variableName] = value;
    } else {
      // Otherwise wrap in year object
      entities[groupKey][variableName] = { [this.currentYear]: value };
    }

    return this;
  }

  /**
   * Remove person from all group entities
   */
  private removeFromAllGroups(personKey: string): void {
    // Iterate through all properties of householdData
    Object.keys(this.household.householdData).forEach((entityName) => {
      // Skip 'people' as it's not a group entity
      if (entityName === 'people') {
        return;
      }

      const entities = this.household.householdData[entityName] as Record<
        string,
        HouseholdGroupEntity
      >;

      // Remove person from each group in this entity type
      Object.values(entities).forEach((group) => {
        if (group.members) {
          const index = group.members.indexOf(personKey);
          if (index > -1) {
            group.members.splice(index, 1);
          }
        }
      });
    });
  }

  /**
   * Set the current year for data
   */
  setCurrentYear(year: string): HouseholdBuilder {
    if (!/^\d{4}$/.test(year)) {
      throw new Error('Year must be a four-digit string');
    }
    this.currentYear = year;
    return this;
  }

  /**
   * Build and return the household
   */
  build(): Household {
    return JSON.parse(JSON.stringify(this.household)); // Return deep clone
  }

  /**
   * Get current household without building
   */
  getHousehold(): Household {
    return this.household;
  }
}
