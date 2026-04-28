import { Household as HouseholdModel } from '@/models/Household';
import type { AppHouseholdInputGroup as HouseholdGroupEntity } from '@/models/household/appTypes';
import { sortPeopleKeys } from '@/utils/householdIndividuals';

const DEFAULT_ADULT_AGE = 30;
const DEFAULT_CHILD_AGE = 10;
const DEFAULT_EMPLOYMENT_INCOME = 0;
const PRIMARY_PERSON_NAME = 'you';
const DEFAULT_PARTNER_NAME = 'your partner';
const DEPENDENT_ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth'];

export interface HouseholdBuilderComposition {
  people: string[];
  primaryPersonKey: string | null;
  partnerKey: string | null;
  childKeys: string[];
  maritalStatus: 'single' | 'married';
  numChildren: number;
}

function getPersonAge(person: Record<string, any> | undefined, year: string): number | null {
  const age = person?.age?.[year];
  return typeof age === 'number' ? age : null;
}

function getPrimaryPersonKey(household: HouseholdModel, year: string): string | null {
  const householdData = household.householdData;
  const people = sortPeopleKeys(Object.keys(householdData.people || {}));

  if (people.includes(PRIMARY_PERSON_NAME)) {
    return PRIMARY_PERSON_NAME;
  }

  const adults = household.getAdults(year).map((person) => person.name);
  if (adults.length > 0) {
    return adults[0];
  }

  return people[0] ?? null;
}

function getMaritalUnits(
  householdData: ReturnType<HouseholdModel['toAppInput']>['householdData']
): Record<string, HouseholdGroupEntity> {
  return (householdData.maritalUnits as Record<string, HouseholdGroupEntity> | undefined) || {};
}

function getPartnerKey(
  household: HouseholdModel,
  year: string,
  primaryPersonKey: string | null
): string | null {
  const householdData = household.householdData;
  if (!primaryPersonKey) {
    return null;
  }

  const maritalUnits = getMaritalUnits(householdData);
  for (const unit of Object.values(maritalUnits)) {
    if (!unit.members?.includes(primaryPersonKey)) {
      continue;
    }

    const partnerKey = unit.members.find((member) => member !== primaryPersonKey) ?? null;
    if (partnerKey) {
      return partnerKey;
    }
  }

  const people = Object.keys(householdData.people || {});
  if (people.includes(DEFAULT_PARTNER_NAME) && DEFAULT_PARTNER_NAME !== primaryPersonKey) {
    return DEFAULT_PARTNER_NAME;
  }

  const adults = household.getAdults(year).map((person) => person.name);
  return adults.find((personKey) => personKey !== primaryPersonKey) ?? null;
}

function isManagedChild(person: Record<string, any> | undefined, year: string): boolean {
  if (!person) {
    return false;
  }

  const age = getPersonAge(person, year);
  if (age !== null) {
    return age < 18;
  }

  return person.is_tax_unit_dependent?.[year] === true;
}

function getChildKeys(
  household: HouseholdModel,
  year: string,
  primaryPersonKey: string | null,
  partnerKey: string | null
): string[] {
  const householdData = household.householdData;
  return sortPeopleKeys(
    Object.entries(householdData.people || {})
      .filter(([personKey, person]) => {
        if (personKey === primaryPersonKey || personKey === partnerKey) {
          return false;
        }

        return isManagedChild(person, year);
      })
      .map(([personKey]) => personKey)
  );
}

function getDependentName(index: number): string {
  return `your ${DEPENDENT_ORDINALS[index] || `${index + 1}th`} dependent`;
}

function getUniquePersonName(existingKeys: Set<string>, preferredName: string): string {
  if (!existingKeys.has(preferredName)) {
    return preferredName;
  }

  let suffix = 2;
  let candidate = `${preferredName} ${suffix}`;
  while (existingKeys.has(candidate)) {
    suffix += 1;
    candidate = `${preferredName} ${suffix}`;
  }

  return candidate;
}

export function deriveHouseholdBuilderComposition(
  household: HouseholdModel,
  year: string
): HouseholdBuilderComposition {
  const householdData = household.householdData;
  const people = sortPeopleKeys(Object.keys(householdData.people || {}));
  const primaryPersonKey = getPrimaryPersonKey(household, year);
  const partnerKey = getPartnerKey(household, year, primaryPersonKey);
  const childKeys = getChildKeys(household, year, primaryPersonKey, partnerKey);

  return {
    people,
    primaryPersonKey,
    partnerKey,
    childKeys,
    maritalStatus: partnerKey ? 'married' : 'single',
    numChildren: childKeys.length,
  };
}

export function updateHouseholdBuilderMaritalStatus(
  household: HouseholdModel,
  year: string,
  newStatus: 'single' | 'married'
): HouseholdModel {
  const composition = deriveHouseholdBuilderComposition(household, year);

  if (!composition.primaryPersonKey) {
    return household;
  }

  if (newStatus === 'married' && !composition.partnerKey) {
    const existingKeys = new Set(Object.keys(household.householdData.people || {}));
    const partnerKey = getUniquePersonName(existingKeys, DEFAULT_PARTNER_NAME);

    return household
      .addAdult(partnerKey, DEFAULT_ADULT_AGE, {
        employment_income: DEFAULT_EMPLOYMENT_INCOME,
      })
      .setMaritalStatus(composition.primaryPersonKey, partnerKey);
  }

  if (newStatus === 'single' && composition.partnerKey) {
    return household.removePerson(composition.partnerKey);
  }

  return household;
}

export function updateHouseholdBuilderChildCount(
  household: HouseholdModel,
  year: string,
  newCount: number
): HouseholdModel {
  const composition = deriveHouseholdBuilderComposition(household, year);
  let nextHousehold = household;

  if (newCount < composition.childKeys.length) {
    composition.childKeys.slice(newCount).forEach((childKey) => {
      nextHousehold = nextHousehold.removePerson(childKey);
    });
  }

  if (newCount > composition.childKeys.length) {
    const existingKeys = new Set(Object.keys(household.householdData.people || {}));
    const parentIds = [composition.primaryPersonKey, composition.partnerKey].filter(
      Boolean
    ) as string[];

    for (let index = composition.childKeys.length; index < newCount; index += 1) {
      const childKey = getUniquePersonName(existingKeys, getDependentName(index));
      existingKeys.add(childKey);
      nextHousehold = nextHousehold.addChild(childKey, DEFAULT_CHILD_AGE, parentIds, {
        employment_income: DEFAULT_EMPLOYMENT_INCOME,
      });
    }
  }

  return nextHousehold;
}
