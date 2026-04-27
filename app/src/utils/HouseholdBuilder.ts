import { countryIds } from '@/libs/countries';
import { Household as HouseholdModel } from '@/models/Household';
import type { AppHouseholdInputEnvelope, HouseholdFieldValue } from '@/models/household/appTypes';
import type { HouseholdGroupAppKey } from '@/models/household/schema';

/**
 * Fluent API shell for older call sites.
 * It owns no household shape; all mutations delegate to the `Household` model.
 */
export class HouseholdBuilder {
  private household: HouseholdModel;

  constructor(countryId: (typeof countryIds)[number], currentYear: string) {
    if (!/^\d{4}$/.test(currentYear)) {
      throw new Error('currentYear must be a four-digit year string');
    }

    this.household = HouseholdModel.empty(countryId, currentYear);
  }

  loadHousehold(household: AppHouseholdInputEnvelope | HouseholdModel): HouseholdBuilder {
    this.household =
      household instanceof HouseholdModel ? household : HouseholdModel.fromAppInput(household);
    return this;
  }

  addAdult(name: string, age: number, variables?: Record<string, unknown>): string {
    this.household = this.household.addAdult(name, age, variables);
    return name;
  }

  addChild(
    name: string,
    age: number,
    parentIds: string[],
    variables?: Record<string, unknown>
  ): string {
    this.household = this.household.addChild(name, age, parentIds, variables);
    return name;
  }

  addChildren(
    baseName: string,
    count: number,
    age: number,
    parentIds: string[],
    variables?: Record<string, unknown>
  ): string[] {
    const childKeys: string[] = [];

    for (let index = 0; index < count; index += 1) {
      const childKey = count === 1 ? baseName : `${baseName} ${index + 1}`;
      this.household = this.household.addChild(childKey, age, parentIds, variables);
      childKeys.push(childKey);
    }

    return childKeys;
  }

  removePerson(personKey: string): HouseholdBuilder {
    this.household = this.household.removePerson(personKey);
    return this;
  }

  setMaritalStatus(person1Key: string, person2Key: string): HouseholdBuilder {
    this.household = this.household.setMaritalStatus(person1Key, person2Key);
    return this;
  }

  assignToGroupEntity(personKey: string, entityName: string, groupKey: string): HouseholdBuilder {
    this.household = this.household.assignToGroupEntity(
      personKey,
      entityName as HouseholdGroupAppKey,
      groupKey
    );
    return this;
  }

  setPersonVariable(
    personKey: string,
    variableName: string,
    value: HouseholdFieldValue
  ): HouseholdBuilder {
    this.household = this.household.setPersonVariable(personKey, variableName, value);
    return this;
  }

  setGroupVariable(
    entityName: string,
    groupKey: string,
    variableName: string,
    value: HouseholdFieldValue
  ): HouseholdBuilder {
    this.household = this.household.setGroupVariable(
      entityName as HouseholdGroupAppKey,
      groupKey,
      variableName,
      value
    );
    return this;
  }

  setCurrentYear(year: string): HouseholdBuilder {
    if (!/^\d{4}$/.test(year)) {
      throw new Error('Year must be a four-digit string');
    }

    this.household = HouseholdModel.fromAppInput({
      ...this.household.toAppInput(),
      year: Number(year),
    });
    return this;
  }

  build(): AppHouseholdInputEnvelope {
    return this.household.toAppInput();
  }

  buildModel(): HouseholdModel {
    return this.household;
  }

  getHousehold(): AppHouseholdInputEnvelope {
    return this.household.toAppInput();
  }
}
