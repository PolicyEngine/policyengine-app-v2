import type {
  AppHouseholdInputEnvelope,
  AppHouseholdInputGroupMap,
  AppHouseholdInputPerson,
} from '@/models/household/appTypes';
import { getHouseholdGroupCollection, getHouseholdYearValue } from './householdDataAccess';
import { sortPeopleKeys } from './householdIndividuals';

const GROUP_CANDIDATES = ['taxUnits', 'households', 'families', 'benunits'] as const;

function isAdult(
  person: AppHouseholdInputPerson | undefined,
  year: string | null | undefined
): boolean {
  if (!person || !year) {
    return false;
  }

  const age = getHouseholdYearValue(person.age, year);
  return typeof age === 'number' && age >= 18;
}

function getFirstAdultOrMember(
  members: string[] | undefined,
  people: Record<string, AppHouseholdInputPerson>,
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
  household: AppHouseholdInputEnvelope,
  year: string | null | undefined
): string | null {
  const householdData = household.householdData ?? {};
  const people = householdData.people ?? {};

  for (const groupName of GROUP_CANDIDATES) {
    const groups = getHouseholdGroupCollection(householdData, groupName) as
      | AppHouseholdInputGroupMap
      | undefined;
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
  household: AppHouseholdInputEnvelope,
  year: string | null | undefined
): string | null {
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
