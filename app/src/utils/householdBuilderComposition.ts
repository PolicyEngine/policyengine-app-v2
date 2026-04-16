import { Household, HouseholdGroupEntity } from '@/types/ingredients/Household';
import { HouseholdBuilder } from '@/utils/HouseholdBuilder';
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

function getAdults(household: Household, year: string): string[] {
  return sortPeopleKeys(
    Object.entries(household.householdData.people || {})
      .filter(([, person]) => {
        const age = getPersonAge(person, year);
        return age !== null && age >= 18;
      })
      .map(([personKey]) => personKey)
  );
}

function getPrimaryPersonKey(household: Household, year: string): string | null {
  const people = sortPeopleKeys(Object.keys(household.householdData.people || {}));

  if (people.includes(PRIMARY_PERSON_NAME)) {
    return PRIMARY_PERSON_NAME;
  }

  const adults = getAdults(household, year);
  if (adults.length > 0) {
    return adults[0];
  }

  return people[0] ?? null;
}

function getMaritalUnits(household: Household): Record<string, HouseholdGroupEntity> {
  return (
    (household.householdData.maritalUnits as Record<string, HouseholdGroupEntity> | undefined) ||
    (household.householdData.marital_units as Record<string, HouseholdGroupEntity> | undefined) ||
    {}
  );
}

function getPartnerKey(
  household: Household,
  year: string,
  primaryPersonKey: string | null
): string | null {
  if (!primaryPersonKey) {
    return null;
  }

  const maritalUnits = getMaritalUnits(household);
  for (const unit of Object.values(maritalUnits)) {
    if (!unit.members?.includes(primaryPersonKey)) {
      continue;
    }

    const partnerKey = unit.members.find((member) => member !== primaryPersonKey) ?? null;
    if (partnerKey) {
      return partnerKey;
    }
  }

  const people = Object.keys(household.householdData.people || {});
  if (people.includes(DEFAULT_PARTNER_NAME) && DEFAULT_PARTNER_NAME !== primaryPersonKey) {
    return DEFAULT_PARTNER_NAME;
  }

  const adults = getAdults(household, year);
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
  household: Household,
  year: string,
  primaryPersonKey: string | null,
  partnerKey: string | null
): string[] {
  return sortPeopleKeys(
    Object.entries(household.householdData.people || {})
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
  household: Household,
  year: string
): HouseholdBuilderComposition {
  const people = sortPeopleKeys(Object.keys(household.householdData.people || {}));
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
  household: Household,
  year: string,
  newStatus: 'single' | 'married'
): Household {
  const composition = deriveHouseholdBuilderComposition(household, year);
  const builder = new HouseholdBuilder(household.countryId, year);
  builder.loadHousehold(household);

  if (!composition.primaryPersonKey) {
    return household;
  }

  if (newStatus === 'married' && !composition.partnerKey) {
    const existingKeys = new Set(Object.keys(household.householdData.people || {}));
    const partnerKey = getUniquePersonName(existingKeys, DEFAULT_PARTNER_NAME);

    builder.addAdult(partnerKey, DEFAULT_ADULT_AGE, {
      employment_income: DEFAULT_EMPLOYMENT_INCOME,
    });
    builder.setMaritalStatus(composition.primaryPersonKey, partnerKey);
  }

  if (newStatus === 'single' && composition.partnerKey) {
    builder.removePerson(composition.partnerKey);
  }

  return builder.build();
}

export function updateHouseholdBuilderChildCount(
  household: Household,
  year: string,
  newCount: number
): Household {
  const composition = deriveHouseholdBuilderComposition(household, year);
  const builder = new HouseholdBuilder(household.countryId, year);
  builder.loadHousehold(household);

  if (newCount < composition.childKeys.length) {
    composition.childKeys.slice(newCount).forEach((childKey) => builder.removePerson(childKey));
  }

  if (newCount > composition.childKeys.length) {
    const existingKeys = new Set(Object.keys(household.householdData.people || {}));
    const parentIds = [composition.primaryPersonKey, composition.partnerKey].filter(
      Boolean
    ) as string[];

    for (let index = composition.childKeys.length; index < newCount; index += 1) {
      const childKey = getUniquePersonName(existingKeys, getDependentName(index));
      existingKeys.add(childKey);
      builder.addChild(childKey, DEFAULT_CHILD_AGE, parentIds, {
        employment_income: DEFAULT_EMPLOYMENT_INCOME,
      });
    }
  }

  return builder.build();
}
