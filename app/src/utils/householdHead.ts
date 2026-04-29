import { Household } from '@/models/Household';
import { getHouseholdHeadGroupKeys } from '@/models/household/schema';
import type {
  HouseholdCalculationOutput,
  HouseholdCalculationPerson,
} from '@/types/calculation/household';
import {
  getHouseholdCalculationGroupCollection,
  getHouseholdCalculationYearValue,
} from './householdCalculationOutput';
import { sortPeopleKeys } from './householdIndividuals';

type HouseholdHeadInput = Pick<HouseholdCalculationOutput, 'countryId' | 'householdData'>;
type HouseholdHeadPerson = HouseholdCalculationPerson;

function isAdult(
  person: HouseholdHeadPerson | undefined,
  year: string | null | undefined
): boolean {
  if (!person || !year) {
    return false;
  }

  const age = getHouseholdCalculationYearValue(person.age, year);
  return typeof age === 'number' && age >= 18;
}

function getFirstAdultOrMember(
  members: string[] | undefined,
  people: Record<string, HouseholdHeadPerson>,
  year: string | null | undefined
): string | null {
  if (!Array.isArray(members) || members.length === 0) {
    return null;
  }

  const existingMembers = members.filter((member) => member in people);
  if (existingMembers.length === 0) {
    return null;
  }

  const firstAdult = existingMembers.find((member) => isAdult(people[member], year));
  return firstAdult ?? existingMembers[0];
}

function getPersonFromGroups(
  household: HouseholdHeadInput,
  year: string | null | undefined
): string | null {
  const householdData = household.householdData ?? {};
  const people = householdData.people ?? {};

  for (const groupName of getHouseholdHeadGroupKeys(household.countryId)) {
    const groups = getHouseholdCalculationGroupCollection(householdData, groupName);
    if (!groups) {
      continue;
    }

    const orderedGroupKeys = Object.keys(groups).sort((left, right) => left.localeCompare(right));
    for (const groupKey of orderedGroupKeys) {
      const match = getFirstAdultOrMember(groups[groupKey]?.members, people, year);
      if (match) {
        return match;
      }
    }
  }

  return null;
}

export function getHeadOfHouseholdPersonName(
  household: Household | HouseholdHeadInput,
  year: string | null | undefined
): string | null {
  if (household instanceof Household) {
    return household.getHeadPersonName(year);
  }

  const people = household.householdData?.people ?? {};
  const orderedPeople = sortPeopleKeys(Object.keys(people));

  if (orderedPeople.length === 0) {
    return null;
  }

  if ('you' in people) {
    return 'you';
  }

  const groupedPerson = getPersonFromGroups(household, year);
  if (groupedPerson) {
    return groupedPerson;
  }

  const firstAdult = orderedPeople.find((personName) => isAdult(people[personName], year));
  return firstAdult ?? orderedPeople[0];
}
