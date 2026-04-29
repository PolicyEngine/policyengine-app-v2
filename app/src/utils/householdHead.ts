import type { CountryId } from '@/libs/countries';
import type {
  AppHouseholdInputData,
  AppHouseholdInputGroupMap,
  AppHouseholdInputPerson,
} from '@/models/household/appTypes';
import { getHouseholdGroupDefinitions, type HouseholdGroupAppKey } from '@/models/household/schema';
import type {
  HouseholdCalculationData,
  HouseholdCalculationGroupMap,
  HouseholdCalculationOutput,
  HouseholdCalculationPerson,
} from '@/types/calculation/household';
import { getHouseholdGroupCollection, getHouseholdYearValue } from './householdDataAccess';
import { sortPeopleKeys } from './householdIndividuals';

const GROUP_CANDIDATE_PRIORITY: readonly HouseholdGroupAppKey[] = [
  'taxUnits',
  'benunits',
  'households',
  'families',
  'spmUnits',
  'maritalUnits',
];
type HouseholdHeadInput = Pick<HouseholdCalculationOutput, 'countryId' | 'householdData'> & {
  householdData: AppHouseholdInputData | HouseholdCalculationData;
};
type HouseholdHeadPerson = AppHouseholdInputPerson | HouseholdCalculationPerson;
type HouseholdHeadGroupMap = AppHouseholdInputGroupMap | HouseholdCalculationGroupMap;

function getGroupCandidates(countryId: CountryId): readonly HouseholdGroupAppKey[] {
  const configuredGroups = new Set(
    getHouseholdGroupDefinitions(countryId).map((definition) => definition.appKey)
  );

  return GROUP_CANDIDATE_PRIORITY.filter((groupName) => configuredGroups.has(groupName));
}

function isAdult(
  person: HouseholdHeadPerson | undefined,
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

  for (const groupName of getGroupCandidates(household.countryId)) {
    const groups = getHouseholdGroupCollection(householdData, groupName) as
      | HouseholdHeadGroupMap
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
  household: HouseholdHeadInput,
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
